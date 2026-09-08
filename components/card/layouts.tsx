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

function cardLabel(member: Member, fallback: string): string | null {
  if (!member.showLabel) return null
  return member.label.trim() || fallback
}

function CardQr({
  brand,
  member,
  className,
}: {
  brand: Brand
  member: Member
  className?: string
}) {
  if (!member.showQr) return null
  return <QrCode value={qrPayload(brand, member)} className={className} />
}

/* Access — the reference card. Brushed metal, brand block, member block, QR. */
function Access({ brand, member, logoInvert }: CardLayoutProps) {
  const photo = member.showPhoto ? member.photo : null
  const label = cardLabel(member, "Access card")
  return (
    <div className="flex h-full flex-col justify-between p-[7cqw]">
      <div className="flex items-start justify-between gap-[4cqw]">
        <div className="flex min-w-0 flex-col gap-[5cqw]">
          {member.showLogo ? (
            <BrandMark
              brand={brand}
              invert={logoInvert}
              className="size-[13cqw]"
            />
          ) : null}
          {brand.logoShape === "wordmark" && member.showLogo ? (
            label ? (
              <Eyebrow>{label}</Eyebrow>
            ) : null
          ) : (
            <div className="flex flex-col gap-[1.8cqw]">
              {member.showLogo ? (
                <h2
                  title={brand.name}
                  className="truncate text-[6.2cqw] leading-[1.1] font-medium tracking-tight text-balance"
                >
                  {brand.name}
                </h2>
              ) : null}
              {label ? <Eyebrow>{label}</Eyebrow> : null}
            </div>
          )}
        </div>
        {member.showPhoto ? (
          photo ? (
            <Portrait
              src={photo}
              name={member.name}
              brand={brand}
              photoFilter={member.photoFilter}
              className="size-[22cqw] rounded-[2.4cqw]"
            />
          ) : (
            <Contactless className="size-[9cqw] opacity-70" />
          )
        ) : null}
      </div>

      <div className="flex items-end justify-between gap-[4cqw]">
        <div className="flex min-w-0 flex-col gap-[6cqw]">
          <div className="flex flex-col gap-[2cqw]">
            {member.showTier ? <Eyebrow>{member.tier}</Eyebrow> : null}
            {member.showName ? (
              <p
                title={member.name}
                className="truncate text-[5.2cqw] leading-none font-medium tracking-[0.06em] uppercase"
              >
                {member.name}
              </p>
            ) : null}
          </div>
          {member.showRole || member.showSince ? (
            <div className="flex items-baseline gap-[2.4cqw]">
              {member.showRole ? <Eyebrow>{member.role}</Eyebrow> : null}
              {member.showSince ? (
                <Eyebrow className="opacity-70">{member.since}</Eyebrow>
              ) : null}
            </div>
          ) : null}
          {member.showNumber ? (
            <Mono className="text-[3.4cqw] opacity-80">
              {memberNumber(brand, member)}
            </Mono>
          ) : null}
        </div>
        <CardQr
          brand={brand}
          member={member}
          className="size-[19cqw] opacity-85"
        />
      </div>
    </div>
  )
}

/* Laminate — passport data page: photo window, fields, MRZ band. */
function Laminate({ brand, member, logoInvert }: CardLayoutProps) {
  const number = memberNumber(brand, member)
  const label = cardLabel(member, "Specimen")
  const fields = (
    [
      member.showName ? ["Name", member.name] : null,
      member.showRole ? ["Role", member.role] : null,
      member.showTier ? ["Status", member.tier] : null,
      member.showSince ? ["Since", member.since] : null,
    ] as const
  ).filter((row): row is [string, string] => row !== null)

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col p-[7cqw] pb-[4.5cqw]">
        <div className="flex items-center justify-between gap-[4cqw]">
          <div className="flex min-w-0 items-center gap-[3cqw]">
            {member.showLogo ? (
              <BrandMark
                brand={brand}
                invert={logoInvert}
                className="size-[8cqw]"
              />
            ) : null}
            {member.showLogo && brand.logoShape !== "wordmark" ? (
              <p
                title={brand.name}
                className="truncate font-mono text-[3.2cqw] leading-none tracking-[0.14em] uppercase"
              >
                {brand.name}
              </p>
            ) : null}
          </div>
          {label ? <Eyebrow className="shrink-0">{label}</Eyebrow> : null}
        </div>

        <div
          className={cn(
            "mt-[7cqw] flex min-h-0",
            member.showPhoto ? "gap-[5.5cqw]" : null
          )}
        >
          {member.showPhoto ? (
            <div className="shrink-0 rounded-[1.6cqw] p-[0.9cqw] ring-1 ring-current/18">
              <Portrait
                src={member.photo}
                name={member.name}
                brand={brand}
                photoFilter={member.photoFilter}
                className="aspect-[7/9] w-[30cqw] rounded-[0.9cqw] ring-0"
              />
            </div>
          ) : null}
          {fields.length > 0 ? (
            <dl className="flex min-w-0 flex-1 flex-col justify-center gap-[3.4cqw] py-[0.4cqw]">
              {fields.map(([field, value]) => (
                <div key={field} className="flex flex-col gap-[1.3cqw]">
                  <dt className="font-mono text-[2.2cqw] leading-none tracking-[0.2em] uppercase opacity-50">
                    {field}
                  </dt>
                  <dd
                    title={value}
                    className="truncate text-[4.1cqw] leading-none font-medium tracking-tight"
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        {member.showNumber || member.showQr ? (
          <div className="mt-auto flex items-end justify-between gap-[4cqw] pt-[5cqw]">
            {member.showNumber ? (
              <div className="flex flex-col gap-[1.5cqw]">
                <Eyebrow>Member no.</Eyebrow>
                <Mono className="text-[3.8cqw] font-medium">{number}</Mono>
              </div>
            ) : (
              <span />
            )}
            <CardQr
              brand={brand}
              member={member}
              className="size-[13cqw] opacity-90"
            />
          </div>
        ) : null}
      </div>

      {member.showMrz ? (
        <div className="bg-current/16 px-[6.5cqw] py-[2.6cqw] shadow-[inset_0_0.35cqw_0_0_color-mix(in_oklab,currentColor_22%,transparent)]">
          {mrz(brand, member).map((line, i) => (
            <p
              key={i}
              className="font-mono text-[3.15cqw] leading-[1.38] tracking-[0.18em] whitespace-pre opacity-90"
            >
              {line}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/* Aurora — creative pass. Serif display name over frosted brand colour. */
function Aurora({ brand, member, logoInvert }: CardLayoutProps) {
  const photo = member.showPhoto ? member.photo : null
  const label = cardLabel(member, "Pass")
  return (
    <div className="flex h-full flex-col justify-between p-[7cqw]">
      <div className="flex items-start justify-between gap-[4cqw]">
        <div className="flex min-w-0 items-center gap-[3cqw]">
          {member.showLogo ? (
            <BrandMark
              brand={brand}
              invert={logoInvert}
              className="size-[9cqw]"
            />
          ) : null}
          {member.showLogo && brand.logoShape !== "wordmark" ? (
            <p
              title={brand.name}
              className="truncate text-[3.6cqw] leading-none font-medium tracking-tight"
            >
              {brand.name}
            </p>
          ) : null}
        </div>
        {photo ? (
          <Portrait
            src={photo}
            name={member.name}
            brand={brand}
            photoFilter={member.photoFilter}
            className="size-[16cqw] rounded-full"
          />
        ) : label ? (
          <Eyebrow className="shrink-0 pt-[1cqw]">{label}</Eyebrow>
        ) : null}
      </div>

      <div className="flex flex-col gap-[3cqw]">
        {member.showName ? (
          <h2
            title={member.name}
            className="line-clamp-3 text-[14cqw] leading-[0.94] tracking-[-0.02em] text-balance"
          >
            {member.name}
          </h2>
        ) : null}
        {member.showRole || member.showSince ? (
          <p className="text-[4cqw] leading-none opacity-80">
            {[
              member.showRole ? member.role : null,
              member.showSince ? member.since : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
      </div>

      <div className="flex items-end justify-between gap-[4cqw] border-t border-current/20 pt-[4.5cqw]">
        <div className="flex flex-col gap-[1.8cqw]">
          {member.showTier ? <Eyebrow>{member.tier}</Eyebrow> : null}
          {member.showNumber ? (
            <Mono className="text-[3.4cqw]">{memberNumber(brand, member)}</Mono>
          ) : null}
        </div>
        <CardQr
          brand={brand}
          member={member}
          className="size-[14cqw] opacity-85"
        />
      </div>
    </div>
  )
}

/* Ledger — boarding-pass stub. Main panel, perforation, tear-off. */
function Ledger({ brand, member, logoInvert }: CardLayoutProps) {
  const number = memberNumber(brand, member)
  const seat = number.replaceAll(" ", "").slice(-3)
  const label = cardLabel(member, "Member pass")
  const fields = (
    [
      member.showRole ? ["Role", member.role] : null,
      member.showTier ? ["Tier", member.tier] : null,
      member.showNumber ? ["Seat", seat] : null,
      member.showSince ? ["Since", member.since] : null,
    ] as const
  ).filter((row): row is [string, string] => row !== null)

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-[2] flex-col justify-between p-[4.2cqw]">
        <div className="flex items-center justify-between gap-[3cqw]">
          <div className="flex min-w-0 items-center gap-[2cqw]">
            {member.showLogo ? (
              <BrandMark
                brand={brand}
                invert={logoInvert}
                className="size-[5.5cqw]"
              />
            ) : null}
            {member.showLogo && brand.logoShape !== "wordmark" ? (
              <p
                title={brand.name}
                className="truncate font-mono text-[2.3cqw] leading-none tracking-[0.1em] uppercase"
              >
                {brand.name}
              </p>
            ) : null}
          </div>
        </div>

        {member.showName ? (
          <p
            title={member.name}
            className="truncate text-[6.4cqw] leading-none font-medium tracking-[0.04em] uppercase"
          >
            {member.name}
          </p>
        ) : null}

        {fields.length > 0 ? (
          <dl className="flex flex-wrap gap-x-[5cqw] gap-y-[2.4cqw]">
            {fields.map(([field, value]) => (
              <div key={field} className="flex flex-col gap-[1.3cqw]">
                <dt className="font-mono text-[1.9cqw] leading-none tracking-[0.18em] uppercase opacity-60">
                  {field}
                </dt>
                <dd className="font-mono text-[2.8cqw] leading-none whitespace-nowrap tabular-nums">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {member.showBarcode ? (
          <Barcode value={number} className="h-[4.6cqw] w-[58%] opacity-80" />
        ) : null}
      </div>

      <div
        aria-hidden
        className="my-[3cqw] w-0 shrink-0 border-l border-dashed border-current/35"
      />

      <div className="flex min-w-0 flex-1 flex-col items-center justify-between p-[3.6cqw] text-center">
        {label ? (
          <Eyebrow className="text-[1.9cqw]">{label}</Eyebrow>
        ) : (
          <span />
        )}
        <CardQr brand={brand} member={member} className="w-[62%] opacity-85" />
        {member.showNumber ? (
          <Mono className="text-[2.3cqw]">{number}</Mono>
        ) : (
          <span />
        )}
      </div>
    </div>
  )
}

/* Forge — carbon spec sheet. Engineering grid, registration marks, big name. */
function Forge({ brand, member, logoInvert }: CardLayoutProps) {
  const number = memberNumber(brand, member)
  const label = cardLabel(member, "Spec")
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
          {member.showLogo ? (
            <BrandMark
              brand={brand}
              invert={logoInvert}
              className="size-[8cqw]"
            />
          ) : null}
          {member.showLogo && brand.logoShape !== "wordmark" ? (
            <p
              title={brand.name}
              className="truncate font-mono text-[3cqw] leading-none tracking-[0.14em] uppercase"
            >
              {brand.name}
            </p>
          ) : null}
        </div>
        {label ? <Eyebrow className="shrink-0">{label}</Eyebrow> : null}
      </div>

      <div className="flex flex-col gap-[4cqw]">
        {member.showTier ? <Eyebrow>{member.tier}</Eyebrow> : null}
        {member.showName ? (
          <h2
            title={member.name}
            className="line-clamp-2 text-[10.5cqw] leading-[0.95] font-medium tracking-[-0.02em] text-balance uppercase"
          >
            {member.name}
          </h2>
        ) : null}
        <div aria-hidden className="h-[0.7cqw] w-[16cqw] bg-current" />
        {member.showRole ? (
          <p className="text-[3.8cqw] leading-none opacity-80">{member.role}</p>
        ) : null}
      </div>

      <div className="flex items-end justify-between gap-[4cqw]">
        <dl className="flex flex-col gap-[3cqw]">
          {member.showSince ? (
            <div className="flex flex-col gap-[1.4cqw]">
              <dt className="font-mono text-[2.5cqw] leading-none tracking-[0.18em] uppercase opacity-60">
                Since
              </dt>
              <dd className="font-mono text-[3.8cqw] leading-none font-medium tabular-nums">
                {member.since}
              </dd>
            </div>
          ) : null}
          {member.showNumber ? (
            <div className="flex flex-col gap-[1.4cqw]">
              <dt className="font-mono text-[2.5cqw] leading-none tracking-[0.18em] uppercase opacity-60">
                Member no.
              </dt>
              <dd className="font-mono text-[3.8cqw] leading-none font-medium tabular-nums">
                {number}
              </dd>
            </div>
          ) : null}
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
        <CardQr
          brand={brand}
          member={member}
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
        {member.showNumber ? (
          <Eyebrow className="shrink-0">{memberNumber(brand, member)}</Eyebrow>
        ) : null}
      </div>

      <div className="flex flex-1 items-center justify-center py-[6cqw]">
        {member.showLogo && brand.logo ? (
          <BrandMark
            brand={brand}
            invert={logoInvert}
            className={cn(
              "drop-shadow-[0_1.2cqw_2.4cqw_rgba(0,0,0,0.25)] [&>img]:max-w-full",
              wordmark ? "h-[12cqw] max-w-[64cqw]" : "size-[30cqw]"
            )}
          />
        ) : member.showLogo ? (
          <h2
            title={brand.name}
            className="line-clamp-2 text-center text-[11cqw] leading-none font-medium tracking-tight text-balance"
          >
            {brand.name}
          </h2>
        ) : member.showName ? (
          <h2
            title={member.name}
            className="line-clamp-2 text-center text-[11cqw] leading-none font-medium tracking-tight text-balance"
          >
            {member.name}
          </h2>
        ) : null}
      </div>

      <div className="flex items-end justify-between gap-[4cqw]">
        <div className="flex min-w-0 flex-col gap-[2cqw]">
          {member.showName && member.showLogo ? (
            <p
              title={member.name}
              className="truncate text-[5cqw] leading-none font-medium tracking-tight"
            >
              {member.name}
            </p>
          ) : null}
          {member.showRole || member.showTier || member.showSince ? (
            <Eyebrow className="truncate">
              {[
                member.showRole ? member.role : null,
                member.showTier ? member.tier : null,
                member.showSince ? member.since : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Eyebrow>
          ) : null}
        </div>
        <CardQr
          brand={brand}
          member={member}
          className="size-[13cqw] opacity-80"
        />
      </div>
    </div>
  )
}

/* Press — letterpress stock. A debossed monogram, then quiet editorial type. */
function Press({ brand, member, logoInvert }: CardLayoutProps) {
  const number = memberNumber(brand, member)
  const meta = (
    [
      member.showSince ? ["Since", member.since] : null,
      member.showNumber ? ["No.", number] : null,
    ] as const
  ).filter((row): row is [string, string] => row !== null)

  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden p-[7cqw]">
      {member.showName ? (
        <p
          aria-hidden
          className="pointer-events-none absolute -top-[9cqw] -right-[2cqw] text-[62cqw] leading-none font-medium tracking-[-0.07em] text-current/8 [text-shadow:0_0.3cqw_0_rgba(255,255,255,0.4),0_-0.2cqw_0_rgba(0,0,0,0.16)]"
        >
          {monogramFor(member.name)}
        </p>
      ) : null}

      <div className="relative flex items-center gap-[3cqw]">
        {member.showLogo ? (
          <BrandMark
            brand={brand}
            invert={logoInvert}
            className="size-[8cqw]"
          />
        ) : null}
        {member.showLogo && brand.logoShape !== "wordmark" ? (
          <p
            title={brand.name}
            className="truncate text-[3.6cqw] leading-none font-medium tracking-tight"
          >
            {brand.name}
          </p>
        ) : null}
      </div>

      <div className="relative flex flex-col gap-[3cqw]">
        {member.showTier ? <Eyebrow>{member.tier}</Eyebrow> : null}
        {member.showName ? (
          <h2
            title={member.name}
            className="line-clamp-2 text-[9cqw] leading-none font-medium tracking-tight text-balance"
          >
            {member.name}
          </h2>
        ) : null}
        {member.showRole ? (
          <p className="text-[3.8cqw] leading-none opacity-80">{member.role}</p>
        ) : null}
      </div>

      <div className="relative flex items-end justify-between gap-[4cqw] border-t border-current/20 pt-[4.5cqw]">
        {meta.length > 0 ? (
          <dl className="flex min-w-0 flex-wrap gap-x-[5cqw] gap-y-[2.4cqw]">
            {meta.map(([field, value]) => (
              <div key={field} className="flex flex-col gap-[1.4cqw]">
                <dt className="font-mono text-[2.5cqw] leading-none tracking-[0.18em] uppercase opacity-60">
                  {field}
                </dt>
                <dd className="font-mono text-[3.2cqw] leading-none whitespace-nowrap tabular-nums">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <span />
        )}
        <CardQr
          brand={brand}
          member={member}
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
          {member.showLogo ? (
            <BrandMark
              brand={brand}
              invert={logoInvert}
              className="size-[6cqw]"
            />
          ) : null}
          {member.showLogo && brand.logoShape !== "wordmark" ? (
            <p
              title={brand.name}
              className="truncate text-[2.8cqw] leading-none font-medium tracking-tight"
            >
              {brand.name}
            </p>
          ) : null}
        </div>
        {member.showTier ? (
          <Eyebrow className="shrink-0 text-[2.1cqw]">{member.tier}</Eyebrow>
        ) : null}
      </div>

      <div className="flex flex-col gap-[2cqw]">
        {member.showName ? (
          <p
            title={member.name}
            className="truncate text-[8cqw] leading-none font-medium tracking-tight"
          >
            {member.name}
          </p>
        ) : null}
        {member.showRole ? (
          <p className="text-[3cqw] leading-none opacity-80">{member.role}</p>
        ) : null}
      </div>

      <div className="flex items-end justify-between gap-[3cqw]">
        <div className="flex items-baseline gap-[3cqw]">
          {member.showNumber ? (
            <Mono className="text-[2.6cqw]">{memberNumber(brand, member)}</Mono>
          ) : null}
          {member.showSince ? (
            <Eyebrow className="text-[2.1cqw]">Since {member.since}</Eyebrow>
          ) : null}
        </div>
        <CardQr
          brand={brand}
          member={member}
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
  const number = member.showNumber
    ? memberNumber(brand, member).replaceAll(" ", "")
    : ""
  const issuer = (clean(brand.name).split("<")[0] ?? "ID").slice(0, 9)
  const name = member.showName ? clean(member.name) : ""
  const role = member.showRole ? clean(member.role).slice(0, 8) : ""
  const since = member.showSince ? member.since : ""
  return [fill(`P<${issuer}<<${name}`), fill(`${number}<${role}<${since}`)]
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
