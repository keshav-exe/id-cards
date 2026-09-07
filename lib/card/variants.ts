import type { Brand } from "@/lib/brand"
import {
  chroma,
  hueDeg,
  luminance,
  mix,
  parseColor,
  toHex,
  type RGB,
} from "@/lib/color"
import type { MaterialId } from "@/lib/card/material"

export type Orientation = "portrait" | "landscape"
export type VariantId = "access" | "laminate" | "aurora" | "ledger"
/**
 * `brand`, `brand-2`… follow the brand palette; `site` is the page
 * background; the rest are the fixed defaults below.
 */
export type ColorwayId = string

export interface CardVariant {
  id: VariantId
  name: string
  description: string
  material: MaterialId
  orientation: Orientation
  defaultColorway: ColorwayId
}

export const VARIANTS: readonly CardVariant[] = [
  {
    id: "access",
    name: "Access",
    description: "Brushed metal member card with QR.",
    material: "brushed",
    orientation: "portrait",
    defaultColorway: "brand",
  },
  {
    id: "laminate",
    name: "Laminate",
    description: "Holographic specimen with photo and MRZ.",
    material: "holo",
    orientation: "portrait",
    defaultColorway: "brand",
  },
  {
    id: "aurora",
    name: "Aurora",
    description: "Frosted glass over brand colour.",
    material: "aurora",
    orientation: "portrait",
    defaultColorway: "brand",
  },
  {
    id: "ledger",
    name: "Ledger",
    description: "Boarding-pass stub with tear-off.",
    material: "brushed",
    orientation: "landscape",
    defaultColorway: "site",
  },
]

export function getVariant(id: VariantId): CardVariant {
  return VARIANTS.find((v) => v.id === id) ?? VARIANTS[0]
}

export interface Colorway {
  id: ColorwayId
  label: string
  /** Brand finishes change with the pulled site; defaults never do. */
  group: "brand" | "default"
  base: RGB
  accent: RGB
  /** Text colour that stays legible on this material. */
  ink: "light" | "dark"
  /** Hex pair for the picker swatch. */
  swatch: [string, string]
}

const DEFAULT_FINISHES: readonly {
  id: ColorwayId
  label: string
  base: RGB
  accent: RGB
}[] = [
  { id: "silver", label: "Silver", base: [0.76, 0.77, 0.8], accent: [0.97, 0.97, 0.98] },
  { id: "graphite", label: "Graphite", base: [0.29, 0.3, 0.33], accent: [0.64, 0.66, 0.7] },
  { id: "onyx", label: "Onyx", base: [0.075, 0.08, 0.095], accent: [0.3, 0.31, 0.35] },
  { id: "gold", label: "Gold", base: [0.72, 0.56, 0.18], accent: [0.95, 0.85, 0.55] },
  { id: "rose-gold", label: "Rose gold", base: [0.72, 0.48, 0.42], accent: [0.94, 0.78, 0.72] },
  { id: "copper", label: "Copper", base: [0.58, 0.32, 0.2], accent: [0.9, 0.6, 0.42] },
  { id: "midnight", label: "Midnight", base: [0.07, 0.1, 0.22], accent: [0.26, 0.33, 0.56] },
  { id: "bone", label: "Bone", base: [0.9, 0.87, 0.8], accent: [0.99, 0.98, 0.95] },
]

/**
 * One finish per brand palette colour, then the site background, then the
 * fixed defaults. Ids for the palette are positional so switching brands
 * keeps "the first brand colour" selected.
 */
export function colorwaysFor(brand: Brand): Colorway[] {
  const palette = brand.palette
    .map(parseColor)
    .filter((c): c is RGB => c !== null)
  const background = parseColor(brand.colors.background) ?? [0.06, 0.06, 0.07]
  const hue = palette[0] ?? [0.32, 0.33, 0.36]

  const used = new Set<string>()
  const fromPalette = palette.map((color, index) => {
    const label = unique(colorName(color), used)
    return make(
      index === 0 ? "brand" : `brand-${index + 1}`,
      label,
      "brand",
      finishBase(color),
      finishAccent(color)
    )
  })

  const siteBase = mix(
    background,
    [0.14, 0.145, 0.16],
    luminance(background) < 0.02 ? 0.45 : 0
  )
  const site = make(
    "site",
    "Site",
    "brand",
    siteBase,
    mix(hue, [1, 1, 1], 0.28)
  )

  const defaults = DEFAULT_FINISHES.map((finish) =>
    make(finish.id, finish.label, "default", finish.base, finish.accent)
  )

  return [...fromPalette, site, ...defaults]
}

/**
 * Bright saturated colours (lime, yellow, cyan) are darkened less so the
 * finish still reads as that colour rather than an olive or teal.
 */
function finishBase(color: RGB): RGB {
  const bright = luminance(color) > 0.45
  return mix(color, [0.18, 0.18, 0.2], bright ? 0.08 : 0.22)
}

function finishAccent(color: RGB): RGB {
  const bright = luminance(color) > 0.45
  return mix(color, [1, 1, 1], bright ? 0.42 : 0.3)
}

function make(
  id: ColorwayId,
  label: string,
  group: Colorway["group"],
  base: RGB,
  accent: RGB
): Colorway {
  return {
    id,
    label,
    group,
    base,
    accent,
    ink: luminance(base) > 0.42 ? "dark" : "light",
    swatch: [toHex(base), toHex(accent)],
  }
}

function unique(label: string, used: Set<string>): string {
  let next = label
  let n = 2
  while (used.has(next)) next = `${label} ${n++}`
  used.add(next)
  return next
}

/** Coarse hue family, for labelling palette finishes. */
export function colorName(color: RGB): string {
  if (chroma(color) < 0.1) {
    const lum = luminance(color)
    return lum > 0.6 ? "Silver" : lum > 0.15 ? "Slate" : "Onyx"
  }
  const h = hueDeg(color)
  if (h < 14) return "Red"
  if (h < 38) return "Orange"
  if (h < 52) return "Amber"
  if (h < 66) return "Yellow"
  if (h < 96) return "Lime"
  if (h < 150) return "Green"
  if (h < 180) return "Teal"
  if (h < 200) return "Cyan"
  if (h < 222) return "Sky"
  if (h < 250) return "Blue"
  if (h < 272) return "Indigo"
  if (h < 300) return "Violet"
  if (h < 332) return "Magenta"
  if (h < 350) return "Pink"
  return "Red"
}

export type PhotoFilter = "none" | "mono" | "brand"

export interface Member {
  name: string
  role: string
  tier: string
  since: string
  /** Object URL or data URL of an uploaded photo. */
  photo: string | null
  photoFilter: PhotoFilter
}

export const LIMITS = {
  name: 22,
  role: 18,
  tier: 16,
  since: 4,
} as const

export const DEFAULT_MEMBER: Member = {
  name: "Keshav",
  role: "Developer",
  tier: "Founding member",
  since: String(new Date().getFullYear()),
  photo: null,
  photoFilter: "none",
}

/** Deterministic 11-digit member number from brand + name, grouped 4-4-3. */
export function memberNumber(brand: Brand, member: Member): string {
  let h = 2166136261
  for (const ch of `${brand.id}:${member.name.toLowerCase()}`) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619) >>> 0
  }
  const digits = (h.toString() + Math.imul(h, 2654435761).toString()).replace(
    /\D/g,
    ""
  )
  const d = digits.padEnd(11, "7").slice(0, 11)
  return `${d.slice(0, 4)} ${d.slice(4, 8)} ${d.slice(8)}`
}

export function qrPayload(brand: Brand, member: Member): string {
  const url = new URL(brand.url)
  url.searchParams.set(
    "member",
    memberNumber(brand, member).replaceAll(" ", "")
  )
  return url.toString()
}
