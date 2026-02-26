"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Phone } from "lucide-react"
import { BookingLink } from "@/components/booking-form-provider"

export function FinalCTASection() {
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
            Ready to Start?
          </p>
          <h2 className="reveal opacity-0 animation-delay-200 font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-primary-foreground text-balance mb-6 max-w-3xl mx-auto">
            Book a free 15-minute discovery call
          </h2>
          <p className="reveal opacity-0 animation-delay-400 text-lg text-primary-foreground/80 max-w-xl mx-auto leading-relaxed mb-10">
            Tell us what&apos;s going on with your dog. We&apos;ll listen, answer your questions,
            and figure out the right path together. No pressure, no commitment.
          </p>

          <div className="reveal opacity-0 animation-delay-600 flex flex-col sm:flex-row items-center justify-center gap-4">
            <BookingLink>
              <Button
                size="lg"
                className="bg-background text-foreground hover:bg-background/90 rounded-full px-8 py-6 text-base group"
              >
                Book Your Free Call
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </BookingLink>
            <Link href="tel:+15145551234">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 py-6 text-base border-primary-foreground/30 hover:bg-primary-foreground/10 text-primary-foreground bg-transparent"
              >
                <Phone className="mr-2 w-4 h-4" />
                (514) 555-1234
              </Button>
            </Link>
          </div>

          <p className="reveal opacity-0 animation-delay-600 text-sm text-primary-foreground/60 mt-8">
            Not sure yet?{" "}
            <Link href="/services" className="underline hover:text-primary-foreground transition-colors">
              Take a look at our training programs
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
