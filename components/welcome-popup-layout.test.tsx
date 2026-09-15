import { renderToStaticMarkup } from "react-dom/server"
import { WelcomePopup } from "@/components/welcome-popup"
import { HeroSection } from "@/components/hero-section"
import { useAppLocale } from "@/components/locale-provider"

jest.mock("next/navigation", () => ({ usePathname: () => "/en" }))
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) =>
    require("react").createElement("img", { src, alt, className }),
}))
jest.mock("posthog-js", () => ({ __esModule: true, default: { capture: jest.fn(), register: jest.fn() } }))
jest.mock("@/components/locale-provider", () => ({ useAppLocale: jest.fn(() => "en") }))
jest.mock("@/components/booking-form-provider", () => ({
  useBookingForm: () => ({ openBookingForm: jest.fn() }),
  FreeCallLink: ({ children }: { children: unknown }) => children,
}))
jest.mock("@/components/animated-text", () => ({
  AnimatedText: ({ text }: { text: string }) => require("react").createElement("span", null, text),
}))
jest.mock("@/components/ui/dialog", () => {
  const React = require("react")
  return {
    Dialog: ({ children }: { children: unknown }) => children,
    DialogContent: ({ children, className, "data-testid": testId }: Record<string, unknown>) =>
      React.createElement("div", { className, "data-testid": testId }, children),
    DialogTitle: ({ children, className }: Record<string, unknown>) => React.createElement("h2", { className }, children),
    DialogDescription: ({ children, className }: Record<string, unknown>) => React.createElement("p", { className }, children),
    DialogClose: ({ children, className, "aria-label": label }: Record<string, unknown>) =>
      React.createElement("button", { className, "aria-label": label }, children),
  }
})

describe("welcome popup mobile layout", () => {
  const previousFlag = process.env.NEXT_PUBLIC_WELCOME_POPUP
  beforeEach(() => {
    process.env.NEXT_PUBLIC_WELCOME_POPUP = "1"
    jest.mocked(useAppLocale).mockReturnValue("en")
  })
  afterAll(() => {
    if (previousFlag === undefined) delete process.env.NEXT_PUBLIC_WELCOME_POPUP
    else process.env.NEXT_PUBLIC_WELCOME_POPUP = previousFlag
  })

  it("uses ordinary auto-height flow, not stretched grid tracks, with bounded scrolling", () => {
    const html = renderToStaticMarkup(<WelcomePopup />)
    const root = html.match(/<div[^>]*data-testid="welcome-popup"[^>]*>/)?.[0]
    expect(root).toContain("block h-auto")
    expect(root).toContain("max-h-[calc(100dvh-2rem)]")
    expect(root).not.toContain("h-fit")
    expect(root).not.toContain("grid")
    expect(html).toContain("overflow-y-auto overscroll-contain")
    expect(html).toContain('data-testid="welcome-popup-body"')
    expect(html).toContain("px-5 pb-5 pt-5")
  })

  it("has a high-contrast 44px close target and does not automatically summon a mobile keyboard", () => {
    const html = renderToStaticMarkup(<WelcomePopup />)
    const close = html.match(/<button[^>]*aria-label="Close popup"[^>]*>/)?.[0]
    expect(close).toContain("h-11 w-11")
    expect(close).toContain("bg-white text-black")
    expect(close).not.toContain("opacity-70")
    expect(html).not.toMatch(/autofocus/i)
  })

  it("localizes the close label", () => {
    jest.mocked(useAppLocale).mockReturnValue("fr")
    expect(renderToStaticMarkup(<WelcomePopup />)).toContain('aria-label="Fermer la fenêtre"')
  })
})

describe("homepage hero readability", () => {
  it("preserves the life-back benefit without the you-your phrasing or dark green text", () => {
    jest.mocked(useAppLocale).mockReturnValue("en")
    const html = renderToStaticMarkup(<HeroSection />)
    const heading = html.match(/<h1[\s\S]*?<\/h1>/)?.[0]
    expect(heading).toContain("Montreal dog training.")
    expect(heading).toContain("Get your life back.")
    expect(heading).not.toContain("gives you your")
    expect(heading).not.toContain("text-accent")
    expect(html).toContain("from-black/85 via-black/65")
  })

  it("translates the new benefit into French", () => {
    jest.mocked(useAppLocale).mockReturnValue("fr")
    expect(renderToStaticMarkup(<HeroSection />)).toContain("Retrouvez votre liberté.")
  })
})
