"use client"

import { useRef, useState } from "react"

import { type Brand } from "@/lib/brand"
import { SAMPLE_BRANDS } from "@/lib/brands/samples"
import { withHttps } from "@/lib/net"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface BrandPanelProps {
  brand: Brand
  onBrandChange: (brand: Brand) => void
}

const MAX_LOGO_BYTES = 4 * 1024 * 1024

export function BrandPanel({ brand, onBrandChange }: BrandPanelProps) {
  const [url, setUrl] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  async function pull(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const target = withHttps(url)
    if (!target || pending) return
    setUrl(target)
    setPending(true)
    setError(null)
    try {
      const res = await fetch("/api/brand", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: target }),
      })
      const data = (await res.json()) as { brand?: Brand; error?: string }
      if (!res.ok || !data.brand) {
        throw new Error(
          data.error ?? "Couldn't pull a usable brand from that site."
        )
      }
      revokeLogo(brand)
      onBrandChange(data.brand)
      setUrl("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't pull that brand.")
    } finally {
      setPending(false)
    }
  }

  function onLogo(event: React.ChangeEvent<HTMLInputElement>) {
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
    const src = URL.createObjectURL(file)
    onBrandChange({
      ...brand,
      logo: src,
      logoShape: "mark",
    })
  }

  function clearLogo() {
    revokeLogo(brand)
    onBrandChange({ ...brand, logo: null, logoShape: "mark" })
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
              className="shrink-0"
            >
              {pending ? "Pulling…" : "Pull brand"}
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

      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          size="xs"
          variant="outline"
          className="relative"
          onClick={() => logoRef.current?.click()}
        >
          {brand.logo ? "Replace logo" : "Upload logo"}
          <span
            className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden"
            aria-hidden="true"
          />
        </Button>
        {brand.logo ? (
          <Button
            type="button"
            size="xs"
            variant="ghost"
            className="relative"
            onClick={clearLogo}
          >
            Use name
            <span
              className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden"
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
          onChange={onLogo}
        />
      </div>

      <div
        className="flex flex-wrap items-center gap-1.5"
        role="group"
        aria-label="Sample brands"
      >
        {SAMPLE_BRANDS.map((sample) => (
          <Button
            key={sample.id}
            type="button"
            size="xs"
            variant={sample.id === brand.id ? "secondary" : "ghost"}
            aria-pressed={sample.id === brand.id}
            className="relative"
            onClick={() => {
              revokeLogo(brand)
              onBrandChange(sample)
            }}
          >
            {sample.name}
            <span
              className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden"
              aria-hidden="true"
            />
          </Button>
        ))}
      </div>

      <BrandSummary brand={brand} />
    </div>
  )
}

function BrandSummary({ brand }: { brand: Brand }) {
  const swatches: [string, string][] = [
    ...brand.palette.map((hex, i): [string, string] => [
      i === 0 ? "Brand" : `Brand ${i + 1}`,
      hex,
    ]),
    ["Background", brand.colors.background],
    ["Text", brand.colors.text],
  ]
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 ring-1 ring-foreground/10">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="truncate text-base font-medium sm:text-sm">
          {brand.name}
        </p>
        <p className="truncate font-mono text-sm text-muted-foreground">
          {brand.domain}
        </p>
      </div>
      <ul
        role="list"
        className="flex shrink-0 gap-1"
        aria-label="Brand colours"
      >
        {swatches.map(([label, hex]) => (
          <li
            key={label}
            title={`${label} ${hex}`}
            className={cn(
              "size-4 rounded-full ring-1 ring-black/10 ring-inset dark:ring-white/15"
            )}
            style={{ backgroundColor: hex }}
          >
            <span className="sr-only">
              {label} {hex}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function revokeLogo(brand: Brand) {
  if (brand.logo?.startsWith("blob:")) URL.revokeObjectURL(brand.logo)
}
