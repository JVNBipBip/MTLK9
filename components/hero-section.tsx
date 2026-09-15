"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Phone } from "lucide-react"
import { FreeCallLink } from "@/components/booking-form-provider"
import { useLocalizedText } from "@/lib/i18n/use-localized-text"
import { useHeroCtaExperiment } from "@/components/use-hero-cta-experiment"
import { heroCtaLabel } from "@/lib/hero-cta-experiment"

const HERO_FALLBACK = "/images/hero-fallback.webp"

const HERO_VIDEO_SOURCES = {
  desktop: { src: "/videos/desktop-hero-lite.webm", type: "video/webm" },
  mobile: { src: "/videos/mobile-hero-lite.mp4", type: "video/mp4" },
} as const

type HeroVideoVariant = keyof typeof HERO_VIDEO_SOURCES

export function HeroSection() {
  const t = useLocalizedText()
  const { variant: ctaVariant, ctaRef, trackCtaClick } = useHeroCtaExperiment()
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [showLoader, setShowLoader] = useState(false)
  // No video renders pre-hydration (the priority poster image is the LCP);
  // after mount we pick ONLY the matching breakpoint's video so a device never
  // downloads both sources (~5MB wasted before this).
  const [videoVariant, setVideoVariant] = useState<HeroVideoVariant | null>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)")
    const update = () => setVideoVariant(mediaQuery.matches ? "desktop" : "mobile")
    update()
    mediaQuery.addEventListener("change", update)
    return () => mediaQuery.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    if (!videoVariant) return
    const isMobile = videoVariant === "mobile"
    const activeVideo = videoRef.current

    // If the active video is already buffered (cache/fast network), skip loader entirely.
    if (activeVideo?.readyState && activeVideo.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      setIsVideoReady(true)
      return
    }

    const spinnerDelay = isMobile ? 300 : 150
    const fallbackTimeout = isMobile ? 800 : 400

    const loaderTimer = window.setTimeout(() => setShowLoader(true), spinnerDelay)
    const fallbackTimer = window.setTimeout(() => setIsVideoReady(true), fallbackTimeout)

    return () => {
      window.clearTimeout(loaderTimer)
      window.clearTimeout(fallbackTimer)
    }
  }, [videoVariant])

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
  const handleVideoReady = () => {
    setShowLoader(false)
    setIsVideoReady(true)
  }

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100svh] flex items-end md:items-center overflow-hidden pt-20"
    >
      <div
        className="absolute inset-0 w-full h-full overflow-hidden transition-transform duration-100"
        style={{ transform: `scale(${scale})`, borderRadius: `${borderRadius}px` }}
      >
        {/* Fallback hero image — always present behind videos */}
        <Image
          src={HERO_FALLBACK}
          alt="Montreal Canine Training"
          fill
          priority
          quality={55}
          className="object-cover -z-10"
          sizes="100vw"
        />
        {/* Single breakpoint-matched video, mounted client-side only (see
            videoVariant) so devices download exactly one compressed source. */}
        {videoVariant && (
          <video
            key={videoVariant}
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={HERO_FALLBACK}
            onLoadedData={handleVideoReady}
            onCanPlay={handleVideoReady}
            className={`w-full h-full object-cover transition-opacity duration-1000 ${
              isVideoReady ? "opacity-100" : "opacity-0"
            }`}
          >
            <source src={HERO_VIDEO_SOURCES[videoVariant].src} type={HERO_VIDEO_SOURCES[videoVariant].type} />
          </video>
        )}
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/65 to-black/25 md:bg-gradient-to-r md:from-black/80 md:via-black/65 md:to-black/25" />
        {/* Loading overlay appears only when video startup is actually slow */}
        {showLoader && !isVideoReady && (
          <div className="absolute inset-0 transition-opacity duration-500 opacity-100">
            <Image src={HERO_FALLBACK} alt="" fill priority quality={55} className="object-cover" sizes="100vw" />
            <div className="absolute inset-0 bg-foreground/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full border-2 border-white/55 border-t-transparent animate-spin" />
            </div>
          </div>
        )}
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
            <span>{t(" · 130+ Google reviews")}</span>
          </p>
          <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-background/80 font-medium mb-4 md:mb-6">
            {t("Montreal #1 Dog School")}
          </p>
          <h1 className="font-display text-[2.5rem] leading-[1.08] md:text-5xl lg:text-6xl xl:text-7xl font-bold md:leading-[1.1] text-background text-balance mb-5 md:mb-8 tracking-tight">
            <span className="inline-block">{t("Montreal dog training.")}</span>
            <br />
            <span data-hero-benefit className="inline-block text-background">
              {t("Get your")}{" "}
              <span className="relative inline-block whitespace-nowrap pb-[0.12em]">
                {t("life back.")}
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
            {t("Real-World training for leash pulling, reactivity, behaviour and everyday manners — built to deliver effective, lasting results.")}
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
              href="tel:+15148269558"
              data-conversion-location="homepage_hero"
              className="w-full sm:w-auto"
            >
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto lg:min-w-[180px] rounded-full px-8 py-6 lg:px-10 lg:py-8 text-base lg:text-lg lg:font-semibold bg-background text-foreground border-background backdrop-blur-sm transition-all duration-300 hover:bg-transparent hover:text-background hover:border-background/30"
              >
                <Phone className="mr-2 w-4 h-4 lg:w-5 lg:h-5" />
                {t("Call Now")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
