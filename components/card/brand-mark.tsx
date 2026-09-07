import { proxyImage, type Brand } from "@/lib/brand"
import { cn } from "@/lib/utils"

interface BrandMarkProps extends React.ComponentProps<"div"> {
  brand: Brand
  /** Flip a light logo dark (or vice-versa) to sit on the current ink. */
  invert?: boolean
}

/**
 * Brand mark when we have an SVG/PNG. Wordmarks take the name's place.
 * No logo → render nothing; the layout shows the brand name instead.
 */
export function BrandMark({
  brand,
  invert,
  className,
  ...props
}: BrandMarkProps) {
  const src = proxyImage(brand.logo)
  if (!src) return null
  const wordmark = brand.logoShape === "wordmark"
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center",
        wordmark && "!w-auto max-w-[46cqw] justify-start",
        className
      )}
      {...props}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- brand asset, sized by container */}
      <img
        src={src}
        alt=""
        crossOrigin="anonymous"
        draggable={false}
        className={cn(
          "object-contain",
          wordmark ? "h-full w-auto" : "size-full",
          invert && "invert"
        )}
      />
    </div>
  )
}
