import type { BrandpullProfile } from "@/lib/brand"
import {
  chroma,
  hueDeg,
  luminance,
  parseColor,
  toHex,
  type RGB,
} from "@/lib/color"
import { fetchPublic, parsePublicUrl } from "@/lib/net"

const ICON_PROBES = [
  "/favicon.svg",
  "/icon.svg",
  "/icon.png",
  "/apple-icon.png",
  "/apple-icon-180x180.png",
  "/apple-touch-icon.png",
  "/apple-touch-icon-precomposed.png",
  "/logo.svg",
]

const CHALLENGE =
  /Attention Required|Just a moment|cf-browser-verification|challenge-platform|Enable JavaScript and cookies to continue/i

/**
 * Serverless stand-in for brandpull. Reads public HTML / icons — no Chromium.
 * Cloudflare-blocked origins still resolve via icon probes + a text reader.
 */
export async function extractBrandProfile(
  target: string
): Promise<BrandpullProfile> {
  const origin = new URL(target)
  const homepage = await readHomepage(origin)

  const [icons, sheets] = await Promise.all([
    collectIcons(origin, homepage?.html ?? "", homepage?.finalUrl ?? origin),
    homepage ? readStylesheets(origin, homepage.html, homepage.finalUrl) : "",
  ])

  const name =
    homepage?.name ??
    (await readFallbackName(origin)) ??
    titleFromDomain(origin.hostname)

  const colors = pickColors(
    `${homepage?.html ?? ""}\n${sheets}`,
    homepage?.themeColor ?? null
  )

  return {
    brandName: name,
    url: (homepage?.finalUrl ?? origin).toString(),
    logo: icons.logo,
    images: {
      logo: icons.logo,
      favicon: icons.favicon,
      ogImage: homepage?.ogImage ?? null,
    },
    colors,
  }
}

async function readHomepage(origin: URL): Promise<{
  html: string
  finalUrl: URL
  name: string | null
  themeColor: string | null
  ogImage: string | null
} | null> {
  const res = await fetchPublic(origin, {
    timeout: 12_000,
    headers: { accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5" },
  })
  if (!res) return null

  const type = res.headers.get("content-type") ?? ""
  const html = (await res.text().catch(() => "")).slice(0, 1_500_000)
  if (!html || isChallenge(res.status, html, type)) return null

  let finalUrl = origin
  try {
    finalUrl = new URL(res.url)
  } catch {
    /* keep origin */
  }

  const meta = readMeta(html, finalUrl)
  return { html, finalUrl, ...meta }
}

async function readFallbackName(origin: URL): Promise<string | null> {
  const res = await fetchPublic(`https://r.jina.ai/${origin.toString()}`, {
    timeout: 8_000,
    headers: { accept: "text/plain" },
  })
  if (!res?.ok) return null
  const text = (await res.text().catch(() => "")).slice(0, 8_000)
  const title = text.match(/^Title:\s*(.+)$/m)?.[1]?.trim()
  if (!title || !plausibleName(title, origin.hostname)) return null
  return cleanName(title)
}

function isChallenge(status: number, html: string, type: string) {
  if (status === 403 || status === 503) return true
  if (type && !/html|xml|text\/plain/i.test(type)) return true
  return CHALLENGE.test(html.slice(0, 12_000))
}

function readMeta(html: string, base: URL) {
  const tags = [...html.matchAll(/<(meta|link|title)(\s[^>]*)?\s*\/?>/gi)]
  let title: string | null = null
  let siteName: string | null = null
  let appName: string | null = null
  let themeLight: string | null = null
  let themeDark: string | null = null
  let theme: string | null = null
  let ogImage: string | null = null

  const titleText = html.match(/<title[^>]*>([^<]+)/i)?.[1]
  if (titleText) title = decodeEntities(titleText)

  for (const match of tags) {
    const name = match[1].toLowerCase()
    const attrs = parseAttrs(match[2] ?? "")
    if (name === "meta") {
      const key = (
        attrs.property ||
        attrs.name ||
        attrs.itemprop ||
        ""
      ).toLowerCase()
      const content = decodeEntities(attrs.content || attrs.value || "")
      if (!content) continue
      if (key === "og:site_name") siteName = content
      if (key === "application-name") appName = content
      if (key === "og:title" && !title) title = content
      if (key === "theme-color") {
        const media = (attrs.media || "").toLowerCase()
        if (media.includes("dark")) themeDark = content
        else if (media.includes("light")) themeLight = content
        else theme ??= content
      }
      if (key === "og:image" || key === "twitter:image") {
        ogImage ??= resolveUrl(content, base)
      }
    }
  }

  return {
    name: cleanName(siteName || appName || title || ""),
    themeColor: themeDark || theme || themeLight,
    ogImage,
  }
}

async function collectIcons(origin: URL, html: string, base: URL) {
  const nav = extractNavLogos(html, base)
  const fromHtml = iconsFromHtml(html, base)
  const probed = ICON_PROBES.map((path) => new URL(path, origin).toString())
  const ranked = unique([...fromHtml.ranked.slice(0, 6), ...probed]).slice(
    0,
    10
  )

  const [navVerified, verified] = await Promise.all([
    Promise.all(
      nav.slice(0, 4).map((src) =>
        src.startsWith("data:image/svg") ? src : verifyImage(src)
      )
    ),
    Promise.all(ranked.map(verifyImage)),
  ])

  const navLogo = navVerified.find((url): url is string => Boolean(url))
  const pool = verified.filter((url): url is string => Boolean(url))
  const marks = pool.filter(isMarkPath)
  const icons = marks.length ? marks : pool
  const svg = icons.find((url) => /\.svg(\?|#|$)/i.test(url))
  const png = icons.find((url) => /\.png(\?|#|$)/i.test(url))
  const fallback = svg ?? png ?? icons[0] ?? null
  const favicon =
    icons.find((url) => /favicon|icon\.svg|icon\.png/i.test(url)) ?? fallback

  return { logo: navLogo ?? fallback, favicon }
}

/**
 * Navbar / home-link marks beat favicons. Sites like Extraordinary inline the
 * wordmark as <svg> in <header>; brandpull's Chromium walk found those, we
 * have to scrape them out of the HTML.
 */
function extractNavLogos(html: string, base: URL) {
  const scored: { src: string; score: number }[] = []

  for (const { text, bonus } of navRegions(html)) {
    for (const match of text.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
      if (match[0].length > 25_000) continue
      const attrs = parseAttrs(match[1])
      if (!isHomeOrLogoLink(attrs, match[0], base)) continue
      pushLogoAssets(scored, match[2], base, bonus + 60)
    }
    for (const match of text.matchAll(/<svg\b([^>]*)>[\s\S]*?<\/svg>/gi)) {
      if (!isLogoAttr(parseAttrs(match[1]))) continue
      const data = svgToDataUrl(match[0])
      if (data) {
        scored.push({
          src: data,
          score: bonus + 40 + svgAspectBonus(match[0]),
        })
      }
    }
  }

  scored.sort((a, b) => b.score - a.score)
  return unique(scored.map((item) => item.src))
}

function navRegions(html: string) {
  const regions: { text: string; bonus: number }[] = []
  for (const match of html.matchAll(
    /<(header|nav)\b[^>]*>[\s\S]{0,40000}?<\/\1>/gi
  )) {
    regions.push({ text: match[0], bonus: 80 })
  }
  if (regions.length === 0) {
    regions.push({ text: html.slice(0, 60_000), bonus: 25 })
  }
  return regions
}

function isHomeOrLogoLink(
  attrs: Record<string, string>,
  raw: string,
  base: URL
) {
  const label = `${attrs["aria-label"] || ""} ${attrs.title || ""} ${attrs.class || ""}`
  if (
    /logo|wordmark|brand|\bhome\b/.test(label) ||
    /logo|wordmark/.test(raw.slice(0, 240))
  ) {
    return true
  }
  const href = (attrs.href || "").trim()
  try {
    const url = new URL(href, base)
    return (
      url.origin === base.origin &&
      (url.pathname === "/" || url.pathname === "") &&
      !url.hash
    )
  } catch {
    return href === "/" || href === ""
  }
}

function isLogoAttr(attrs: Record<string, string>) {
  return /logo|wordmark|brand-mark/.test(
    `${attrs.class || ""} ${attrs.id || ""} ${attrs["aria-label"] || ""}`
  )
}

function pushLogoAssets(
  out: { src: string; score: number }[],
  html: string,
  base: URL,
  score: number
) {
  for (const svg of html.matchAll(/<svg\b[\s\S]*?<\/svg>/gi)) {
    const data = svgToDataUrl(svg[0])
    if (data) out.push({ src: data, score: score + svgAspectBonus(svg[0]) })
  }
  for (const img of html.matchAll(/<img\b([^>]*)\/?>/gi)) {
    const src = resolveImgSrc(parseAttrs(img[1]), base)
    if (src) out.push({ src, score })
  }
}

function svgAspectBonus(svg: string) {
  const vb = svg.match(
    /viewBox=["']\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)/i
  )
  if (!vb) return 0
  const w = Number(vb[1])
  const h = Number(vb[2])
  if (w > 0 && h > 0 && w / h > 2.1) return 25
  return 8
}

function svgToDataUrl(svg: string) {
  if (svg.length > 60_000 || /<script/i.test(svg)) return null
  if (!/<path|<rect|<g|<circle|<use|<polygon/i.test(svg)) return null
  const next = /\sxmlns=/.test(svg)
    ? svg
    : svg.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"')
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(next)}`
}

function resolveImgSrc(attrs: Record<string, string>, base: URL) {
  const raw = attrs.src || attrs["data-src"] || ""
  if (!raw) return null
  try {
    const url = new URL(raw, base)
    if (url.pathname.includes("/_next/image")) {
      const inner = url.searchParams.get("url")
      if (inner) return resolveUrl(inner, base)
    }
    return resolveUrl(url.toString(), base)
  } catch {
    return resolveUrl(raw, base)
  }
}

function iconsFromHtml(html: string, base: URL) {
  const ranked: { href: string; score: number }[] = []
  for (const match of html.matchAll(/<link\s[^>]*>/gi)) {
    const attrs = parseAttrs(match[0])
    const rel = (attrs.rel || "").toLowerCase()
    if (!/(icon|apple-touch-icon|mask-icon)/.test(rel)) continue
    const href = resolveUrl(attrs.href, base)
    if (!href) continue
    ranked.push({ href, score: iconScore(rel, attrs) })
  }
  for (const match of html.matchAll(
    /(?:src|href)=["']([^"']+\.(?:svg|png)(?:\?[^"']*)?)["']/gi
  )) {
    const href = resolveUrl(match[1], base)
    if (!href || !isMarkPath(href)) continue
    ranked.push({ href, score: /\.svg/i.test(href) ? 70 : 40 })
  }
  ranked.sort((a, b) => b.score - a.score)
  return { ranked: ranked.map((item) => item.href) }
}

function iconScore(rel: string, attrs: Record<string, string>) {
  const type = (attrs.type || "").toLowerCase()
  const href = attrs.href || ""
  const size = Math.max(
    0,
    ...(`${attrs.sizes || ""}`.match(/\d+/g)?.map(Number) ?? [0])
  )
  if (type.includes("icon") && !type.includes("svg") && !type.includes("png")) {
    return -1
  }
  if (/\.ico(\?|#|$)/i.test(href) || type.includes("x-icon")) return -1
  let score = 10 + Math.min(size, 256) / 20
  if (type.includes("svg") || /\.svg(\?|#|$)/i.test(href)) score += 80
  if (rel.includes("apple-touch-icon")) score += 25
  if (/\.png(\?|#|$)/i.test(href) || type.includes("png")) score += 20
  if (rel.includes("mask-icon")) score += 15
  return score
}

async function verifyImage(url: string): Promise<string | null> {
  if (/\.ico(\?|#|$)/i.test(url)) return null
  const res = await fetchPublic(url, {
    timeout: 6_000,
    headers: { accept: "image/svg+xml,image/png,image/*;q=0.8,*/*;q=0.4" },
  })
  if (!res?.ok) return null
  const type = (res.headers.get("content-type") ?? "").toLowerCase()
  const path = (() => {
    try {
      return new URL(res.url || url).pathname.toLowerCase()
    } catch {
      return url.toLowerCase()
    }
  })()
  if (type.includes("icon") || path.endsWith(".ico")) return null
  if (/html|javascript|json|text\/css/.test(type)) return null
  if (type.includes("svg") || type === "image/png") {
    return parsePublicUrl(res.url || url)?.toString() ?? url
  }
  if (type.startsWith("image/") || type === "application/octet-stream") {
    if (path.endsWith(".svg") || path.endsWith(".png")) {
      return parsePublicUrl(res.url || url)?.toString() ?? url
    }
  }
  return null
}

async function readStylesheets(origin: URL, html: string, base: URL) {
  const hrefs = [...html.matchAll(/<link\s[^>]*>/gi)]
    .map((match) => {
      const attrs = parseAttrs(match[0])
      if (!/\bstylesheet\b/i.test(attrs.rel || "")) return null
      const href = resolveUrl(attrs.href, base)
      if (!href || !relatedHost(new URL(href).hostname, origin.hostname)) {
        return null
      }
      return { href, hint: sheetHint(href) }
    })
    .filter((item): item is { href: string; hint: number } => Boolean(item))
    .sort((a, b) => b.hint - a.hint)
    .slice(0, 2)

  const sheets = await Promise.all(
    hrefs.map(async ({ href }) => {
      const res = await fetchPublic(href, {
        timeout: 5_000,
        headers: { accept: "text/css,*/*;q=0.5" },
      })
      if (!res?.ok) return ""
      return (await res.text().catch(() => "")).slice(0, 80_000)
    })
  )
  return sheets.join("\n")
}

function isMarkPath(url: string) {
  try {
    const file = (new URL(url).pathname.split("/").pop() ?? "").toLowerCase()
    if (/promo|product|hero|banner|screenshot|opengraph|og[-_]/.test(file)) {
      return false
    }
    return /(favicon|apple-touch-icon|apple-icon|(^|[-_])logo|(^|[-_])icon)/.test(
      file
    )
  } catch {
    return false
  }
}

function pickColors(source: string, theme: string | null) {
  const background =
    parseColor(theme) ?? parseColor(cssVar(source, "background") ?? "")
  const namedPrimary = usable(parseColor(cssVar(source, "primary") ?? ""))
  const namedAccent = usable(parseColor(cssVar(source, "accent") ?? ""))

  const scored = collectHexes(source)
    .map(({ hex, bonus }) => {
      const rgb = parseColor(hex)
      if (!rgb) return null
      const score = colorScore(rgb) + bonus
      return score > 0 ? { hex: toHex(rgb), rgb, score } : null
    })
    .filter((item): item is { hex: string; rgb: RGB; score: number } =>
      Boolean(item)
    )
    .sort((a, b) => b.score - a.score)

  const uniqueColors: { hex: string; rgb: RGB; score: number }[] = []
  for (const item of scored) {
    if (uniqueColors.some((other) => similar(other.rgb, item.rgb))) continue
    uniqueColors.push(item)
    if (uniqueColors.length >= 6) break
  }

  const best = uniqueColors.find((item) => item.score >= 0.25)
  const next = uniqueColors.find(
    (item) => item.score >= 0.25 && (!best || !similar(item.rgb, best.rgb))
  )
  let primary = namedPrimary ?? best?.rgb ?? parseColor("#e8e8ea")!
  let accent = namedAccent ?? next?.rgb ?? primary
  if (isStatusGreen(primary) && isBrandBlue(accent)) {
    const swapped = primary
    primary = accent
    accent = swapped
  }

  return {
    primary: toHex(primary),
    accent: toHex(accent),
    background: toHex(background ?? parseColor("#0d0e11")!),
    textPrimary: toHex(
      background && luminance(background) > 0.45
        ? parseColor("#1d1d1f")!
        : parseColor("#f5f5f7")!
    ),
  }
}

function cssVar(source: string, name: string) {
  const re = new RegExp(
    `--(?:color-)?(?:${name}|brand(?:-${name})?)\\s*:\\s*([^;}$]+)`,
    "i"
  )
  return source.match(re)?.[1]?.trim() ?? null
}

function usable(rgb: RGB | null) {
  return rgb && colorScore(rgb) > 0.22 ? rgb : null
}

function collectHexes(source: string) {
  const stats = new Map<string, { rgb: RGB; bonus: number; count: number }>()

  function add(raw: string, bonus: number) {
    const rgb = parseColor(raw)
    if (!rgb) return
    const hex = toHex(rgb)
    const identity = colorScore(rgb) > 0.22
    const applied = identity ? bonus : 0
    const prev = stats.get(hex)
    if (!prev) {
      stats.set(hex, { rgb, bonus: applied, count: 1 })
      return
    }
    prev.bonus = Math.max(prev.bonus, applied)
    prev.count += 1
  }

  for (const match of source.matchAll(/#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
    add(match[0], 0)
  }
  for (const match of source.matchAll(/%23([0-9a-f]{6})\b/gi)) {
    add(`#${match[1]}`, 0.75)
  }
  for (const match of source.matchAll(/fill=["']#([0-9a-f]{3,8})["']/gi)) {
    add(`#${match[1]}`, 0.8)
  }

  return [...stats.values()].map((item) => ({
    hex: toHex(item.rgb),
    bonus: item.bonus + (item.bonus > 0 ? 0.22 * Math.min(item.count, 8) : 0),
  }))
}

function colorScore(rgb: RGB) {
  const sat = chroma(rgb)
  const lum = luminance(rgb)
  if (lum > 0.92 || lum < 0.035) return -1
  if (sat < 0.1) return sat * 0.15
  let score = sat
  if (lum > 0.12 && lum < 0.62) score += 0.16
  if (sat > 0.55 && lum > 0.55) score -= 0.2
  return score
}

function isStatusGreen(rgb: RGB) {
  const hue = hueDeg(rgb)
  return chroma(rgb) > 0.3 && hue >= 88 && hue <= 165
}

function isBrandBlue(rgb: RGB) {
  const hue = hueDeg(rgb)
  return chroma(rgb) > 0.25 && hue >= 200 && hue <= 275
}

function similar(a: RGB, b: RGB) {
  return (
    Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 0.18
  )
}

function sheetHint(href: string) {
  if (/\/color\.[^/]+\.css|tokens|variables|palette/i.test(href)) return 3
  if (/theme|global|root/i.test(href)) return 1
  if (/color/i.test(href)) return 2
  return 0
}

function relatedHost(host: string, origin: string) {
  const a = host.replace(/^www\./, "").toLowerCase()
  const b = origin.replace(/^www\./, "").toLowerCase()
  if (a === b || a.endsWith(`.${b}`)) return true
  const label = b.split(".")[0] ?? ""
  return label.length > 2 && (a === `${label}.com` || a.includes(`${label}.`))
}

function parseAttrs(raw: string) {
  const attrs: Record<string, string> = {}
  const re = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g
  let match: RegExpExecArray | null
  while ((match = re.exec(raw))) {
    attrs[match[1].toLowerCase()] = decodeEntities(
      match[2] ?? match[3] ?? match[4] ?? ""
    )
  }
  return attrs
}

function resolveUrl(value: string | null | undefined, base: URL) {
  if (!value) return null
  try {
    return parsePublicUrl(new URL(value, base).toString())?.toString() ?? null
  } catch {
    return null
  }
}

function cleanName(value: string) {
  const trimmed = decodeEntities(value).replace(/\s+/g, " ").trim()
  if (!trimmed) return null
  const head = trimmed.split(/\s+[–—|•·]\s+/)[0]?.trim() || trimmed
  return head.slice(0, 48) || null
}

function plausibleName(name: string, host: string) {
  const compact = name.toLowerCase().replace(/[^a-z0-9]/g, "")
  const domain = host.replace(/^www\./, "").toLowerCase()
  const label = domain.split(".")[0] ?? domain
  if (!compact || CHALLENGE.test(name)) return false
  if (label.length <= 2) {
    const brand = label + (domain.split(".")[1] ?? "")
    return compact === brand || compact.startsWith(brand)
  }
  return compact.includes(label) || label.includes(compact.slice(0, 6))
}

function titleFromDomain(host: string) {
  const label = host.replace(/^www\./, "").split(".")[0] ?? host
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(x?)([0-9a-f]+);/gi, (_, hex, code) =>
      String.fromCodePoint(parseInt(code, hex ? 16 : 10))
    )
}

function unique<T>(values: T[]) {
  return [...new Set(values)]
}
