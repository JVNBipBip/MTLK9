import { EditableTextClient } from "@/components/editable-text-client"
import type { AppLocale } from "@/lib/i18n/config"
import { resolveText, type TextFieldId } from "@/lib/site-editing/fields"

/**
 * Owner-editable text, registered in `content/editable-fields.json`.
 *
 * Resolved here (on the server, when used from a server component) so the
 * registry isn't shipped to the browser; the small client child only swaps in
 * a draft while the owner is editing.
 */
export function EditableText({ id, locale }: { id: TextFieldId; locale: AppLocale }) {
  return <EditableTextClient id={id} locale={locale} value={resolveText(id, locale)} />
}
