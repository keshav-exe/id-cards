import { chromium as playwright, type Browser } from "playwright-core"

import { extractBrandingFromPage } from "./page-script"
import { processRawBranding } from "./processor"
import type { BrandingProfile, RawBranding } from "./types"

export type { BrandingProfile } from "./types"

/**
 * brandpull's rendered extraction, running in-process instead of as a CLI.
 * Port of https://github.com/suraj-xd/brandpull src/branding/index.ts (MIT).
 *
 * Locally: playwright-core drives the Chromium that `playwright` installed.
 * On Vercel: @sparticuz/chromium ships a Lambda-built headless_shell and is
 * inflated to /tmp on first launch. Set `serverExternalPackages` for both.
 */

export interface ExtractBrandingOptions {
  /** Navigation timeout. brandpull default 30s; keep under the route budget. */
  timeoutMs?: number
  /** Extra settle time after load. brandpull default 2000. */
  waitMs?: number
  debug?: boolean
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

const IS_SERVERLESS = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
)

// Warm instances reuse one Chromium; Fluid Compute may serve concurrent
// requests from the same process, so each request gets its own context.
const globalCache = globalThis as unknown as {
  __brandpullBrowser?: Promise<Browser> | null
}

async function launchBrowser(): Promise<Browser> {
  if (IS_SERVERLESS) {
    const { default: sparticuz } = await import("@sparticuz/chromium")
    // WebGL via swiftshader isn't needed for style sampling; skip its setup.
    sparticuz.setGraphicsMode = false
    return playwright.launch({
      args: sparticuz.args,
      executablePath: await sparticuz.executablePath(),
      headless: true,
    })
  }
  try {
    return await playwright.launch({ headless: true })
  } catch (error) {
    try {
      return await playwright.launch({ headless: true, channel: "chrome" })
    } catch {
      throw error
    }
  }
}

async function getBrowser(): Promise<Browser> {
  if (!globalCache.__brandpullBrowser) {
    globalCache.__brandpullBrowser = launchBrowser().then((browser) => {
      browser.on("disconnected", () => {
        globalCache.__brandpullBrowser = null
      })
      return browser
    })
  }
  try {
    return await globalCache.__brandpullBrowser
  } catch (error) {
    globalCache.__brandpullBrowser = null
    throw error
  }
}

/**
 * Render `inputUrl` in Chromium and score the live DOM into a brand profile.
 * Throws on navigation/launch failure so callers can fall back; brandpull
 * itself returns a zeroed profile with diagnostics instead.
 */
export async function extractBranding(
  inputUrl: string,
  options: ExtractBrandingOptions = {}
): Promise<BrandingProfile> {
  const url = normalizeUrl(inputUrl)
  const timeoutMs = options.timeoutMs ?? 30_000
  const browser = await getBrowser()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    userAgent: UA,
  })
  try {
    const page = await context.newPage()
    page.setDefaultTimeout(timeoutMs)
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs })
    await page
      .waitForLoadState("networkidle", { timeout: 6_000 })
      .catch(() => undefined)
    await page.waitForTimeout(options.waitMs ?? 2_000)

    const raw = (await page.evaluate(extractBrandingFromPage)) as RawBranding
    const profile = processRawBranding(raw, { debug: options.debug, url })
    if (!options.debug) delete profile.debug
    return profile
  } finally {
    await context.close().catch(() => undefined)
  }
}

function normalizeUrl(input: string): string {
  const raw = /^https?:\/\//i.test(input) ? input : `https://${input}`
  return new URL(raw).href
}
