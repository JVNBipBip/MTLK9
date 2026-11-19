"use client"

import type { AppLocale } from "@/lib/i18n/config"
import { useEditDrafts } from "@/lib/site-editing/edit-store"

export function EditableTextClient({ id, locale, value }: { id: string; locale: AppLocale; value: string }) {
  const drafts = useEditDrafts()
  const draft = drafts?.text[id]?.[locale]

  return (
    <span data-edit-key={id} data-edit-type="text">
      {draft ?? value}
    </span>
  )
}
