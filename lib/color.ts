export type RGB = readonly [number, number, number]

const NAMED: Record<string, string> = {
  white: "#ffffff",
  black: "#000000",
  transparent: "#00000000",
}

/** Parse `#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb()`/`rgba()` into linear-ish 0–1 sRGB triplet. */
export function parseColor(input: string | null | undefined): RGB | null {
  if (!input) return null
  const value = (NAMED[input.trim().toLowerCase()] ?? input).trim()

  if (value.startsWith("#")) {
    let hex = value.slice(1)
    if (hex.length === 3 || hex.length === 4) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("")
    }
    if (hex.length !== 6 && hex.length !== 8) return null
    const n = Number.parseInt(hex.slice(0, 6), 16)
    if (Number.isNaN(n)) return null
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
  }

  const match = value.match(/rgba?\(([^)]+)\)/i)
  if (match) {
    const parts = match[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((p) =>
        p.endsWith("%")
          ? Number.parseFloat(p) / 100
          : Number.parseFloat(p) / 255
      )
    if (parts.length === 3 && parts.every((p) => Number.isFinite(p))) {
      return [clamp01(parts[0]), clamp01(parts[1]), clamp01(parts[2])]
    }
  }
  return null
}

export function toHex([r, g, b]: RGB): string {
  const c = (v: number) =>
    Math.round(clamp01(v) * 255)
      .toString(16)
      .padStart(2, "0")
  return `#${c(r)}${c(g)}${c(b)}`
}

export function mix(a: RGB, b: RGB, t: number): RGB {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ]
}

/** WCAG relative luminance (0–1). */
export function luminance([r, g, b]: RGB): number {
  const lin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** Cheap chroma proxy: max − min channel. 0 is grey, 1 is a pure hue. */
export function chroma([r, g, b]: RGB): number {
  return Math.max(r, g, b) - Math.min(r, g, b)
}

/** Hue in degrees [0, 360). Grey returns 0. */
export function hueDeg([r, g, b]: RGB): number {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  if (d < 1e-6) return 0
  let h = 0
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return ((h * 60) + 360) % 360
}

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v))
}
