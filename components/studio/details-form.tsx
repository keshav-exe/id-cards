"use client"

import { useId, useRef } from "react"

import type { Brand } from "@/lib/brand"
import {
  defaultCardLabel,
  LIMITS,
  memberNumber,
  variantSupports,
  type Member,
  type MemberVisibility,
  type PhotoFilter,
  type VariantId,
} from "@/lib/card/variants"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DetailsFormProps {
  brand: Brand
  variantId: VariantId
  member: Member
  onMemberChange: (member: Member) => void
}

const MAX_PHOTO_BYTES = 12 * 1024 * 1024
const FILTERS: { id: PhotoFilter; label: string }[] = [
  { id: "none", label: "Color" },
  { id: "mono", label: "Mono" },
  { id: "brand", label: "Brand" },
]

export function DetailsForm({
  brand,
  variantId,
  member,
  onMemberChange,
}: DetailsFormProps) {
  const photoId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const supports = (key: MemberVisibility) => variantSupports(variantId, key)
  const labelDefault = defaultCardLabel(variantId)

  function set<K extends keyof Member>(key: K, value: Member[K]) {
    onMemberChange({ ...member, [key]: value })
  }

  function onPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || !file.type.startsWith("image/") || file.size > MAX_PHOTO_BYTES)
      return
    if (member.photo?.startsWith("blob:")) URL.revokeObjectURL(member.photo)
    set("photo", URL.createObjectURL(file))
  }

  function removePhoto() {
    if (member.photo?.startsWith("blob:")) URL.revokeObjectURL(member.photo)
    set("photo", null)
  }

  return (
    <FieldGroup className="gap-4">
      {supports("showLogo") ? (
        <ToggleOnly
          id="show-logo"
          label="Logo"
          checked={member.showLogo}
          onCheckedChange={(checked) => set("showLogo", checked)}
          description="Brand mark on the card"
        />
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        {supports("showName") ? (
          <VisibleField
            className="col-span-2"
            showId="show-name"
            inputId="member-name"
            label="Full name"
            show={member.showName}
            onShowChange={(checked) => set("showName", checked)}
            count={{ value: member.name, max: LIMITS.name }}
          >
            <Input
              id="member-name"
              name="name"
              autoComplete="name"
              value={member.name}
              maxLength={LIMITS.name}
              onChange={(e) =>
                set("name", e.target.value.slice(0, LIMITS.name))
              }
            />
          </VisibleField>
        ) : null}

        {supports("showRole") ? (
          <VisibleField
            showId="show-role"
            inputId="member-role"
            label="Job title"
            show={member.showRole}
            onShowChange={(checked) => set("showRole", checked)}
            count={{ value: member.role, max: LIMITS.role }}
          >
            <Input
              id="member-role"
              name="role"
              autoComplete="organization-title"
              value={member.role}
              maxLength={LIMITS.role}
              onChange={(e) =>
                set("role", e.target.value.slice(0, LIMITS.role))
              }
            />
          </VisibleField>
        ) : null}

        {supports("showTier") ? (
          <VisibleField
            showId="show-tier"
            inputId="member-tier"
            label="Membership"
            show={member.showTier}
            onShowChange={(checked) => set("showTier", checked)}
            count={{ value: member.tier, max: LIMITS.tier }}
          >
            <Input
              id="member-tier"
              name="tier"
              value={member.tier}
              maxLength={LIMITS.tier}
              onChange={(e) =>
                set("tier", e.target.value.slice(0, LIMITS.tier))
              }
            />
          </VisibleField>
        ) : null}

        {supports("showSince") ? (
          <VisibleField
            showId="show-since"
            inputId="member-since"
            label="Member since"
            show={member.showSince}
            onShowChange={(checked) => set("showSince", checked)}
          >
            <Input
              id="member-since"
              name="since"
              inputMode="numeric"
              autoComplete="off"
              value={member.since}
              maxLength={LIMITS.since}
              className="tabular-nums"
              onChange={(e) =>
                set(
                  "since",
                  e.target.value.replace(/\D/g, "").slice(0, LIMITS.since)
                )
              }
            />
          </VisibleField>
        ) : null}

        {supports("showLabel") ? (
          <VisibleField
            showId="show-label"
            inputId="member-label"
            label="Card label"
            show={member.showLabel}
            onShowChange={(checked) => set("showLabel", checked)}
            count={{ value: member.label, max: LIMITS.label }}
            className={supports("showPhoto") ? undefined : "col-span-2"}
          >
            <Input
              id="member-label"
              name="label"
              placeholder={labelDefault || "Style default"}
              value={member.label}
              maxLength={LIMITS.label}
              onChange={(e) =>
                set("label", e.target.value.slice(0, LIMITS.label))
              }
            />
          </VisibleField>
        ) : null}

        {supports("showPhoto") ? (
          <VisibleField
            showId="show-photo"
            inputId={photoId}
            label="Photo"
            show={member.showPhoto}
            onShowChange={(checked) => set("showPhoto", checked)}
          >
            <div className="flex gap-1.5">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => fileRef.current?.click()}
              >
                {member.photo ? "Replace" : "Upload"}
              </Button>
              {member.photo ? (
                <Button type="button" variant="ghost" onClick={removePhoto}>
                  Remove
                </Button>
              ) : null}
            </div>
            <input
              ref={fileRef}
              id={photoId}
              name="photo"
              type="file"
              accept="image/*"
              tabIndex={-1}
              className="hidden"
              onChange={onPhoto}
            />
          </VisibleField>
        ) : null}
      </div>

      {supports("showPhoto") && member.photo ? (
        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label="Photo filter"
        >
          {FILTERS.map((filter) => (
            <Button
              key={filter.id}
              type="button"
              size="xs"
              variant={member.photoFilter === filter.id ? "secondary" : "ghost"}
              aria-pressed={member.photoFilter === filter.id}
              onClick={() => set("photoFilter", filter.id)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      ) : null}

      {supports("showNumber") ? (
        <VisibleField
          showId="show-number"
          inputId="member-number"
          label="Member ID"
          show={member.showNumber}
          onShowChange={(checked) => set("showNumber", checked)}
        >
          <Input
            id="member-number"
            name="number"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            placeholder={memberNumber(brand, { ...member, number: "" })}
            value={member.number}
            maxLength={LIMITS.number}
            className="tabular-nums"
            onChange={(e) =>
              set("number", e.target.value.slice(0, LIMITS.number))
            }
          />
          <FieldDescription>Leave blank to generate one.</FieldDescription>
        </VisibleField>
      ) : null}

      {supports("showQr") ? (
        <VisibleField
          showId="show-qr"
          inputId="member-qr"
          label="QR link"
          show={member.showQr}
          onShowChange={(checked) => set("showQr", checked)}
        >
          <Input
            id="member-qr"
            name="qrUrl"
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder={brand.url}
            value={member.qrUrl}
            maxLength={LIMITS.qrUrl}
            onChange={(e) =>
              set("qrUrl", e.target.value.slice(0, LIMITS.qrUrl))
            }
          />
          <FieldDescription>
            Leave blank to use the brand site.
          </FieldDescription>
        </VisibleField>
      ) : null}

      {supports("showMrz") || supports("showBarcode") ? (
        <div
          data-slot="checkbox-group"
          className="flex flex-col gap-2 border-t border-foreground/10 pt-3"
        >
          <p className="text-sm text-muted-foreground">Security marks</p>
          {supports("showMrz") ? (
            <ToggleOnly
              id="show-mrz"
              label="Machine-readable zone"
              checked={member.showMrz}
              onCheckedChange={(checked) => set("showMrz", checked)}
              description="Passport-style MRZ lines at the bottom"
            />
          ) : null}
          {supports("showBarcode") ? (
            <ToggleOnly
              id="show-barcode"
              label="Barcode"
              checked={member.showBarcode}
              onCheckedChange={(checked) => set("showBarcode", checked)}
              description="Decorative barcode derived from the member ID"
            />
          ) : null}
        </div>
      ) : null}
    </FieldGroup>
  )
}

function VisibleField({
  showId,
  inputId,
  label,
  show,
  onShowChange,
  count,
  className,
  children,
}: {
  showId: string
  inputId: string
  label: string
  show: boolean
  onShowChange: (checked: boolean) => void
  count?: { value: string; max: number }
  className?: string
  children: React.ReactNode
}) {
  return (
    <Field
      className={cn(!show && "opacity-70", className)}
      data-disabled={!show || undefined}
    >
      <div className="flex items-center gap-2">
        <Checkbox
          id={showId}
          checked={show}
          aria-controls={inputId}
          onCheckedChange={onShowChange}
        />
        <FieldLabel htmlFor={inputId} className="mb-0 flex-1 cursor-pointer">
          {label}
        </FieldLabel>
        {count ? (
          <p className="font-mono text-sm text-muted-foreground tabular-nums">
            {count.value.length}/{count.max}
          </p>
        ) : null}
      </div>
      <FieldContent>{children}</FieldContent>
    </Field>
  )
}

function ToggleOnly({
  id,
  label,
  checked,
  onCheckedChange,
  description,
}: {
  id: string
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  description?: string
}) {
  return (
    <Field
      orientation="horizontal"
      className={cn(!checked && "opacity-70")}
      data-disabled={!checked || undefined}
    >
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <FieldContent>
        <FieldLabel htmlFor={id} className="mb-0 cursor-pointer">
          {label}
        </FieldLabel>
        {description ? (
          <FieldDescription>{description}</FieldDescription>
        ) : null}
      </FieldContent>
    </Field>
  )
}
