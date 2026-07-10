import { buildWelcomeSignupTags, welcomeSourceTag } from "@/lib/welcome-flow"

describe("welcome flow segmentation", () => {
  it("maps known landing pages to a bounded source tag", () => {
    expect(welcomeSourceTag("/en/services/reactivity?utm_source=google")).toBe("welcome-source-reactivity")
    expect(welcomeSourceTag("/fr/blog/how-to-help")).toBe("welcome-source-blog")
    expect(welcomeSourceTag("/en")).toBe("welcome-source-home")
    expect(welcomeSourceTag("/en/not-a-real-page/injected-tag")).toBe("welcome-source-site")
  })

  it("adds language, intent, variant, and source tags", () => {
    expect(buildWelcomeSignupTags({ locale: "fr", path: "/fr/services/puppy-training", variant: "a" })).toEqual([
      "website-welcome-flow",
      "welcome-cohort-treatment",
      "lang-fr",
      "popup-variant-a",
      "welcome-intent-help",
      "welcome-source-puppy",
    ])
  })
})
