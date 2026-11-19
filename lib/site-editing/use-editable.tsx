"use client"

import { useCallback } from "react"
import type { ImageProps } from "next/image"
import publishedEdits from "@/content/site-edits.json"
import { EditableImageClient } from "@/components/editable-image-client"
import { EditableTextClient } from "@/components/editable-text-client"
import { useAppLocale } from "@/components/locale-provider"
import { getLocalizedText } from "@/lib/i18n/localized-text"
import type { ImageFieldId, SiteEdits, TextFieldId } from "@/lib/site-editing/fields"

/**
 * Owner-editable copy inside client components.
 *
 * Unlike server components (which take their default from the registry),
 * these keep their English in the component, exactly as before, and the
 * registry entry is marked `"source": "code"`. Only the small published-edits
 * file is bundled, not the registry. fields.test.ts checks the registry's
 * default still matches the component's English and the translation table.
 */

const edits = publishedEdits as unknown as SiteEdits

export function useEditableText() {
  const locale = useAppLocale()
  return useCallback(
    (id: TextFieldId, english: string, options?: { listOnly?: boolean }) => {
      const value = edits.text[id]?.[locale] || getLocalizedText(locale, english)
      return <EditableTextClient id={id} locale={locale} value={value} listOnly={options?.listOnly} />
    },
    [locale],
  )
}

/**
 * For copy already localized by its source (next-intl messages, inline
 * {en, fr} pairs): his published edit, else that value. Registry entries for
 * these are source: "data" with a dataPath, checked by fields.test.ts.
 */
export function useEditableValue() {
  const locale = useAppLocale()
  return useCallback(
    (id: string, localized: string, options?: { listOnly?: boolean }) => {
      const value = edits.text[id]?.[locale] || localized
      return <EditableTextClient id={id} locale={locale} value={value} listOnly={options?.listOnly} />
    },
    [locale],
  )
}

type EditablePhotoProps = Omit<ImageProps, "src" | "alt"> & {
  id: ImageFieldId
  /** The photo in the code (the registry's default). */
  src: string
  /** English alt text in the code; French comes from the translation table. */
  alt: string
  /** Must match the registry's `aspect`; uploads are cropped to it. */
  aspect: string
}

export function EditablePhoto({ id, src, alt, aspect, ...imageProps }: EditablePhotoProps) {
  const locale = useAppLocale()
  const edit = edits.images[id]
  return (
    <EditableImageClient
      {...imageProps}
      id={id}
      locale={locale}
      src={edit?.src ?? src}
      alt={edit?.alt?.[locale] || getLocalizedText(locale, alt)}
      aspect={aspect}
    />
  )
}
