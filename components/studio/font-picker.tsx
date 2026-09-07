"use client"

import {
  TYPEFACE_GROUPS,
  TYPEFACES,
  type TypefaceId,
  typefaceById,
  typefaceStack,
} from "@/lib/card/typefaces"
import { Field, FieldLabel } from "@/components/ui/field"

interface FontPickerProps {
  value: TypefaceId
  onValueChange: (id: TypefaceId) => void
}

export function FontPicker({ value, onValueChange }: FontPickerProps) {
  const current = typefaceById(value)

  return (
    <Field>
      <FieldLabel htmlFor="card-font">Font</FieldLabel>
      <div className="inline-grid w-full grid-cols-[1fr_--spacing(8)]">
        <select
          id="card-font"
          name="font"
          value={current.id}
          onChange={(event) => onValueChange(event.target.value as TypefaceId)}
          className="col-span-full row-start-1 h-8 w-full appearance-none rounded-lg border border-input bg-transparent px-2.5 pr-8 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
          style={{ fontFamily: typefaceStack(current) }}
        >
          {TYPEFACE_GROUPS.map((group) => (
            <optgroup key={group.kind} label={group.label}>
              {TYPEFACES.filter((face) => face.kind === group.kind).map(
                (face) => (
                  <option
                    key={face.id}
                    value={face.id}
                    style={{ fontFamily: typefaceStack(face) }}
                  >
                    {face.title}
                  </option>
                )
              )}
            </optgroup>
          ))}
        </select>
        <svg
          viewBox="0 0 8 5"
          width="8"
          height="5"
          fill="none"
          aria-hidden
          className="pointer-events-none col-start-2 row-start-1 place-self-center text-muted-foreground"
        >
          <path d="M.5.5 4 4 7.5.5" stroke="currentColor" />
        </svg>
      </div>
    </Field>
  )
}
