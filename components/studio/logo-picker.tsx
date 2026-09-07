"use client"

import { useState } from "react"
import { Popover } from "@base-ui/react/popover"

import { detectLogoShape, proxyImage } from "@/lib/brand"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LogoPickerProps {
  logos: readonly string[]
  value: string | null
  onValueChange: (src: string) => void
}

/** Dropdown grid of every mark the pull found. */
export function LogoPicker({ logos, value, onValueChange }: LogoPickerProps) {
  const [open, setOpen] = useState(false)
  if (logos.length === 0) return null

  const selected = value && logos.includes(value) ? value : logos[0]
  const count = logos.length

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        render={
          <Button type="button" size="xs" variant="outline" className="relative" />
        }
      >
        Logos
        {count > 1 ? (
          <span className="text-muted-foreground"> · {count}</span>
        ) : null}
        <span
          className="pointer-fine:hidden absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2"
          aria-hidden="true"
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="start"
          sideOffset={6}
          className="z-50"
        >
          <Popover.Popup
            className={cn(
              "w-[min(18.5rem,calc(100vw-2rem))] origin-[var(--transform-origin)] rounded-xl border border-foreground/10 bg-background p-2 shadow-lg outline-none dark:shadow-none dark:ring-1 dark:ring-white/10",
              "transition-[opacity,transform] duration-200 ease-[cubic-bezier(.215,.61,.355,1)]",
              "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
              "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
              "motion-reduce:transition-none motion-reduce:data-[starting-style]:scale-100 motion-reduce:data-[ending-style]:scale-100"
            )}
          >
            <Popover.Title className="px-1.5 pt-0.5 pb-2 text-sm font-medium">
              Extracted logos
            </Popover.Title>
            <div className="grid grid-cols-2 gap-1.5">
              {logos.map((src, index) => {
                const shape = detectLogoShape(src)
                const active = src === selected && value !== null
                return (
                  <button
                    key={`${index}:${src.slice(0, 48)}`}
                    type="button"
                    onClick={() => {
                      onValueChange(src)
                      setOpen(false)
                    }}
                    className={cn(
                      "flex flex-col gap-1.5 rounded-lg p-1.5 text-left outline-none",
                      "transition-colors duration-200 ease",
                      "focus-visible:ring-2 focus-visible:ring-ring",
                      "pointer-fine:hover:bg-muted",
                      shape === "wordmark" && "col-span-2",
                      active && "bg-muted ring-2 ring-foreground ring-inset"
                    )}
                  >
                    <LogoPreview src={src} wide={shape === "wordmark"} />
                    <span className="px-0.5 text-xs text-muted-foreground">
                      {shape === "wordmark" ? "Wordmark" : "Mark"} {index + 1}
                    </span>
                  </button>
                )
              })}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

function LogoPreview({ src, wide }: { src: string; wide: boolean }) {
  const [broken, setBroken] = useState(false)
  const preview = proxyImage(src) ?? src

  return (
    <span
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-md bg-neutral-200 ring-1 ring-black/10 ring-inset dark:bg-neutral-800 dark:ring-white/15",
        wide ? "h-14" : "h-16"
      )}
    >
      {broken ? (
        <span className="size-2 rounded-full bg-foreground/25" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          className={cn(
            "object-contain",
            wide ? "max-h-8 max-w-[90%]" : "max-h-10 max-w-[70%]"
          )}
          onError={() => setBroken(true)}
        />
      )}
    </span>
  )
}
