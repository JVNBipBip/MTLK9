"use client"

import { useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TrustStrip } from "@/components/trust-strip"
import { ServiceForYouSection } from "@/components/service-for-you-section"
import { ServiceOverviewSection } from "@/components/service-overview-section"
import { Button } from "@/components/ui/button"
import { BookingLink } from "@/components/booking-form-provider"
import { useLocalizedText } from "@/lib/i18n/use-localized-text"
import { useAppLocale } from "@/components/locale-provider"
import { addLocaleToPathname } from "@/lib/i18n/config"
import type { GroupClassOffering } from "@/lib/group-class-offerings"

const heroSecondaryButtonClassName =
  "rounded-full bg-white text-foreground hover:bg-transparent hover:text-white border border-white px-6 py-5 text-sm md:text-base transition-colors"

const ctaSecondaryButtonClassName =
  "rounded-full bg-white text-foreground hover:bg-muted border border-foreground px-8 py-6 text-base transition-colors"

export function GroupClassDetailContent({ offering }: { offering: GroupClassOffering }) {
  const t = useLocalizedText()
  const locale = useAppLocale()
  const contentRef = useRef<HTMLDivElement>(null)

  const groupClassesHref = useMemo(() => addLocaleToPathname("/group-classes", locale), [locale])
  const availabilityHref = useMemo(
    () => `${groupClassesHref}#group-class-availability`,
    [groupClassesHref],
  )

  const hasClassDetails = Boolean(offering.classInfo?.length)
  const hasSplitOverview = hasClassDetails && offering.goals.length > 0

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
        <section
          className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 px-6 lg:px-8 bg-primary text-primary-foreground bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${offering.image.replace(/ /g, "%20")}')` }}
        >
          <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
          <div className="relative z-10 max-w-7xl mx-auto">
            <Link
              href={groupClassesHref}
              className="reveal opacity-0 inline-flex items-center gap-1.5 text-sm text-primary-foreground/75 hover:text-primary-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden />
              {t("All group classes")}
            </Link>
            <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-primary-foreground/70 font-medium mb-4">
              {t(offering.heroEyebrow)}
            </p>
            <h1 className="reveal opacity-0 animation-delay-200 font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary-foreground text-balance mb-6">
              {t(offering.heroTitle)}
            </h1>
            <p className="reveal opacity-0 animation-delay-400 text-lg md:text-xl text-primary-foreground/90 max-w-2xl leading-relaxed">
              {t(offering.heroDescription)}
            </p>
            {(offering.packagePrice || offering.unitPrice || offering.note) ? (
              <div className="reveal opacity-0 animation-delay-500 mt-6 flex flex-wrap gap-2">
                {offering.packagePrice ? (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-primary-foreground backdrop-blur-sm">
                    {t("Package")}: {offering.packagePrice}
                    {offering.packageDetail ? ` · ${t(offering.packageDetail)}` : ""}
                  </span>
                ) : null}
                {offering.unitPrice ? (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-primary-foreground backdrop-blur-sm">
                    {t("Unit")}: {offering.unitPrice}
                  </span>
                ) : null}
                {offering.note ? (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-primary-foreground/90 backdrop-blur-sm">
                    {t(offering.note)}
                  </span>
                ) : null}
              </div>
            ) : null}
            <div className="reveal opacity-0 animation-delay-600 mt-8 flex flex-col sm:flex-row gap-3">
              <BookingLink>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 py-5 text-sm md:text-base group shine-effect animate-shine">
                  {t("Send an Inquiry")}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </BookingLink>
              {!offering.comingSoon ? (
                <Button className={heroSecondaryButtonClassName} asChild>
                  <Link href={availabilityHref}>{t("See dates & availability")}</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        {hasSplitOverview ? (
          <section className="py-20 lg:py-28 px-6 lg:px-8 bg-muted/30">
            <div className="max-w-7xl mx-auto">
              <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-secondary font-medium mb-10 lg:mb-14">
                {t(offering.heroEyebrow)}
              </p>
              {offering.goalCarouselBody ? (
                <p className="reveal opacity-0 animation-delay-200 max-w-3xl text-base md:text-lg text-muted-foreground leading-relaxed mb-10 lg:mb-14">
                  {t(offering.goalCarouselBody)}
                </p>
              ) : null}
              <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-start">
                <ServiceOverviewSection
                  layout="column"
                  eyebrow={offering.heroEyebrow}
                  title="Class details"
                  items={offering.classInfo}
                />
                <ServiceOverviewSection
                  layout="column"
                  eyebrow={offering.heroEyebrow}
                  title={offering.overviewTitle ?? "What we'll work on"}
                  items={offering.goals}
                  pricingRows={offering.pricingRows}
                />
              </div>
            </div>
          </section>
        ) : (
          <>
            {hasClassDetails ? (
              <ServiceOverviewSection
                eyebrow={offering.heroEyebrow}
                title="Class details"
                items={offering.classInfo}
              />
            ) : null}

            <ServiceOverviewSection
              eyebrow={offering.heroEyebrow}
              title={offering.overviewTitle ?? "What we'll work on"}
              intro={offering.goalCarouselBody}
              items={offering.goals}
              pricingRows={offering.pricingRows}
            />
          </>
        )}

        <ServiceForYouSection items={offering.forYouIf} />

        <section className="pt-10 pb-20 lg:pt-14 lg:pb-28 px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="reveal opacity-0 font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-6 text-balance">
              {t(offering.ctaHeadline)}
            </h2>
            <p className="reveal opacity-0 animation-delay-200 text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
              {t(offering.ctaBody)}
            </p>
            <div className="reveal opacity-0 animation-delay-300 flex flex-col sm:flex-row items-center justify-center gap-3">
              <BookingLink>
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 text-base group">
                  {t("Send an Inquiry")}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </BookingLink>
              {!offering.comingSoon ? (
                <Button size="lg" className={ctaSecondaryButtonClassName} asChild>
                  <Link href={availabilityHref}>{t("See dates & availability")}</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        <TrustStrip />
      </div>

      <Footer />
    </main>
  )
}