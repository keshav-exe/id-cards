/**
 * Font embedding for export.
 *
 * modern-screenshot rasterises the DOM through an SVG <foreignObject>, and an
 * SVG loaded as an image can't fetch external resources — so every webfont the
 * card uses has to be inlined as a data URL. Its built-in embedder misses the
 * next/font faces here, so we do it ourselves: collect the same-origin
 * @font-face rules for the families the card actually renders, fetch each
 * woff2 once, and hand the rewritten CSS back as `font.cssText`.
 */

const dataUrlCache = new Map<string, Promise<string>>()
const URL_RE = /url\((['"]?)([^'")]+)\1\)/g

/** Families (lowercase, unquoted) used by `root` or anything inside it. */
export function usedFontFamilies(root: HTMLElement): Set<string> {
  const families = new Set<string>()
  const add = (el: Element) => {
    const raw = getComputedStyle(el).fontFamily
    for (const family of splitFamilies(raw)) families.add(family)
  }
  add(root)
  for (const el of root.querySelectorAll("*")) add(el)
  return families
}

/** `@font-face` CSS for `families`, with every `url()` replaced by a data URL. */
export async function inlineFontFaces(families: Set<string>): Promise<string> {
  const rules = fontFaceRules().filter((rule) => {
    const family = rule.style.getPropertyValue("font-family")
    const src = rule.style.getPropertyValue("src")
    return (
      src.includes("url(") &&
      splitFamilies(family).some((f) => families.has(f))
    )
  })

  const css = await Promise.all(
    rules.map(async (rule) => {
      const base = rule.parentStyleSheet?.href ?? location.href
      let text = rule.cssText
      const matches = [...text.matchAll(URL_RE)]
      for (const match of matches) {
        const absolute = new URL(match[2], base).toString()
        try {
          const data = await toDataUrl(absolute)
          text = text.replace(match[0], `url("${data}")`)
        } catch {
          // Leave the original URL in place; the browser will fall back.
        }
      }
      return text
    })
  )
  return css.join("\n")
}

function fontFaceRules(): CSSFontFaceRule[] {
  const out: CSSFontFaceRule[] = []
  for (const sheet of document.styleSheets) {
    let rules: CSSRuleList
    try {
      rules = sheet.cssRules
    } catch {
      continue // cross-origin sheet
    }
    walk(rules, out)
  }
  return out
}

function walk(rules: CSSRuleList, out: CSSFontFaceRule[]) {
  for (const rule of rules) {
    if (rule instanceof CSSFontFaceRule) out.push(rule)
    else if (rule instanceof CSSLayerBlockRule) walk(rule.cssRules, out)
  }
}

function splitFamilies(value: string): string[] {
  return value
    .split(",")
    .map((f) => f.trim().replace(/^["']|["']$/g, "").toLowerCase())
    .filter(Boolean)
}

function toDataUrl(url: string): Promise<string> {
  let pending = dataUrlCache.get(url)
  if (!pending) {
    pending = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${url}`)
        return res.blob()
      })
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(blob)
          })
      )
    pending.catch(() => dataUrlCache.delete(url))
    dataUrlCache.set(url, pending)
  }
  return pending
}
