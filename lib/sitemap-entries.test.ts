import { buildSitemapEntries, SITEMAP_BASE_URL } from "@/lib/sitemap-entries"
import { groupClassOfferingIds } from "@/lib/group-class-offerings"
import { transformationStories } from "@/lib/transformation-stories"
import { ABOUT_TEAM_SLUG_ORDER } from "@/lib/team-trainer-public-bios"

describe("buildSitemapEntries", () => {
  it("includes group class detail pages, all result stories, and trainer booking pages", () => {
    const urls = buildSitemapEntries(new Date("2026-05-18")).map((e) => e.url)
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
})
