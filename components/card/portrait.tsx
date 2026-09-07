import { brandHue, monogramFor, type Brand } from "@/lib/brand"
import { hueDeg } from "@/lib/color"
import type { PhotoFilter } from "@/lib/card/variants"
import { cn } from "@/lib/utils"

interface PortraitProps extends React.ComponentProps<"div"> {
  src: string | null
  name: string
  brand: Brand
  photoFilter?: PhotoFilter
}

/** Member photo slot. Falls back to initials so the layout never collapses. */
export function Portrait({
  src,
  name,
  brand,
  photoFilter = "none",
  className,
  ...props
}: PortraitProps) {
  const hue = hueDeg(brandHue(brand))
  const filter =
    photoFilter === "mono"
      ? "grayscale(1) contrast(1.08)"
      : photoFilter === "brand"
        ? `grayscale(1) sepia(1) saturate(1.35) hue-rotate(${(hue - 40).toFixed(0)}deg)`
        : undefined

  return (
    <div
      className={cn(
        "[container-type:inline-size] relative flex shrink-0 items-center justify-center overflow-hidden bg-current/10 ring-1 ring-current/15 ring-inset",
        className
      )}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- user-uploaded blob URL
        <img
          src={src}
          alt=""
          draggable={false}
          className="size-full object-cover"
          style={filter ? { filter } : undefined}
        />
      ) : (
        <span
          aria-hidden
          className="text-[34cqw] leading-none font-medium tracking-tight opacity-70"
        >
          {monogramFor(name)}
        </span>
      )}
    </div>
  )
}
