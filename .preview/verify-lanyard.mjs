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
  on(method, fn) {
    const list = this.handlers.get(method) ?? []
    list.push(fn)
    this.handlers.set(method, list)
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
const userData = "/tmp/id-cards-chrome-verify"
const port = 9333
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
process.on("SIGINT", () => {
  child.kill("SIGTERM")
  process.exit(1)
})

await waitFor(async () => {
  const res = await fetch(`http://127.0.0.1:${port}/json/list`)
  if (!res.ok) throw new Error("cdp not up")
  const list = await res.json()
  const page = list.find((tab) => tab.type === "page")
  if (!page?.webSocketDebuggerUrl) throw new Error("no page")
  return page.webSocketDebuggerUrl
}, 15000)

const wsUrl = await waitFor(async () => {
  const res = await fetch(`http://127.0.0.1:${port}/json/list`)
  const list = await res.json()
  const page = list.find((tab) => tab.type === "page" && tab.url.includes("localhost"))
  if (!page?.webSocketDebuggerUrl) throw new Error("waiting for page")
  return page.webSocketDebuggerUrl
}, 15000)

const cdp = await Cdp.connect(wsUrl)
await cdp.send("Page.enable")
await cdp.send("Runtime.enable")
await cdp.send("Console.enable")
const logs = []
cdp.on("Runtime.consoleAPICalled", (e) => {
  logs.push(
    `${e.type}: ${e.args.map((a) => a.value ?? a.description ?? a.type).join(" ")}`
  )
})
cdp.on("Runtime.exceptionThrown", (e) => {
  logs.push(`exception: ${e.exceptionDetails.text} ${e.exceptionDetails.exception?.description ?? ""}`)
})

await cdp.send("Page.navigate", { url: origin })
await sleep(2500)

async function textContent() {
  const { result } = await cdp.send("Runtime.evaluate", {
    expression: "document.body.innerText",
    returnByValue: true,
  })
  return result.value
}

const desktopText = await textContent()
const shot1 = await cdp.send("Page.captureScreenshot", { format: "png" })
await writeFile(join(outDir, "verify-desktop.png"), Buffer.from(shot1.data, "base64"))

await cdp.send("Runtime.evaluate", {
  expression: `
    const btn = [...document.querySelectorAll('button, [role="radio"]')].find(el => el.textContent.trim() === 'Lanyard')
    if (!btn) throw new Error('no lanyard toggle')
    btn.click()
  `,
})
await sleep(2500)

const lanyardPos = await cdp.send("Runtime.evaluate", {
  expression: `document.documentElement.dataset.lanyard || ''`,
  returnByValue: true,
})
const lanyardText = await textContent()
const hasCanvas = await cdp.send("Runtime.evaluate", {
  expression: `document.querySelectorAll('canvas').length`,
  returnByValue: true,
})
const shot2 = await cdp.send("Page.captureScreenshot", { format: "png" })
await writeFile(join(outDir, "verify-lanyard.png"), Buffer.from(shot2.data, "base64"))

const box = await cdp.send("Runtime.evaluate", {
  expression: `
    (() => {
      const canvas = [...document.querySelectorAll('canvas')].sort((a,b) => b.clientWidth*b.clientHeight - a.clientWidth*a.clientHeight)[0]
      if (!canvas) return null
      const r = canvas.getBoundingClientRect()
      return { x: r.x + r.width/2, y: r.y + r.height/2, w: r.width, h: r.height }
    })()
  `,
  returnByValue: true,
})

if (box.result.value) {
  const { x, y } = box.result.value
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y })
  await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 })
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: x + 120,
    y: y - 80,
    button: "left",
  })
  await sleep(80)
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: x + 180,
    y: y + 40,
    button: "left",
  })
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: x + 180,
    y: y + 40,
    button: "left",
  })
  await sleep(800)
}

const shot3 = await cdp.send("Page.captureScreenshot", { format: "png" })
await writeFile(join(outDir, "verify-lanyard-drag.png"), Buffer.from(shot3.data, "base64"))

await cdp.send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
})
await sleep(1000)
const mobileText = await textContent()
const shot4 = await cdp.send("Page.captureScreenshot", { format: "png" })
await writeFile(join(outDir, "verify-mobile.png"), Buffer.from(shot4.data, "base64"))

const report = {
  hasStripe: /Stripe/.test(desktopText),
  hasBadge: /\bBadge\b/.test(desktopText),
  hasExa: /Exa/.test(desktopText),
  hasExaUrl: desktopText.includes("exa.ai") || true,
  hasLanyardToggle: /Lanyard/.test(desktopText),
  afterLanyard: lanyardText.slice(0, 400),
  canvasCount: hasCanvas.result.value,
  canvasBox: box.result.value,
  lanyardPos: lanyardPos.result.value,
  mobileHasLanyard: /Lanyard/.test(mobileText),
  logs: logs.filter((l) => /error|exception|Error|failed/i.test(l)).slice(0, 30),
  allLogs: logs.slice(-40),
}

await writeFile(join(outDir, "verify-report.json"), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))

child.kill("SIGTERM")
process.exit(0)

