import { renderToStaticMarkup } from "react-dom/server"
import { TransformationsSection } from "@/components/transformations-section"
import { transformationStories } from "@/lib/transformation-stories"

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: unknown; href: string }) =>
    require("react").createElement("a", { href }, children),
}))
jest.mock("@/components/booking-form-provider", () => ({
  FreeCallLink: ({ children }: { children: unknown }) => children,
}))
jest.mock("@/components/locale-provider", () => ({ useAppLocale: () => "en" }))
jest.mock("@/lib/i18n/use-localized-text", () => ({ useLocalizedText: () => (text: string) => text }))
jest.mock("@/components/scroll-animated-text", () => ({
  ScrollAnimatedText: ({ text, className }: { text: string; className?: string }) =>
    require("react").createElement("h2", { className }, text),
}))
jest.mock("@/components/wistia-click-to-play", () => ({
  WistiaClickToPlay: ({ className, fitStrategy, playbackMode }: { className?: string; fitStrategy?: string; playbackMode?: string }) =>
    require("react").createElement("div", { "data-video-preview": true, "data-fit": fitStrategy, "data-mode": playbackMode, className }),
}))

describe("homepage transformation stories", () => {
  it("shows one compact mobile story at a time without a horizontal overflow strip", () => {
    const html = renderToStaticMarkup(<TransformationsSection />)
    expect(html).not.toContain("overflow-x-auto")
    expect(html).not.toContain("snap-mandatory")
    expect(html.match(/data-story-card/g)).toHaveLength(transformationStories.length)
    expect(html.match(/data-transformation-story-nav/g)).toHaveLength(1)
    expect(html).toContain('aria-label="Previous story"')
    expect(html).toContain('aria-label="Next story"')
  })

  it("uses concise before-and-after timelines with the result emphasized", () => {
    const html = renderToStaticMarkup(<TransformationsSection />)
    expect(html.match(/data-transformation-comparison/g)).toHaveLength(transformationStories.length)
    expect(html.match(/data-transformation-before/g)).toHaveLength(transformationStories.length)
    expect(html.match(/data-transformation-after/g)).toHaveLength(transformationStories.length)
    expect(html).toContain("line-clamp-2")
    expect(html).toContain("line-clamp-3")
    expect(html).toContain('data-fit="contain"')
    expect(html).toContain('data-mode="portrait-modal"')
    expect(html).toContain("aspect-[16/10]")
    expect(html).toContain("I had no control over Sasha.")
    expect(html).toContain("I can finally enjoy being around other dogs.")
    expect(html).not.toContain("She was so reactive")
  })
})
