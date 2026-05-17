/** Square given names allowed in customer-facing consultation slot lists and trainer filter. */
const PUBLIC_CONSULTATION_BOOKABLE_GIVEN_NAMES = new Set([
  "mia",
  "tyson",
  "nick",
  /** Nick is often listed under full given name in Square. */
  "nicholas",
])

/**
 * When true for a Square team member id, that staff may appear in `/api/consultation-slots` and the scheduling trainer filter,
 * matched by given name from Square (`retrieveSquareTeamMember` uses given + family) or configured Nick specialist id.
 */
export function isAllowedPublicConsultationTrainer(
  teamMemberId: string,
  squareDisplayName: string | null | undefined,
  nickTeamMemberId: string | null,
): boolean {
  if (nickTeamMemberId && teamMemberId === nickTeamMemberId) return true
  const given = (squareDisplayName || "").trim().split(/\s+/)[0]?.toLowerCase() ?? ""
  return PUBLIC_CONSULTATION_BOOKABLE_GIVEN_NAMES.has(given)
}

/** Team members excluded from customer-facing consultation UX (slot picker + `/booking/[slug]`). */
export const HIDDEN_PUBLIC_CONSULTATION_TEAM_MEMBER_IDS = new Set<string>([
  "TM32wtl__BW48AwU", // Sam Di Q
])
