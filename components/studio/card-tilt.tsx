"use client"

import { useEffect, useRef, type ReactNode, type RefObject } from "react"

import type { MaterialRenderer } from "@/lib/card/material"
import { cn } from "@/lib/utils"

const MAX_X = 10
const MAX_Y = 14
const LERP = 0.14

interface CardTiltProps {
  children: ReactNode
  rendererRef: RefObject<MaterialRenderer | null>
  className?: string
}

/**
 * Perspective wrapper. Pointer over the stage tilts the card and drives the
 * material sheen. Export stays flat because the transform is outside `data-card`.
 */
export function CardTilt({ children, rendererRef, className }: CardTiltProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const plateRef = useRef<HTMLDivElement>(null)
  const glareRef = useRef<HTMLDivElement>(null)
  const target = useRef({ x: 0, y: 0, gx: 50, gy: 40 })
  const current = useRef({ x: 0, y: 0, gx: 50, gy: 40 })
  const hovering = useRef(false)

  useEffect(() => {
    const stage = stageRef.current
    const plate = plateRef.current
    const glare = glareRef.current
    if (!stage || !plate || !glare) return

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (reduce.matches) return

    let frame = 0

    const tick = () => {
      const c = current.current
      const t = target.current
      c.x += (t.x - c.x) * LERP
      c.y += (t.y - c.y) * LERP
      c.gx += (t.gx - c.gx) * LERP
      c.gy += (t.gy - c.gy) * LERP

      plate.style.transform = `rotateX(${(-c.y * MAX_X).toFixed(2)}deg) rotateY(${(c.x * MAX_Y).toFixed(2)}deg)`
      glare.style.background = `radial-gradient(circle at ${c.gx.toFixed(1)}% ${c.gy.toFixed(1)}%, rgba(255,255,255,0.34), transparent 52%)`
      glare.style.opacity = hovering.current ? "1" : "0"

      const nx = (c.x + 1) / 2
      const ny = (c.y + 1) / 2
      rendererRef.current?.setMouse([nx, ny])

      const settled =
        Math.abs(t.x - c.x) < 0.001 &&
        Math.abs(t.y - c.y) < 0.001 &&
        !hovering.current
      if (!settled) frame = requestAnimationFrame(tick)
      else frame = 0
    }

    const start = () => {
      if (!frame) frame = requestAnimationFrame(tick)
    }

    const onMove = (event: PointerEvent) => {
      const rect = plate.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = ((event.clientY - rect.top) / rect.height) * 2 - 1
      target.current = {
        x: clamp(x, -1, 1),
        y: clamp(y, -1, 1),
        gx: ((event.clientX - rect.left) / rect.width) * 100,
        gy: ((event.clientY - rect.top) / rect.height) * 100,
      }
      hovering.current = true
      start()
    }

    const onLeave = () => {
      hovering.current = false
      target.current = { x: 0, y: 0, gx: 50, gy: 40 }
      start()
    }

    const renderer = rendererRef.current

    stage.addEventListener("pointermove", onMove, { passive: true })
    stage.addEventListener("pointerleave", onLeave)
    stage.addEventListener("pointercancel", onLeave)
    return () => {
      cancelAnimationFrame(frame)
      stage.removeEventListener("pointermove", onMove)
      stage.removeEventListener("pointerleave", onLeave)
      stage.removeEventListener("pointercancel", onLeave)
      plate.style.transform = ""
      renderer?.setMouse([0.5, 0.5])
    }
  }, [rendererRef])

  return (
    <div
      ref={stageRef}
      className="flex size-full items-center justify-center [perspective:64rem]"
    >
      <div
        ref={plateRef}
        className={cn(
          "relative [container-type:inline-size] will-change-transform [transform-style:preserve-3d] motion-reduce:will-change-auto",
          className
        )}
      >
        {children}
        <div
          ref={glareRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[3.7cqw] opacity-0 mix-blend-overlay transition-opacity duration-200 ease-[cubic-bezier(.215,.61,.355,1)] motion-reduce:hidden"
        />
      </div>
    </div>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
