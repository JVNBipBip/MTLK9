"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FaqAccordion } from "@/components/faq-accordion"
import { ScrollAnimatedText } from "@/components/scroll-animated-text"

export function FaqSection() {
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
    <section ref={sectionRef} className="pt-24 lg:pt-32 pb-8 lg:pb-12 bg-background">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16 lg:mb-20">
          <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-secondary font-medium mb-4">
            Common Questions
          </p>
          <ScrollAnimatedText
            text="FAQ"
            className="font-display text-3xl md:text-5xl lg:text-7xl text-foreground text-balance mb-6 font-semibold tracking-tight"
          />
          <p className="reveal opacity-0 animation-delay-400 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Everything you need to know before getting started.
          </p>
        </div>

        <div className="reveal opacity-0">
          <FaqAccordion />
        </div>

        <div className="text-center mt-12">
          <Link href="/faq">
            <Button variant="outline" className="rounded-full px-8 group">
              View All FAQs
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
