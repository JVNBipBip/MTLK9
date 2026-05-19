"use client"

import { useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { CardCoverImage } from "@/components/card-cover-image"
import { ArrowRight } from "lucide-react"
import { BookingLink, TrainingPortalLink } from "@/components/booking-form-provider"
import { useLocalizedText } from "@/lib/i18n/use-localized-text"
import { useAppLocale } from "@/components/locale-provider"
import { addLocaleToPathname } from "@/lib/i18n/config"
type TrainingPathCard = {
  title: string
  lead: string
  body: string
  image: string
  imageAvif?: string
  variant: "consultation" | "private" | "group"
}

const trainingPaths: TrainingPathCard[] = [
  {
    title: "Consultation",
    lead: "Start with an evaluation",
    body: "Start your dog's training journey with a 75-minute evaluation session designed to establish the right program for both you and your dog.",
    image: "/images/Classes images/obedience.webp",
    variant: "consultation",
  },
  {
    title: "Private training",
    lead: "One-on-one sessions",
    body: "Our most popular option! Private classes offer personalized, hands-on training tailored to your specific goals. Only offered after a consultation.",
    image: "/images/Classes images/private.webp",
    variant: "private",
  },
  {
    title: "Group Classes",
    lead: "Small group programs",
    body: "A variety of structured group classes available for all dogs, ranging from basic foundations to advanced obedience training.",
    image: "/images/Classes images/obedience_group_class_1.webp",
    imageAvif: "/images/Classes images/obedience_group_class_1.avif",
    variant: "group",
  },
]

function PathCardCta({
  path,
  groupClassesHref,
  consultationLearnMoreHref,
  privateLearnMoreHref,
  t,
}: {
  path: TrainingPathCard
  groupClassesHref: string
  consultationLearnMoreHref: string
  privateLearnMoreHref: string
  t: ReturnType<typeof useLocalizedText>
}) {
  const learnMoreClasses =
    "inline-flex items-center justify-center gap-1 w-full text-sm font-medium text-primary hover:text-primary/80 transition-colors"

  if (path.variant === "consultation") {
    return (
      <div className="flex flex-col gap-3">
        <BookingLink>
          <Button variant="outline" className="w-full rounded-full border-primary/35 bg-transparent hover:bg-primary/5 group/btn">
            {t("Send an Inquiry")}
            <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </BookingLink>
        <Link href={consultationLearnMoreHref} className={learnMoreClasses}>
          {t("Learn More")}
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
        </Link>
      </div>
    )
  }
  if (path.variant === "private") {
    return (
      <div className="flex flex-col gap-3">
        <TrainingPortalLink>
          <Button variant="outline" className="w-full rounded-full border-primary/35 bg-transparent hover:bg-primary/5 group/btn">
            {t("Book Private Training")}
            <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </TrainingPortalLink>
        <Link href={privateLearnMoreHref} className={learnMoreClasses}>
          {t("Learn More")}
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
        </Link>
      </div>
    )
  }
  return (
    <Button variant="outline" className="w-full rounded-full border-primary/35 bg-transparent hover:bg-primary/5 group/btn" asChild>
      <Link href={groupClassesHref}>
        {t("Explore group classes")}
        <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
      </Link>
    </Button>
  )
}

export default function ServicesPage() {
  const t = useLocalizedText()
  const locale = useAppLocale()
  const contentRef = useRef<HTMLDivElement>(null)

  const groupClassesHref = useMemo(() => addLocaleToPathname("/group-classes", locale), [locale])

  const consultationLearnMoreHref = useMemo(() => addLocaleToPathname("/services/consultation", locale), [locale])

  const privateLearnMoreHref = useMemo(
    () => addLocaleToPathname("/services/private-classes", locale),
    [locale],
  )

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

    const elements = contentRef.current?.querySelectorAll(".reveal")
    elements?.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div ref={contentRef}>
        <section className="pt-32 pb-12 lg:pt-36 lg:pb-20 px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10 lg:mb-14">
              <h1 className="reveal opacity-0 font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance mb-4">
                {t("Choose Your Training Path")}
              </h1>
              <p className="reveal opacity-0 animation-delay-200 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {t("Every dog is different. Every path starts with understanding yours.")}
              </p>
            </div>

            <div className="relative rounded-[32px] border border-border/40 bg-muted/25 p-2 sm:p-3 lg:p-4">
              <div
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"
                aria-hidden={true}
              />
              <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
                {trainingPaths.map((path, index) => (
                  <article
                    key={path.variant}
                    className={`reveal opacity-0 group/card flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-md shadow-black/[0.04] ring-1 ring-black/[0.03] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/10 ${
                      index === 1 ? "animation-delay-200" : index === 2 ? "animation-delay-400" : ""
                    }`}
                  >
                    <div className="relative aspect-[5/4] shrink-0 overflow-hidden">
                      <CardCoverImage
                        src={path.image}
                        srcAvif={path.imageAvif}
                        alt={t(path.title)}
                        fill
                        className="object-cover transition-transform duration-500 group-hover/card:scale-[1.03]"
                        sizes="(max-width: 1024px) 100vw, 33vw"
                      />
                      <div
                        className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent"
                        aria-hidden
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-5">
                        <p className="font-display text-lg font-semibold tracking-tight text-white drop-shadow-sm md:text-xl">
                          {t(path.title)}
                        </p>
                        <p className="mt-1 text-xs font-medium uppercase tracking-[0.15em] text-white/85">
                          {t(path.lead)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-4 p-5 lg:p-6">
                      <p className="text-sm leading-relaxed text-muted-foreground">{t(path.body)}</p>
                      <div className="mt-auto pt-1">
                        <PathCardCta
                          path={path}
                          groupClassesHref={groupClassesHref}
                          consultationLearnMoreHref={consultationLearnMoreHref}
                          privateLearnMoreHref={privateLearnMoreHref}
                          t={t}
                        />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 lg:py-32 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden border border-border/50 shadow-lg bg-gradient-to-br from-primary/10 via-muted/30 to-secondary/10">
              <div className="relative px-8 lg:px-16 py-16 lg:py-24 text-center">
                <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-secondary font-medium mb-4">
                  {t("Need Guidance?")}
                </p>
                <h2 className="reveal opacity-0 animation-delay-200 font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground text-balance mb-6 max-w-3xl mx-auto">
                  {t("Not Sure Where to Start?")}
                </h2>
                <p className="reveal opacity-0 animation-delay-400 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10">
                  {t(
                    "Book a consultation and we'll walk through your dog's behaviour, your goals, and whether private lessons or a group series is the best fit.",
                  )}
                </p>
                <div className="reveal opacity-0 animation-delay-600">
                  <BookingLink>
                    <Button
                      size="lg"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 text-base group"
                    >
                      {t("Send an Inquiry")}
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </BookingLink>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  )
}
