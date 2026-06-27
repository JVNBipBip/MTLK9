import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { TrainerBookingClientPage } from "./trainer-booking-client"
import { JsonLd, buildBreadcrumbJsonLd, buildFaqJsonLd, buildPersonJsonLd } from "@/components/json-ld"
import {
  getConsultationBookingTrainerHeroImageForSlug,
  resolveConsultationBookingTrainerTeamMemberId,
} from "@/lib/consultation-booking-trainer-pages"
import { trainerPhotoPositionClassForBookingSlug } from "@/lib/team-trainer-photos"
import { retrieveSquareTeamMember } from "@/lib/square"
import { buildLocalizedMetadata, getRequestLocale } from "@/lib/seo"
import { getTrainerSeoProfile, localizeTrainerSeoProfile } from "@/lib/team-trainer-public-bios"

type PageProps = {
  params: Promise<{ trainerSlug: string }>
  searchParams: Promise<{ openConsultation?: string }>
}

export async function generateMetadata(props: Pick<PageProps, "params">): Promise<Metadata> {
  const { trainerSlug } = await props.params
  const teamMemberId = await resolveConsultationBookingTrainerTeamMemberId(trainerSlug)
  const seoProfile = getTrainerSeoProfile(trainerSlug)
  if (!teamMemberId && !seoProfile) {
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
  const displayName = teamMemberId
    ? (await retrieveSquareTeamMember(teamMemberId).catch(() => null))?.trim() || seoProfile?.fullName || trainerSlug
    : seoProfile?.fullName || trainerSlug
  return buildLocalizedMetadata({
    path: `/booking/${trainerSlug}`,
    title: {
      en: seoProfile?.titleEn || `Montreal dog training with ${displayName}`,
      fr: seoProfile?.titleFr || `Entraînement canin à Montréal avec ${displayName}`,
    },
    description: {
      en: seoProfile?.descriptionEn || `Book a consultation, private training, or group classes with ${displayName}.`,
      fr: seoProfile?.descriptionFr || `Réservez une consultation, du privé ou des cours en groupe avec ${displayName}.`,
    },
  })
}

export default async function TrainerBookingPage(props: PageProps) {
  const [{ trainerSlug }, searchParams] = await Promise.all([props.params, props.searchParams])
  const locale = await getRequestLocale()
  const initialOpenConsultation =
    searchParams.openConsultation === "1" || searchParams.openConsultation?.toLowerCase() === "true"
  const teamMemberId = await resolveConsultationBookingTrainerTeamMemberId(trainerSlug)
  const seoProfile = getTrainerSeoProfile(trainerSlug)
  if (!teamMemberId && !seoProfile) notFound()
  const [heroImageSrc, squareName] = await Promise.all([
    getConsultationBookingTrainerHeroImageForSlug(trainerSlug),
    teamMemberId ? retrieveSquareTeamMember(teamMemberId).catch(() => null) : Promise.resolve(null),
  ])
  const trainerDisplayName = (squareName || "").trim() || seoProfile?.fullName || trainerSlug
  const trainerHeroImageClassName = trainerPhotoPositionClassForBookingSlug(trainerSlug)
  const localizedSeo = seoProfile ? localizeTrainerSeoProfile(seoProfile, locale) : null

  return (
    <>
      {localizedSeo ? (
        <>
          <JsonLd
            data={buildPersonJsonLd({
              name: localizedSeo.fullName,
              jobTitle: localizedSeo.jobTitle,
              description: localizedSeo.description,
              path: `/booking/${trainerSlug}`,
              locale,
              image: heroImageSrc,
              knowsAbout: localizedSeo.specialties,
            })}
          />
          <JsonLd
            data={buildBreadcrumbJsonLd(
              [
                { name: locale === "fr" ? "Accueil" : "Home", path: "/" },
                { name: locale === "fr" ? "Réservation" : "Booking", path: "/booking" },
                { name: localizedSeo.fullName, path: `/booking/${trainerSlug}` },
              ],
              locale,
            )}
          />
          <JsonLd data={buildFaqJsonLd(localizedSeo.faqs)} />
        </>
      ) : null}
      <TrainerBookingClientPage
        pinnedTeamMemberId={teamMemberId}
        trainerSlug={trainerSlug}
        trainerDisplayName={trainerDisplayName}
        trainerHeroImageSrc={heroImageSrc}
        trainerHeroImageClassName={trainerHeroImageClassName}
        initialOpenConsultation={initialOpenConsultation}
      />
    </>
  )
}
