"use client"

import type { AppLocale } from "@/lib/i18n/config"
import { useEditDrafts } from "@/lib/site-editing/edit-store"

/**
 * listOnly: for link labels (menus, footer links). Clicking them in the editor
 * still follows the link, so the menus keep working; he edits them from the
 * editor's side list instead.
 */
export function EditableTextClient({ id, locale, value, listOnly }: { id: string; locale: AppLocale; value: string; listOnly?: boolean }) {
  const drafts = useEditDrafts()
  const draft = drafts?.text[id]?.[locale]

  return (
    <span data-edit-key={id} data-edit-type="text" data-edit-list-only={listOnly ? "true" : undefined}>
      {draft ?? value}
    </span>
  )
}
