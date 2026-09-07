import { clock, effect, frame, frameLoop, init, surface, target } from "vgpu"
import type { Effect, FrameLoopHandle, Gpu, Surface } from "vgpu"

import type { RGB } from "@/lib/color"
import auroraShader from "./shaders/aurora.wgsl"
import brushedShader from "./shaders/brushed.wgsl"
import carbonShader from "./shaders/carbon.wgsl"
import holoShader from "./shaders/holo.wgsl"

export const MATERIAL_SHADERS = {
  brushed: brushedShader,
  holo: holoShader,
  carbon: carbonShader,
  aurora: auroraShader,
} as const

export type MaterialId = keyof typeof MATERIAL_SHADERS

export interface MaterialState {
  material: MaterialId
  base: RGB
  accent: RGB
}

export interface MaterialRenderer {
  update(next: Partial<MaterialState>): void
  /** Pointer in card UV space, origin top-left. Used by the 3D preview tilt. */
  setMouse(next: readonly [number, number]): void
  /** Render the current material at an arbitrary size and return RGBA bytes. */
  snapshot(size: readonly [number, number]): Promise<Uint8Array>
  dispose(): void
}

interface Options {
  onError?: (message: string) => void
  onReady?: () => void
}

/**
 * Owns one WebGPU surface for a card canvas. Effects are created lazily per
 * material and kept for the life of the renderer so switching is free.
 */
export function createMaterialRenderer(
  canvas: HTMLCanvasElement,
  initial: MaterialState,
  options: Options = {}
): MaterialRenderer {
  let state: MaterialState = { ...initial }
  let mouse: readonly [number, number] = [0.5, 0.5]
  let disposed = false
  let gpu: Gpu | undefined
  let canvasSurface: Surface | undefined
  let loop: FrameLoopHandle | undefined
  let visible = true
  let time: ReturnType<typeof clock> | undefined
  const effects = new Map<MaterialId, Effect>()
  const cleanups: (() => void)[] = []

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches

  const onPointerMove = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    mouse = [
      (event.clientX - rect.left) / rect.width,
      (event.clientY - rect.top) / rect.height,
    ]
    if (reduceMotion) renderOnce()
  }
  const onPointerLeave = () => {
    mouse = [0.5, 0.5]
    if (reduceMotion) renderOnce()
  }
  canvas.addEventListener("pointermove", onPointerMove, { passive: true })
  canvas.addEventListener("pointerleave", onPointerLeave, { passive: true })
  cleanups.push(() => {
    canvas.removeEventListener("pointermove", onPointerMove)
    canvas.removeEventListener("pointerleave", onPointerLeave)
  })

  function getEffect(id: MaterialId): Effect {
    if (!gpu) throw new Error("GPU not ready")
    let eff = effects.get(id)
    if (!eff) {
      eff = effect(gpu, MATERIAL_SHADERS[id], {
        label: `material-${id}`,
        set: { params: paramsFor(canvasSurface?.texelSize ?? [1, 1]) },
      })
      effects.set(id, eff)
    }
    return eff
  }

  function paramsFor(texel: readonly [number, number]) {
    return {
      time: time?.time ?? 0,
      texel,
      mouse,
      base: state.base,
      accent: state.accent,
    }
  }

  function renderOnce() {
    if (!gpu || !canvasSurface || disposed) return
    const eff = getEffect(state.material)
    eff.set({ params: paramsFor(canvasSurface.texelSize) })
    frame(gpu, (f) => {
      f.pass(canvasSurface!, eff)
    })
  }

  function startLoop() {
    if (!gpu || loop || reduceMotion || !visible || disposed) return
    loop = frameLoop(gpu, (f) => {
      if (!canvasSurface) return
      const eff = getEffect(state.material)
      eff.set({ params: paramsFor(canvasSurface.texelSize) })
      f.pass(canvasSurface, eff)
    })
  }

  function stopLoop() {
    loop?.stop()
    loop = undefined
  }

  void (async () => {
    try {
      gpu = await init()
      if (disposed) {
        gpu.dispose()
        return
      }
      canvasSurface = surface(gpu, canvas, { dpr: [1, 2], label: "card" })
      time = clock(gpu)

      // Warm every material against the real surface format so switching never hitches.
      frame(gpu, () => {
        for (const id of Object.keys(MATERIAL_SHADERS) as MaterialId[]) {
          getEffect(id).compileSync(canvasSurface)
        }
      })
      if (disposed) return

      // Pause when scrolled out of view; rAF already pauses on hidden tabs.
      const io = new IntersectionObserver(
        ([entry]) => {
          visible = entry?.isIntersecting ?? true
          if (visible) startLoop()
          else stopLoop()
        },
        { threshold: 0 }
      )
      io.observe(canvas)
      cleanups.push(() => io.disconnect())

      options.onReady?.()
      if (reduceMotion) renderOnce()
      else startLoop()
    } catch (error) {
      options.onError?.(
        error instanceof Error ? error.message : "WebGPU failed to start."
      )
    }
  })()

  return {
    update(next) {
      state = { ...state, ...next }
      if (reduceMotion) renderOnce()
    },
    setMouse(next) {
      mouse = next
      if (reduceMotion) renderOnce()
    },
    async snapshot(size) {
      if (!gpu) throw new Error("The material hasn't finished loading yet.")
      const eff = getEffect(state.material)
      // `target()` is typed as the generic Target; the offscreen class adds destroy().
      const offscreen = target(gpu, { size, label: "export" }) as ReturnType<
        typeof target
      > & {
        destroy(): void
      }
      try {
        eff.set({ params: paramsFor(offscreen.texelSize) })
        frame(gpu, (f) => {
          f.pass(offscreen, eff)
        })
        return await offscreen.read()
      } finally {
        offscreen.destroy()
        // Put the live surface's texel size back for the next frame.
        if (canvasSurface)
          eff.set({ params: { texel: canvasSurface.texelSize } })
      }
    },
    dispose() {
      disposed = true
      stopLoop()
      for (const cleanup of cleanups) cleanup()
      gpu?.dispose()
    },
  }
}
