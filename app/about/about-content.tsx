"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { TrustStrip } from "@/components/trust-strip"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { FreeCallLink } from "@/components/booking-form-provider"
import { useAppLocale } from "@/components/locale-provider"
import { useLocalizedText } from "@/lib/i18n/use-localized-text"
import { TrainerBioReadMoreSection } from "@/components/trainer-bio-read-more"
import {
  TEAM_TRAINER_PHOTO_POSITIONS_BY_BOOKING_SLUG,
  TEAM_TRAINER_PHOTOS_BY_BOOKING_SLUG,
  type CanonicalTrainerBookingSlug,
} from "@/lib/team-trainer-photos"
import {
  TEAM_TRAINER_PUBLIC_NARRATIVE_BY_SLUG,
  localizeTrainerBioReadMoreTexts,
} from "@/lib/team-trainer-public-bios"

type AboutTeamTrainerCard = {
  bookingSlug: CanonicalTrainerBookingSlug
  name: string
  title: string
  titleFr?: string
  years: string
  yearsFr?: string
  specialty: string
  photoDesc: string
  photo: string | null
  photoPosition?: string
}

const TEAM_ABOUT_META: Record<CanonicalTrainerBookingSlug, Omit<AboutTeamTrainerCard, "bookingSlug">> = {
  nick: {
    name: "Nick Azzuolo",
    title: "Owner, Founder & Head Trainer",
    years: "15+ years",
    specialty:
      "High-drive dogs, serious rehabilitation, advanced obedience, reactivity",
    photoDesc: "Nick working with a dog on a calm loose-leash walk in a Montreal park",
    photo: TEAM_TRAINER_PHOTOS_BY_BOOKING_SLUG.nick,
    photoPosition: TEAM_TRAINER_PHOTO_POSITIONS_BY_BOOKING_SLUG.nick,
  },
  tyson: {
    name: "Tyson Jerome White",
    title: "Trainer",
    years: "10+ years",
    specialty:
      "Puppy training & development, behaviour modification, reactivity, obedience",
    photoDesc: "Tyson coaching an owner through a reactive moment on a busy Montreal street",
    photo: TEAM_TRAINER_PHOTOS_BY_BOOKING_SLUG.tyson,
  },
  mia: {
    name: "Mia M",
    title: "Trainer",
    titleFr: "Entraîneuse",
    years: "Trainer",
    yearsFr: "Entraîneuse",
    specialty: "Puppy training, reactivity training, pet obedience",
    photoDesc:
      "Portrait of Mia M smiling in a Montreal Canine Training hoodie outdoors",
    photo: TEAM_TRAINER_PHOTOS_BY_BOOKING_SLUG.mia,
    photoPosition: TEAM_TRAINER_PHOTO_POSITIONS_BY_BOOKING_SLUG.mia,
  },
}

const trainers: AboutTeamTrainerCard[] = (["nick", "tyson", "mia"] as const).map((bookingSlug) => ({
  bookingSlug,
  ...TEAM_ABOUT_META[bookingSlug],
}))

export function AboutContent() {
  const locale = useAppLocale()
  const t = useLocalizedText()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const teamScrollerRef = useRef<HTMLDivElement>(null)
  const [activeTeamIndex, setActiveTeamIndex] = useState(0)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-up")
          }
        })
      },
      { threshold: 0.1 },
    )

    const elements = wrapperRef.current?.querySelectorAll(".reveal")
    elements?.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const scroller = teamScrollerRef.current
    if (!scroller) return

    const updateActiveIndex = () => {
      const cards = Array.from(scroller.querySelectorAll("[data-team-card]"))
      if (!cards.length) return
      const scrollLeft = scroller.scrollLeft

      let closestIndex = 0
      let closestDistance = Number.POSITIVE_INFINITY

      cards.forEach((card, index) => {
        const distance = Math.abs(card.getBoundingClientRect().left - scroller.getBoundingClientRect().left)
        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      })

      setActiveTeamIndex(closestIndex)
    }

    updateActiveIndex()
    scroller.addEventListener("scroll", updateActiveIndex, { passive: true })
    return () => scroller.removeEventListener("scroll", updateActiveIndex)
  }, [])

  const goToTeamSlide = (index: number) => {
    const scroller = teamScrollerRef.current
    if (!scroller) return
    const cards = Array.from(scroller.querySelectorAll("[data-team-card]"))
    const target = cards[index] as HTMLElement | undefined
    if (!target) return
    scroller.scrollTo({ left: target.offsetLeft, behavior: "smooth" })
  }

  return (
    <div ref={wrapperRef}>
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="reveal opacity-0 font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance mb-6">
            {t("Training That Protects the Bond")}
          </h1>
          <p className="reveal opacity-0 animation-delay-200 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("Who we are, what we believe, and why we train the way we do.")}
          </p>
        </div>
      </section>

      {/* Section 1: Team Bios */}
      <section className="reveal opacity-0 animation-delay-200 py-16 lg:py-24 px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 lg:mb-20">
            <h2 className="font-display text-2xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
              {t("Meet the Team")}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t("Three specialists. One mission: help you and your dog thrive together.")}
            </p>
          </div>

          <div className="mb-4 md:hidden">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground/80">
              {t("Swipe to meet each trainer")}
            </p>
          </div>

          <div
            ref={teamScrollerRef}
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2 -mx-6 px-6 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:gap-8 lg:gap-10 md:overflow-visible"
          >
            {trainers.map((trainer) => {
              const title = locale === "fr" && trainer.titleFr ? trainer.titleFr : t(trainer.title)
              const years = locale === "fr" && trainer.yearsFr ? trainer.yearsFr : t(trainer.years)
              const photoDesc = t(trainer.photoDesc)
              const narrative = TEAM_TRAINER_PUBLIC_NARRATIVE_BY_SLUG[trainer.bookingSlug]
              const bioTexts = localizeTrainerBioReadMoreTexts(
                narrative,
                locale === "fr" ? "fr" : "en",
                t,
              )

              return (
                <div
                  key={trainer.bookingSlug}
                  data-team-card
                  className="snap-center shrink-0 w-[92%] sm:w-[88%] md:w-auto md:shrink"
                >
                  <div className="bg-card rounded-3xl border border-border/50 overflow-hidden shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 h-full flex flex-col">
                    <div className="relative aspect-[4/3] bg-muted" aria-label={photoDesc}>
                      {trainer.photo ? (
                        <Image
                          src={trainer.photo}
                          alt={photoDesc}
                          fill
                          className={`object-cover ${trainer.photoPosition ?? ""}`}
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-secondary/10">
                          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-border bg-card text-3xl font-semibold text-primary shadow-sm">
                            MM
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-6 lg:p-8 flex flex-col flex-grow">
                      <div className="flex items-baseline gap-2 mb-2">
                        <h3 className="font-display text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                          {trainer.name}
                        </h3>
                        <span className="text-sm text-primary font-medium">{years}</span>
                      </div>
                      <p className="text-sm font-medium text-secondary mb-1">{title}</p>
                      <TrainerBioReadMoreSection
                        preset="about"
                        texts={bioTexts}
                        readMoreLabel={t("Read more")}
                        readLessLabel={t("Show less")}
                        className="mt-2 flex-grow"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2.5 md:hidden">
            {trainers.map((trainer, index) => (
              <button
                key={trainer.name}
                type="button"
                onClick={() => goToTeamSlide(index)}
                className={`h-2.5 rounded-full transition-all ${
                  index === activeTeamIndex
                    ? "w-7 bg-primary"
                    : "w-2.5 bg-border hover:bg-muted-foreground/40"
                }`}
                aria-label={`Go to trainer ${index + 1}`}
              />
            ))}
            <span className="ml-2 text-xs font-medium tracking-wide text-muted-foreground">
              {activeTeamIndex + 1} / {trainers.length}
            </span>
          </div>
        </div>
      </section>

      {/* Section 2: Our Philosophy */}
      <section className="py-16 lg:py-24 px-6 lg:px-8 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="reveal opacity-0 font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-10">
            {t("Our Philosophy")}
          </h2>
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p className="reveal opacity-0 animation-delay-200">
              {t("At Montreal Canine Training, we help build strong, healthy relationships between dogs and their owners. With a proven track record, we consistently deliver real, professional, and effective training solutions.")}
            </p>
            <p className="reveal opacity-0 animation-delay-200">
              {t("Every dog is assessed individually to create a personalized training plan. From basic/advanced obedience to severe behavioral issues, our experienced team delivers real results. We believe training is about the human, not the dog. Your dog is already doing what makes sense to them. We help you understand why and give you the tools to guide them without breaking trust. We train in the real world, not just at our facility — progressing into everyday environments like parks, cafés, hardware stores and markets.")}
            </p>
            <p className="reveal opacity-0 animation-delay-200">
              {t("We don't just hand you techniques. We give you a plan, ongoing support between sessions, and stay in your corner until you see results — because training isn't a one-off, it's a partnership.")}
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Methods Statement */}
      <section className="py-16 lg:py-24 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="reveal opacity-0 font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-6">
            {t("Our Methods")}
          </h2>
          <p className="reveal opacity-0 animation-delay-200 text-sm uppercase tracking-[0.2em] text-secondary font-medium mb-8">
            {t("Positive reinforcement training, motivation and reward based training")}
          </p>
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p className="reveal opacity-0 animation-delay-200">
              <strong className="text-foreground">{t("Our approach:")}</strong>{" "}
              {t("We build and shape behaviours using positive reinforcement, clear communication, and motivation, creating confident, engaged dogs. We don't use fear or pain. We adapt our approach to their needs, perception and understanding. Our expertise in a variety of proven training methods allows us to support a wider range of dogs, resulting in high success rates, from early puppy development to severe behavioral problems.")}
            </p>
            <p className="reveal opacity-0 animation-delay-200">
              <strong className="text-foreground">{t("What to expect in a session:")}</strong>{" "}
              {t("We meet you and your dog where you are — literally and figuratively. Sessions happen in real environments: your neighborhood, a park, your home. We observe, we teach, we practice. You leave with homework, and we support you between sessions with check-ins and guidance.")}
            </p>
            <p className="reveal opacity-0 animation-delay-200">
              <strong className="text-foreground">{t("Your dog's emotional wellbeing:")}</strong>{" "}
              {t("We believe a dog who feels safe learns faster and bonds deeper. We never push a dog past their threshold. We work at their pace, and we prioritize their emotional state in every decision we make.")}
            </p>
            <p className="reveal opacity-0 animation-delay-200 text-sm text-muted-foreground/90">
              {t("Dog training is unregulated in Canada. Anyone can call themselves a trainer. We hold ourselves to a higher standard: our methods are transparent, our credentials are verifiable, and we're committed to continuing education in animal behavior science.")}
            </p>
          </div>
        </div>
      </section>

      <TrustStrip />

      {/* CTA Section */}
      <section className="py-24 lg:py-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-border/50 shadow-lg bg-gradient-to-br from-primary via-primary/90 to-secondary">
            <div className="relative px-8 lg:px-16 py-16 lg:py-24 text-center">
              <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-primary-foreground/70 font-medium mb-4">
                {t("Ready to Meet Us?")}
              </p>
              <h2 className="reveal opacity-0 animation-delay-200 font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-primary-foreground text-balance mb-6 max-w-3xl mx-auto">
                {t("Contact us for a free discovery call and start your dog's plan")}
              </h2>
              <p className="reveal opacity-0 animation-delay-400 text-lg text-primary-foreground/80 max-w-xl mx-auto leading-relaxed mb-10">
                {t("Tell us about your dog. We'll listen, answer your questions, and figure out the right path together.")}
              </p>
              <div className="reveal opacity-0 animation-delay-600">
                <FreeCallLink>
                  <Button
                    size="lg"
                    className="bg-background text-foreground hover:bg-background/90 rounded-full px-8 py-6 text-base group"
                  >
                    {t("Contact Us for a Free Call")}
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </FreeCallLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
