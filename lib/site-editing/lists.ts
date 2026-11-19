import type { AppLocale } from "@/lib/i18n/config"

/**
 * List content the owner can add to, remove from and reorder (today, the FAQ).
 * Kept free of the registry so client components can use it without bundling
 * content/editable-fields.json.
 */

export type LocalizedString = Record<AppLocale, string>

/** A list he can add to, remove from and reorder: today, the FAQ. */
export type ListItem = { id: string; question: LocalizedString; answer: LocalizedString }
export type ListCategory = { id: string; title: LocalizedString; items: ListItem[] }
export type ListValue = { categories: ListCategory[] }


/** One language's view of a list, in the shape the FAQ components render. */
export function localizeList(list: ListValue, locale: AppLocale) {
  return list.categories.map((category) => ({
    id: category.id,
    title: category.title[locale] || category.title.en,
    items: category.items.map((item) => ({
      id: item.id,
      question: item.question[locale] || item.question.en,
      answer: item.answer[locale] || item.answer.en,
    })),
  }))
}
