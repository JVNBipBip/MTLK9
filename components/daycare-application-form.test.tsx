import { renderToStaticMarkup } from "react-dom/server"
import { DaycareApplicationForm } from "./daycare-application-form"
import { TrainingMoments } from "./training-moments"
import { WELCOME_POPUP_BLOCKED_PATH_PREFIXES } from "@/lib/welcome-popup-content"
jest.mock("@/components/locale-provider", () => ({ useAppLocale: () => "en" }))
it("does not interrupt the intake with a welcome signup popup", () => {
  expect(WELCOME_POPUP_BLOCKED_PATH_PREFIXES).toContain("/daycare/apply")
})
it.each(["en", "fr"] as const)("renders only the first step and blocks session capture in %s", locale => {
  const html = renderToStaticMarkup(<DaycareApplicationForm locale={locale} />)
  expect(html).toContain("ph-no-capture")
  expect(html).toContain('id="daycare-ownerEmail"')
  expect(html).not.toContain('id="daycare-dogName"')
  expect(html).toContain(locale === "fr" ? "Étape" : "Step")
  expect(html).not.toContain("autofocus")
})
it("keeps supplied portrait videos inline, user-controlled, and unloaded until requested", () => {
  const html = renderToStaticMarkup(<TrainingMoments />)
  expect(html.match(/<video /g)).toHaveLength(2)
  expect(html.match(/preload="none"/g)).toHaveLength(2)
  expect(html.match(/controls=""/g)).toHaveLength(2)
  expect(html).toContain("aspect-[9/16]")
  expect(html).not.toMatch(/\s(?:autoplay|muted)=|<(?:iframe|dialog)\b/i)
})
