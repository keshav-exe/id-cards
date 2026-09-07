import { domToCanvas } from "modern-screenshot"

import { inlineFontFaces, usedFontFamilies } from "@/lib/card/fonts"
import type { MaterialRenderer } from "@/lib/card/material"

interface RasterizeOptions {
  /** The card's container wrapper (the `IdCard` ref). */
  card: HTMLElement
  renderer: MaterialRenderer
  /** Output width in pixels; height follows the card's aspect ratio. */
  width?: number
}

interface ExportOptions extends RasterizeOptions {
  filename: string
}

/**
 * Composite = WebGPU material (re-rendered offscreen at export size) under a
 * rasterised copy of the DOM overlay. WebGPU canvases can't be read back after
 * present, so the material is never captured from the visible canvas.
 */
export async function rasterizeCard({
  card,
  renderer,
  width = 1080,
}: RasterizeOptions): Promise<HTMLCanvasElement> {
  const rect = card.getBoundingClientRect()
  if (rect.width === 0) throw new Error("The card isn't visible yet.")

  const scale = width / rect.width
  const w = Math.round(rect.width * scale)
  const h = Math.round(rect.height * scale)

  await document.fonts.ready
  await Promise.all(
    [...card.querySelectorAll("img")].map((img) =>
      img.decode().catch(() => undefined)
    )
  )
  const fontCss = await inlineFontFaces(usedFontFamilies(card))

  const [material, overlay] = await Promise.all([
    renderer.snapshot([w, h]),
    domToCanvas(card, {
      scale,
      backgroundColor: null,
      // The live WebGPU canvas is replaced by the offscreen snapshot.
      filter: (node) => !(node instanceof HTMLCanvasElement),
      font: { cssText: fontCss },
    }),
  ])

  const out = document.createElement("canvas")
  out.width = w
  out.height = h
  const ctx = out.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D isn't available.")

  const face = card.querySelector("article") ?? card
  const radius =
    Number.parseFloat(getComputedStyle(face).borderTopLeftRadius) * scale
  ctx.beginPath()
  ctx.roundRect(0, 0, w, h, Number.isFinite(radius) ? radius : 0)
  ctx.clip()

  // putImageData ignores the clip, so stage the material on its own canvas first.
  const stage = new OffscreenCanvas(w, h)
  const stageCtx = stage.getContext("2d")
  if (!stageCtx) throw new Error("Canvas 2D isn't available.")
  const pixels = new Uint8ClampedArray(w * h * 4)
  pixels.set(material.subarray(0, w * h * 4))
  stageCtx.putImageData(new ImageData(pixels, w, h), 0, 0)
  ctx.drawImage(stage, 0, 0)
  ctx.drawImage(overlay, 0, 0, w, h)

  return out
}

export async function exportCardPng({
  card,
  renderer,
  width = 1080,
  filename,
}: ExportOptions): Promise<void> {
  const out = await rasterizeCard({ card, renderer, width })

  const blob = await new Promise<Blob | null>((resolve) =>
    out.toBlob(resolve, "image/png")
  )
  if (!blob) throw new Error("Couldn't encode the PNG.")

  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
