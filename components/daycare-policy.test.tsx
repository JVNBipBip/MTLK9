import { renderToStaticMarkup } from "react-dom/server"
import { DaycareCalculator } from "@/components/daycare-calculator"
import { DaycarePolicy } from "@/components/daycare-policy"
import { DaycareHouseholdOffer } from "@/components/daycare-household-offer"
import { DaycarePage } from "@/components/daycare-page"
import { FacilityServicePage } from "@/components/facility-service-page"
import { daycareBundleWindow } from "@/lib/daycare-policy"
import { daycareMoney } from "@/lib/daycare-pricing"
import { getRequestLocale } from "@/lib/seo"

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => require("react").createElement("img", { src, alt }),
}))
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: unknown; href: string }) => require("react").createElement("a", { href }, children),
}))
jest.mock("@/components/header", () => ({ Header: () => null }))
jest.mock("@/components/footer", () => ({ Footer: () => null }))
jest.mock("@/components/service-inquiry-button", () => ({
  ServiceInquiryButton: ({ children }: { children: unknown }) => children,
}))
jest.mock("@/lib/seo", () => ({
  getRequestLocale: jest.fn().mockResolvedValue("en"),
  localizedPath: (locale: string, path: string) => `/${locale}${path}`,
  buildLocalizedMetadata: jest.fn(),
}))

describe("Nick's October 27–28 daycare terms", () => {
  it.each(["en", "fr"] as const)("uses revised pricing and keeps the household offer at the end in %s", async locale => {
    jest.mocked(getRequestLocale).mockResolvedValue(locale)
    const description = locale === "fr" ? "Bénéfique pour les chiens très énergiques qui ont besoin de beaucoup de stimulation physique." : "Beneficial for high energy dogs that need lots of physical stimulation."
    for (const focus of ["daycare", "day-training", "regular-daycare"] as const) {
      const html = renderToStaticMarkup(await DaycarePage({ focus }))
      expect(html).toContain(`+${daycareMoney(4000, locale)}`)
      expect(html).toContain(daycareMoney(11500, locale))
      expect(html).toContain(daycareMoney(13000, locale))
      expect(html).toContain(description)
      expect(html.indexOf('id="daycare-household-offer"')).toBeGreaterThan(html.indexOf('</video>'))
      expect(html.indexOf('id="daycare-household-offer"')).toBeGreaterThan(html.indexOf('id="daycare-pricing"'))
    }
    expect(renderToStaticMarkup(<DaycareCalculator locale={locale} />)).toContain(description)
  })
  it("shows the cutoff, late-change consequences and penalty-free rescheduling in English", () => {
    const html = renderToStaticMarkup(<DaycarePolicy locale="en" />)
    expect(html).toContain("Book at least 24 hours before your scheduled visit.")
    expect(html).toContain("less than 24 hours before your scheduled visit are non-refundable")
    expect(html).toContain("forfeited, deducted from your bundle and cannot be made up")
    expect(html).toContain("With at least 24 hours’ notice, you may reschedule your visit without penalty.")
    expect(html).not.toMatch(/full refund|refunded|refund within/i)
  })

  it("preserves those terms in French", () => {
    const html = renderToStaticMarkup(<DaycarePolicy locale="fr" />)
    expect(html).toContain("Réservez au moins 24 heures avant votre visite.")
    expect(html).toContain("moins de 24 heures avant votre visite ne sont pas remboursables")
    expect(html).toContain("déduite de votre forfait et ne peut pas être reprise")
    expect(html).toContain("Avec un préavis d’au moins 24 heures, vous pouvez reporter votre visite sans pénalité.")
  })

  it.each(["en", "fr"] as const)("shows approved durations and bundle windows in the %s calculator", locale => {
    const html = renderToStaticMarkup(<DaycareCalculator locale={locale} />)
    expect(html).toContain(locale === "fr" ? "Jusqu’à 6 heures inclusivement" : "Up to 6 hours (inclusive)")
    expect(html).toContain(locale === "fr" ? "Plus de 6, jusqu’à 11 heures" : "More than 6, up to 11 hours")
    expect(html).not.toContain(locale === "fr" ? "6 à 11 heures" : "6–11 hours")
    for (const weeks of [4, 7, 12]) {
      expect(html).toContain(locale === "fr" ? `À utiliser en ${weeks} semaines à partir de la première visite` : `Complete within ${weeks} weeks from the first visit`)
    }
    expect(html).toContain('href="#daycare-policy"')
    expect(daycareBundleWindow(1, locale)).toBeNull()
    expect(html).toContain(locale === "fr" ? "Votre estimation pour un chien" : "Your estimate for one dog")
    expect(html).toMatch(/30\s?%/)
    expect(html).toContain(locale === "fr" ? "après le rabais du forfait" : "after bundle savings")
  })

  it.each(["en", "fr"] as const)("shows the daily dog limit and first-visit expiry anchor in %s", locale => {
    const html = renderToStaticMarkup(<DaycarePolicy locale={locale} />)
    expect(html).toContain(locale === "fr" ? "maximum de 15 chiens par jour" : "maximum of 15 dogs per day")
    expect(html).toContain(locale === "fr" ? "ne réserve pas une place" : "does not reserve a place")
    expect(html).toContain(locale === "fr" ? "première visite, et non à la date d’achat" : "first visit, not the purchase date")
    for (const weeks of [4, 7, 12]) {
      expect(html).toContain(locale === "fr" ? `${weeks} semaines à partir de la première visite` : `${weeks} weeks from the first visit`)
    }
  })

  it.each(["daycare", "day-training", "regular-daycare"] as const)("includes the policy section on %s", async focus => {
    jest.mocked(getRequestLocale).mockResolvedValue("en")
    const html = renderToStaticMarkup(await DaycarePage({ focus }))
    expect(html).toContain('id="daycare-policy"')
    expect(html).toContain("Complete within 4 weeks")
    expect(html).toContain("Complete within 7 weeks")
    expect(html).toContain("Complete within 12 weeks")
    expect(html).toContain("30% off your second dog")
    expect(html).toContain("daycare, training and add-ons")
    expect(html).toContain('/en/daycare/book')
  })

  it.each(["en", "fr"] as const)("publishes confirmed second-dog coverage without guessing household totals in %s", locale => {
    const html = renderToStaticMarkup(<DaycareHouseholdOffer locale={locale} />)
    expect(html).toContain(locale === "fr" ? "30 % de rabais pour le deuxième" : "30% off your second dog")
    expect(html).toContain(locale === "fr" ? "deux chiens du même foyer" : "two dogs in the same household")
    expect(html).toContain(locale === "fr" ? "garderie, à l’entraînement et aux options" : "daycare, training and add-ons")
    expect(html).toContain(locale === "fr" ? "après le rabais du forfait" : "after bundle savings")
    expect(html).toContain('href="tel:+15148269558"')
    expect(html).toContain(locale === "fr" ? "son propre solde" : "its own visit balance")
    expect(html).not.toMatch(/share a bundle|partagez un forfait/i)
  })

  it.each(["en", "fr"] as const)("publishes apprenticeship tuition without promising the optional placement in %s", async locale => {
    jest.mocked(getRequestLocale).mockResolvedValue(locale)
    const html = renderToStaticMarkup(await FacilityServicePage({ id: "apprenticeships" }))
    expect(html).toContain(locale === "fr" ? "3 000 $ CA + taxes" : "$3,000 CAD + tax")
    expect(html).toContain(locale === "fr" ? "n’est pas incluse dans le programme standard" : "not included in the standard program")
    expect(html).toContain(locale === "fr" ? "ne garantit pas un emploi" : "does not guarantee employment")
  })
})
