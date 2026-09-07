"use client"

import { useEffect, useRef, useState, type RefObject } from "react"

import type { Brand } from "@/lib/brand"
import {
  createMaterialRenderer,
  type MaterialRenderer,
} from "@/lib/card/material"
import type { CardVariant, Colorway, Member } from "@/lib/card/variants"
import { cn } from "@/lib/utils"

import { LAYOUTS } from "./layouts"

interface IdCardProps extends Omit<
  React.ComponentProps<"article">,
  "children" | "ref"
> {
  /**
   * The card's sizing wrapper — what `exportCardPng` rasterises. It has to be
   * the container-query root, otherwise `cqw` sizes fall apart in the clone.
   */
  ref?: React.Ref<HTMLDivElement>
  brand: Brand
  member: Member
  variant: CardVariant
  colorway: Colorway
  logoInvert?: boolean
  /** Receives the live renderer so the studio can snapshot it for export. */
  rendererRef?: RefObject<MaterialRenderer | null>
}

/**
 * One physical card: a WebGPU material canvas underneath, a DOM layout on top.
 * The DOM layer is what gets rasterised for export, so everything visible must
 * be real markup — no canvas text.
 */
export function IdCard({
  brand,
  member,
  variant,
  colorway,
  logoInvert = false,
  rendererRef,
  ref,
  className,
  style,
  ...props
}: IdCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const localRenderer = useRef<MaterialRenderer | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const renderer = createMaterialRenderer(
      canvas,
      {
        material: variant.material,
        base: colorway.base,
        accent: colorway.accent,
      },
      { onError: setError }
    )
    localRenderer.current = renderer
    if (rendererRef) rendererRef.current = renderer
    return () => {
      renderer.dispose()
      localRenderer.current = null
      if (rendererRef) rendererRef.current = null
    }
    // Mount once; material/colour changes flow through update() below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    localRenderer.current?.update({
      material: variant.material,
      base: colorway.base,
      accent: colorway.accent,
    })
  }, [variant.material, colorway.base, colorway.accent])

  const Layout = LAYOUTS[variant.id]
  const light = colorway.ink === "light"

  return (
    // Outer box is the container; `cqw` units inside (including the card's own
    // radius) resolve against its width.
    <div
      ref={ref}
      data-card
      className={cn(
        "font-synthesis-none [container-type:inline-size] w-full",
        className
      )}
      style={style}
    >
      <article
        aria-label={`${brand.name} ${variant.name} card for ${member.name}`}
        data-ink={colorway.ink}
        data-orientation={variant.orientation}
        className={cn(
          "relative w-full touch-none overflow-hidden rounded-[3.7cqw] shadow-2xl ring-1 ring-black/10 select-none",
          variant.orientation === "portrait"
            ? "aspect-[54/85.6]"
            : "aspect-[85.6/54]",
          light ? "text-white" : "text-neutral-950"
        )}
        {...props}
      >
        <canvas
          ref={canvasRef}
          aria-hidden
          className="absolute inset-0 size-full"
        />
        {/* Scrim: legibility over a live material without killing the sheen. */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0",
            light
              ? "bg-linear-to-t from-black/45 via-black/10 to-black/15"
              : "bg-linear-to-t from-white/30 via-white/5 to-white/10"
          )}
        />
        <div className="pointer-events-none relative h-full">
          <Layout
            brand={brand}
            member={member}
            colorway={colorway}
            logoInvert={logoInvert}
          />
        </div>
        {/* Bevel: a lit top edge and a shaded bottom edge make it a slab, not a rectangle. */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 rounded-[inherit]",
            light
              ? "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),inset_0_-1px_0_0_rgba(0,0,0,0.35),inset_1px_0_0_0_rgba(255,255,255,0.07)]"
              : "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),inset_0_-1px_0_0_rgba(0,0,0,0.14),inset_1px_0_0_0_rgba(255,255,255,0.3)]"
          )}
        />
        {error ? (
          <p
            role="alert"
            className="absolute inset-0 flex items-center justify-center bg-neutral-950/85 p-[8cqw] text-center text-[3.4cqw] leading-snug text-pretty text-white"
          >
            {error}
          </p>
        ) : null}
      </article>
    </div>
  )
}
