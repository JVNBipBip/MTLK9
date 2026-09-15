export const HERO_CTA_EXPERIMENT_ID = "homepage-cta-v1"
export const HERO_CTA_COOKIE_NAME = "mtlk9_hero_cta_v1"
export const HERO_CTA_COOKIE_MAX_AGE = 90 * 24 * 60 * 60

export type HeroCtaVariant = "a" | "b"

export function assignHeroCtaVariant(random: number): HeroCtaVariant {
  return random >= 0.5 && random < 1 ? "b" : "a"
}

export function parseHeroCtaCookieHeader(header: string | null | undefined): HeroCtaVariant | null {
  for (const part of (header || "").split(";")) {
    const separator = part.indexOf("=")
    if (part.slice(0, separator).trim() !== HERO_CTA_COOKIE_NAME) continue
    const value = part.slice(separator + 1).trim()
    if (value === "v1:a") return "a"
    if (value === "v1:b") return "b"
  }
  return null
}

export function getOrCreateHeroCtaVariant(): HeroCtaVariant {
  const existing = parseHeroCtaCookieHeader(document.cookie)
  if (existing) return existing
  const variant = assignHeroCtaVariant(Math.random())
  document.cookie = `${HERO_CTA_COOKIE_NAME}=v1:${variant}; Path=/; Max-Age=${HERO_CTA_COOKIE_MAX_AGE}; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`
  return variant
}

export function heroCtaExperimentProperties(variant?: HeroCtaVariant | null) {
  const assignment = variant === undefined
    ? typeof document === "undefined" ? null : parseHeroCtaCookieHeader(document.cookie)
    : variant
  return assignment
    ? { hero_cta_experiment: HERO_CTA_EXPERIMENT_ID, hero_cta_variant: assignment }
    : {}
}

export function heroCtaLabel(variant: HeroCtaVariant | null) {
  return variant === "b" ? "Get a training plan" : "Send an Inquiry"
}
