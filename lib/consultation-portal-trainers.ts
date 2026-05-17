import { HIDDEN_PUBLIC_CONSULTATION_TEAM_MEMBER_IDS } from "@/lib/consultation-public-team-members"
import { retrieveSquareTeamMemberProfile } from "@/lib/square"
import { getConsultationBookingTrainerSlugMap } from "@/lib/consultation-booking-trainer-pages"

export type ConsultationPortalTrainerRow = {
  slug: string
  teamMemberId: string
  displayName: string
}

/** Trainers shown on `/booking-access` private hub — matches bookable consultation staff. */
export async function listConsultationPortalTrainerRows(): Promise<ConsultationPortalTrainerRow[]> {
  const slugMap = await getConsultationBookingTrainerSlugMap()
  const trainers = (
    await Promise.all(
      Object.entries(slugMap).map(async ([slug, teamMemberId]) => {
        if (HIDDEN_PUBLIC_CONSULTATION_TEAM_MEMBER_IDS.has(teamMemberId)) return null
        const raw = await retrieveSquareTeamMemberProfile(teamMemberId).catch(() => null)
        const displayName = raw?.displayName?.trim() || slug
        return { slug, teamMemberId, displayName } satisfies ConsultationPortalTrainerRow
      }),
    )
  ).filter((r): r is ConsultationPortalTrainerRow => r !== null)
  return trainers.sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" }),
  )
}

/**
 * When `allowList` is null or empty, no filtering (caller shows all portal rows).
 * Otherwise keep only trainers whose `teamMemberId` is listed.
 */
export function filterTrainerRowsByAllowList(
  rows: ConsultationPortalTrainerRow[],
  allowList: string[] | null,
): ConsultationPortalTrainerRow[] {
  if (!allowList || allowList.length === 0) return rows
  const allowed = new Set(allowList.map((id) => id.trim()).filter(Boolean))
  return rows.filter((r) => allowed.has(r.teamMemberId))
}
