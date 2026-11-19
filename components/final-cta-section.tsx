"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Phone } from "lucide-react"
import { FreeCallLink } from "@/components/booking-form-provider"
import { useAppLocale } from "@/components/locale-provider"
import { addLocaleToPathname } from "@/lib/i18n/config"
import { getBusinessDetails } from "@/lib/business-details"
import { useEditableText, useEditableValue } from "@/lib/site-editing/use-editable"

export function FinalCTASection() {
  const text = useEditableText()
  const value = useEditableValue()
  const business = getBusinessDetails()
  const locale = useAppLocale()
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
    <section ref={sectionRef} className="py-24 lg:py-32 px-6">
      <div className="relative max-w-7xl mx-auto rounded-[48px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary" />

        <div className="relative px-8 lg:px-16 py-16 lg:py-24 text-center">
          <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-primary-foreground/70 font-medium mb-4">
            {text("home.finalCta.eyebrow", "Ready to Start?")}
          </p>
          <h2 className="reveal opacity-0 animation-delay-200 font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-primary-foreground text-balance mb-6 max-w-3xl mx-auto">
            {text("home.finalCta.heading", "Start with a free 15-minute discovery call")}
          </h2>
          <p className="reveal opacity-0 animation-delay-400 text-lg text-primary-foreground/80 max-w-xl mx-auto leading-relaxed mb-10">
            {text("home.finalCta.body", "Tell us what's going on with your dog. We'll listen, answer your questions, and figure out the right path together. No pressure, no commitment.")}
          </p>

          <div className="reveal opacity-0 animation-delay-600 flex flex-col sm:flex-row items-center justify-center gap-4">
            <FreeCallLink>
              <Button
                size="lg"
                className="bg-background text-foreground hover:bg-background/90 rounded-full px-8 py-6 text-base group"
              >
                {text("home.finalCta.button", "Contact Us for a Free Call")}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </FreeCallLink>
            <FreeCallLink>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 py-6 text-base border-primary-foreground/30 hover:bg-primary-foreground/10 text-primary-foreground bg-transparent"
              >
                <Phone className="mr-2 w-4 h-4" />
                {value("business.phone", business.phone)}
              </Button>
            </FreeCallLink>
          </div>

          <p className="reveal opacity-0 animation-delay-600 text-sm text-primary-foreground/60 mt-8">
            {text("home.finalCta.notSure", "Not sure yet?")}{" "}
            <Link
              href={addLocaleToPathname("/services", locale)}
              className="underline hover:text-primary-foreground transition-colors"
            >
              {text("home.finalCta.programsLink", "Take a look at our training programs")}
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
