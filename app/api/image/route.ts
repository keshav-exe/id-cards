import type { NextRequest } from "next/server"

const MAX_BYTES = 8 * 1024 * 1024

/**
 * Same-origin proxy for brand assets so they can be painted onto an export
 * canvas without tainting it. Only http(s) images, capped at 8 MB.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url")
  if (!raw) {
    return new Response("Missing url", { status: 400 })
  }

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return new Response("Invalid url", { status: 400 })
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return new Response("Only http(s) urls are supported", { status: 400 })
  }
  if (isPrivateHost(url.hostname)) {
    return new Response("Host not allowed", { status: 400 })
  }

  const upstream = await fetch(url, {
    headers: { accept: "image/*,*/*;q=0.8", "user-agent": "id-cards/1.0" },
    redirect: "follow",
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null)

  if (!upstream?.ok || !upstream.body) {
    return new Response("Upstream image unavailable", { status: 502 })
  }

      const type =
        upstream.headers.get("content-type") ?? "application/octet-stream"
      const path = url.pathname.toLowerCase()
      if (type.includes("icon") || path.endsWith(".ico")) {
        return new Response("Not an SVG or PNG", { status: 415 })
      }
      const isSvgOrPng =
        type.startsWith("image/svg") ||
        type === "image/png" ||
        path.endsWith(".svg") ||
        path.endsWith(".png")
      if (!isSvgOrPng) {
        return new Response("Not an SVG or PNG", { status: 415 })
      }
  const length = Number(upstream.headers.get("content-length") ?? 0)
  if (length > MAX_BYTES) {
    return new Response("Image too large", { status: 413 })
  }

  return new Response(upstream.body, {
    headers: {
      "content-type": type,
      "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  })
}

function isPrivateHost(host: string) {
  if (host === "localhost" || host.endsWith(".local")) return true
  const m = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (!m) return false
  const [a, b] = [Number(m[1]), Number(m[2])]
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  )
}
