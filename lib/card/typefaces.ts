/**
 * Card typefaces from the shadcn Create picker.
 * https://ui.shadcn.com/create
 */
export const TYPEFACES = [
  { id: "geist", title: "Geist", kind: "sans", variable: "--font-card-geist" },
  { id: "inter", title: "Inter", kind: "sans", variable: "--font-card-inter" },
  {
    id: "noto-sans",
    title: "Noto Sans",
    kind: "sans",
    variable: "--font-card-noto-sans",
  },
  {
    id: "nunito-sans",
    title: "Nunito Sans",
    kind: "sans",
    variable: "--font-card-nunito-sans",
  },
  {
    id: "figtree",
    title: "Figtree",
    kind: "sans",
    variable: "--font-card-figtree",
  },
  {
    id: "roboto",
    title: "Roboto",
    kind: "sans",
    variable: "--font-card-roboto",
  },
  {
    id: "raleway",
    title: "Raleway",
    kind: "sans",
    variable: "--font-card-raleway",
  },
  {
    id: "dm-sans",
    title: "DM Sans",
    kind: "sans",
    variable: "--font-card-dm-sans",
  },
  {
    id: "public-sans",
    title: "Public Sans",
    kind: "sans",
    variable: "--font-card-public-sans",
  },
  { id: "outfit", title: "Outfit", kind: "sans", variable: "--font-sans" },
  {
    id: "oxanium",
    title: "Oxanium",
    kind: "sans",
    variable: "--font-card-oxanium",
  },
  {
    id: "manrope",
    title: "Manrope",
    kind: "sans",
    variable: "--font-card-manrope",
  },
  {
    id: "space-grotesk",
    title: "Space Grotesk",
    kind: "sans",
    variable: "--font-card-space-grotesk",
  },
  {
    id: "montserrat",
    title: "Montserrat",
    kind: "sans",
    variable: "--font-card-montserrat",
  },
  {
    id: "ibm-plex-sans",
    title: "IBM Plex Sans",
    kind: "sans",
    variable: "--font-card-ibm-plex-sans",
  },
  {
    id: "source-sans-3",
    title: "Source Sans 3",
    kind: "sans",
    variable: "--font-card-source-sans-3",
  },
  {
    id: "instrument-sans",
    title: "Instrument Sans",
    kind: "sans",
    variable: "--font-card-instrument-sans",
  },
  {
    id: "jetbrains-mono",
    title: "JetBrains Mono",
    kind: "mono",
    variable: "--font-card-jetbrains-mono",
  },
  {
    id: "geist-mono",
    title: "Geist Mono",
    kind: "mono",
    variable: "--font-mono",
  },
  {
    id: "noto-serif",
    title: "Noto Serif",
    kind: "serif",
    variable: "--font-card-noto-serif",
  },
  {
    id: "roboto-slab",
    title: "Roboto Slab",
    kind: "serif",
    variable: "--font-card-roboto-slab",
  },
  {
    id: "merriweather",
    title: "Merriweather",
    kind: "serif",
    variable: "--font-card-merriweather",
  },
  { id: "lora", title: "Lora", kind: "serif", variable: "--font-card-lora" },
  {
    id: "playfair-display",
    title: "Playfair Display",
    kind: "serif",
    variable: "--font-card-playfair-display",
  },
  {
    id: "eb-garamond",
    title: "EB Garamond",
    kind: "serif",
    variable: "--font-card-eb-garamond",
  },
  {
    id: "instrument-serif",
    title: "Instrument Serif",
    kind: "serif",
    variable: "--font-serif",
  },
] as const

export type TypefaceId = (typeof TYPEFACES)[number]["id"]
export type Typeface = (typeof TYPEFACES)[number]
export type TypefaceKind = Typeface["kind"]

export const DEFAULT_TYPEFACE: TypefaceId = "outfit"

export const TYPEFACE_GROUPS: { kind: TypefaceKind; label: string }[] = [
  { kind: "sans", label: "Sans" },
  { kind: "mono", label: "Mono" },
  { kind: "serif", label: "Serif" },
]

export function typefaceById(id: string | null | undefined): Typeface {
  return (
    TYPEFACES.find((face) => face.id === id) ??
    TYPEFACES.find((face) => face.id === DEFAULT_TYPEFACE)!
  )
}

export function typefaceStack(face: Typeface) {
  const fallback =
    face.kind === "mono"
      ? "ui-monospace, SFMono-Regular, Menlo, monospace"
      : face.kind === "serif"
        ? "ui-serif, Georgia, serif"
        : "ui-sans-serif, system-ui, sans-serif"
  return `var(${face.variable}), ${fallback}`
}
