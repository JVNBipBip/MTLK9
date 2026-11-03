import type { MetadataRoute } from "next"
import { blogPosts } from "@/lib/blog"
import { groupClassOfferingIds } from "@/lib/group-class-offerings"
import { locales, type AppLocale } from "@/lib/i18n/config"
import { transformationStories } from "@/lib/transformation-stories"
import { ABOUT_TEAM_SLUG_ORDER } from "@/lib/team-trainer-public-bios"
import { facilityServices, type FacilityServiceId } from "@/lib/facility-services"

/** Canonical origin for sitemap URLs (matches robots.ts and page canonicals). */
export const SITEMAP_BASE_URL = "https://www.mtlcaninetraining.com"

/** Pinned lastmod for static routes — bump when site-wide content changes.
 * A blanket `new Date()` would claim every page changed on every crawl. */
export const SITE_LAST_UPDATED = new Date("2026-07-02")

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>

type RouteSpec = {
  path: string
  changeFrequency: ChangeFrequency
  priority: number
  /** Per-route override; static routes fall back to the shared site date. */
  lastModified?: Date
}

/** Last significant content change per facility page (git history of the page, its template and its data). */
const FACILITY_LAST_MODIFIED: Record<FacilityServiceId, string> = {
  daycare: "2026-11-03",
  "day-training": "2026-10-27",
  "regular-daycare": "2026-10-27",
  grooming: "2026-10-27",
  "training-offer": "2026-10-27",
  apprenticeships: "2026-10-27",
}

const STATIC_ROUTES: RouteSpec[] = [
  { path: "", changeFrequency: "weekly", priority: 1, lastModified: new Date("2026-10-27") },
  { path: "/services", changeFrequency: "weekly", priority: 0.9 },
  ...(Object.keys(facilityServices) as FacilityServiceId[]).map((id) => ({ path: facilityServices[id].path, changeFrequency: "monthly" as const, priority: 0.8, lastModified: new Date(FACILITY_LAST_MODIFIED[id]) })),
  { path: "/services/reactivity", changeFrequency: "monthly", priority: 0.85 },
  { path: "/services/aggression", changeFrequency: "monthly", priority: 0.85 },
  { path: "/services/separation-anxiety", changeFrequency: "monthly", priority: 0.85 },
  { path: "/services/private-classes", changeFrequency: "monthly", priority: 0.85 },
  { path: "/services/consultation", changeFrequency: "monthly", priority: 0.85 },
  { path: "/services/obedience", changeFrequency: "monthly", priority: 0.85 },
  { path: "/services/puppy-training", changeFrequency: "monthly", priority: 0.85 },
  { path: "/services/in-home", changeFrequency: "monthly", priority: 0.85 },
  { path: "/dog-training-west-island", changeFrequency: "monthly", priority: 0.8, lastModified: new Date("2026-07-09") },
  { path: "/group-classes", changeFrequency: "weekly", priority: 0.85 },
  { path: "/results", changeFrequency: "weekly", priority: 0.75, lastModified: new Date("2026-09-15") },
  { path: "/about", changeFrequency: "monthly", priority: 0.65 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.65, lastModified: new Date("2026-10-05") },
  { path: "/blog", changeFrequency: "weekly", priority: 0.55, lastModified: new Date("2026-07-08") },
  { path: "/booking", changeFrequency: "monthly", priority: 0.7, lastModified: new Date("2026-10-05") },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.25 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.25 },
]

function localizedSitemapUrl(locale: AppLocale, path: string): string {
  const normalized = path === "" ? "" : path.startsWith("/") ? path : `/${path}`
  return `${SITEMAP_BASE_URL}/${locale}${normalized}`
}

function expandRoute(spec: RouteSpec, fallbackLastModified: Date): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: localizedSitemapUrl(locale, spec.path),
    lastModified: spec.lastModified ?? fallbackLastModified,
    changeFrequency: spec.changeFrequency,
    priority: spec.priority,
  }))
}

/** All indexable public routes for sitemap.xml (EN + FR). */
export function buildSitemapEntries(lastModified = SITE_LAST_UPDATED): MetadataRoute.Sitemap {
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
    ...blogPosts.map((post) => ({
      path: post.path,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      lastModified: new Date(post.dateModified),
    })),
  ]

  return routes.flatMap((spec) => expandRoute(spec, lastModified))
}
