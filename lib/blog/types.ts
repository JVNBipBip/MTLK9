import type { AppLocale } from "@/lib/i18n/config"

/** Slugs for published articles. Add new slugs here first — the registry,
 * routes, and sitemap all key off this union. */
export type BlogPostSlug =
  | "choose-dog-trainer-montreal"
  | "real-reason-dog-is-reactive"
  | "separation-anxiety-signs-myths-help"
  | "socialize-puppy-without-overwhelming"

type LocalizedText = Record<AppLocale, string>

export type BlogSection =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "subheading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; title: string; text: string }

export type BlogPostContent = {
  /** Visible H1 — may differ slightly from the metadata title. */
  title: string
  /** Card + meta-description source, 1-2 sentences. */
  excerpt: string
  sections: BlogSection[]
  faqTitle: string
  faqs: { question: string; answer: string }[]
  relatedTitle: string
  /** No-locale paths (e.g. "/services/reactivity") — localized at render. */
  related: { path: string; label: string; description: string }[]
  ctaTitle: string
  ctaBody: string
  ctaLabel: string
}

export type BlogAuthorSlug = "nick" | "tyson" | "mia"

export type BlogPost = {
  slug: BlogPostSlug
  /** Canonical no-locale path, always `/blog/<slug>`. */
  path: string
  /** Existing asset under /public used for the card and og:image. */
  image: string
  author: { name: string; slug: BlogAuthorSlug }
  /** ISO dates (YYYY-MM-DD). Drive sitemap lastmod + Article schema. */
  datePublished: string
  dateModified: string
  readingMinutes: number
  metadata: {
    title: LocalizedText
    description: LocalizedText
  }
  content: Record<AppLocale, BlogPostContent>
}
