"use client"

import { useEffect, useRef } from "react"
import { FreeCallLink } from "@/components/booking-form-provider"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { ScrollAnimatedText } from "@/components/scroll-animated-text"
import { useLocalizedText } from "@/lib/i18n/use-localized-text"

const painPoints = [
  {
    question: "Pull on every walk?",
    description: "You dread taking them out. Every walk is a battle.",
    image: "/images/pain-points/pulling.webp",
  },
  {
    question: "Lunge or bark at other dogs?",
    description: "You cross the street, avoid the park, walk at odd hours.",
    image: "/images/pain-points/generated-options/barking-option-2.webp",
  },
  {
    question: "Destroy things when left alone?",
    description: "You can't leave the house without worrying.",
    image: "/images/pain-points/generated-options/destroying-option-1.webp",
  },
  {
    question: "Bite, nip, or jump on people?",
    description: "Guests are afraid. You're embarrassed and on edge.",
    image: "/images/pain-points/generated-options/jumping-option-1.webp",
  },
]

export function PainPointsSection() {
  const t = useLocalizedText()
  const sectionRef = useRef<HTMLElement>(null)

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

  return (
    <section ref={sectionRef} className="py-24 lg:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16 lg:mb-20">
          <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-secondary font-medium mb-4">
            {t("Sound Familiar?")}
          </p>
          <ScrollAnimatedText
            text={t("Does your dog...")}
            className="font-display text-3xl md:text-5xl lg:text-7xl text-foreground text-balance mb-6 font-semibold tracking-tight"
          />
          <p className="reveal opacity-0 animation-delay-400 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("You're not a bad owner. These are the most common reasons Montreal dog owners reach out to us.")}
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:gap-8">
          {painPoints.map((point, index) => (
            <article
              key={point.question}
              className="reveal opacity-0 group bg-card rounded-3xl border border-border/50 shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-500 overflow-hidden"
            >
              <div className="grid lg:grid-cols-2 lg:min-h-[420px]">
                <div
                  className={`relative h-60 sm:h-72 lg:h-full overflow-hidden ${
                    index % 2 === 1 ? "lg:order-2" : ""
                  }`}
                >
                  <Image
                    src={point.image}
                    alt={t(point.question)}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent lg:bg-gradient-to-r lg:from-black/25 lg:to-transparent" />
                </div>
                <div className="flex flex-col justify-center p-7 md:p-10 lg:p-12">
                  <p className="text-xs uppercase tracking-[0.16em] text-secondary font-semibold mb-3">
                    {t("Common Challenge")} · {index + 1}/{painPoints.length}
                  </p>
                  <h3 className="font-display text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground mb-4">
                    {t(point.question)}
                  </h3>
                  <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-8 max-w-xl">
                    {t(point.description)}
                  </p>
                  <FreeCallLink className="inline-flex">
                    <span className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3.5 text-sm font-semibold transition-colors group-hover:bg-primary/90 cursor-pointer">
                      {t("Find your training path")}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </FreeCallLink>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
