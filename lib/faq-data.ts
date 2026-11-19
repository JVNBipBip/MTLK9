import type { AppLocale } from "@/lib/i18n/config"
import { localizeList, resolveList } from "@/lib/site-editing/fields"

/**
 * The FAQ, shown on the home page, /faq (with its FAQPage structured data)
 * and llms-full.txt.
 *
 * The questions live in content/editable-fields.json (lists.faq) so the owner
 * can edit, add, remove and reorder them from the admin's Website editor; his
 * published version comes from content/site-edits.json. Server-only: client
 * components receive the categories as props rather than bundling the registry.
 */

export interface FaqItem {
  id?: string
  question: string
  answer: string
}

export interface FaqCategory {
  id?: string
  title: string
  items: FaqItem[]
}

export function getFaqData(locale: AppLocale = "en"): FaqCategory[] {
  return localizeList(resolveList("faq"), locale)
}
