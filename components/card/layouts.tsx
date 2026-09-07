import type { ComponentType } from "react"

import type { Brand } from "@/lib/brand"
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
        ) : null}
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
}
