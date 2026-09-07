import { extractBrandProfile } from "@/lib/extract-brand"
import { normalizeBrand } from "@/lib/brand"
import { isPrivateHost, withHttps } from "@/lib/net"

// Fetch-only: HTML / CSS / icons. No Chromium — Vercel packaging fails when
// playwright-core (pnpm symlinks) or a 60MB chromium pack lands in the
// function bundle.
export const maxDuration = 30

/**
 * POST { url } → normalized Brand.
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

  try {
    const profile = await extractBrandProfile(target)
    return Response.json({
      engine: "fetch",
      brand: normalizeBrand({ ...profile, url: profile.url ?? target }),
    })
  } catch (error) {
    const host = new URL(target).hostname
    const detail =
      error instanceof Error
        ? error.message.split("\n")[0].slice(0, 160)
        : String(error).slice(0, 160)
    return Response.json(
      { error: `Couldn't read ${host}. ${detail}`.trim() },
      { status: 502 }
    )
  }
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
