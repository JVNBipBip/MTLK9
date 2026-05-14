import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { TrainerBookingClientPage } from "./trainer-booking-client"
import {
  getConsultationBookingTrainerHeroImageForSlug,
  resolveConsultationBookingTrainerTeamMemberId,
} from "@/lib/consultation-booking-trainer-pages"
import { trainerPhotoPositionClassForBookingSlug } from "@/lib/team-trainer-photos"
import { retrieveSquareTeamMember } from "@/lib/square"
import { buildLocalizedMetadata } from "@/lib/seo"

type PageProps = { params: Promise<{ trainerSlug: string }> }

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { trainerSlug } = await props.params
  const teamMemberId = await resolveConsultationBookingTrainerTeamMemberId(trainerSlug)
  if (!teamMemberId) {
    return buildLocalizedMetadata({
      path: `/booking/${trainerSlug}`,
      title: {
        en: "Book a Dog Training Assessment",
        fr: "Réserver une évaluation d'entraînement canin",
      },
      description: {
        en: "Schedule your in-person dog training assessment.",
        fr: "Planifiez votre évaluation d'entraînement canin en personne.",
      },
    })
  }
  const displayName = (await retrieveSquareTeamMember(teamMemberId).catch(() => null))?.trim() || trainerSlug
  return buildLocalizedMetadata({
    path: `/booking/${trainerSlug}`,
    title: {
      en: `Montreal dog training with ${displayName}`,
      fr: `Entraînement canin à Montréal avec ${displayName}`,
    },
    description: {
      en: `Book a consultation, private training, or group classes with ${displayName}.`,
      fr: `Réservez une consultation, du privé ou des cours en groupe avec ${displayName}.`,
    },
  })
}

export default async function TrainerBookingPage(props: PageProps) {
  const { trainerSlug } = await props.params
  const teamMemberId = await resolveConsultationBookingTrainerTeamMemberId(trainerSlug)
  if (!teamMemberId) notFound()
  const [heroImageSrc, squareName] = await Promise.all([
    getConsultationBookingTrainerHeroImageForSlug(trainerSlug),
    retrieveSquareTeamMember(teamMemberId).catch(() => null),
  ])
  const trainerDisplayName = (squareName || "").trim() || trainerSlug
  const trainerHeroImageClassName = trainerPhotoPositionClassForBookingSlug(trainerSlug)
  return (
    <TrainerBookingClientPage
      pinnedTeamMemberId={teamMemberId}
      trainerSlug={trainerSlug}
      trainerDisplayName={trainerDisplayName}
      trainerHeroImageSrc={heroImageSrc}
      trainerHeroImageClassName={trainerHeroImageClassName}
    />
  )
}
