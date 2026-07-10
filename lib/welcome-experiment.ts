import type { WelcomePopupVariant } from "@/lib/welcome-popup-content"

export const WELCOME_EXPERIMENT_COOKIE_NAME = "mtlk9_welcome_experiment"
export const WELCOME_EXPERIMENT_HOLDOUT_RATE = 0.2
export const WELCOME_EXPERIMENT_MAX_AGE_SECONDS = 90 * 24 * 60 * 60

export type WelcomeExperimentCohort = "holdout" | "treatment"

export type WelcomeExperimentAssignment = {
  cohort: WelcomeExperimentCohort
  variant: WelcomePopupVariant | null
}

export function assignWelcomeExperiment(
  cohortRandom: number,
  variantRandom: number,
): WelcomeExperimentAssignment {
  if (cohortRandom < WELCOME_EXPERIMENT_HOLDOUT_RATE) {
    return { cohort: "holdout", variant: null }
  }

  return {
    cohort: "treatment",
    variant: variantRandom < 0.5 ? "a" : "b",
  }
}

export function serializeWelcomeExperiment(assignment: WelcomeExperimentAssignment) {
  return assignment.cohort === "holdout" ? "holdout" : `treatment:${assignment.variant || "a"}`
}

export function parseWelcomeExperimentValue(value: string | null | undefined): WelcomeExperimentAssignment | null {
  if (value === "holdout") return { cohort: "holdout", variant: null }
  if (value === "treatment:a") return { cohort: "treatment", variant: "a" }
  if (value === "treatment:b") return { cohort: "treatment", variant: "b" }
  return null
}

export function parseWelcomeExperimentCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) return null

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=")
    if (separator === -1) continue
    const name = part.slice(0, separator).trim()
    if (name !== WELCOME_EXPERIMENT_COOKIE_NAME) continue

    try {
      return parseWelcomeExperimentValue(decodeURIComponent(part.slice(separator + 1).trim()))
    } catch {
      return null
    }
  }

  return null
}
