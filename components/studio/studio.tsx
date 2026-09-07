"use client"

import { useMemo, useRef, useState } from "react"

import type { Brand } from "@/lib/brand"
import { SAMPLE_BRANDS } from "@/lib/brands/samples"
import { exportCardPng } from "@/lib/card/export"
import type { MaterialRenderer } from "@/lib/card/material"
import {
  colorwaysFor,
  DEFAULT_MEMBER,
  getVariant,
  VARIANTS,
  type ColorwayId,
  type Member,
  type VariantId,
} from "@/lib/card/variants"
import { IdCard } from "@/components/card/id-card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { AppHeader } from "./app-header"
import { BrandPanel } from "./brand-panel"
import { ColorwayPicker } from "./colorway-picker"
import { DetailsForm } from "./details-form"
import { VariantPicker } from "./variant-picker"
import { ThemeToggle } from "./theme-toggle"

type ExportState =
  { status: "idle" } | { status: "busy" } | { status: "error"; message: string }

export function Studio() {
  const [brand, setBrand] = useState<Brand>(SAMPLE_BRANDS[0])
  const [variantId, setVariantId] = useState<VariantId>("access")
  const [colorwayId, setColorwayId] = useState<ColorwayId>(
    getVariant("access").defaultColorway
  )
  const [member, setMember] = useState<Member>(DEFAULT_MEMBER)
  const [logoInvertOverride, setLogoInvertOverride] = useState<boolean | null>(
    null
  )
  const [exportState, setExportState] = useState<ExportState>({
    status: "idle",
  })

  const cardRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<MaterialRenderer | null>(null)

  const variant = getVariant(variantId)
  const colorways = useMemo(() => colorwaysFor(brand), [brand])
  const colorway = colorways.find((c) => c.id === colorwayId) ?? colorways[0]

  const remoteLogo =
    !!brand.logo &&
    (brand.logo.startsWith("data:") || brand.logo.startsWith("http"))
  const logoIsDark = !remoteLogo || !brand.dark
  const autoInvert = logoIsDark === (colorway.ink === "light")
  const logoInvert = logoInvertOverride ?? autoInvert

  const exportDimensions =
    variant.orientation === "portrait" ? "1080 × 1712 px" : "1712 × 1080 px"

  function chooseVariant(id: VariantId) {
    setVariantId(id)
    setColorwayId(getVariant(id).defaultColorway)
  }

  function chooseBrand(next: Brand) {
    setBrand(next)
    setLogoInvertOverride(null)
  }

  async function download() {
    const card = cardRef.current
    const renderer = rendererRef.current
    if (!card || !renderer) return
    setExportState({ status: "busy" })
    try {
      await exportCardPng({
        card,
        renderer,
        width: variant.orientation === "portrait" ? 1080 : 1712,
        filename: `${brand.id}-${variant.id}-${slug(member.name) || "card"}.png`,
      })
      setExportState({ status: "idle" })
    } catch (error) {
      setExportState({
        status: "error",
        message: error instanceof Error ? error.message : "Export failed.",
      })
    }
  }

  return (
    <div className="isolate flex h-dvh flex-col overflow-x-clip">
      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:overflow-hidden xl:grid-cols-[minmax(0,1fr)_24rem]">
        <main
          aria-label="Card preview"
          className="relative flex min-h-[min(36rem,70dvh)] flex-1 items-center justify-center overflow-hidden bg-muted/35 px-6 py-10 dark:bg-neutral-950"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--foreground)_1px,transparent_0)] opacity-[0.035] bg-size-[20px_20px] dark:opacity-[0.06]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-linear-to-b from-background/0 via-background/0 to-background/40 dark:to-background/60"
          />

          <IdCard
            ref={cardRef}
            rendererRef={rendererRef}
            brand={brand}
            member={member}
            variant={variant}
            colorway={colorway}
            logoInvert={logoInvert}
            className={cn(
              "relative w-full drop-shadow-2xl",
              variant.orientation === "portrait"
                ? "max-w-[16rem] sm:max-w-[18rem] xl:max-w-[20rem]"
                : "max-w-md xl:max-w-lg"
            )}
          />
        </main>

        <aside
          aria-label="Card settings"
          className="flex min-h-0 min-w-0 flex-col border-t border-foreground/10 bg-background lg:overflow-y-auto lg:border-t-0 lg:border-l"
        >
          <div className="hidden items-center justify-between border-b border-foreground/10 px-5 py-4 lg:flex">
            <div className="">
              <h2 className="text-base font-medium tracking-tight sm:text-sm">
                Inspector
              </h2>
              <p className="text-base text-pretty text-muted-foreground sm:text-sm">
                Brand, style, and member details.
              </p>
            </div>

            <ThemeToggle />
          </div>

          <div className="flex flex-col divide-y divide-foreground/10">
            <InspectorSection title="Brand">
              <BrandPanel brand={brand} onBrandChange={chooseBrand} />
            </InspectorSection>

            <InspectorSection title="Style">
              <VariantPicker
                variants={VARIANTS}
                value={variantId}
                onValueChange={chooseVariant}
                colorway={colorway}
              />
            </InspectorSection>

            <InspectorSection title="Finish" aside={colorway.label}>
              <ColorwayPicker
                colorways={colorways}
                value={colorway.id}
                onValueChange={setColorwayId}
              />
            </InspectorSection>

            <InspectorSection title="Details">
              <DetailsForm
                member={member}
                onMemberChange={setMember}
                logoInvert={logoInvert}
                onLogoInvertChange={setLogoInvertOverride}
                hasLogo={Boolean(brand.logo)}
              />
            </InspectorSection>
          </div>

          <div className="mt-auto border-t border-foreground/10 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sticky bottom-0 bg-background">
            <Button
              type="button"
              size="lg"
              onClick={download}
              disabled={exportState.status === "busy"}
              className="w-full"
            >
              {exportState.status === "busy" ? "Rendering…" : "Download PNG"}
            </Button>
            <p
              role={exportState.status === "error" ? "alert" : undefined}
              className={cn(
                "mt-2 text-center font-mono text-sm tabular-nums",
                exportState.status === "error"
                  ? "text-destructive"
                  : "text-muted-foreground"
              )}
            >
              {exportState.status === "error"
                ? exportState.message
                : exportDimensions}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

function InspectorSection({
  title,
  aside,
  children,
}: {
  title: string
  aside?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3 px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-medium sm:text-sm">{title}</h3>
        {aside ? (
          <p className="text-sm text-muted-foreground">{aside}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function slug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}
