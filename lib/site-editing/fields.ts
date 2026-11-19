import registry from "@/content/editable-fields.json"
import publishedEdits from "@/content/site-edits.json"
import type { AppLocale } from "@/lib/i18n/config"

/**
 * Owner-editable website content.
 *
 * `content/editable-fields.json` is the registry: every piece of text or photo
 * the owner may change, with a stable ID, a label written for him, the pages it
 * appears on, and its default (current) value in both languages. We write it,
 * in code review. Anything not registered is not editable — prices, booking
 * copy and legal text are kept out deliberately.
 *
 * `content/site-edits.json` holds his published changes, keyed by those IDs.
 * Only the admin's publish step writes it (a commit to GitHub, then Vercel
 * redeploys), so edits are compiled into the build and visitors never wait on
 * a database. See WEBSITE_VISUAL_EDITING_PLAN.md.
 */

export type LocalizedString = Record<AppLocale, string>

type FieldBase = {
  /**
   * "code": the default English lives in a client component (via
   * useEditableText / EditablePhoto) and this entry mirrors it. Omitted: the
   * registry is the source of the default (server components).
   */
  source?: "code"
  /** No-locale paths the field renders on, e.g. "/daycare". */
  pages: string[]
  /** Group heading in the admin editor, e.g. "Top of page". */
  section: string
  /** What the owner sees: named by where it is, not by schema. */
  label: string
}

export type EditableTextField = FieldBase & {
  default: LocalizedString
  maxLength: number
}

export type EditableImageField = FieldBase & {
  default: { src: string; alt: LocalizedString }
  /** Width/height ratio uploads are cropped to, e.g. "4/5". */
  aspect: string
}

export type TextFieldId = keyof typeof registry.text
export type ImageFieldId = keyof typeof registry.images

export type TextEdit = LocalizedString & { frSource?: "auto" | "edited" }

export type ImageEdit = {
  src: string
  width?: number
  height?: number
  alt: LocalizedString
}

export type SiteEdits = {
  text: Partial<Record<string, TextEdit>>
  images: Partial<Record<string, ImageEdit>>
}

export const textFields = registry.text as Record<TextFieldId, EditableTextField>
export const imageFields = registry.images as Record<ImageFieldId, EditableImageField>
export const siteEdits = publishedEdits as unknown as SiteEdits

export type ResolvedImage = { src: string; alt: string; width?: number; height?: number }

/** His published text for this locale, else the registered default. */
export function resolveText(id: TextFieldId, locale: AppLocale, edits: SiteEdits = siteEdits): string {
  return edits.text[id]?.[locale] || textFields[id].default[locale]
}

/** His published photo (and alt text), else the registered default. */
export function resolveImage(id: ImageFieldId, locale: AppLocale, edits: SiteEdits = siteEdits): ResolvedImage {
  const field = imageFields[id]
  const edit = edits.images[id]
  if (!edit) return { src: field.default.src, alt: field.default.alt[locale] }
  return {
    src: edit.src,
    alt: edit.alt[locale] || field.default.alt[locale],
    width: edit.width,
    height: edit.height,
  }
}
