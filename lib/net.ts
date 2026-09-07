/** Bare hosts like `linear.app` become `https://linear.app`. */
export function withHttps(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`
}

export const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

export function isPrivateHost(host: string) {
  const name = host.replace(/^\[|\]$/g, "").toLowerCase()
  if (
    name === "localhost" ||
    name.endsWith(".localhost") ||
    name.endsWith(".local") ||
    name.endsWith(".internal")
  ) {
    return true
  }
  if (name.includes(":")) {
    return (
      name === "::1" ||
      name.startsWith("fc") ||
      name.startsWith("fd") ||
      name.startsWith("fe80")
    )
  }
  const m = name.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
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

export function parsePublicUrl(value: string | null | undefined): URL | null {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    if (isPrivateHost(url.hostname)) return null
    return url
  } catch {
    return null
  }
}

export async function fetchPublic(
  url: string | URL,
  init: RequestInit & { timeout?: number } = {}
): Promise<Response | null> {
  const parsed = parsePublicUrl(typeof url === "string" ? url : url.toString())
  if (!parsed) return null
  const { timeout = 10_000, headers, ...rest } = init
  try {
    return await fetch(parsed, {
      redirect: "follow",
      signal: AbortSignal.timeout(timeout),
      headers: {
        "user-agent": BROWSER_UA,
        "accept-language": "en-US,en;q=0.8",
        ...headers,
      },
      ...rest,
    })
  } catch {
    return null
  }
}
