"use client"

import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="relative shrink-0"
    >
      <HugeiconsIcon
        icon={Sun03Icon}
        strokeWidth={1.75}
        className="size-4 dark:hidden"
      />
      <HugeiconsIcon
        icon={Moon02Icon}
        strokeWidth={1.75}
        className="hidden size-4 dark:block"
      />
      <span
        className="pointer-fine:hidden absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2"
        aria-hidden="true"
      />
    </Button>
  )
}
