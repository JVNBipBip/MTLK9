import { buildSitemapEntries } from "@/lib/sitemap-entries"
import { stripLocaleFromPathname } from "@/lib/i18n/config"
import { PUBLIC_CACHE_CONTROL, isPublicCacheablePath } from "@/lib/public-routes"

/** Locale-stripped paths of every URL we submit to Google. */
function sitemapPaths(): string[] {
  const paths = buildSitemapEntries().map((entry) =>
    stripLocaleFromPathname(new URL(entry.url).pathname)
  )
  return Array.from(new Set(paths))
}

/**
 * Booking renders live Square availability, so it stays dynamic on purpose.
 * Listed explicitly so that "in the sitemap but not cached" is a deliberate
 * choice someone has to edit, not an oversight.
 */
const INTENTIONALLY_UNCACHED = [/^\/booking(\/|$)/]

describe("isPublicCacheablePath", () => {
  it("caches every sitemap URL except the intentional exclusions", () => {
    const missed = sitemapPaths().filter(
      (path) =>
        !isPublicCacheablePath(path) &&
        !INTENTIONALLY_UNCACHED.some((pattern) => pattern.test(path))
    )
    expect(missed).toEqual([])
  })

  it("keeps the intentional exclusions uncached", () => {
    const leaked = sitemapPaths().filter(
      (path) =>
        INTENTIONALLY_UNCACHED.some((pattern) => pattern.test(path)) &&
        isPublicCacheablePath(path)
    )
    expect(leaked).toEqual([])
  })

  it("never caches a live booking route nested under a cacheable parent", () => {
    // Regression: `/group-classes/book` matches the `/group-classes/{slug}`
    // content pattern but is a booking route, not a content page.
    expect(isPublicCacheablePath("/group-classes/book")).toBe(false)
    expect(isPublicCacheablePath("/group-classes/teen-puppy-class")).toBe(true)
  })

  it("never caches private, token-gated or checkout routes", () => {
    const private_ = [
      "/booking/resume/abc123",
      "/booking-access/tok_live_123",
      "/training-portal",
      "/training-portal/private",
      "/training-portal/book",
      "/checkout/success",
      "/checkout/cancel",
      "/agreements/service-agreement",
      "/program-signup",
      "/daycare/apply",
      "/daycare/book",
      "/impact",
      "/api/schedule-slots",
    ]
    for (const path of private_) {
      expect([path, isPublicCacheablePath(path)]).toEqual([path, false])
    }
  })

  it("does not cache unknown or deeper paths it has never seen", () => {
    for (const path of ["/not-a-real-page", "/services/aggression/extra", "/blog/a/b"]) {
      expect([path, isPublicCacheablePath(path)]).toEqual([path, false])
    }
  })

  it("treats a trailing slash the same as the bare path", () => {
    expect(isPublicCacheablePath("/services/")).toBe(true)
    expect(isPublicCacheablePath("/")).toBe(true)
    expect(isPublicCacheablePath("/booking/")).toBe(false)
  })

  it("lets browsers revalidate while the shared cache serves and refreshes", () => {
    expect(PUBLIC_CACHE_CONTROL).toContain("public")
    expect(PUBLIC_CACHE_CONTROL).toContain("max-age=0")
    expect(PUBLIC_CACHE_CONTROL).toContain("must-revalidate")
    expect(PUBLIC_CACHE_CONTROL).toMatch(/s-maxage=\d+/)
    expect(PUBLIC_CACHE_CONTROL).toMatch(/stale-while-revalidate=\d+/)
    expect(PUBLIC_CACHE_CONTROL).not.toContain("no-store")
    expect(PUBLIC_CACHE_CONTROL).not.toContain("private")
  })
})
