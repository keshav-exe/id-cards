import { execFile } from "node:child_process"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { promisify } from "node:util"

import { normalizeBrand, type BrandpullProfile } from "@/lib/brand"

const run = promisify(execFile)

/**
 * POST { url } → normalized Brand.
 * Shells out to the local `brandpull` bin (Chromium via Playwright, 5–20 s).
 */
export async function POST(request: Request) {
  let body: { url?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { error: "Body must be JSON with a url field." },
      { status: 400 }
    )
  }

  const target = coerceUrl(body.url)
  if (!target) {
    return Response.json(
      { error: "Enter a full website address, like https://linear.app." },
      { status: 400 }
    )
  }

  const dir = await mkdtemp(join(tmpdir(), "brandpull-"))
  const out = join(dir, "brand.json")

  try {
    await run(
      join(process.cwd(), "node_modules/.bin/brandpull"),
      [target, "--no-preview", "-o", out, "--timeout", "30000"],
      {
        timeout: 90_000,
        env: { ...process.env, CI: "1" },
        maxBuffer: 8 * 1024 * 1024,
      }
    )
    const profile = JSON.parse(await readFile(out, "utf8")) as BrandpullProfile
    return Response.json({
      brand: normalizeBrand({ ...profile, url: profile.url ?? target }),
    })
  } catch (error) {
    const detail = describe(error)
    return Response.json(
      {
        error:
          `brandpull couldn't read ${new URL(target).hostname}. ${detail}`.trim(),
      },
      { status: 502 }
    )
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined)
  }
}

function coerceUrl(value: string | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`
  try {
    const url = new URL(withScheme)
    if (!url.hostname.includes(".")) return null
    return url.toString()
  } catch {
    return null
  }
}

function describe(error: unknown): string {
  if (error && typeof error === "object") {
    const e = error as {
      killed?: boolean
      stderr?: string
      code?: string | number
    }
    if (e.killed) return "It timed out after 90 seconds."
    if (e.code === "ENOENT") return "brandpull isn't installed."
    const stderr = (e.stderr ?? "").toString().trim().split("\n").at(-1)
    if (stderr) return stderr.slice(0, 200)
  }
  return error instanceof Error ? error.message : ""
}
