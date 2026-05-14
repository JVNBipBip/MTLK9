"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { ArrowLeft, Calendar, UserRound, Users } from "lucide-react"
import { BookingContent } from "../booking-content"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { useBookingForm } from "@/components/booking-form-provider"
import { useAppLocale } from "@/components/locale-provider"
import { addLocaleToPathname } from "@/lib/i18n/config"
import { getTrainerPublicNarrative, localizeTrainerBioReadMoreTexts } from "@/lib/team-trainer-public-bios"
import { cn } from "@/lib/utils"
import { TrainerBioReadMoreSection } from "@/components/trainer-bio-read-more"
import { useLocalizedText } from "@/lib/i18n/use-localized-text"

const hubCopy = {
  en: {
    title: (name: string) => `Train with ${name}`,
    subtitle:
      "Book a consultation, private sessions, or group classes. Private and group flows check your profile before you can book sessions or request a class series.",
    back: "Back to home",
    chooseAnother: "Choose another option",
    consultation: "Consultation",
    consultationDesc: "In-person assessment — pick a time or send an inquiry.",
    private: "Private training",
    privateDesc: "Verify your assessment, then choose a package and book one-on-one sessions.",
    group: "Group classes",
    groupDesc: "Look up approved programs and request a cohort — same experience as our group classes page.",
    assessmentNote:
      "Already completed your assessment? Use private or group below — we verify your email before showing booking options.",
    readMoreBio: "Read more",
    readLessBio: "Show less",
  },
  fr: {
    title: (name: string) => `Programmes avec ${name}`,
    subtitle:
      "Réservez une consultation, des séances privées ou des cours en groupe. Les parcours privé et collectif vérifient votre dossier avant la réservation ou la demande de série.",
    back: "Retour à l’accueil",
    chooseAnother: "Choisir une autre option",
    consultation: "Consultation",
    consultationDesc: "Évaluation en personne — créneau ou demande par courriel.",
    private: "Entraînement privé",
    privateDesc:
      "Après vérification de votre évaluation, choisissez un forfait et réservez des séances individuelles.",
    group: "Cours en groupe",
    groupDesc:
      "Consultez les programmes approuvés et demandez une cohorte — même expérience que sur la page cours en groupe.",
    assessmentNote:
      "Évaluation déjà complétée ? Utilisez le privé ou le collectif — nous vérifions votre courriel avant d’afficher les réservations.",
    readMoreBio: "Lire la suite",
    readLessBio: "Voir moins",
  },
} as const

export function TrainerBookingClientPage({
  pinnedTeamMemberId,
  trainerSlug,
  trainerDisplayName,
  trainerHeroImageSrc,
  trainerHeroImageClassName,
}: {
  pinnedTeamMemberId: string
  trainerSlug: string
  trainerDisplayName: string
  trainerHeroImageSrc: string | null
  trainerHeroImageClassName?: string | null
}) {
  const locale = useAppLocale()
  const router = useRouter()
  const { openTrainingPortal, openGroupClassesBooking } = useBookingForm()
  const copy = hubCopy[locale]
  const tDom = useLocalizedText()
  const [showConsultation, setShowConsultation] = useState(false)

  const narrative = useMemo(() => getTrainerPublicNarrative(trainerSlug), [trainerSlug])
  const localizedBioTexts = useMemo(() => {
    if (!narrative) return null
    return localizeTrainerBioReadMoreTexts(narrative, locale === "fr" ? "fr" : "en", tDom)
  }, [narrative, locale, tDom])

  const openPrivateModal = () => {
    openTrainingPortal({
      mode: "private_only",
      trainerTeamMemberId: pinnedTeamMemberId,
      trainerSlug,
      trainerName: trainerDisplayName,
    })
  }

  const openGroupModal = () => {
    openGroupClassesBooking({
      preferredCoachId: pinnedTeamMemberId,
      preferredCoachLabel: trainerDisplayName,
    })
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-8 sm:py-12 space-y-8">
        <Button type="button" variant="ghost" className="gap-2 -ml-2" onClick={() => router.push(addLocaleToPathname("/", locale))}>
          <ArrowLeft className="w-4 h-4" aria-hidden />
          {copy.back}
        </Button>

        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row gap-6 p-6 sm:p-8">
            <div className="relative mx-auto sm:mx-0 h-36 w-36 shrink-0 rounded-2xl bg-muted overflow-hidden">
              {trainerHeroImageSrc ? (
                <Image
                  src={trainerHeroImageSrc}
                  alt={trainerDisplayName}
                  fill
                  className={cn("object-cover", trainerHeroImageClassName || undefined)}
                  sizes="144px"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <UserRound className="w-14 h-14" aria-hidden />
                </div>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left space-y-3">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{copy.title(trainerDisplayName)}</h1>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">{copy.subtitle}</p>
              <p className="text-xs sm:text-sm text-muted-foreground border-t border-border/60 pt-3">{copy.assessmentNote}</p>
              {localizedBioTexts ? (
                <TrainerBioReadMoreSection
                  preset="booking-trainer-page"
                  texts={localizedBioTexts}
                  readMoreLabel={copy.readMoreBio}
                  readLessLabel={copy.readLessBio}
                  className="text-left"
                />
              ) : null}
            </div>
          </div>
        </div>

        {!showConsultation ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setShowConsultation(true)}
              className={cn(
                "rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:bg-muted/40",
                "flex flex-col gap-3 min-h-[140px]",
              )}
            >
              <Calendar className="w-8 h-8 text-primary shrink-0" aria-hidden />
              <div>
                <p className="font-medium">{copy.consultation}</p>
                <p className="text-sm text-muted-foreground mt-1">{copy.consultationDesc}</p>
              </div>
            </button>

            <button
              type="button"
              onClick={openPrivateModal}
              className={cn(
                "rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:bg-muted/40",
                "flex flex-col gap-3 min-h-[140px]",
              )}
            >
              <UserRound className="w-8 h-8 text-primary shrink-0" aria-hidden />
              <div>
                <p className="font-medium">{copy.private}</p>
                <p className="text-sm text-muted-foreground mt-1">{copy.privateDesc}</p>
              </div>
            </button>

            <button
              type="button"
              onClick={openGroupModal}
              className={cn(
                "rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:bg-muted/40",
                "flex flex-col gap-3 min-h-[140px]",
              )}
            >
              <Users className="w-8 h-8 text-primary shrink-0" aria-hidden />
              <div>
                <p className="font-medium">{copy.group}</p>
                <p className="text-sm text-muted-foreground mt-1">{copy.groupDesc}</p>
              </div>
            </button>
          </div>
        ) : null}

        {showConsultation ? (
          <div className="space-y-4">
            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setShowConsultation(false)}>
              ← {copy.chooseAnother}
            </Button>
            <BookingContent
              layout="page"
              pinnedTeamMemberId={pinnedTeamMemberId}
              trainerPageSlug={trainerSlug}
              onClose={() => router.push(addLocaleToPathname("/", locale))}
            />
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  )
}
