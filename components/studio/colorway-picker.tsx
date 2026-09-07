"use client"

import { Radio } from "@base-ui/react/radio"
import { RadioGroup } from "@base-ui/react/radio-group"

import type { Colorway, ColorwayId } from "@/lib/card/variants"

interface ColorwayPickerProps {
  colorways: readonly Colorway[]
  value: ColorwayId
  onValueChange: (id: ColorwayId) => void
}

/**
 * Metallic discs in two rows: finishes pulled from the brand, then the fixed
 * defaults. One radio group, so arrow keys walk across both rows.
 */
export function ColorwayPicker({
  colorways,
  value,
  onValueChange,
}: ColorwayPickerProps) {
  const brand = colorways.filter((c) => c.group === "brand")
  const defaults = colorways.filter((c) => c.group === "default")

  return (
    <RadioGroup
      aria-label="Finish"
      value={value}
      onValueChange={(next) => onValueChange(next as ColorwayId)}
      className="flex flex-col gap-3"
    >
      <Row label="From the brand" colorways={brand} />
      <Row label="Defaults" colorways={defaults} />
    </RadioGroup>
  )
}

function Row({
  label,
  colorways,
}: {
  label: string
  colorways: readonly Colorway[]
}) {
  if (colorways.length === 0) return null
  return (
    <div role="presentation" className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {colorways.map((colorway) => (
          <Disc key={colorway.id} colorway={colorway} />
        ))}
      </div>
    </div>
  )
}

function Disc({ colorway }: { colorway: Colorway }) {
  return (
    <Radio.Root
      value={colorway.id}
      aria-label={colorway.label}
      title={colorway.label}
      className="relative flex size-9 items-center justify-center rounded-full outline-none after:absolute after:-inset-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-checked:ring-2 data-checked:ring-foreground data-checked:ring-offset-2 data-checked:ring-offset-background"
    >
      <span
        aria-hidden
        className="block size-7 rounded-full ring-1 ring-black/15 ring-inset"
        style={{
          background: `linear-gradient(135deg, ${colorway.swatch[1]} 0%, ${colorway.swatch[0]} 55%, ${colorway.swatch[1]} 100%)`,
        }}
      />
      <span
        className="pointer-fine:hidden absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2"
        aria-hidden="true"
      />
    </Radio.Root>
  )
}
