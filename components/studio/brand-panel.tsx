"use client"

import { useMemo, useRef, useState } from "react"

import { FlipHorizontalIcon, RefreshCcwIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Radio } from "@base-ui/react/radio"
import { RadioGroup } from "@base-ui/react/radio-group"

import { detectLogoShape, type Brand } from "@/lib/brand"
import { findBrand } from "@/lib/brands/library"
import { withHttps } from "@/lib/net"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { BrandThumb } from "./brand-thumb"
import { LogoPicker } from "./logo-picker"

interface BrandPanelProps {
  brand: Brand
  library: readonly Brand[]
  onBrandChange: (brand: Brand) => void
  onRemember: (brand: Brand) => void
  logoInvert: boolean
  onLogoInvertChange: (value: boolean) => void
}

const MAX_LOGO_BYTES = 4 * 1024 * 1024

export function BrandPanel({
  brand,
  library,
  onBrandChange,
  onRemember,
  logoInvert,
  onLogoInvertChange,
}: BrandPanelProps) {
  const [url, setUrl] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  const cached = useMemo(
    () => (url.trim() ? findBrand(library, url) : undefined),
    [library, url]
  )

  async function pull(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const target = withHttps(url)
    if (!target || pending) return
    setUrl(target)

    const hit = findBrand(library, target)
    if (hit) {
      revokeLogo(brand)
      onBrandChange(hit)
      setError(null)
      setUrl("")
      return
    }

    setPending(true)
    setError(null)
    try {
      const next = await fetchBrand(target)
      revokeLogo(brand)
      onRemember(next)
      setUrl("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't pull that brand.")
    } finally {
      setPending(false)
    }
  }

  async function refresh() {
    if (pending) return
    setPending(true)
    setError(null)
    try {
      const next = await fetchBrand(brand.url)
      revokeLogo(brand)
      onRemember(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't refresh that brand.")
    } finally {
      setPending(false)
    }
  }

  async function onLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || file.size > MAX_LOGO_BYTES) return
    const ok =
      file.type === "image/svg+xml" ||
      file.type === "image/png" ||
      /\.(svg|png)$/i.test(file.name)
    if (!ok) {
      setError("Logo has to be an SVG or PNG.")
      return
    }
    setError(null)
    revokeLogo(brand)
    const src = await readAsDataUrl(file)
    onRemember({
      ...brand,
      logo: src,
      logos: [src, ...brand.logos.filter((logo) => !logo.startsWith("blob:"))],
      logoShape: "mark",
    })
  }

  function pickExtracted(src: string) {
    onRemember({
      ...brand,
      logo: src,
      logoShape: detectLogoShape(src),
    })
  }

  function clearLogo() {
    revokeLogo(brand)
    onRemember({
      ...brand,
      logo: null,
      logos: brand.logos.filter((logo) => !logo.startsWith("blob:")),
      logoShape: "mark",
    })
  }

  function chooseFromLibrary(id: string) {
    const next = library.find((entry) => entry.id === id)
    if (!next || next.id === brand.id) return
    revokeLogo(brand)
    onBrandChange(next)
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={pull} className="flex flex-col gap-3">
        <Field data-invalid={error ? true : undefined}>
          <FieldLabel htmlFor="brand-url">Website</FieldLabel>
          <div className="flex min-w-0 gap-2">
            <Input
              id="brand-url"
              name="url"
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              placeholder="linear.app"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => {
                const next = withHttps(url)
                if (next !== url) setUrl(next)
              }}
              aria-invalid={error ? true : undefined}
              aria-busy={pending}
              disabled={pending}
              className="min-w-0 flex-1"
            />
            <Button
              type="submit"
              variant="outline"
              disabled={pending || !url.trim()}
              className="max-w-36 shrink-0 truncate"
            >
              {pending
                ? "Pulling…"
                : cached
                  ? `Use ${cached.name}`
                  : "Pull brand"}
            </Button>
          </div>
          {error ? (
            <FieldError>{error}</FieldError>
          ) : (
            <FieldDescription>
              Reads the site&apos;s logo, colours, and name.
            </FieldDescription>
          )}
        </Field>
      </form>

      <div className="flex flex-col gap-3 rounded-xl p-3 ring-1 ring-foreground/10">
        <div className="flex items-start gap-3">
          <BrandThumb
            brand={brand}
            invert={logoInvert}
            className="size-11 rounded-lg sm:size-10"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="truncate text-base font-medium sm:text-sm">
              {brand.name}
            </p>
            <p className="truncate font-mono text-sm text-muted-foreground">
              {brand.domain}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Pull brand again"
            title="Pull brand again"
            disabled={pending}
            onClick={() => void refresh()}
            className="relative shrink-0"
          >
            <HugeiconsIcon icon={RefreshCcwIcon} strokeWidth={1.75} />
            <span
              className="pointer-fine:hidden absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2"
              aria-hidden="true"
            />
          </Button>
        </div>

        <Swatches brand={brand} />

        <div className="flex flex-col gap-2 border-t border-foreground/10 pt-3">
          <p className="text-sm text-muted-foreground">Logo</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <LogoPicker
              logos={brand.logos}
              value={brand.logo}
              onValueChange={pickExtracted}
            />
            <Button
              type="button"
              size="xs"
              variant="outline"
              className="relative"
              onClick={() => logoRef.current?.click()}
            >
              {brand.logo ? "Replace" : "Upload logo"}
              <span
                className="pointer-fine:hidden absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2"
                aria-hidden="true"
              />
            </Button>
            {brand.logo ? (
              <Button
                type="button"
                size="xs"
                variant={logoInvert ? "secondary" : "outline"}
                aria-pressed={logoInvert}
                onClick={() => onLogoInvertChange(!logoInvert)}
                className="relative"
              >
                <HugeiconsIcon
                  icon={FlipHorizontalIcon}
                  strokeWidth={1.75}
                  data-icon="inline-start"
                />
                Invert
                <span
                  className="pointer-fine:hidden absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2"
                  aria-hidden="true"
                />
              </Button>
            ) : null}
          </div>
          {brand.logo ? (
            <Button
              type="button"
              size="xs"
              variant="link"
              className="relative h-auto self-start px-0 text-muted-foreground"
              onClick={clearLogo}
            >
              Use name instead
              <span
                className="pointer-fine:hidden absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2"
                aria-hidden="true"
              />
            </Button>
          ) : null}
          <input
            ref={logoRef}
            type="file"
            accept="image/svg+xml,image/png,.svg,.png"
            tabIndex={-1}
            className="hidden"
            onChange={(event) => void onLogo(event)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Library</p>
        <RadioGroup
          aria-label="Brand library"
          value={brand.id}
          onValueChange={(id) => chooseFromLibrary(String(id))}
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
        >
          {library.map((entry) => (
            <LibraryTile key={entry.id} brand={entry} />
          ))}
        </RadioGroup>
      </div>
    </div>
  )
}

function LibraryTile({ brand }: { brand: Brand }) {
  return (
    <Radio.Root
      value={brand.id}
      aria-label={brand.name}
      title={brand.name}
      className="group/tile relative flex w-14 shrink-0 flex-col items-center gap-1.5 rounded-lg p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <BrandThumb
        brand={brand}
        className="size-10 rounded-lg group-data-checked/tile:outline-2 group-data-checked/tile:outline-foreground"
      />
      <p className="w-full truncate text-center text-sm text-muted-foreground group-data-checked/tile:text-foreground sm:text-xs">
        {brand.name}
      </p>
      <span
        className="pointer-fine:hidden absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2"
        aria-hidden="true"
      />
    </Radio.Root>
  )
}

function Swatches({ brand }: { brand: Brand }) {
  const swatches: [string, string][] = [
    ...brand.palette.map((hex, i): [string, string] => [
      i === 0 ? "Brand" : `Brand ${i + 1}`,
      hex,
    ]),
    ["Background", brand.colors.background],
    ["Text", brand.colors.text],
  ]
  return (
    <ul role="list" className="flex flex-wrap gap-1" aria-label="Brand colours">
      {swatches.map(([label, hex]) => (
        <li
          key={label}
          title={`${label} ${hex}`}
          className="size-4 rounded-full ring-1 ring-black/10 ring-inset dark:ring-white/15"
          style={{ backgroundColor: hex }}
        >
          <span className="sr-only">
            {label} {hex}
          </span>
        </li>
      ))}
    </ul>
  )
}

async function fetchBrand(url: string): Promise<Brand> {
  const res = await fetch("/api/brand", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url }),
  })
  const data = (await res.json()) as { brand?: Brand; error?: string }
  if (!res.ok || !data.brand) {
    throw new Error(data.error ?? "Couldn't pull a usable brand from that site.")
  }
  return data.brand
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result)
      else reject(new Error("Couldn't read that file."))
    }
    reader.onerror = () =>
      reject(reader.error ?? new Error("Couldn't read that file."))
    reader.readAsDataURL(file)
  })
}

function revokeLogo(brand: Brand) {
  if (brand.logo?.startsWith("blob:")) URL.revokeObjectURL(brand.logo)
}
