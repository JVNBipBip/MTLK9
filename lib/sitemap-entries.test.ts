import { buildSitemapEntries, SITE_LAST_UPDATED, SITEMAP_BASE_URL } from "@/lib/sitemap-entries"
import { blogPosts } from "@/lib/blog"
import { groupClassOfferingIds } from "@/lib/group-class-offerings"
import { transformationStories } from "@/lib/transformation-stories"
import { ABOUT_TEAM_SLUG_ORDER } from "@/lib/team-trainer-public-bios"

const STATIC_ROUTE_COUNT = 19

describe("buildSitemapEntries", () => {
  it("includes group class detail pages, all result stories, and trainer booking pages", () => {
    const urls = buildSitemapEntries(new Date("2026-05-18")).map((e) => e.url)
    expect(urls).toContain(`${SITEMAP_BASE_URL}/en/services/aggression`)
    expect(urls).toContain(`${SITEMAP_BASE_URL}/fr/services/aggression`)
    expect(urls).toContain(`${SITEMAP_BASE_URL}/en/services/separation-anxiety`)
    expect(urls).toContain(`${SITEMAP_BASE_URL}/fr/services/separation-anxiety`)
    expect(urls).toContain(`${SITEMAP_BASE_URL}/en/dog-training-west-island`)
    expect(urls).toContain(`${SITEMAP_BASE_URL}/fr/dog-training-west-island`)
    for (const slug of groupClassOfferingIds()) {
      expect(urls).toContain(`${SITEMAP_BASE_URL}/en/group-classes/${slug}`)
      expect(urls).toContain(`${SITEMAP_BASE_URL}/fr/group-classes/${slug}`)
    }
    for (const story of transformationStories) {
      expect(urls).toContain(`${SITEMAP_BASE_URL}/en/results/${story.slug}`)
    }
    for (const slug of ABOUT_TEAM_SLUG_ORDER) {
      expect(urls).toContain(`${SITEMAP_BASE_URL}/en/booking/${slug}`)
    }
  })

  it("includes every blog post in both locales with its own lastModified", () => {
    const entries = buildSitemapEntries()
    expect(blogPosts.length).toBeGreaterThan(0)
    for (const post of blogPosts) {
      const postEntries = entries.filter((entry) => entry.url.endsWith(post.path))
      expect(postEntries.map((entry) => entry.url).sort()).toEqual([
        `${SITEMAP_BASE_URL}/en${post.path}`,
        `${SITEMAP_BASE_URL}/fr${post.path}`,
      ])
      for (const entry of postEntries) {
        expect(entry.priority).toBe(0.7)
        expect(entry.changeFrequency).toBe("monthly")
        expect(entry.lastModified).toEqual(new Date(post.dateModified))
      }
    }
  })

  it("uses the pinned site date for static routes, not the crawl time", () => {
    const entries = buildSitemapEntries()
    const home = entries.find((entry) => entry.url === `${SITEMAP_BASE_URL}/en`)
    const services = entries.find((entry) => entry.url === `${SITEMAP_BASE_URL}/fr/services`)
    expect(home?.lastModified).toEqual(SITE_LAST_UPDATED)
    expect(services?.lastModified).toEqual(SITE_LAST_UPDATED)
  })

  it("covers every route in both locales", () => {
    const entries = buildSitemapEntries()
    const expectedRouteCount =
      STATIC_ROUTE_COUNT +
      groupClassOfferingIds().length +
      transformationStories.length +
      ABOUT_TEAM_SLUG_ORDER.length +
      blogPosts.length
    expect(entries).toHaveLength(expectedRouteCount * 2)
    expect(new Set(entries.map((entry) => entry.url)).size).toBe(entries.length)
  })
})
