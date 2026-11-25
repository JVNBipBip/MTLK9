"use client"

import publishedEdits from "@/content/site-edits.json"
import { EditableImageClient } from "@/components/editable-image-client"
import { useAppLocale } from "@/components/locale-provider"
import { useEditDrafts } from "@/lib/site-editing/edit-store"
import type { SiteEdits } from "@/lib/site-editing/fields"

const edits = publishedEdits as unknown as SiteEdits

/**
 * An owner-replaceable card photo (fills its card, like CardCoverImage).
 * Until he replaces it, the original keeps its AVIF + WebP set; his photo is a
 * single WebP, so it goes through next/image. `alt` is already localized.
 */
export function EditableCardImage({
  id,
  aspect,
  src,
  srcAvif,
  alt,
  className,
  sizes,
}: {
  id: string
  aspect: string
  src: string
  srcAvif?: string
  alt: string
  /** Always fills its card (kept for parity with CardCoverImage). */
  fill?: true
  className?: string
  sizes: string
}) {
  const locale = useAppLocale()
  const drafts = useEditDrafts()
  const replaced = drafts?.images[id] ?? edits.images[id]
  const altText = replaced?.alt?.[locale] || alt

  if (!replaced && srcAvif) {
    return (
      <picture className="absolute inset-0" data-edit-key={id} data-edit-type="image" data-edit-aspect={aspect}>
        <source srcSet={srcAvif} type="image/avif" />
        <source srcSet={src} type="image/webp" />
        {/* eslint-disable-next-line @next/next/no-img-element -- same raster set as CardCoverImage */}
        <img src={src} alt={altText} className={`h-full w-full ${className ?? ""}`} sizes={sizes} />
      </picture>
    )
  }
  // Draft photos (while he edits) are applied inside EditableImageClient.
  return <EditableImageClient id={id} locale={locale} src={edits.images[id]?.src ?? src} alt={altText} aspect={aspect} fill className={className} sizes={sizes} />
}
