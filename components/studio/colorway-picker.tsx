"use client"

import { Radio } from "@base-ui/react/radio"
import { RadioGroup } from "@base-ui/react/radio-group"

import type { Colorway, ColorwayId } from "@/lib/card/variants"

interface ColorwayPickerProps {
  colorways: readonly Colorway[]
  value: ColorwayId
  onValueChange: (id: ColorwayId) => void
}

/** Metallic discs, like the reference. The label of the active one is read out loud. */
export function ColorwayPicker({
  colorways,
  value,
  onValueChange,
}: ColorwayPickerProps) {
  return (
    <RadioGroup
      aria-label="Colorway"
      value={value}
      onValueChange={(next) => onValueChange(next as ColorwayId)}
      className="flex flex-wrap gap-2"
    >
      {colorways.map((colorway) => (
        <Radio.Root
          key={colorway.id}
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
      ))}
    </RadioGroup>
  )
}
