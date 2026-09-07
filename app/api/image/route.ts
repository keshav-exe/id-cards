import type { NextRequest } from "next/server"

import { BROWSER_UA, isPrivateHost } from "@/lib/net"

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
    headers: {
      accept: "image/svg+xml,image/png,image/*;q=0.8,*/*;q=0.4",
      "user-agent": BROWSER_UA,
    },
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
  if (/html|javascript|json|text\/css/.test(type)) {
    return new Response("Not an SVG or PNG", { status: 415 })
  }
  const isSvgOrPng =
    type.includes("svg") ||
    type === "image/png" ||
    ((type.startsWith("image/") || type === "application/octet-stream") &&
      (path.endsWith(".svg") || path.endsWith(".png")))
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
