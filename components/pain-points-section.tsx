"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollAnimatedText } from "@/components/scroll-animated-text"

const painPoints = [
  {
    question: "Pull on every walk?",
    description: "You dread taking them out. Every walk is a battle.",
    href: "/services/city-manners",
    icon: "🐕‍🦺",
  },
  {
    question: "Lunge or bark at other dogs?",
    description: "You cross the street, avoid the park, walk at odd hours.",
    href: "/services/reactivity",
    icon: "⚡",
  },
  {
    question: "Destroy things when left alone?",
    description: "You can't leave the house without worrying.",
    href: "/services/reactivity",
    icon: "🏠",
  },
  {
    question: "Bite, nip, or jump on people?",
    description: "Guests are afraid. You're embarrassed and on edge.",
    href: "/services/puppy-foundations",
    icon: "🤕",
  },
  {
    question: "Ignore you outside the house?",
    description: "They listen inside but the second you step out — nothing.",
    href: "/services/city-manners",
    icon: "🙉",
  },
]

export function PainPointsSection() {
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
            Sound Familiar?
          </p>
          <ScrollAnimatedText
            text="Does your dog..."
            className="font-display text-3xl md:text-5xl lg:text-7xl text-foreground text-balance mb-6 font-semibold tracking-tight"
          />
          <p className="reveal opacity-0 animation-delay-400 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            You&apos;re not a bad owner. These are the most common reasons Montreal dog owners reach
            out to us.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {painPoints.map((point, index) => (
            <Link key={point.question} href={point.href}>
              <div
                className={`reveal opacity-0 ${index === 1 || index === 3 ? "animation-delay-200" : index === 2 || index === 4 ? "animation-delay-400" : ""} group bg-card rounded-3xl p-8 border border-border/50 shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-500 h-full`}
              >
                <span className="text-3xl mb-5 block">{point.icon}</span>
                <h3 className="font-display text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-3">
                  {point.question}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-5">{point.description}</p>
                <span className="text-primary text-sm font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
                  Find your training path
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
