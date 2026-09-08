"use client"

import { useMemo, useRef, useState } from "react"

import {
  CreditCardIcon,
  Globe02Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import type { Brand } from "@/lib/brand"
import { useBrandLibrary } from "@/hooks/use-brand-library"
import { exportCardPng } from "@/lib/card/export"
import type { MaterialRenderer } from "@/lib/card/material"
import {
  DEFAULT_TYPEFACE,
  type TypefaceId,
  typefaceById,
  typefaceStack,
} from "@/lib/card/typefaces"
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

import { BrandActiveCard, BrandLibrary, BrandPullForm } from "./brand-panel"
import { CardTilt } from "./card-tilt"
import { ColorwayPicker } from "./colorway-picker"
import { DetailsForm } from "./details-form"
import { FontPicker } from "./font-picker"
import {
  Inspector,
  InspectorBody,
  InspectorFooter,
  InspectorGroup,
  InspectorHeader,
  InspectorSection,
} from "./inspector"
import { ThemeToggle } from "./theme-toggle"
import { VariantPicker } from "./variant-picker"

type ExportState =
  { status: "idle" } | { status: "busy" } | { status: "error"; message: string }

export function Studio() {
  const library = useBrandLibrary()
  const brand = library.selected
  const [variantId, setVariantId] = useState<VariantId>("access")
  const [colorwayId, setColorwayId] = useState<ColorwayId>(
    getVariant("access").defaultColorway
  )
  const [member, setMember] = useState<Member>(DEFAULT_MEMBER)
  const [typefaceId, setTypefaceId] = useState<TypefaceId>(DEFAULT_TYPEFACE)
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
  }

  function chooseBrand(next: Brand) {
    setLogoInvertOverride(null)
    library.select(next)
  }

  function rememberBrand(next: Brand) {
    setLogoInvertOverride(null)
    library.remember(next)
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

  const brandProps = {
    brand,
    library: library.brands,
    onBrandChange: chooseBrand,
    onRemember: rememberBrand,
    logoInvert,
    onLogoInvertChange: setLogoInvertOverride,
  }

  return (
    <div className="isolate flex min-h-dvh flex-col overflow-x-clip lg:h-dvh lg:overflow-hidden">
      <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_26rem] lg:overflow-hidden xl:grid-cols-[minmax(0,1fr)_28rem]">
        <main
          aria-label="Card preview"
          className="relative flex h-[min(26rem,44dvh)] shrink-0 items-center justify-center overflow-hidden bg-muted/40 px-4 py-6 sm:px-6 sm:py-8 lg:h-auto lg:min-h-0 lg:flex-1 lg:max-h-none lg:py-10 dark:bg-neutral-950"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--foreground)_1px,transparent_0)] bg-size-[20px_20px] opacity-[0.035] dark:opacity-[0.06]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-linear-to-b from-background/0 via-background/0 to-background/40 dark:to-background/60"
          />

          <a
            href="https://x.com/kshvbgde"
            target="_blank"
            rel="noopener noreferrer"
            className="ease absolute top-4 left-4 z-10 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            @kshvbgde
          </a>

          <span className="ease absolute bottom-4 -translate-x-1/2 left-1/2 z-10 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md lg:hidden">Best viewed on desktop</span>

          <CardTilt
            rendererRef={rendererRef}
            className={cn(
              "relative w-full max-h-full",
              variant.orientation === "portrait"
                ? "max-w-50 sm:max-w-[16rem] lg:max-w-[18rem] xl:max-w-[20rem]"
                : "max-w-[min(100%,20rem)] sm:max-w-md xl:max-w-lg"
            )}
          >
            <IdCard
              ref={cardRef}
              rendererRef={rendererRef}
              brand={brand}
              member={member}
              variant={variant}
              colorway={colorway}
              logoInvert={logoInvert}
              className="relative w-full drop-shadow-2xl"
              style={{ fontFamily: typefaceStack(typefaceById(typefaceId)) }}
            />
          </CardTilt>
        </main>

        <Inspector>
          <InspectorHeader title="Studio">
            <ThemeToggle />
          </InspectorHeader>

          <InspectorBody>
            <InspectorGroup
              title="Brand"
              icon={
                <HugeiconsIcon
                  icon={Globe02Icon}
                  strokeWidth={1.75}
                  className="size-4"
                />
              }
            >
              <InspectorSection
                title="From the web"
                description="Pull logo, colours, and name from a site."
              >
                <BrandPullForm {...brandProps} />
              </InspectorSection>

              <InspectorSection title="Active brand">
                <BrandActiveCard {...brandProps} />
              </InspectorSection>

              {library.brands.length > 0 ? (
                <InspectorSection
                  title="Library"
                  description="Switch between brands saved in this browser."
                >
                  <BrandLibrary {...brandProps} />
                </InspectorSection>
              ) : null}
            </InspectorGroup>

            <InspectorGroup
              title="Card"
              icon={
                <HugeiconsIcon
                  icon={CreditCardIcon}
                  strokeWidth={1.75}
                  className="size-4"
                />
              }
            >
              <InspectorSection
                title="Style"
                description="Layout and material for the card face."
                padded={false}
                className="gap-0 p-3"
              >
                <VariantPicker
                  variants={VARIANTS}
                  value={variantId}
                  onValueChange={chooseVariant}
                  colorway={colorway}
                />
              </InspectorSection>

              <InspectorSection title="Typography">
                <FontPicker value={typefaceId} onValueChange={setTypefaceId} />
              </InspectorSection>

              <InspectorSection title="Finish" aside={colorway.label}>
                <ColorwayPicker
                  colorways={colorways}
                  value={colorway.id}
                  onValueChange={setColorwayId}
                />
              </InspectorSection>
            </InspectorGroup>

            <InspectorGroup
              title="Member"
              icon={
                <HugeiconsIcon
                  icon={UserIcon}
                  strokeWidth={1.75}
                  className="size-4"
                />
              }
            >
              <InspectorSection
                title="Details"
                description="Holder info and what appears on the card."
              >
                <DetailsForm
                  brand={brand}
                  variantId={variantId}
                  member={member}
                  onMemberChange={setMember}
                />
              </InspectorSection>
            </InspectorGroup>
          </InspectorBody>

          <InspectorFooter>
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
          </InspectorFooter>
        </Inspector>
      </div>
    </div>
  )
}

function slug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}
