import Image, { type ImageProps } from "next/image"
import { EditableImageClient } from "@/components/editable-image-client"
import { EditableTextClient } from "@/components/editable-text-client"
import type { AppLocale } from "@/lib/i18n/config"
import { imageFields, siteEdits, textFields, type LocalizedString } from "@/lib/site-editing/fields"

/**
 * Owner-editable copy for server components whose text lives in a bilingual
 * data file (lib/facility-services.ts, lib/location-pages.ts…). The data file
 * stays the source of the defaults; the registry entry (source: "data",
 * with a dataPath) mirrors it, and fields.test.ts checks the two match.
 *
 * Only registered ids are marked editable. Anything deliberately left out of
 * the registry (prices, offers) renders as plain text, so the editor never
 * outlines something it can't edit.
 */
export function EditableCopy({ id, copy, locale }: { id: string; copy: LocalizedString; locale: AppLocale }) {
  const value = siteEdits.text[id]?.[locale] || copy[locale]
  if (!(id in textFields)) return <>{copy[locale]}</>
  return <EditableTextClient id={id} locale={locale} value={value} />
}

type EditableDataPhotoProps = Omit<ImageProps, "src" | "alt"> & {
  id: string
  src: string
  alt: LocalizedString
  locale: AppLocale
}

/** A photo from a data file, replaceable by the owner if registered. */
export function EditableDataPhoto({ id, src, alt, locale, ...imageProps }: EditableDataPhotoProps) {
  const field = imageFields[id as keyof typeof imageFields]
  if (!field) return <Image {...imageProps} src={src} alt={alt[locale]} />
  const edit = siteEdits.images[id]
  return (
    <EditableImageClient
      {...imageProps}
      id={id}
      locale={locale}
      src={edit?.src ?? src}
      alt={edit?.alt?.[locale] || alt[locale]}
      aspect={field.aspect}
    />
  )
}
