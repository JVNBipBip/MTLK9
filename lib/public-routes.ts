/**
 * Which public paths may be served from the CDN cache.
 *
 * Why this exists: every public page reads `headers()` for the locale, so Next
 * renders them dynamically and defaults to `Cache-Control: private, no-cache,
 * no-store`. That means Googlebot's every fetch hits the origin, and as of
 * 2026-08-10 sixteen sitemap URLs — all twelve blog articles plus three money
 * pages — had never been crawled at all (`lastCrawlTime: null`, 33+ days after
 * publication). Making these responses CDN-cacheable is the fix.
 *
 * The list is deliberately an allowlist, not a denylist: caching a token-gated
 * page would serve one customer's page to another. Anything not matched here
 * keeps Next's private default. `lib/public-routes.test.ts` asserts this stays
 * in sync with the sitemap, so a new public route can't silently go uncached
 * and a new private route can't silently become cacheable.
 *
 * All inputs are locale-stripped paths (`/services/aggression`, not
 * `/en/services/aggression`) — see `stripLocaleFromPathname`.
 */

/** Content pages that are identical for every visitor. */
const CACHEABLE_EXACT = new Set([
  "/",
  "/services",
  "/dog-training-west-island",
  "/group-classes",
  "/results",
  "/about",
  "/faq",
  "/blog",
  "/privacy",
  "/terms",
  "/daycare",
  "/day-training",
  "/regular-daycare",
  "/grooming",
  "/training-offer",
  "/apprenticeships",
])

/** Public detail routes: one path segment under a known content parent. */
const CACHEABLE_PATTERNS: RegExp[] = [
  /^\/services\/[^/]+$/,
  /^\/group-classes\/[^/]+$/,
  /^\/results\/[^/]+$/,
  /^\/blog\/[^/]+$/,
]

/**
 * Never cacheable, whatever else matches — checked before the patterns above.
 *
 * `/booking` and `/booking/{trainer}` are in the sitemap but render live Square
 * availability, so they stay dynamic: stale class times are worse than a slower
 * crawl, and they aren't the pages Google is failing to fetch.
 * `/booking/resume/{token}` and `/booking-access/{token}` are token-gated and
 * must never be shared between visitors. `/group-classes/book` sits under a
 * cacheable parent but is a live booking route, not a content page.
 * `/daycare/apply` and `/daycare/book` sit under the cacheable `/daycare` page
 * but are the application form and the signed-in booking portal.
 */
const NEVER_CACHEABLE: RegExp[] = [
  /^\/daycare\/(apply|book)(\/|$)/,
  /^\/booking(\/|$)/,
  /^\/group-classes\/book(\/|$)/,
  /^\/training-portal(\/|$)/,
  /^\/booking-access(\/|$)/,
  /^\/checkout(\/|$)/,
  /^\/agreements(\/|$)/,
  /^\/program-signup(\/|$)/,
  /^\/impact(\/|$)/,
  /^\/api(\/|$)/,
]

/**
 * True when a locale-stripped path may be served from the shared CDN cache.
 * Callers must have already stripped the locale prefix.
 */
export function isPublicCacheablePath(strippedPathname: string): boolean {
  const path = normalize(strippedPathname)
  if (NEVER_CACHEABLE.some((pattern) => pattern.test(path))) return false
  if (CACHEABLE_EXACT.has(path)) return true
  return CACHEABLE_PATTERNS.some((pattern) => pattern.test(path))
}

function normalize(pathname: string): string {
  if (!pathname || pathname === "/") return "/"
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`
  return withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/, "") || "/" : withLeadingSlash
}

/**
 * Browsers revalidate every time (`max-age=0, must-revalidate`) so a visitor
 * never sees stale copy; the shared CDN serves a cached response for ten
 * minutes and may serve stale for a day while it refreshes behind the request.
 * That is what takes Googlebot off the origin.
 */
export const PUBLIC_CACHE_CONTROL =
  "public, max-age=0, must-revalidate, s-maxage=600, stale-while-revalidate=86400"
