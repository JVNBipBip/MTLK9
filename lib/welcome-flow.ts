import type { AppLocale } from "@/lib/i18n/config"
import { stripLocaleFromPathname } from "@/lib/i18n/config"
import type { WelcomePopupVariant } from "@/lib/welcome-popup-content"

const SERVICE_SOURCE_TAGS: Record<string, string> = {
  aggression: "welcome-source-aggression",
  consultation: "welcome-source-consultation",
  "in-home": "welcome-source-in-home",
  obedience: "welcome-source-obedience",
  "private-classes": "welcome-source-private",
  "puppy-training": "welcome-source-puppy",
  reactivity: "welcome-source-reactivity",
  "separation-anxiety": "welcome-source-separation-anxiety",
}

export function welcomeSourceTag(path: string) {
  const normalized = stripLocaleFromPathname(path.split("?")[0] || "/")
  const serviceSlug = normalized.match(/^\/services\/([^/]+)/)?.[1]

  if (serviceSlug && SERVICE_SOURCE_TAGS[serviceSlug]) return SERVICE_SOURCE_TAGS[serviceSlug]
  if (normalized === "/services") return "welcome-source-services"
  if (normalized.startsWith("/blog")) return "welcome-source-blog"
  if (normalized.startsWith("/results")) return "welcome-source-results"
  if (normalized.startsWith("/group-classes")) return "welcome-source-group-classes"
  if (normalized.startsWith("/dog-training-west-island")) return "welcome-source-west-island"
  if (normalized === "/") return "welcome-source-home"
  return "welcome-source-site"
}

export function buildWelcomeSignupTags({
  locale,
  path,
  variant,
}: {
  locale: AppLocale
  path: string
  variant: WelcomePopupVariant
}) {
  return [
    "website-welcome-flow",
    `lang-${locale}`,
    `popup-variant-${variant}`,
    variant === "a" ? "welcome-intent-help" : "welcome-intent-tips",
    welcomeSourceTag(path),
  ]
}
