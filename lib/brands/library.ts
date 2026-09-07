import type { Brand } from "@/lib/brand"
import { SAMPLE_BRANDS } from "@/lib/brands/samples"
import { withHttps } from "@/lib/net"

export const STORAGE_KEY = "id-cards.library.v1"
const MAX_SAVED = 24

export interface BrandLibrary {
  version: 1
  selectedId: string
  brands: Brand[]
}

const SAMPLE_IDS = new Set(SAMPLE_BRANDS.map((brand) => brand.id))

export function isSampleBrand(id: string): boolean {
  return SAMPLE_IDS.has(id)
}

/** Samples first, then saved pulls (newest first). Saved wins on the same id. */
export function mergeLibrary(saved: readonly Brand[]): Brand[] {
  const overrides = new Map(saved.map((brand) => [brand.id, brand]))
  const samples = SAMPLE_BRANDS.map((brand) => overrides.get(brand.id) ?? brand)
  const extras = saved.filter((brand) => !SAMPLE_IDS.has(brand.id))
  return [...samples, ...extras]
}

export function hostFromInput(value: string): string | null {
  try {
    const host = new URL(withHttps(value)).hostname
      .replace(/^www\./, "")
      .toLowerCase()
    return host || null
  } catch {
    return null
  }
}

export function brandIdFromHost(host: string): string {
  return host.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export function findBrand(
  brands: readonly Brand[],
  value: string
): Brand | undefined {
  const host = hostFromInput(value)
  if (!host) return undefined
  const id = brandIdFromHost(host)
  return brands.find((brand) => brand.id === id || brand.domain === host)
}

export function readLibrary(): BrandLibrary | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<BrandLibrary>
    if (parsed.version !== 1 || !Array.isArray(parsed.brands)) return null
    const brands = parsed.brands
      .map(persistable)
      .filter((brand): brand is Brand => brand !== null)
    if (brands.length === 0 && !parsed.selectedId) return null
    return {
      version: 1,
      selectedId:
        typeof parsed.selectedId === "string"
          ? parsed.selectedId
          : SAMPLE_BRANDS[0].id,
      brands,
    }
  } catch {
    return null
  }
}

export function writeLibrary(library: BrandLibrary): void {
  if (typeof window === "undefined") return
  const payload: BrandLibrary = {
    version: 1,
    selectedId: library.selectedId,
    brands: library.brands
      .map(persistable)
      .filter((brand): brand is Brand => brand !== null)
      .slice(0, MAX_SAVED),
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...payload, brands: payload.brands.slice(0, 8) })
      )
    } catch {
      // Quota still exceeded — keep the in-memory library.
    }
  }
}

export function upsertSaved(saved: readonly Brand[], brand: Brand): Brand[] {
  const next = persistable(brand)
  if (!next) return [...saved]
  return [next, ...saved.filter((entry) => entry.id !== next.id)].slice(
    0,
    MAX_SAVED
  )
}

function persistable(value: unknown): Brand | null {
  if (!value || typeof value !== "object") return null
  const brand = value as Brand
  if (
    typeof brand.id !== "string" ||
    typeof brand.name !== "string" ||
    typeof brand.domain !== "string" ||
    typeof brand.url !== "string" ||
    typeof brand.monogram !== "string" ||
    !brand.colors ||
    typeof brand.colors.primary !== "string" ||
    !Array.isArray(brand.logos) ||
    !Array.isArray(brand.palette)
  ) {
    return null
  }
  const logos = brand.logos
    .filter((src): src is string => typeof src === "string")
    .map(persistableSrc)
    .filter((src): src is string => src !== null)
  const logo = persistableSrc(brand.logo) ?? logos[0] ?? null
  return { ...brand, logo, logos: logo && !logos.includes(logo) ? [logo, ...logos] : logos }
}

function persistableSrc(src: string | null | undefined): string | null {
  if (!src || src.startsWith("blob:")) return null
  // Huge raster data URLs blow the 5 MB quota; keep remote / SVG / small PNGs.
  if (src.startsWith("data:image/png") && src.length > 180_000) return null
  return src
}
