import { brandHue, type Brand } from "@/lib/brand"
import { luminance, mix, parseColor, toHex, type RGB } from "@/lib/color"
import type { MaterialId } from "@/lib/card/material"

export type Orientation = "portrait" | "landscape"
export type VariantId = "access" | "laminate" | "aurora" | "ledger"
export type ColorwayId =
  "brand" | "site" | "silver" | "graphite" | "onyx" | "gold"

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
  base: RGB
  accent: RGB
  /** Text colour that stays legible on this material. */
  ink: "light" | "dark"
  /** Hex pair for the picker swatch. */
  swatch: [string, string]
}

const METALS: Record<
  Exclude<ColorwayId, "brand" | "site">,
  { label: string; base: RGB; accent: RGB }
> = {
  silver: {
    label: "Silver",
    base: [0.76, 0.77, 0.8],
    accent: [0.97, 0.97, 0.98],
  },
  graphite: {
    label: "Graphite",
    base: [0.29, 0.3, 0.33],
    accent: [0.64, 0.66, 0.7],
  },
  onyx: {
    label: "Onyx",
    base: [0.075, 0.08, 0.095],
    accent: [0.3, 0.31, 0.35],
  },
  gold: { label: "Gold", base: [0.72, 0.56, 0.18], accent: [0.95, 0.85, 0.55] },
}

/** Brand-derived colorways first, then metals tinted with the brand hue. */
export function colorwaysFor(brand: Brand): Colorway[] {
  const hue = brandHue(brand)
  const background = parseColor(brand.colors.background) ?? [0.06, 0.06, 0.07]
  const accent = parseColor(brand.colors.accent) ?? hue

  const brandBase = mix(hue, [0.18, 0.18, 0.2], 0.22)
  const brandAccent = mix(accent, [1, 1, 1], 0.35)
  const siteBase = mix(
    background,
    [0.14, 0.145, 0.16],
    luminance(background) < 0.02 ? 0.45 : 0
  )
  const siteAccent = mix(hue, [1, 1, 1], 0.28)

  const derived: Colorway[] = [
    make("brand", "Brand", brandBase, brandAccent),
    make("site", "Site", siteBase, siteAccent),
  ]
  const metals = (Object.keys(METALS) as (keyof typeof METALS)[]).map((id) => {
    const metal = METALS[id]
    return make(
      id,
      metal.label,
      mix(metal.base, hue, 0.16),
      mix(metal.accent, hue, 0.1)
    )
  })
  return [...derived, ...metals]
}

function make(id: ColorwayId, label: string, base: RGB, accent: RGB): Colorway {
  return {
    id,
    label,
    base,
    accent,
    ink: luminance(base) > 0.42 ? "dark" : "light",
    swatch: [toHex(base), toHex(accent)],
  }
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
