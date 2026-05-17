import { NextResponse } from "next/server"
import { getConsultationBookingTrainerSlugMap } from "@/lib/consultation-booking-trainer-pages"
import { retrieveSquareTeamMember } from "@/lib/square"

export const runtime = "nodejs"

/**
 * Square bookable staff available on `/booking/[slug]` —
 * used by the secure booking-access hub to route private & consultation bookings.
 */
export async function GET() {
  try {
    const slugMap = await getConsultationBookingTrainerSlugMap()
    const trainers = (
      await Promise.all(
        Object.entries(slugMap).map(async ([slug, teamMemberId]) => {
          const raw = await retrieveSquareTeamMember(teamMemberId).catch(() => null)
          const displayName = (raw || "").trim() || slug
          return { slug, teamMemberId, displayName }
        }),
      )
    ).sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" }))

    return NextResponse.json({ trainers })
  } catch (error) {
    console.error("[consultation-booking-trainers]", error)
    return NextResponse.json({ error: "Could not load trainers.", trainers: [] as [] }, { status: 500 })
  }
}
