"use client"

import { useEffect, useRef, useState } from "react"
import { ScrollAnimatedText } from "@/components/scroll-animated-text"

const stats = [
  {
    value: "99%",
    numericValue: 99,
    suffix: "%",
    label: "of dogs exhibit behavioral issues",
    source: "Texas A&M, 43,517 dogs studied",
  },
  {
    value: "85.9%",
    numericValue: 86,
    suffix: "%",
    label: "show separation or attachment behaviors",
    source: "",
  },
  {
    value: "8%",
    numericValue: 8,
    suffix: "%",
    label: "of owners ever enroll in formal training",
    source: "",
  },
]

const studySource = "Texas A&M, 43,517 dogs studied"

export function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [animatedValues, setAnimatedValues] = useState<{ [key: string]: number }>({})
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-up")
            if (!hasAnimated) {
              setHasAnimated(true)
              stats.forEach((stat) => animateCounter(stat.numericValue, stat.label))
            }
          }
        })
      },
      { threshold: 0.1 },
    )
    const elements = sectionRef.current?.querySelectorAll(".reveal")
    elements?.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [hasAnimated])

  const animateCounter = (target: number, label: string) => {
    const duration = 2000
    const steps = 60
    const increment = target / steps
    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      const currentValue = Math.min(Math.round(increment * currentStep), target)
      setAnimatedValues((prev) => ({ ...prev, [label]: currentValue }))
      if (currentStep >= steps) clearInterval(timer)
    }, duration / steps)
  }

  return (
    <section
      ref={sectionRef}
      className="relative py-24 lg:py-32 bg-primary bg-cover bg-center bg-no-repeat text-primary-foreground"
      style={{ backgroundImage: "url('/images/stats/Community%20Walk.webp')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/60" aria-hidden="true" />
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16 lg:mb-20">
          <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-primary-foreground/90 font-medium mb-4">
            You&apos;re Not Alone
          </p>
          <ScrollAnimatedText
            text="The numbers tell the story"
            className="font-display text-3xl md:text-5xl lg:text-7xl text-primary-foreground text-balance mb-6 font-semibold tracking-tight"
          />
        </div>

        <div className="reveal opacity-0 animation-delay-400 mb-16 rounded-3xl border border-white/30 bg-white/10 backdrop-blur-sm shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="px-6 py-4 border-b border-white/20 text-center">
            <p className="text-primary-foreground/95 text-sm md:text-base font-medium tracking-wide">
              Study source: <span className="font-semibold">{studySource}</span>
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 md:gap-12 px-6 md:px-8 py-8 md:py-10">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-primary-foreground mb-4">
                  {animatedValues[stat.label] ?? 0}
                  {stat.suffix}
                </div>
                <p className="text-primary-foreground text-lg mb-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="reveal opacity-0 animation-delay-600 text-center border-t border-primary-foreground/35 pt-12">
          <p className="font-display text-2xl md:text-3xl tracking-tight text-primary-foreground max-w-2xl mx-auto leading-relaxed">
            You don&apos;t have a bad dog. You have a dog that needs a plan.
          </p>
        </div>
      </div>
    </section>
  )
}
