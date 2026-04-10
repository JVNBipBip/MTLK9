/** Impact values that, with other signals, route consultations to the specialist (Nick) only. */
export const NICK_ROUTING_IMPACT_VALUES = ["worried-about-safety", "thought-about-rehoming"] as const

/**
 * When true, only consultation slots for the configured specialist (see {@link getNickTeamMemberIdForConsultation} in
 * square-service-config) should be offered.
 */
export function intakeRequiresNickOnlyConsultation(issue: string, impact: string[]): boolean {
  if (issue === "aggression-safety") return true
  const chosen = new Set(impact)
  return NICK_ROUTING_IMPACT_VALUES.some((v) => chosen.has(v))
}
