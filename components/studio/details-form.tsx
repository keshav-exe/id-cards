"use client"

import { useId, useRef } from "react"

import {
  LIMITS,
  type Member,
  type PhotoFilter,
} from "@/lib/card/variants"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

interface DetailsFormProps {
  member: Member
  onMemberChange: (member: Member) => void
  logoInvert: boolean
  onLogoInvertChange: (value: boolean) => void
  hasLogo: boolean
}

const MAX_PHOTO_BYTES = 12 * 1024 * 1024
const FILTERS: { id: PhotoFilter; label: string }[] = [
  { id: "none", label: "Color" },
  { id: "mono", label: "Mono" },
  { id: "brand", label: "Brand" },
]

export function DetailsForm({
  member,
  onMemberChange,
  logoInvert,
  onLogoInvertChange,
  hasLogo,
}: DetailsFormProps) {
  const photoId = useId()
  const fileRef = useRef<HTMLInputElement>(null)

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
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <CountedField
          className="col-span-2"
          id="member-name"
          label="Name"
          value={member.name}
          max={LIMITS.name}
        >
          <Input
            id="member-name"
            name="name"
            autoComplete="name"
            value={member.name}
            maxLength={LIMITS.name}
            onChange={(e) => set("name", e.target.value.slice(0, LIMITS.name))}
          />
        </CountedField>
        <CountedField
          id="member-role"
          label="Role"
          value={member.role}
          max={LIMITS.role}
        >
          <Input
            id="member-role"
            name="role"
            value={member.role}
            maxLength={LIMITS.role}
            onChange={(e) => set("role", e.target.value.slice(0, LIMITS.role))}
          />
        </CountedField>
        <CountedField
          id="member-tier"
          label="Tier"
          value={member.tier}
          max={LIMITS.tier}
        >
          <Input
            id="member-tier"
            name="tier"
            value={member.tier}
            maxLength={LIMITS.tier}
            onChange={(e) => set("tier", e.target.value.slice(0, LIMITS.tier))}
          />
        </CountedField>
        <Field>
          <FieldLabel htmlFor="member-since">Since</FieldLabel>
          <Input
            id="member-since"
            name="since"
            inputMode="numeric"
            value={member.since}
            maxLength={LIMITS.since}
            className="tabular-nums"
            onChange={(e) =>
              set("since", e.target.value.replace(/\D/g, "").slice(0, LIMITS.since))
            }
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={photoId}>Photo</FieldLabel>
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
        </Field>
      </div>

      {member.photo ? (
        <div className="flex flex-wrap gap-1" role="group" aria-label="Photo filter">
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

      {hasLogo ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-pressed={logoInvert}
          onClick={() => onLogoInvertChange(!logoInvert)}
          className="self-start aria-pressed:bg-muted"
        >
          Invert logo
        </Button>
      ) : null}
    </div>
  )
}

function CountedField({
  id,
  label,
  value,
  max,
  className,
  children,
}: {
  id: string
  label: string
  value: string
  max: number
  className?: string
  children: React.ReactNode
}) {
  return (
    <Field className={className}>
      <div className="flex items-baseline justify-between gap-2">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <p className="font-mono text-sm tabular-nums text-muted-foreground">
          {value.length}/{max}
        </p>
      </div>
      {children}
    </Field>
  )
}
