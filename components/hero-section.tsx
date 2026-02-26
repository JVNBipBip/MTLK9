"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { AnimatedText } from "@/components/animated-text"
import { BookingLink } from "@/components/booking-form-provider"

const HERO_FALLBACK = "/images/hero-fallback.png"

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const desktopVideoRef = useRef<HTMLVideoElement>(null)
  const mobileVideoRef = useRef<HTMLVideoElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [showLoader, setShowLoader] = useState(false)

  useEffect(() => {
    if (!isVideoReady) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("animate-fade-up")
        })
      },
      { threshold: 0.1 },
    )
    const elements = sectionRef.current?.querySelectorAll(".reveal")
    elements?.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [isVideoReady])

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches
    const activeVideo = isMobile ? mobileVideoRef.current : desktopVideoRef.current

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
  }, [])

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
          className="object-cover -z-10"
          sizes="100vw"
        />
        {/* Desktop video */}
        <video
          ref={desktopVideoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={HERO_FALLBACK}
          onLoadedData={handleVideoReady}
          onCanPlay={handleVideoReady}
          className={`hidden md:block w-full h-full object-cover transition-opacity duration-1000 ${
            isVideoReady ? "opacity-100" : "opacity-0"
          }`}
        >
          <source src="/videos/Desktop Hero Video.webm" type="video/webm" />
        </video>
        {/* Mobile video */}
        <video
          ref={mobileVideoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={HERO_FALLBACK}
          onLoadedData={handleVideoReady}
          onCanPlay={handleVideoReady}
          className={`md:hidden w-full h-full object-cover transition-opacity duration-1000 ${
            isVideoReady ? "opacity-100" : "opacity-0"
          }`}
        >
          <source src="/videos/Mobile Hero Video.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/50 to-foreground/20 md:bg-gradient-to-r md:from-foreground/70 md:via-foreground/50 md:to-transparent" />
        {/* Loading overlay appears only when video startup is actually slow */}
        {showLoader && !isVideoReady && (
          <div className="absolute inset-0 transition-opacity duration-500 opacity-100">
            <Image src={HERO_FALLBACK} alt="" fill priority className="object-cover" sizes="100vw" />
            <div className="absolute inset-0 bg-foreground/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full border-2 border-white/55 border-t-transparent animate-spin" />
            </div>
          </div>
        )}
      </div>

      <div className="relative max-w-7xl mx-auto px-5 md:px-6 lg:px-8 pb-12 pt-16 md:py-20 lg:py-32 w-full">
        <div className="max-w-2xl">
          <p className="reveal opacity-0 text-sm md:text-base text-background/95 font-semibold mb-2">
            5.0 <span className="text-yellow-400">★★★★★</span> · 124 Google reviews
          </p>
          <p className="reveal opacity-0 text-xs md:text-sm uppercase tracking-[0.2em] text-background/80 font-medium mb-4 md:mb-6">
            Montreal #1 Dog School
          </p>
          <h1 className="font-display text-[2.5rem] leading-[1.08] md:text-5xl lg:text-6xl xl:text-7xl font-bold md:leading-[1.1] text-background text-balance mb-5 md:mb-8 tracking-tight">
            <AnimatedText text="Get your life" delay={0.3} />
            <br />
            <AnimatedText text="with your dog" delay={0.6} />
            <br />
            <span className="text-accent">
              <AnimatedText text="back." delay={1.0} />
            </span>
          </h1>
          <p className="reveal opacity-0 animation-delay-400 text-base md:text-lg text-background/90 leading-relaxed mb-8 md:mb-10 max-w-xl">
            Real-world training for leash pulling, reactivity, anxiety, and everyday manners —
            built around humane, evidence-guided methods.
          </p>
          <div className="reveal opacity-0 animation-delay-600 flex flex-col sm:flex-row gap-3 md:gap-4">
            <BookingLink className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 text-base group shine-effect animate-shine"
              >
                Book a Free Discovery Call
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </BookingLink>
            <Link href="/services" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto rounded-full px-8 py-6 text-base border-background/30 text-background bg-transparent backdrop-blur-sm transition-all duration-300 hover:bg-background hover:text-foreground hover:border-background hover:shadow-[0_0_20px_rgba(255,255,255,0.25)]"
              >
                See Training Programs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
