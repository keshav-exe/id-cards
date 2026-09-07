import { useMemo } from "react"
import QRCode from "qrcode"
import { cn } from "@/lib/utils"

interface QrCodeProps extends React.ComponentProps<"svg"> {
  value: string
}

/** Crisp inline-SVG QR in `currentColor`, so it inherits the card's ink. */
export function QrCode({ value, className, ...props }: QrCodeProps) {
  const { size, path } = useMemo(() => {
    const { modules } = QRCode.create(value, { errorCorrectionLevel: "M" })
    const parts: string[] = []
    for (let y = 0; y < modules.size; y++) {
      let run = 0
      for (let x = 0; x <= modules.size; x++) {
        const on = x < modules.size && modules.get(y, x)
        if (on) {
          run++
        } else if (run > 0) {
          parts.push(`M${x - run} ${y}h${run}v1h-${run}z`)
          run = 0
        }
      }
    }
    return { size: modules.size, path: parts.join("") }
  }, [value])

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      aria-label="Member QR code"
      role="img"
      className={cn("aspect-square fill-current", className)}
      {...props}
    >
      <path d={path} />
    </svg>
  )
}
