"use client"

import { useCallback, useMemo, useSyncExternalStore } from "react"

import type { Brand } from "@/lib/brand"
import {
  STORAGE_KEY,
  mergeLibrary,
  readLibrary,
  upsertSaved,
  writeLibrary,
  type BrandLibrary,
} from "@/lib/brands/library"
import { SAMPLE_BRANDS } from "@/lib/brands/samples"

const CHANGE_EVENT = "id-cards-library"

const EMPTY: BrandLibrary = {
  version: 1,
  selectedId: SAMPLE_BRANDS[0].id,
  brands: [],
}

let cacheRaw: string | null | undefined
let cache: BrandLibrary = EMPTY

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange)
  window.addEventListener(CHANGE_EVENT, onStoreChange)
  return () => {
    window.removeEventListener("storage", onStoreChange)
    window.removeEventListener(CHANGE_EVENT, onStoreChange)
  }
}

function getSnapshot(): BrandLibrary {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw === cacheRaw) return cache
  cacheRaw = raw
  cache = readLibrary() ?? EMPTY
  return cache
}

function getServerSnapshot(): BrandLibrary {
  return EMPTY
}

function commit(next: BrandLibrary) {
  writeLibrary(next)
  cacheRaw = undefined
  cache = next
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function useBrandLibrary() {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const brands = useMemo(() => mergeLibrary(stored.brands), [stored.brands])
  const selected =
    brands.find((brand) => brand.id === stored.selectedId) ?? SAMPLE_BRANDS[0]

  const select = useCallback((brand: Brand) => {
    const current = getSnapshot()
    commit({ ...current, selectedId: brand.id })
  }, [])

  const remember = useCallback((brand: Brand) => {
    const current = getSnapshot()
    commit({
      version: 1,
      selectedId: brand.id,
      brands: upsertSaved(current.brands, brand),
    })
  }, [])

  return { brands, selected, select, remember }
}
