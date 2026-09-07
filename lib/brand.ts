import {
  chroma,
  luminance,
  mix,
  parseColor,
  toHex,
  type RGB,
} from "@/lib/color"

/**
 * Raw output of `npx brandpull <url> --no-preview`.
 * https://github.com/suraj-xd/brandpull#output-shape
 */
export interface BrandpullProfile {
  brandName?: string | null
  url?: string | null
  logo?: string | null
  images?: {
    logo?: string | null
    favicon?: string | null
    ogImage?: string | null
  } | null
  colors?: {
    primary?: string | null
    accent?: string | null
    background?: string | null
    textPrimary?: string | null
  } | null
  fonts?: unknown[]
  typography?: Record<string, unknown>
  components?: Record<string, unknown>
  confidence?: Record<string, unknown>
}

/** Normalized brand the card renderer consumes. Colors are hex strings. */
export interface Brand {
  id: string
  name: string
  domain: string
  url: string
  /** SVG / PNG / data / blob. Go through `proxyImage()` before canvas paint. */
  logo: string | null
  /** Wide lockups sit as the name; square marks sit next to it. */
  logoShape: "mark" | "wordmark"
  favicon: string | null
  ogImage: string | null
  colors: {
    primary: string
    accent: string
    background: string
    text: string
  }
  /** 1–2 letters used when there is no logo. */
  monogram: string
  /** True when the site itself is dark-themed. */
  dark: boolean
}

const FALLBACK: Brand["colors"] = {
  primary: "#e8e8ea",
  accent: "#8d8f96",
  background: "#0d0e11",
  text: "#f5f5f7",
}

export function normalizeBrand(profile: BrandpullProfile): Brand {
  const url = safeUrl(profile.url) ?? "https://example.com"
  const domain = new URL(url).hostname.replace(/^www\./, "")
  const name = (profile.brandName ?? "").trim() || titleFromDomain(domain)

  const background =
    parseColor(profile.colors?.background) ?? parseColor(FALLBACK.background)!
  const primary =
    parseColor(profile.colors?.primary) ?? parseColor(FALLBACK.primary)!
  const accent = parseColor(profile.colors?.accent) ?? primary
  const text =
    parseColor(profile.colors?.textPrimary) ?? parseColor(FALLBACK.text)!

  const logo = pickLogo([
    profile.logo,
    profile.images?.logo,
    profile.images?.favicon,
  ])

  return {
    id: slug(domain),
    name,
    domain,
    url,
    logo,
    logoShape: detectLogoShape(logo),
    favicon: pickLogo([profile.images?.favicon]),
    ogImage: safeUrl(profile.images?.ogImage),
    colors: {
      primary: toHex(primary),
      accent: toHex(accent),
      background: toHex(background),
      text: toHex(text),
    },
    monogram: monogramFor(name),
    dark: luminance(background) < 0.4,
  }
}

/**
 * The most "brand-like" chromatic color. brandpull reports `primary` as the
 * dominant UI color, which on dark sites is often white — so prefer chroma.
 */
export function brandHue(brand: Brand): RGB {
  const candidates = [
    parseColor(brand.colors.accent)!,
    parseColor(brand.colors.primary)!,
    parseColor(brand.colors.background)!,
  ]
  const chromatic = candidates
    .filter((c) => chroma(c) > 0.12)
    .sort((a, b) => chroma(b) - chroma(a))[0]
  if (chromatic) return chromatic
  return mix([0.32, 0.33, 0.36], candidates[2], 0.35)
}

export function monogramFor(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return "ID"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

/** Route remote images through our proxy so they can be drawn onto a canvas. */
export function proxyImage(src: string | null): string | null {
  if (!src) return null
  if (
    src.startsWith("/") ||
    src.startsWith("data:") ||
    src.startsWith("blob:")
  ) {
    return src
  }
  return `/api/image?url=${encodeURIComponent(src)}`
}

/** SVG, PNG, or a data/blob of either. ICO and raster junk are dropped. */
export function pickLogo(
  candidates: (string | null | undefined)[]
): string | null {
  for (const value of candidates) {
    if (!value) continue
    if (
      value.startsWith("data:image/svg+xml") ||
      value.startsWith("data:image/png") ||
      value.startsWith("blob:")
    ) {
      return value
    }
    if (value.startsWith("/") && /\.(svg|png)(\?|#|$)/i.test(value)) {
      return value
    }
    if (/\.ico(\?|#|$)/i.test(value)) continue
    const url = safeUrl(value)
    if (url && /\.(svg|png)(\?|#|$)/i.test(url)) return url
  }
  return null
}

export function detectLogoShape(src: string | null): "mark" | "wordmark" {
  if (!src?.startsWith("data:image/svg")) return "mark"
  const svg = decodeSvgData(src)
  if (!svg) return "mark"
  const vb = svg.match(
    /viewBox=["']\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)/i
  )
  if (vb) {
    const w = Number(vb[1])
    const h = Number(vb[2])
    if (w > 0 && h > 0 && w / h > 2.1) return "wordmark"
  }
  return "mark"
}

function decodeSvgData(src: string): string | null {
  const comma = src.indexOf(",")
  if (comma < 0) return null
  const meta = src.slice(0, comma)
  const data = src.slice(comma + 1)
  try {
    if (/;base64/i.test(meta)) return atob(data)
    return decodeURIComponent(data)
  } catch {
    return null
  }
}

function safeUrl(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const u = new URL(value)
    return u.protocol === "http:" || u.protocol === "https:"
      ? u.toString()
      : null
  } catch {
    return null
  }
}

function titleFromDomain(domain: string) {
  const label = domain.split(".")[0] ?? domain
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}
