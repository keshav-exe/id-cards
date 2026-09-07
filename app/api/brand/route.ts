import { extractBranding } from "@/lib/brandpull"
import { extractBrandProfile } from "@/lib/extract-brand"
import { normalizeBrand } from "@/lib/brand"
import { isPrivateHost, withHttps } from "@/lib/net"

// Chromium cold start (~3s) + navigation (≤15s) + settle. Fluid Compute
// allows this on Hobby; the fetch fallback keeps failures cheap.
export const maxDuration = 60

/**
 * POST { url } → normalized Brand.
 *
 * Primary: brandpull's rendered extraction in headless Chromium (exact port,
 * runs in-process). Fallback: the fetch-only extractor when Chromium can't
 * launch or the page refuses to render (bot walls, timeouts).
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
      { error: "Enter a website, like linear.app." },
      { status: 400 }
    )
  }

  const errors: string[] = []

  try {
    const profile = await extractBranding(target, {
      timeoutMs: 15_000,
      waitMs: 1_500,
    })
    return Response.json({
      engine: "chromium",
      brand: normalizeBrand({
        ...profile,
        url: profile.finalUrl || profile.url || target,
      }),
    })
  } catch (error) {
    errors.push(describe(error))
    console.warn("[brand] chromium failed, falling back to fetch:", errors[0])
  }

  try {
    const profile = await extractBrandProfile(target)
    return Response.json({
      engine: "fetch",
      brand: normalizeBrand({ ...profile, url: profile.url ?? target }),
    })
  } catch (error) {
    errors.push(describe(error))
  }

  const host = new URL(target).hostname
  return Response.json(
    { error: `Couldn't read ${host}. ${errors.at(-1) ?? ""}`.trim() },
    { status: 502 }
  )
}

function describe(error: unknown): string {
  return error instanceof Error
    ? error.message.split("\n")[0].slice(0, 160)
    : String(error).slice(0, 160)
}

function coerceUrl(value: string | undefined): string | null {
  if (!value) return null
  const trimmed = withHttps(value)
  if (!trimmed) return null
  try {
    const url = new URL(trimmed)
    if (!url.hostname.includes(".")) return null
    if (isPrivateHost(url.hostname)) return null
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    return url.toString()
  } catch {
    return null
  }
}
