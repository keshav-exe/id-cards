"use client"

import { cn } from "@/lib/utils"

function Inspector({
  className,
  children,
  ...props
}: React.ComponentProps<"aside">) {
  return (
    <aside
      aria-label="Card settings"
      className={cn(
        "flex min-w-0 flex-col bg-sidebar text-sidebar-foreground lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:shadow-[-1px_0_0_0_var(--sidebar-border),-8px_0_24px_-12px_rgba(0,0,0,0.08)] lg:dark:shadow-[-1px_0_0_0_var(--sidebar-border),-8px_0_32px_-12px_rgba(0,0,0,0.45)]",
        className
      )}
      {...props}
    >
      {children}
    </aside>
  )
}

function InspectorHeader({
  title,
  children,
  className,
}: {
  title: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between gap-3 border-b border-sidebar-border px-4 py-3 sm:px-5 sm:py-4",
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 className="text-lg font-medium text-balance">{title}</h2>
        <p className="hidden text-sm text-pretty text-muted-foreground sm:block">
          Brand, card, and member settings
        </p>
      </div>
      {children}
    </div>
  )
}

function InspectorBody({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 px-4 py-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:gap-6 sm:px-5 sm:py-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pb-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function InspectorGroup({
  title,
  icon,
  children,
  className,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2 px-0.5">
        {icon ? (
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground"
          >
            {icon}
          </span>
        ) : null}
        <h3 className="text-sm font-medium text-sidebar-foreground">{title}</h3>
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  )
}

function InspectorSection({
  title,
  aside,
  description,
  children,
  className,
  padded = true,
}: {
  title?: string
  aside?: string
  description?: string
  children: React.ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-sidebar-border bg-card text-card-foreground shadow-sm",
        padded ? "p-4" : "overflow-hidden",
        className
      )}
    >
      {title || aside || description ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3">
            {title ? (
              <h4 className="text-sm font-medium text-balance">{title}</h4>
            ) : (
              <span />
            )}
            {aside ? (
              <p className="shrink-0 text-sm text-muted-foreground">{aside}</p>
            ) : null}
          </div>
          {description ? (
            <p className="text-sm text-pretty text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  )
}

function InspectorFooter({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-10 shrink-0 border-t border-sidebar-border bg-sidebar p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5 sm:pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:relative lg:inset-auto lg:z-auto lg:mt-auto lg:bg-sidebar/95 lg:backdrop-blur-sm lg:supports-backdrop-filter:bg-sidebar/80",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export {
  Inspector,
  InspectorHeader,
  InspectorBody,
  InspectorGroup,
  InspectorSection,
  InspectorFooter,
}
