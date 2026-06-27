"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, UserRound, Users } from "lucide-react"
import { BookingContent } from "../booking-content"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { SITE_FIXED_HEADER_MAIN_PT_CLASS } from "@/lib/site-header-layout"
import { Button } from "@/components/ui/button"
import { useBookingForm } from "@/components/booking-form-provider"
import { useAppLocale } from "@/components/locale-provider"
import { addLocaleToPathname } from "@/lib/i18n/config"
import {
  getTrainerPublicNarrative,
  getTrainerSeoProfile,
  localizeTrainerBioReadMoreTexts,
  localizeTrainerSeoProfile,
} from "@/lib/team-trainer-public-bios"
import { cn } from "@/lib/utils"
import { TrainerBioReadMoreSection } from "@/components/trainer-bio-read-more"
import { useLocalizedText } from "@/lib/i18n/use-localized-text"

const hubCopy = {
  en: {
    title: (name: string) => `Dog Training with ${name} in Montreal`,
    subtitle:
      "Book a consultation, private sessions, or group classes. Private and group flows check your profile before you can book sessions or request a class series.",
    back: "Back to home",
    chooseAnother: "Choose another option",
    consultation: "Consultation",
    consultationDesc: "In-person assessment — share your details and we'll follow up by email.",
    private: "Private training",
    privateDesc: "Verify your assessment, then choose a package and book one-on-one sessions.",
    group: "Group classes",
    groupDesc: "Look up approved programs and request a class — same experience as our group classes page.",
    assessmentNote:
      "Already completed your assessment? Use private or group below — we verify your email before showing booking options.",
    readMoreBio: "Read more",
    readLessBio: "Show less",
    trainerFocus: (name: string) => `${name}'s training focus`,
    bestFor: "Best fit",
    specialties: "Specialties",
    relatedPrograms: "Related programs",
    trainerFaq: "Trainer FAQ",
  },
  fr: {
    title: (name: string) => `Entraînement canin avec ${name} à Montréal`,
    subtitle:
      "Réservez une consultation, des séances privées ou des cours en groupe. Les parcours privé et collectif vérifient votre dossier avant la réservation ou la demande de série.",
    back: "Retour à l’accueil",
    chooseAnother: "Choisir une autre option",
    consultation: "Consultation",
    consultationDesc: "Évaluation en personne — partagez vos informations et nous vous répondrons par courriel.",
    private: "Entraînement privé",
    privateDesc:
      "Après vérification de votre évaluation, choisissez un forfait et réservez des séances individuelles.",
    group: "Cours en groupe",
    groupDesc:
      "Consultez les programmes approuvés et demandez une classe — même expérience que sur la page cours en groupe.",
    assessmentNote:
      "Évaluation déjà complétée ? Utilisez le privé ou le collectif — nous vérifions votre courriel avant d’afficher les réservations.",
    readMoreBio: "Lire la suite",
    readLessBio: "Voir moins",
    trainerFocus: (name: string) => `Spécialités de ${name}`,
    bestFor: "Idéal pour",
    specialties: "Spécialités",
    relatedPrograms: "Programmes liés",
    trainerFaq: "FAQ entraîneur",
  },
} as const

export function TrainerBookingClientPage({
  pinnedTeamMemberId,
  trainerSlug,
  trainerDisplayName,
  trainerHeroImageSrc,
  trainerHeroImageClassName,
  initialOpenConsultation = false,
}: {
  pinnedTeamMemberId: string | null
  trainerSlug: string
  trainerDisplayName: string
  trainerHeroImageSrc: string | null
  trainerHeroImageClassName?: string | null
  /** When true (e.g. `?openConsultation=1` from booking-access), skip hub and open assessment booking. */
  initialOpenConsultation?: boolean
}) {
  const locale = useAppLocale()
  const router = useRouter()
  const { openTrainingPortal, openGroupClassesBooking } = useBookingForm()
  const copy = hubCopy[locale]
  const tDom = useLocalizedText()
  const [showConsultation, setShowConsultation] = useState(Boolean(initialOpenConsultation))

  const narrative = useMemo(() => getTrainerPublicNarrative(trainerSlug), [trainerSlug])
  const seoProfile = useMemo(() => getTrainerSeoProfile(trainerSlug), [trainerSlug])
  const localizedSeoProfile = useMemo(() => {
    if (!seoProfile) return null
    return localizeTrainerSeoProfile(seoProfile, locale === "fr" ? "fr" : "en")
  }, [seoProfile, locale])
  const localizedBioTexts = useMemo(() => {
    if (!narrative) return null
    return localizeTrainerBioReadMoreTexts(narrative, locale === "fr" ? "fr" : "en", tDom)
  }, [narrative, locale, tDom])

  const openPrivateModal = () => {
    openTrainingPortal({
      mode: "private_only",
      ...(pinnedTeamMemberId ? { trainerTeamMemberId: pinnedTeamMemberId } : {}),
      trainerSlug,
      trainerName: trainerDisplayName,
    })
  }

  const openGroupModal = () => {
    openGroupClassesBooking({
      ...(pinnedTeamMemberId ? { preferredCoachId: pinnedTeamMemberId } : {}),
      preferredCoachLabel: trainerDisplayName,
    })
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Header />
      <main
        className={cn(
          "flex flex-1 flex-col min-h-0 mx-auto w-full max-w-3xl px-4 pb-8 sm:pb-12 space-y-8",
          SITE_FIXED_HEADER_MAIN_PT_CLASS,
        )}
      >
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

        {localizedSeoProfile ? (
          <section className="space-y-5">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-secondary">
                  {localizedSeoProfile.jobTitle}
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {copy.trainerFocus(localizedSeoProfile.shortName)}
                </h2>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {localizedSeoProfile.intro}
                </p>
              </div>

              <div className="mt-7 grid gap-5 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{copy.specialties}</h3>
                  <ul className="mt-3 space-y-2">
                    {localizedSeoProfile.specialties.map((item) => (
                      <li key={item} className="flex gap-2 text-sm text-foreground/85">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground">{copy.bestFor}</h3>
                  <ul className="mt-3 space-y-2">
                    {localizedSeoProfile.bestFor.map((item) => (
                      <li key={item} className="flex gap-2 text-sm text-foreground/85">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-7">
                <h3 className="text-sm font-semibold text-foreground">{copy.relatedPrograms}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {localizedSeoProfile.serviceLinks.map((link) => (
                    <Link
                      key={link.path}
                      href={addLocaleToPathname(link.path, locale)}
                      className="inline-flex items-center gap-1 rounded-full border border-primary/25 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                    >
                      {link.label}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">{copy.trainerFaq}</h2>
              <div className="mt-4 divide-y divide-border">
                {localizedSeoProfile.faqs.map((faq) => (
                  <details key={faq.question} className="group py-4 first:pt-0 last:pb-0">
                    <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
                      {faq.question}
                    </summary>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        ) : null}

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
          <div className="flex flex-1 flex-col min-h-0 space-y-4">
            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setShowConsultation(false)}>
              ← {copy.chooseAnother}
            </Button>
            <BookingContent
              layout="page"
              inquiryOnly
              pinnedTeamMemberId={pinnedTeamMemberId}
              trainerPageSlug={trainerSlug}
              trainerPageDisplayName={trainerDisplayName}
              onClose={() => router.push(addLocaleToPathname("/", locale))}
            />
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  )
}
