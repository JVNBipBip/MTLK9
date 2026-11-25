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
import { useEditableText } from "@/lib/site-editing/use-editable"
import { isPriceLike } from "@/lib/site-editing/price-rule"
import type { TextFieldId } from "@/lib/site-editing/fields"
import { useAppLocale } from "@/components/locale-provider"
import { PriceTag } from "@/components/price-tag"
import { addLocaleToPathname } from "@/lib/i18n/config"
import { getGroupClassOffering, type GroupClassOffering } from "@/lib/group-class-offerings"
import { useDraftPrices } from "@/lib/site-editing/use-draft-prices"

const heroSecondaryButtonClassName =
  "rounded-full bg-white text-foreground hover:bg-transparent hover:text-white border border-white px-6 py-5 text-sm md:text-base transition-colors"

const ctaSecondaryButtonClassName =
  "rounded-full bg-white text-foreground hover:bg-muted border border-foreground px-8 py-6 text-base transition-colors"

export function GroupClassDetailContent({ offering: published }: { offering: GroupClassOffering }) {
  // In the editor's live preview, rebuilt with his unsaved prices; otherwise as published.
  const draftPrices = useDraftPrices()
  const offering = useMemo(() => (draftPrices && getGroupClassOffering(published.id, draftPrices)) || published, [draftPrices, published])
  const t = useLocalizedText()
  const text = useEditableText()
  const locale = useAppLocale()
  // Owner-editable class copy: group.<class>.<key> (data in lib/group-class-offerings.ts). Prices stay in code.
  const g = (key: string, english: string) =>
    isPriceLike(english) ? t(english) : text(`group.${offering.id}.${key}` as TextFieldId, english)
  const classDetailsEdit = (key: string, english: string) =>
    key === "title" ? text("group.shared.classDetails", "Class details") : key === "eyebrow" ? g("heroEyebrow", english) : g(key.replace("items.", "classInfo."), english)
  const goalsEdit = (key: string, english: string) => {
    if (key === "title") return offering.overviewTitle ? g("overviewTitle", english) : text("group.shared.workOn", "What we'll work on")
    if (key === "eyebrow") return g("heroEyebrow", english)
    if (key === "intro") return g("goalCarouselBody", english)
    return g(key.replace("items.", "goals."), english)
  }
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
              {text("group.shared.allClasses", "All group classes")}
            </Link>
            <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-primary-foreground/70 font-medium mb-4">
              {g("heroEyebrow", offering.heroEyebrow)}
            </p>
            <h1 className="reveal opacity-0 animation-delay-200 font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary-foreground text-balance mb-6">
              {g("heroTitle", offering.heroTitle)}
            </h1>
            <p className="reveal opacity-0 animation-delay-400 text-lg md:text-xl text-primary-foreground/90 max-w-2xl leading-relaxed">
              {g("heroDescription", offering.heroDescription)}
            </p>
            {(offering.packagePrice || offering.unitPrice || offering.note) ? (
              <div className="reveal opacity-0 animation-delay-500 mt-6 flex flex-wrap gap-2">
                {offering.packagePrice ? (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-primary-foreground backdrop-blur-sm">
                    {t("Package")}: <PriceTag locale={locale} price={t(offering.packagePrice)} compareAt={offering.packageCompareAt && t(offering.packageCompareAt)} />
                    {offering.packageDetail ? ` · ${t(offering.packageDetail)}` : ""}
                  </span>
                ) : null}
                {offering.unitPrice ? (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-primary-foreground backdrop-blur-sm">
                    {t("Unit")}: {t(offering.unitPrice)}
                  </span>
                ) : null}
                {offering.note ? (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-primary-foreground/90 backdrop-blur-sm">
                    {g("note", offering.note)}
                  </span>
                ) : null}
              </div>
            ) : null}
            <div className="reveal opacity-0 animation-delay-600 mt-8 flex flex-col sm:flex-row gap-3">
              <BookingLink>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 py-5 text-sm md:text-base group shine-effect animate-shine">
                  {text("group.shared.sendInquiry", "Send an Inquiry")}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </BookingLink>
              {!offering.comingSoon ? (
                <Button className={heroSecondaryButtonClassName} asChild>
                  <Link href={availabilityHref}>{text("group.shared.seeDates", "See dates & availability")}</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        {hasSplitOverview ? (
          <section className="py-20 lg:py-28 px-6 lg:px-8 bg-muted/30">
            <div className="max-w-7xl mx-auto">
              <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-secondary font-medium mb-10 lg:mb-14">
                {g("heroEyebrow", offering.heroEyebrow)}
              </p>
              {offering.goalCarouselBody ? (
                <p className="reveal opacity-0 animation-delay-200 max-w-3xl text-base md:text-lg text-muted-foreground leading-relaxed mb-10 lg:mb-14">
                  {g("goalCarouselBody", offering.goalCarouselBody)}
                </p>
              ) : null}
              <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-start">
                <ServiceOverviewSection
                  layout="column"
                  eyebrow={offering.heroEyebrow}
                  title="Class details"
                  items={offering.classInfo}
                  edit={classDetailsEdit}
                />
                <ServiceOverviewSection
                  layout="column"
                  eyebrow={offering.heroEyebrow}
                  title={offering.overviewTitle ?? "What we'll work on"}
                  items={offering.goals}
                  pricingRows={offering.pricingRows}
                  edit={goalsEdit}
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
                edit={classDetailsEdit}
              />
            ) : null}

            <ServiceOverviewSection
              eyebrow={offering.heroEyebrow}
              title={offering.overviewTitle ?? "What we'll work on"}
              intro={offering.goalCarouselBody}
              items={offering.goals}
              pricingRows={offering.pricingRows}
              edit={goalsEdit}
            />
          </>
        )}

        <ServiceForYouSection items={offering.forYouIf} idPrefix={`group.${offering.id}.forYouIf`} />

        <section className="pt-10 pb-20 lg:pt-14 lg:pb-28 px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="reveal opacity-0 font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-6 text-balance">
              {g("ctaHeadline", offering.ctaHeadline)}
            </h2>
            <p className="reveal opacity-0 animation-delay-200 text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
              {g("ctaBody", offering.ctaBody)}
            </p>
            <div className="reveal opacity-0 animation-delay-300 flex flex-col sm:flex-row items-center justify-center gap-3">
              <BookingLink>
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 text-base group">
                  {text("group.shared.sendInquiry", "Send an Inquiry")}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </BookingLink>
              {!offering.comingSoon ? (
                <Button size="lg" className={ctaSecondaryButtonClassName} asChild>
                  <Link href={availabilityHref}>{text("group.shared.seeDates", "See dates & availability")}</Link>
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