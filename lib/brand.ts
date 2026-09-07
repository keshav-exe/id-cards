import {
  chroma,
  hueDeg,
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
    secondary?: string | null
    accent?: string | null
    background?: string | null
    textPrimary?: string | null
    textSecondary?: string | null
    link?: string | null
  } | null
  fonts?: unknown[]
  typography?: Record<string, unknown>
  components?: {
    buttonPrimary?: { background?: string | null; textColor?: string | null }
    buttonSecondary?: { background?: string | null; textColor?: string | null }
    input?: unknown
  } | null
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
  /**
   * Every distinct chromatic colour the site uses, identity hue first. Unlike
   * `colors`, highlighters (Ramp lime, Linear yellow) survive here so they can
   * be offered as card finishes.
   */
  palette: string[]
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
  const name = brandName(profile.brandName, domain)

  const background =
    parseColor(profile.colors?.background) ?? parseColor(FALLBACK.background)!
  const text =
    parseColor(profile.colors?.textPrimary) ?? parseColor(FALLBACK.text)!
  const { primary, accent } = refineBrandColors({
    primary:
      parseColor(profile.colors?.primary) ?? parseColor(FALLBACK.primary)!,
    accent: parseColor(profile.colors?.accent),
    background,
  })

  const logo = pickLogo([
    profile.logo,
    profile.images?.logo,
    profile.images?.favicon,
  ])

  const colors = {
    primary: toHex(primary),
    accent: toHex(accent),
    background: toHex(background),
    text: toHex(text),
  }

  return {
    id: slug(domain),
    name,
    domain,
    url,
    logo,
    logoShape: detectLogoShape(logo),
    favicon: pickLogo([profile.images?.favicon]),
    ogImage: safeUrl(profile.images?.ogImage),
    colors,
    palette: extractPalette(profile, identityHue(colors)),
    monogram: monogramFor(name),
    dark: luminance(background) < 0.4,
  }
}

/**
 * brandpull's four slots are a first pass. Dark marketing sites often report
 * white as `primary` and a product highlighter (Linear lime, status yellow)
 * as `accent`. For a metal card we want the identity hue, not the loudest one.
 */
function refineBrandColors({
  primary,
  accent,
  background,
}: {
  primary: RGB
  accent: RGB | null
  background: RGB
}): { primary: RGB; accent: RGB } {
  let nextPrimary = primary
  let nextAccent = accent ?? primary

  if (isPaper(nextPrimary) && isIdentity(nextAccent)) {
    nextPrimary = nextAccent
  } else if (isPaper(nextPrimary) && isIdentity(background)) {
    nextPrimary = background
  }

  if (isHighlighter(nextAccent) && isIdentity(nextPrimary)) {
    nextAccent = mix(nextPrimary, [1, 1, 1], 0.36)
  } else if (isPaper(nextAccent) && isIdentity(nextPrimary)) {
    nextAccent = mix(nextPrimary, [1, 1, 1], 0.32)
  }

  return { primary: nextPrimary, accent: nextAccent }
}

/** Identity hue for materials, photos, and metal tints. */
export function brandHue(brand: Brand): RGB {
  return identityHue(brand.colors)
}

/**
 * Chromatic colours worth offering as a finish, identity first. Pulls from
 * every slot brandpull fills (palette, link, button fills) so a site whose
 * loudest colour is a highlighter still gets it as an option. Near-duplicates
 * collapse; paper, ink, and greys are dropped.
 */
function extractPalette(profile: BrandpullProfile, identity: RGB): string[] {
  const sources = [
    profile.colors?.primary,
    profile.colors?.accent,
    profile.components?.buttonPrimary?.background,
    profile.colors?.secondary,
    profile.colors?.link,
    profile.components?.buttonSecondary?.background,
    profile.components?.buttonPrimary?.textColor,
  ]

  const picked: RGB[] = [identity]
  for (const source of sources) {
    const color = parseColor(source)
    if (!color) continue
    if (isPaper(color) || isInk(color) || chroma(color) < 0.12) continue
    if (picked.some((existing) => distance(existing, color) < 0.16)) continue
    picked.push(color)
    if (picked.length >= 4) break
  }
  return picked.map(toHex)
}

function distance(a: RGB, b: RGB): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

function identityHue(colors: Brand["colors"]): RGB {
  const primary = parseColor(colors.primary)!
  const accent = parseColor(colors.accent)!
  const background = parseColor(colors.background)!

  const ranked = [primary, accent]
    .map((color, index) => ({
      color,
      score: identityScore(color, index === 0 ? "primary" : "accent"),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  if (ranked[0]) return ranked[0].color
  if (chroma(background) > 0.12) return background
  return mix([0.32, 0.33, 0.36], background, 0.35)
}

function identityScore(color: RGB, role: "primary" | "accent"): number {
  if (isPaper(color) || isInk(color)) return -1
  const sat = chroma(color)
  if (sat < 0.08) return -0.2

  let score = sat
  if (role === "primary") score += 0.18
  // Rendered sites often report the highlighter as `primary` (Linear, Ramp).
  // Prefer a saturated mid-tone identity when one exists; the highlighter
  // still ships in `palette`.
  if (isHighlighter(color)) score -= role === "accent" ? 0.85 : 0.45

  const lum = luminance(color)
  if (lum > 0.1 && lum < 0.55) score += 0.12
  return score
}

function isPaper(color: RGB) {
  return luminance(color) > 0.86 && chroma(color) < 0.14
}

function isInk(color: RGB) {
  return luminance(color) < 0.05
}

function isHighlighter(color: RGB) {
  const lum = luminance(color)
  const sat = chroma(color)
  const hue = hueDeg(color)
  return sat > 0.5 && lum > 0.52 && hue >= 42 && hue <= 102
}

function isIdentity(color: RGB) {
  return chroma(color) > 0.14 && !isPaper(color) && !isInk(color) && !isHighlighter(color)
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

/**
 * brandpull falls back to `<title>` when a site has no og:site_name, which
 * yields taglines ("Financial Infrastructure to Grow Your Revenue"). A brand
 * name is short; anything longer is a tagline and the domain is a better bet.
 */
function brandName(raw: string | null | undefined, domain: string) {
  const value = (raw ?? "").trim()
  const words = value.split(/\s+/).filter(Boolean)
  if (!value || value.length > 24 || words.length > 3) {
    return titleFromDomain(domain)
  }
  return value
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
