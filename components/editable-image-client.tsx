"use client"

import Image, { type ImageProps } from "next/image"
import type { AppLocale } from "@/lib/i18n/config"
import { useEditDrafts } from "@/lib/site-editing/edit-store"

export type EditableImageClientProps = Omit<ImageProps, "src" | "alt"> & {
  id: string
  locale: AppLocale
  src: string
  alt: string
  aspect: string
}

export function EditableImageClient({ id, locale, src, alt, aspect, ...imageProps }: EditableImageClientProps) {
  const drafts = useEditDrafts()
  const draft = drafts?.images[id]

  return (
    <Image
      {...imageProps}
      src={draft?.src ?? src}
      alt={draft?.alt?.[locale] ?? alt}
      // A draft photo is a local blob: URL that the image optimizer can't fetch.
      unoptimized={draft ? true : imageProps.unoptimized}
      data-edit-key={id}
      data-edit-type="image"
      data-edit-aspect={aspect}
    />
  )
}
