import type { MetadataRoute } from "next"
import { groupClassOfferingIds } from "@/lib/group-class-offerings"
import { locales, type AppLocale } from "@/lib/i18n/config"
import { transformationStories } from "@/lib/transformation-stories"
import { ABOUT_TEAM_SLUG_ORDER } from "@/lib/team-trainer-public-bios"

/** Canonical origin for sitemap URLs (matches robots.ts and page canonicals). */
export const SITEMAP_BASE_URL = "https://www.mtlcaninetraining.com"

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>

type RouteSpec = {
  path: string
  changeFrequency: ChangeFrequency
  priority: number
}

const STATIC_ROUTES: RouteSpec[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/services", changeFrequency: "weekly", priority: 0.9 },
  { path: "/services/reactivity", changeFrequency: "monthly", priority: 0.85 },
  { path: "/services/aggression", changeFrequency: "monthly", priority: 0.85 },
  { path: "/services/separation-anxiety", changeFrequency: "monthly", priority: 0.85 },
  { path: "/services/private-classes", changeFrequency: "monthly", priority: 0.85 },
  { path: "/services/consultation", changeFrequency: "monthly", priority: 0.85 },
  { path: "/services/obedience", changeFrequency: "monthly", priority: 0.85 },
  { path: "/services/puppy-training", changeFrequency: "monthly", priority: 0.85 },
  { path: "/services/in-home", changeFrequency: "monthly", priority: 0.85 },
  { path: "/group-classes", changeFrequency: "weekly", priority: 0.85 },
  { path: "/results", changeFrequency: "weekly", priority: 0.75 },
  { path: "/about", changeFrequency: "monthly", priority: 0.65 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.65 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.55 },
  { path: "/booking", changeFrequency: "monthly", priority: 0.7 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.25 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.25 },
]

function localizedSitemapUrl(locale: AppLocale, path: string): string {
  const normalized = path === "" ? "" : path.startsWith("/") ? path : `/${path}`
  return `${SITEMAP_BASE_URL}/${locale}${normalized}`
}

function expandRoute(spec: RouteSpec, lastModified: Date): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: localizedSitemapUrl(locale, spec.path),
    lastModified,
    changeFrequency: spec.changeFrequency,
    priority: spec.priority,
  }))
}

/** All indexable public routes for sitemap.xml (EN + FR). */
export function buildSitemapEntries(lastModified = new Date()): MetadataRoute.Sitemap {
  const routes: RouteSpec[] = [
    ...STATIC_ROUTES,
    ...groupClassOfferingIds().map((slug) => ({
      path: `/group-classes/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...transformationStories.map((story) => ({
      path: `/results/${story.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
    ...ABOUT_TEAM_SLUG_ORDER.map((slug) => ({
      path: `/booking/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
  ]

  return routes.flatMap((spec) => expandRoute(spec, lastModified))
}
