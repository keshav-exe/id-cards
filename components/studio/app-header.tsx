"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { ThemeToggle } from "./theme-toggle"

interface AppHeaderProps {
  exportLabel: string
  exportBusy: boolean
  exportError: string | null
  onExport: () => void
}

export function AppHeader({
  exportLabel,
  exportBusy,
  exportError,
  onExport,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 px-4 sm:px-6">
      <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
        <p
          className={cn(
            "mr-1 hidden font-mono text-sm tabular-nums lg:block",
            exportError ? "text-destructive" : "text-muted-foreground"
          )}
          role={exportError ? "alert" : undefined}
        >
          {exportError ?? exportLabel}
        </p>
        <Button
          type="button"
          size="sm"
          onClick={onExport}
          disabled={exportBusy}
          className="hidden sm:inline-flex"
        >
          {exportBusy ? "Rendering…" : "Download PNG"}
        </Button>
      </div>
    </header>
  )
}
