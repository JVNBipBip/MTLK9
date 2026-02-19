"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { AnimatedText } from "@/components/animated-text"

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
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

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100svh] flex items-end md:items-center overflow-hidden pt-20"
    >
      <div
        className="absolute inset-0 w-full h-full overflow-hidden transition-transform duration-100"
        style={{ transform: `scale(${scale})`, borderRadius: `${borderRadius}px` }}
      >
        {/* Desktop video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="hidden md:block w-full h-full object-cover"
        >
          <source src="/videos/Desktop Hero Video.webm" type="video/webm" />
        </video>
        {/* Mobile video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="md:hidden w-full h-full object-cover"
        >
          <source src="/videos/Mobile Hero Video.mp4" type="video/mp4" />
        </video>
        {/* Fallback bg color while video loads */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/80 via-primary/60 to-secondary/40" />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/50 to-foreground/20 md:bg-gradient-to-r md:from-foreground/70 md:via-foreground/50 md:to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-5 md:px-6 lg:px-8 pb-12 pt-16 md:py-20 lg:py-32 w-full">
        <div className="max-w-2xl">
          <p className="reveal opacity-0 text-xs md:text-sm uppercase tracking-[0.2em] text-background/80 font-medium mb-4 md:mb-6">
            Real-World Dog Training in Montreal
          </p>
          <h1 className="font-display text-[2.5rem] leading-[1.08] md:text-5xl lg:text-6xl xl:text-7xl font-bold md:leading-[1.1] text-background text-balance mb-5 md:mb-8 tracking-tight">
            <AnimatedText text="Get your life" delay={0.2} />
            <br />
            <AnimatedText text="with your dog" delay={0.5} />
            <br />
            <span className="text-accent">
              <AnimatedText text="back." delay={0.9} />
            </span>
          </h1>
          <p className="reveal opacity-0 animation-delay-400 text-base md:text-lg text-background/90 leading-relaxed mb-8 md:mb-10 max-w-xl">
            Real-world training for leash pulling, reactivity, anxiety, and everyday manners —
            built around humane, evidence-guided methods.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <Link href="/booking" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 text-base group"
              >
                Book a Free Discovery Call
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/services" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto rounded-full px-8 py-6 text-base border-background/30 hover:bg-background/10 text-background bg-transparent backdrop-blur-sm"
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
