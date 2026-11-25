"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { HeroBackdrop } from "@/components/hero-backdrop"
import { Button } from "@/components/ui/button"
import { ArrowRight, Phone } from "lucide-react"
import { FreeCallLink } from "@/components/booking-form-provider"
import { useLocalizedText } from "@/lib/i18n/use-localized-text"
import { useEditableText, useEditableValue } from "@/lib/site-editing/use-editable"
import { useAppLocale } from "@/components/locale-provider"
import { useHeroCtaExperiment } from "@/components/use-hero-cta-experiment"
import { heroCtaLabel } from "@/lib/hero-cta-experiment"
import { getBusinessDetails } from "@/lib/business-details"

export function HeroSection() {
  const t = useLocalizedText()
  const text = useEditableText()
  const value = useEditableValue()
  const locale = useAppLocale()
  const { variant: ctaVariant, ctaRef, trackCtaClick } = useHeroCtaExperiment()
  const sectionRef = useRef<HTMLElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return
      const progress = Math.min(window.scrollY / (sectionRef.current.offsetHeight * 0.5), 1)
      setScrollProgress(progress)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scale = 1 - scrollProgress * 0.05
  const borderRadius = scrollProgress * 24

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100svh] flex items-end md:items-center overflow-hidden pt-20"
    >
      <div
        className="absolute inset-0 w-full h-full overflow-hidden transition-transform duration-100"
        style={{ transform: `scale(${scale})`, borderRadius: `${borderRadius}px` }}
      >
        <HeroBackdrop />
      </div>

      <div className="relative max-w-7xl mx-auto px-5 md:px-6 lg:px-8 pb-12 pt-16 md:py-20 lg:py-32 w-full">
        <div className="max-w-2xl">
          <p
            className="text-sm md:text-base text-background/95 font-semibold mb-2"
            aria-label={t("5.0 ★★★★★ · 130+ Google reviews")}
          >
            <span>{t("5.0")}</span>
            <span className="text-yellow-400 drop-shadow-sm" aria-hidden="true">
              {" "}
              ★★★★★
            </span>
            <span>{" · "}{value("home.hero.reviews", locale === "fr" ? "130+ avis Google" : "130+ Google reviews")}</span>
          </p>
          <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-background/80 font-medium mb-4 md:mb-6">
            {text("home.hero.eyebrow", "Montreal #1 Dog School")}
          </p>
          <h1 className="font-display text-[2.5rem] leading-[1.08] md:text-5xl lg:text-6xl xl:text-7xl font-bold md:leading-[1.1] text-background text-balance mb-5 md:mb-8 tracking-tight">
            <span className="inline-block">{text("home.hero.headline1", "Montreal dog training.")}</span>
            <br />
            <span data-hero-benefit className="inline-block text-background">
              {text("home.hero.headline2", "Get your")}{" "}
              <span className="relative inline-block whitespace-nowrap pb-[0.12em]">
                {text("home.hero.headline3", "life back.")}
                <svg
                  data-hero-benefit-scribble
                  aria-hidden="true"
                  focusable="false"
                  viewBox="0 0 300 20"
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-[0.18em] w-full overflow-visible text-accent/90"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                >
                  <path d="M5 14C81 5 198 5 295 11" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                </svg>
              </span>
            </span>
          </h1>
          <p className="text-base md:text-lg text-background/90 leading-relaxed mb-8 md:mb-10 max-w-xl">
            {text("home.hero.intro", "Real-World training for leash pulling, reactivity, behaviour and everyday manners — built to deliver effective, lasting results.")}
          </p>
          <div ref={ctaRef} data-hero-cta-variant={ctaVariant || "pending"} className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <FreeCallLink className="w-full sm:w-auto" onClick={trackCtaClick}>
              <Button
                size="lg"
                disabled={!ctaVariant}
                className="w-full sm:w-auto lg:min-w-[240px] bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 lg:px-12 lg:py-8 text-base lg:text-lg lg:font-semibold group shine-effect animate-shine"
              >
                {t(heroCtaLabel(ctaVariant))}
                <ArrowRight className="ml-2 w-4 h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </FreeCallLink>
            <Link
              href={getBusinessDetails().phoneHref}
              data-conversion-location="homepage_hero"
              className="w-full sm:w-auto"
            >
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto lg:min-w-[180px] rounded-full px-8 py-6 lg:px-10 lg:py-8 text-base lg:text-lg lg:font-semibold bg-background text-foreground border-background backdrop-blur-sm transition-all duration-300 hover:bg-transparent hover:text-background hover:border-background/30"
              >
                <Phone className="mr-2 w-4 h-4 lg:w-5 lg:h-5" />
                {text("home.hero.callButton", "Call Now")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
