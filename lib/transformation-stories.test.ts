import { getLocalizedText } from "@/lib/i18n/localized-text"
import { localizeTransformationStory, transformationStories } from "@/lib/transformation-stories"

describe("transformation story content", () => {
  it("provides local poster assets and complete French copy for every published story", () => {
    for (const story of transformationStories) {
      expect(story.posterSrc).toMatch(/^\/images\/results\/.+\.jpg$/)

      const localized = localizeTransformationStory(story, "fr")
      expect(localized.before).toBe(story.fr.before)
      expect(localized.after).toBe(story.fr.after)
      expect(localized.testimonial).toBe(story.fr.testimonial)
      expect(localized.before).not.toBe(story.before)
    }
  })

  it("exposes legal-page translations for server rendering", () => {
    expect(getLocalizedText("fr", "Privacy Policy")).toBe("Politique de confidentialité")
    expect(getLocalizedText("fr", "1. Agreement to Terms")).toBe("1. Acceptation des conditions")
  })
})
