"use client"

import { useEffect, useRef } from "react"
import { Phone, MapPin, ClipboardList, Handshake } from "lucide-react"
import { ScrollAnimatedText } from "@/components/scroll-animated-text"

const steps = [
  {
    icon: Phone,
    number: "01",
    title: "Book a Free Call",
    description:
      "Tell us what's going on. We'll figure out the right path together. 15 minutes, no commitment.",
  },
  {
    icon: MapPin,
    number: "02",
    title: "Evaluation Session",
    description:
      "We meet you and your dog in the real world — a park, your neighborhood — and assess behavior where it actually happens.",
  },
  {
    icon: ClipboardList,
    number: "03",
    title: "Your Custom Training Plan",
    description:
      "You get a clear roadmap: what we'll work on, how many sessions, what you'll practice between sessions, and what success looks like.",
  },
  {
    icon: Handshake,
    number: "04",
    title: "Training + Ongoing Support",
    description:
      "We train together in real environments. You get homework, video check-ins, and support between sessions. We're with you until it clicks.",
  },
]

export function HowItWorksSection() {
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
    <section ref={sectionRef} className="py-24 lg:py-32 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16 lg:mb-20">
          <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-secondary font-medium mb-4">
            Simple Process
          </p>
          <ScrollAnimatedText
            text="How it works"
            className="font-display text-3xl md:text-5xl lg:text-7xl text-foreground text-balance mb-6 font-semibold tracking-tight"
          />
          <p className="reveal opacity-0 animation-delay-400 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            From your first call to a calmer, more confident dog — here&apos;s the path.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`reveal opacity-0 ${index === 1 ? "animation-delay-200" : index === 2 ? "animation-delay-400" : index === 3 ? "animation-delay-600" : ""}`}
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 mx-auto md:mx-0">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground/50 mb-2 block">
                  {step.number}
                </span>
                <h3 className="font-display text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
