import type { ComponentType, CSSProperties } from "react"

import { monogramFor, type Brand } from "@/lib/brand"
import {
  memberNumber,
  qrPayload,
  type Colorway,
  type Member,
  type VariantId,
} from "@/lib/card/variants"
import { cn } from "@/lib/utils"

import { BrandMark } from "./brand-mark"
import { Portrait } from "./portrait"
import { QrCode } from "./qr-code"

export interface CardLayoutProps {
  brand: Brand
  member: Member
  colorway: Colorway
  logoInvert: boolean
}

/*
 * Every size below is in `cqw` — a percentage of the card's own width — so the
 * composition is identical at 320px on a phone and at 1080px in the export.
 */

function Eyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "font-mono text-[2.7cqw] leading-none tracking-[0.18em] uppercase opacity-65",
        className
      )}
      {...props}
    />
  )
}

function Mono({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "font-mono text-[2.9cqw] leading-none tabular-nums",
        className
      )}
      {...props}
    />
  )
}

/* Access — the reference card. Brushed metal, brand block, member block, QR. */
function Access({ brand, member, logoInvert }: CardLayoutProps) {
  return (
    <div className="flex h-full flex-col justify-between p-[7cqw]">
      <div className="flex items-start justify-between gap-[4cqw]">
        <div className="flex min-w-0 flex-col gap-[5cqw]">
          <BrandMark
            brand={brand}
            invert={logoInvert}
            className="size-[13cqw]"
          />
          {brand.logoShape === "wordmark" ? (
            <Eyebrow>Access card</Eyebrow>
          ) : (
            <div className="flex flex-col gap-[1.8cqw]">
              <h2
                title={brand.name}
                className="truncate text-[6.2cqw] leading-[1.1] font-medium tracking-tight text-balance"
              >
                {brand.name}
              </h2>
              <Eyebrow>Access card</Eyebrow>
            </div>
          )}
        </div>
        {member.photo ? (
          <Portrait
            src={member.photo}
            name={member.name}
            brand={brand}
            photoFilter={member.photoFilter}
            className="size-[22cqw] rounded-[2.4cqw]"
          />
        ) : (
          <Contactless className="size-[9cqw] opacity-70" />
        )}
      </div>

      <div className="flex items-end justify-between gap-[4cqw]">
        <div className="flex min-w-0 flex-col gap-[6cqw]">
          <div className="flex flex-col gap-[2cqw]">
            <Eyebrow>{member.tier}</Eyebrow>
            <p
              title={member.name}
              className="truncate text-[5.2cqw] leading-none font-medium tracking-[0.06em] uppercase"
            >
              {member.name}
            </p>
          </div>
          <Eyebrow>{member.role}</Eyebrow>
        </div>
        <QrCode
          value={qrPayload(brand, member)}
          className="size-[19cqw] opacity-85"
        />
      </div>
    </div>
  )
}

/* Laminate — passport specimen: photo, data columns, machine-readable zone. */
function Laminate({ brand, member, logoInvert }: CardLayoutProps) {
  const number = memberNumber(brand, member)
  const fields: [string, string][] = [
    ["Name", member.name],
    ["Role", member.role],
    ["Status", member.tier],
    ["Since", member.since],
  ]
  return (
    <div className="flex h-full flex-col p-[7cqw]">
      <div className="flex items-center justify-between gap-[4cqw]">
        <div className="flex min-w-0 items-center gap-[3cqw]">
          <BrandMark
            brand={brand}
            invert={logoInvert}
            className="size-[8cqw]"
          />
          {brand.logoShape === "wordmark" ? null : (
            <p
              title={brand.name}
              className="truncate font-mono text-[3.2cqw] leading-none tracking-[0.14em] uppercase"
            >
              {brand.name}
            </p>
          )}
        </div>
        <Eyebrow className="shrink-0">Specimen</Eyebrow>
      </div>

      <div className="mt-[9cqw] flex gap-[6cqw]">
        <Portrait
          src={member.photo}
          name={member.name}
          brand={brand}
          photoFilter={member.photoFilter}
          className="aspect-4/5 w-[34cqw] rounded-[2.4cqw]"
        />
        <dl className="flex min-w-0 flex-1 flex-col justify-between gap-[3.5cqw]">
          {fields.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-[1.4cqw]">
              <dt className="font-mono text-[2.5cqw] leading-none tracking-[0.18em] uppercase opacity-60">
                {label}
              </dt>
              <dd
                title={value}
                className="truncate text-[4.2cqw] leading-none font-medium tracking-tight"
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-auto flex items-end justify-between gap-[4cqw]">
        <div className="flex flex-col gap-[1.8cqw]">
          <Eyebrow>Member no.</Eyebrow>
          <Mono className="text-[4cqw] font-medium">{number}</Mono>
        </div>
        <QrCode
          value={qrPayload(brand, member)}
          className="size-[15cqw] opacity-85"
        />
      </div>

      <div className="-mx-[7cqw] mt-[5cqw] border-t border-current/20 px-[7cqw] pt-[3.5cqw]">
        {mrz(brand, member).map((line, i) => (
          <p
            key={i}
            className="font-mono text-[3.55cqw] leading-[1.35] tracking-[0.1em] whitespace-pre opacity-80"
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}

/* Aurora — creative pass. Serif display name over frosted brand colour. */
function Aurora({ brand, member, logoInvert }: CardLayoutProps) {
  return (
    <div className="flex h-full flex-col justify-between p-[7cqw]">
      <div className="flex items-start justify-between gap-[4cqw]">
        <div className="flex min-w-0 items-center gap-[3cqw]">
          <BrandMark
            brand={brand}
            invert={logoInvert}
            className="size-[9cqw]"
          />
          {brand.logoShape === "wordmark" ? null : (
            <p
              title={brand.name}
              className="truncate text-[3.6cqw] leading-none font-medium tracking-tight"
            >
              {brand.name}
            </p>
          )}
        </div>
        {member.photo ? (
          <Portrait
            src={member.photo}
            name={member.name}
            brand={brand}
            photoFilter={member.photoFilter}
            className="size-[16cqw] rounded-full"
          />
        ) : (
          <Eyebrow className="shrink-0 pt-[1cqw]">
            Pass · {member.since}
          </Eyebrow>
        )}
      </div>

      <div className="flex flex-col gap-[3cqw]">
        <h2
          title={member.name}
          className="line-clamp-3 text-[14cqw] leading-[0.94] tracking-[-0.02em] text-balance"
        >
          {member.name}
        </h2>
        <p className="text-[4cqw] leading-none opacity-80">{member.role}</p>
      </div>

      <div className="flex items-end justify-between gap-[4cqw] border-t border-current/20 pt-[4.5cqw]">
        <div className="flex flex-col gap-[1.8cqw]">
          <Eyebrow>{member.tier}</Eyebrow>
          <Mono className="text-[3.4cqw]">{memberNumber(brand, member)}</Mono>
        </div>
        <QrCode
          value={qrPayload(brand, member)}
          className="size-[14cqw] opacity-85"
        />
      </div>
    </div>
  )
}

/* Ledger — boarding-pass stub. Main panel, perforation, tear-off. */
function Ledger({ brand, member, logoInvert }: CardLayoutProps) {
  const number = memberNumber(brand, member)
  const seat = number.slice(-3).replace(" ", "")
  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-[2] flex-col justify-between p-[4.2cqw]">
        <div className="flex items-center justify-between gap-[3cqw]">
          <div className="flex min-w-0 items-center gap-[2cqw]">
            <BrandMark
              brand={brand}
              invert={logoInvert}
              className="size-[5.5cqw]"
            />
            {brand.logoShape === "wordmark" ? null : (
              <p
                title={brand.name}
                className="truncate font-mono text-[2.3cqw] leading-none tracking-[0.1em] uppercase"
              >
                {brand.name}
              </p>
            )}
          </div>
        </div>

        <p
          title={member.name}
          className="truncate text-[6.4cqw] leading-none font-medium tracking-[0.04em] uppercase"
        >
          {member.name}
        </p>

        {/* Wrapping row instead of a rigid grid: long tiers flow rather than clip. */}
        <dl className="flex flex-wrap gap-x-[5cqw] gap-y-[2.4cqw]">
          {(
            [
              ["Role", member.role],
              ["Tier", member.tier],
              ["Seat", seat],
              ["Since", member.since],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex flex-col gap-[1.3cqw]">
              <dt className="font-mono text-[1.9cqw] leading-none tracking-[0.18em] uppercase opacity-60">
                {label}
              </dt>
              <dd className="font-mono text-[2.8cqw] leading-none whitespace-nowrap tabular-nums">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <Barcode value={number} className="h-[4.6cqw] w-[58%] opacity-80" />
      </div>

      <div
        aria-hidden
        className="my-[3cqw] w-0 shrink-0 border-l border-dashed border-current/35"
      />

      <div className="flex min-w-0 flex-1 flex-col items-center justify-between p-[3.6cqw] text-center">
        <Eyebrow className="text-[1.9cqw]">Member pass</Eyebrow>
        <QrCode
          value={qrPayload(brand, member)}
          className="w-[62%] opacity-85"
        />
        <Mono className="text-[2.3cqw]">{number}</Mono>
      </div>
    </div>
  )
}

/* Forge — carbon spec sheet. Engineering grid, registration marks, big name. */
function Forge({ brand, member, logoInvert }: CardLayoutProps) {
  const number = memberNumber(brand, member)
  return (
    <div className="relative flex h-full flex-col justify-between p-[7cqw]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(currentColor_0.2cqw,transparent_0.2cqw),linear-gradient(90deg,currentColor_0.2cqw,transparent_0.2cqw)] bg-size-[7cqw_7cqw] bg-position-[3.5cqw_3.5cqw] opacity-[0.07]"
      />
      <Reticle className="top-[3cqw] left-[3cqw]" />
      <Reticle className="top-[3cqw] right-[3cqw]" />
      <Reticle className="bottom-[3cqw] left-[3cqw]" />
      <Reticle className="right-[3cqw] bottom-[3cqw]" />

      <div className="flex items-center justify-between gap-[4cqw]">
        <div className="flex min-w-0 items-center gap-[3cqw]">
          <BrandMark
            brand={brand}
            invert={logoInvert}
            className="size-[8cqw]"
          />
          {brand.logoShape === "wordmark" ? null : (
            <p
              title={brand.name}
              className="truncate font-mono text-[3cqw] leading-none tracking-[0.14em] uppercase"
            >
              {brand.name}
            </p>
          )}
        </div>
        <Eyebrow className="shrink-0">Spec · {member.since}</Eyebrow>
      </div>

      <div className="flex flex-col gap-[4cqw]">
        <Eyebrow>{member.tier}</Eyebrow>
        <h2
          title={member.name}
          className="line-clamp-2 text-[10.5cqw] leading-[0.95] font-medium tracking-[-0.02em] text-balance uppercase"
        >
          {member.name}
        </h2>
        <div aria-hidden className="h-[0.7cqw] w-[16cqw] bg-current" />
        <p className="text-[3.8cqw] leading-none opacity-80">{member.role}</p>
      </div>

      <div className="flex items-end justify-between gap-[4cqw]">
        <dl className="flex flex-col gap-[3cqw]">
          <div className="flex flex-col gap-[1.4cqw]">
            <dt className="font-mono text-[2.5cqw] leading-none tracking-[0.18em] uppercase opacity-60">
              Member no.
            </dt>
            <dd className="font-mono text-[3.8cqw] leading-none font-medium tabular-nums">
              {number}
            </dd>
          </div>
          <div className="flex flex-col gap-[1.4cqw]">
            <dt className="font-mono text-[2.5cqw] leading-none tracking-[0.18em] uppercase opacity-60">
              Issued by
            </dt>
            <dd
              title={brand.name}
              className="truncate font-mono text-[3cqw] leading-none tabular-nums"
            >
              {host(brand)}
            </dd>
          </div>
        </dl>
        <QrCode
          value={qrPayload(brand, member)}
          className="size-[17cqw] opacity-85"
        />
      </div>
    </div>
  )
}

/** Registration crosshair for the Forge corners. */
function Reticle({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      viewBox="0 0 10 10"
      className={cn("absolute size-[3.4cqw] opacity-45", className)}
    >
      <path
        d="M5 0v10M0 5h10"
        stroke="currentColor"
        strokeWidth="0.7"
        fill="none"
      />
      <circle
        cx="5"
        cy="5"
        r="2.6"
        stroke="currentColor"
        strokeWidth="0.7"
        fill="none"
      />
    </svg>
  )
}

/* Mirror — liquid chrome. The mark, centred and large; everything else recedes. */
function Mirror({ brand, member, logoInvert }: CardLayoutProps) {
  const wordmark = brand.logoShape === "wordmark"
  return (
    <div className="flex h-full flex-col justify-between p-[7cqw]">
      <div className="flex items-start justify-between gap-[4cqw]">
        <Eyebrow className="truncate">{host(brand)}</Eyebrow>
        <Eyebrow className="shrink-0">{memberNumber(brand, member)}</Eyebrow>
      </div>

      <div className="flex flex-1 items-center justify-center py-[6cqw]">
        {brand.logo ? (
          <BrandMark
            brand={brand}
            invert={logoInvert}
            className={cn(
              "drop-shadow-[0_1.2cqw_2.4cqw_rgba(0,0,0,0.25)] [&>img]:max-w-full",
              wordmark ? "h-[12cqw] max-w-[64cqw]" : "size-[30cqw]"
            )}
          />
        ) : (
          <h2
            title={brand.name}
            className="line-clamp-2 text-center text-[11cqw] leading-none font-medium tracking-tight text-balance"
          >
            {brand.name}
          </h2>
        )}
      </div>

      <div className="flex items-end justify-between gap-[4cqw]">
        <div className="flex min-w-0 flex-col gap-[2cqw]">
          <p
            title={member.name}
            className="truncate text-[5cqw] leading-none font-medium tracking-tight"
          >
            {member.name}
          </p>
          <Eyebrow className="truncate">
            {member.role} · {member.tier}
          </Eyebrow>
        </div>
        <QrCode
          value={qrPayload(brand, member)}
          className="size-[13cqw] opacity-80"
        />
      </div>
    </div>
  )
}

/* Press — letterpress stock. A debossed monogram, then quiet editorial type. */
function Press({ brand, member, logoInvert }: CardLayoutProps) {
  const number = memberNumber(brand, member)
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden p-[7cqw]">
      <p
        aria-hidden
        className="pointer-events-none absolute -top-[9cqw] -right-[2cqw] text-[62cqw] leading-none font-medium tracking-[-0.07em] text-current/8 [text-shadow:0_0.3cqw_0_rgba(255,255,255,0.4),0_-0.2cqw_0_rgba(0,0,0,0.16)]"
      >
        {monogramFor(member.name)}
      </p>

      <div className="relative flex items-center gap-[3cqw]">
        <BrandMark brand={brand} invert={logoInvert} className="size-[8cqw]" />
        {brand.logoShape === "wordmark" ? null : (
          <p
            title={brand.name}
            className="truncate text-[3.6cqw] leading-none font-medium tracking-tight"
          >
            {brand.name}
          </p>
        )}
      </div>

      <div className="relative flex flex-col gap-[3cqw]">
        <Eyebrow>{member.tier}</Eyebrow>
        <h2
          title={member.name}
          className="line-clamp-2 text-[9cqw] leading-none font-medium tracking-tight text-balance"
        >
          {member.name}
        </h2>
        <p className="text-[3.8cqw] leading-none opacity-80">{member.role}</p>
      </div>

      <div className="relative flex items-end justify-between gap-[4cqw] border-t border-current/20 pt-[4.5cqw]">
        <dl className="flex min-w-0 flex-wrap gap-x-[5cqw] gap-y-[2.4cqw]">
          {(
            [
              ["Since", member.since],
              ["No.", number],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex flex-col gap-[1.4cqw]">
              <dt className="font-mono text-[2.5cqw] leading-none tracking-[0.18em] uppercase opacity-60">
                {label}
              </dt>
              <dd className="font-mono text-[3.2cqw] leading-none whitespace-nowrap tabular-nums">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <QrCode
          value={qrPayload(brand, member)}
          className="size-[13cqw] opacity-85"
        />
      </div>
    </div>
  )
}

/* Noir — landscape night pass. Neon accent bar, one line of type, nothing else. */
function Noir({ brand, member, colorway, logoInvert }: CardLayoutProps) {
  const accent = colorway.swatch[1]
  return (
    <div className="relative flex h-full flex-col justify-between p-[4.5cqw] pl-[6.5cqw]">
      <div
        aria-hidden
        className="absolute top-[16%] bottom-[16%] left-0 w-[0.9cqw] rounded-r-full bg-(--accent) shadow-[0_0_2.2cqw_var(--accent)]"
        style={{ "--accent": accent } as CSSProperties}
      />

      <div className="flex items-center justify-between gap-[3cqw]">
        <div className="flex min-w-0 items-center gap-[2cqw]">
          <BrandMark
            brand={brand}
            invert={logoInvert}
            className="size-[6cqw]"
          />
          {brand.logoShape === "wordmark" ? null : (
            <p
              title={brand.name}
              className="truncate text-[2.8cqw] leading-none font-medium tracking-tight"
            >
              {brand.name}
            </p>
          )}
        </div>
        <Eyebrow className="shrink-0 text-[2.1cqw]">{member.tier}</Eyebrow>
      </div>

      <div className="flex flex-col gap-[2cqw]">
        <p
          title={member.name}
          className="truncate text-[8cqw] leading-none font-medium tracking-tight"
        >
          {member.name}
        </p>
        <p className="text-[3cqw] leading-none opacity-80">{member.role}</p>
      </div>

      <div className="flex items-end justify-between gap-[3cqw]">
        <div className="flex items-baseline gap-[3cqw]">
          <Mono className="text-[2.6cqw]">{memberNumber(brand, member)}</Mono>
          <Eyebrow className="text-[2.1cqw]">Since {member.since}</Eyebrow>
        </div>
        <QrCode
          value={qrPayload(brand, member)}
          className="size-[11cqw] opacity-85"
        />
      </div>
    </div>
  )
}

/** Contactless glyph: three arcs, like the one printed on payment cards. */
function Contactless({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      viewBox="0 0 24 24"
      className={cn("shrink-0", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M7.5 7.5a7 7 0 0 1 0 9" />
      <path d="M11 5a11 11 0 0 1 0 14" />
      <path d="M14.5 2.5a15 15 0 0 1 0 19" />
    </svg>
  )
}

/**
 * Decorative 1-D barcode derived from the member number. Not a real symbology
 * — the QR carries the data — but the bar widths are deterministic per card.
 */
function Barcode({ value, className }: { value: string; className?: string }) {
  const bars: { x: number; w: number }[] = []
  let x = 0
  // Start guard.
  bars.push({ x, w: 1 })
  x += 2
  for (const ch of value.replaceAll(" ", "")) {
    const d = Number(ch)
    // Four bars per digit, widths 1–3, spaces 1–2. Only consistency matters.
    const widths = [
      1 + (d % 3),
      1 + ((d >> 1) % 2),
      1 + ((d * 7) % 3),
      1 + (d % 2),
    ]
    widths.forEach((w, i) => {
      bars.push({ x, w })
      x += w + 1 + ((d + i) % 2)
    })
  }
  // End guard.
  bars.push({ x, w: 1 })
  x += 1
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      viewBox={`0 0 ${x} 10`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      className={cn("fill-current", className)}
    >
      {bars.map((bar, i) => (
        <rect key={i} x={bar.x} y="0" width={bar.w} height="10" />
      ))}
    </svg>
  )
}

/** Bare hostname for the small print. */
function host(brand: Brand): string {
  return brand.domain.replace(/^www\./, "") || brand.name
}

/** Two 30-character machine-readable lines, passport style. */
function mrz(brand: Brand, member: Member): [string, string] {
  const clean = (s: string) =>
    s
      .normalize("NFD")
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, "")
      .trim()
      .replace(/ +/g, "<")
  const fill = (s: string) => s.padEnd(30, "<").slice(0, 30)
  const number = memberNumber(brand, member).replaceAll(" ", "")
  // Issuer code: first word of the brand, whole, max 9 chars.
  const issuer = (clean(brand.name).split("<")[0] ?? "ID").slice(0, 9)
  return [
    fill(`P<${issuer}<<${clean(member.name)}`),
    fill(`${number}<${clean(member.role).slice(0, 8)}<${member.since}`),
  ]
}

export const LAYOUTS: Record<VariantId, ComponentType<CardLayoutProps>> = {
  access: Access,
  laminate: Laminate,
  aurora: Aurora,
  ledger: Ledger,
  forge: Forge,
  mirror: Mirror,
  press: Press,
  noir: Noir,
}
