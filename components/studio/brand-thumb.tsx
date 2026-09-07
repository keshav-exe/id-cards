import { proxyImage, type Brand } from "@/lib/brand"
import { cn } from "@/lib/utils"

interface BrandThumbProps {
  brand: Brand
  invert?: boolean
  className?: string
}

/** Square mark for the library and the current-brand card. */
export function BrandThumb({ brand, invert, className }: BrandThumbProps) {
  const src = proxyImage(brand.logo)
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10",
        invert ? "bg-neutral-900 dark:bg-neutral-200" : "bg-muted",
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote/data brand asset
        <img
          src={src}
          alt=""
          className={cn("size-full object-contain p-[18%]", invert && "invert")}
        />
      ) : (
        <p
          aria-hidden
          className="text-sm font-medium text-muted-foreground sm:text-xs"
        >
          {brand.monogram}
        </p>
      )}
    </span>
  )
}
