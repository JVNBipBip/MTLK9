/** Impact values that, with other signals, route consultations to the specialist (Nick) only. */
export const NICK_ROUTING_IMPACT_VALUES = ["worried-about-safety"] as const

export type IntakeForConsultationRouting = {
  issue: string
  impact?: string[]
  followUps?: Record<string, string>
}

export const CONSULTATION_TRAINERS_BY_NAME = {
  mia: "Mia",
  tyson: "Tyson",
  nick: "Nick",
} as const

function answeredYes(followUps: Record<string, string> | undefined, key: string): boolean {
  return followUps?.[key] === "yes"
}

export function getVisibleTrainerNamesForIntake(intake: IntakeForConsultationRouting): string[] {
  const followUps = intake.followUps || {}

  if (intake.issue === "aggression-safety") {
    return [CONSULTATION_TRAINERS_BY_NAME.nick]
  }

  if (intake.issue === "pulls-lunges-reacts" && answeredYes(followUps, "bitten-or-nipped-human")) {
    return [CONSULTATION_TRAINERS_BY_NAME.nick, CONSULTATION_TRAINERS_BY_NAME.tyson]
  }

  if (intake.issue === "sport-training") {
    if (followUps["sport-interest"] === "agility") return [CONSULTATION_TRAINERS_BY_NAME.tyson]
    if (followUps["sport-interest"] === "bite-sport") return [CONSULTATION_TRAINERS_BY_NAME.nick]
    if (followUps["sport-interest"] === "active-obedience") return [CONSULTATION_TRAINERS_BY_NAME.nick]
    return [CONSULTATION_TRAINERS_BY_NAME.nick, CONSULTATION_TRAINERS_BY_NAME.tyson]
  }

  if (intake.issue === "puppy-out-of-control") {
    return [CONSULTATION_TRAINERS_BY_NAME.mia, CONSULTATION_TRAINERS_BY_NAME.tyson]
  }

  if (intake.issue === "pulls-lunges-reacts" || intake.issue === "anxiety-fear-separation") {
    return [
      CONSULTATION_TRAINERS_BY_NAME.mia,
      CONSULTATION_TRAINERS_BY_NAME.tyson,
      CONSULTATION_TRAINERS_BY_NAME.nick,
    ]
  }

  if (intake.issue === "better-obedience") {
    return [
      CONSULTATION_TRAINERS_BY_NAME.tyson,
      CONSULTATION_TRAINERS_BY_NAME.nick,
      CONSULTATION_TRAINERS_BY_NAME.mia,
    ]
  }

  return []
}

/**
 * When true, only consultation slots for the configured specialist (see {@link getNickTeamMemberIdForConsultation} in
 * square-service-config) should be offered.
 */
export function intakeRequiresNickOnlyConsultation(
  issue: string,
  impact: string[] = [],
  followUps: Record<string, string> = {},
): boolean {
  if (issue === "aggression-safety") return true
  if (issue === "sport-training" && ["bite-sport", "active-obedience"].includes(followUps["sport-interest"])) return true
  const chosen = new Set(impact)
  return NICK_ROUTING_IMPACT_VALUES.some((v) => chosen.has(v))
}
