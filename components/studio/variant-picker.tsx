"use client"

import { Radio } from "@base-ui/react/radio"
import { RadioGroup } from "@base-ui/react/radio-group"

import type { MaterialId } from "@/lib/card/material"
import type { CardVariant, Colorway, VariantId } from "@/lib/card/variants"
import { cn } from "@/lib/utils"

interface VariantPickerProps {
  variants: readonly CardVariant[]
  value: VariantId
  onValueChange: (id: VariantId) => void
  colorway: Colorway
}

/** Radio group of card-shaped tiles. Arrow keys move between them. */
export function VariantPicker({
  variants,
  value,
  onValueChange,
  colorway,
}: VariantPickerProps) {
  return (
    <RadioGroup
      aria-label="Card style"
      value={value}
      onValueChange={(next) => onValueChange(next as VariantId)}
      className="grid grid-cols-2 gap-2"
    >
      {variants.map((variant) => (
        <Radio.Root
          key={variant.id}
          value={variant.id}
          className="group/tile relative flex flex-col gap-2 rounded-xl p-2 text-left ring-1 ring-foreground/10 outline-none focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-muted/60 data-checked:ring-2 data-checked:ring-foreground dark:data-checked:ring-foreground/80"
        >
          <MaterialSwatch
            material={variant.material}
            colorway={colorway}
            orientation={variant.orientation}
          />
          <div className="flex flex-col gap-0.5 px-0.5">
            <p className="text-base font-medium sm:text-sm">{variant.name}</p>
            <p className="text-base text-pretty text-muted-foreground sm:text-sm">
              {variant.description}
            </p>
          </div>
        </Radio.Root>
      ))}
    </RadioGroup>
  )
}

/**
 * A CSS stand-in for the material so the picker doesn't need four live GPU
 * surfaces. Tinted with the active colorway, so it previews the combination.
 */
function MaterialSwatch({
  material,
  colorway,
  orientation,
}: {
  material: MaterialId
  colorway: Colorway
  orientation: CardVariant["orientation"]
}) {
  const [base, accent] = colorway.swatch
  return (
    <span aria-hidden className="flex h-24 w-full items-center justify-center">
      <span
        className={cn(
          "relative block overflow-hidden rounded-md ring-1 ring-black/10 ring-inset",
          orientation === "portrait"
            ? "aspect-[54/85.6] h-full"
            : "aspect-[85.6/54] w-full"
        )}
        style={{ background: swatchBackground(material, base, accent) }}
      >
        <span
          className="absolute top-[12%] left-[10%] h-[6%] w-[30%] rounded-full"
          style={{ backgroundColor: currentInk(colorway), opacity: 0.55 }}
        />
        <span
          className="absolute bottom-[12%] left-[10%] h-[6%] w-[45%] rounded-full"
          style={{ backgroundColor: currentInk(colorway), opacity: 0.35 }}
        />
      </span>
    </span>
  )
}

function currentInk(colorway: Colorway) {
  return colorway.ink === "light" ? "#ffffff" : "#0a0a0a"
}

function swatchBackground(material: MaterialId, base: string, accent: string) {
  switch (material) {
    case "brushed":
      return `linear-gradient(120deg, ${base} 0%, ${accent} 42%, ${base} 58%, ${base} 100%)`
    case "holo":
      return `linear-gradient(115deg, ${base} 0%, ${accent} 30%, #c8a45a 45%, #4fb3a8 60%, #b05a9a 75%, ${base} 100%)`
    case "carbon":
      return `repeating-linear-gradient(90deg, ${base} 0 3px, ${accent}66 3px 4px), repeating-linear-gradient(0deg, ${base} 0 3px, ${accent}33 3px 4px)`
    case "aurora":
      return `radial-gradient(60% 50% at 30% 30%, ${accent} 0%, transparent 70%), radial-gradient(60% 60% at 75% 75%, ${accent}aa 0%, transparent 70%), ${base}`
    case "liquid":
      return `linear-gradient(160deg, ${accent} 0%, ${base} 28%, #ffffffcc 40%, ${base} 52%, ${accent} 70%, ${base} 100%)`
    case "paper":
      return `radial-gradient(120% 80% at 50% 0%, ${accent}33 0%, transparent 60%), ${base}`
    case "noir":
      return `radial-gradient(55% 60% at 68% 78%, ${accent} 0%, transparent 65%), radial-gradient(40% 40% at 10% 15%, ${accent}66 0%, transparent 70%), color-mix(in oklab, ${base} 62%, black)`
  }
}
