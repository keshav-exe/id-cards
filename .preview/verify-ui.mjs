import { spawn } from "node:child_process"
import { mkdir, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"

class Cdp {
  constructor(ws) {
    this.ws = ws
    this.id = 0
    this.pending = new Map()
    this.handlers = new Map()
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id)
        this.pending.delete(msg.id)
        if (msg.error) reject(new Error(msg.error.message))
        else resolve(msg.result)
        return
      }
      if (msg.method && this.handlers.has(msg.method)) {
        for (const fn of this.handlers.get(msg.method)) fn(msg.params)
      }
    })
  }
  static connect(url) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url)
      const cdp = new Cdp(ws)
      ws.addEventListener("open", () => resolve(cdp))
      ws.addEventListener("error", reject)
    })
  }
  send(method, params = {}) {
    const id = ++this.id
    this.ws.send(JSON.stringify({ id, method, params }))
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
    })
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitFor(fn, timeout) {
  const start = Date.now()
  let last
  while (Date.now() - start < timeout) {
    try {
      return await fn()
    } catch (err) {
      last = err
      await sleep(200)
    }
  }
  throw last ?? new Error("timeout")
}

const chrome = join(
  homedir(),
  "Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
)
const userData = "/tmp/id-cards-chrome-verify2"
const port = 9334
const origin = "http://localhost:3000"
const outDir = new URL(".", import.meta.url).pathname

await mkdir(outDir, { recursive: true })

const child = spawn(
  chrome,
  [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userData}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--enable-unsafe-webgpu",
    "--use-angle=metal",
    "--window-size=1440,900",
    origin,
  ],
  { stdio: "ignore" }
)

process.on("exit", () => child.kill("SIGTERM"))

const wsUrl = await waitFor(async () => {
  const res = await fetch(`http://127.0.0.1:${port}/json/list`)
  const list = await res.json()
  const page = list.find((tab) => tab.type === "page" && tab.url.includes("localhost"))
  if (!page?.webSocketDebuggerUrl) throw new Error("waiting")
  return page.webSocketDebuggerUrl
}, 15000)

const cdp = await Cdp.connect(wsUrl)
await cdp.send("Page.enable")
await cdp.send("Runtime.enable")
await cdp.send("Page.navigate", { url: origin })
await sleep(3000)

const text = await cdp.send("Runtime.evaluate", {
  expression: "document.body.innerText",
  returnByValue: true,
})

const shot = await cdp.send("Page.captureScreenshot", { format: "png" })
await writeFile(join(outDir, "verify-desktop.png"), Buffer.from(shot.data, "base64"))

await cdp.send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
})
await sleep(1000)
const mobileShot = await cdp.send("Page.captureScreenshot", { format: "png" })
await writeFile(join(outDir, "verify-mobile.png"), Buffer.from(mobileShot.data, "base64"))

const body = text.result.value
console.log(
  JSON.stringify(
    {
      hasLanyard: /Lanyard/.test(body),
      hasInspector: /Inspector/.test(body),
      hasDownload: /Download PNG/.test(body),
      hasStudio: /Studio/.test(body),
      samples: ["Linear", "Vercel", "Apple", "Exa"].map((s) => ({
        name: s,
        present: body.includes(s),
      })),
    },
    null,
    2
  )
)

child.kill("SIGTERM")
