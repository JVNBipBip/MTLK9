"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Clock,
  Calendar,
  MessageCircle,
  FileText,
  MapPinned,
  ClipboardCheck,
} from "lucide-react"

const steps = [
  {
    icon: MessageCircle,
    title: "We respond within 1 business day",
    description: "After you book, you'll hear from us within 1 business day.",
  },
  {
    icon: FileText,
    title: "Questionnaire & confirmation",
    description:
      "We'll confirm your evaluation time and send you a short questionnaire about your dog.",
  },
  {
    icon: MapPinned,
    title: "Real-world evaluation",
    description:
      "Your evaluation takes place in the real world — we'll meet you at a park or in your neighborhood.",
  },
  {
    icon: ClipboardCheck,
    title: "Clear training plan",
    description:
      "After the evaluation, you'll get a clear training plan with timelines, pricing, and next steps.",
  },
]

export function BookingContent() {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-up")
          }
        })
      },
      { threshold: 0.1 },
    )

    const elements = contentRef.current?.querySelectorAll(".reveal")
    elements?.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={contentRef}>
      {/* Hero */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="reveal opacity-0 font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance mb-6">
            Book Your Evaluation in 2 Minutes
          </h1>
          <p className="reveal opacity-0 animation-delay-200 text-lg md:text-xl text-muted-foreground">
            Here&apos;s what happens next.
          </p>
        </div>
      </section>

      {/* Section 1: What to Expect */}
      <section className="py-16 lg:py-24 px-6 lg:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="reveal opacity-0 font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-12 text-center">
            What to Expect
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`reveal opacity-0 ${
                  index === 1
                    ? "animation-delay-200"
                    : index === 2
                      ? "animation-delay-400"
                      : index === 3
                        ? "animation-delay-600"
                        : ""
                }`}
              >
                <div className="h-full bg-card rounded-3xl p-6 border border-border/50 shadow-lg shadow-primary/5 flex flex-col">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Two Booking Options */}
      <section className="py-16 lg:py-24 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="reveal opacity-0 font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-12 text-center">
            Two Booking Options
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Option A: Free Discovery Call */}
            <div className="reveal opacity-0 animation-delay-200">
              <div className="h-full bg-primary rounded-3xl p-8 lg:p-10 border border-primary/20 shadow-xl flex flex-col">
                <span className="text-sm uppercase tracking-[0.15em] text-primary-foreground/80 font-medium mb-4">
                  Recommended
                </span>
                <h3 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-primary-foreground mb-3">
                  Book a Free Discovery Call
                </h3>
                <p className="text-primary-foreground/90 mb-4">15 min phone call · No cost · No commitment</p>
                <p className="text-primary-foreground/80 leading-relaxed mb-8 flex-grow">
                  Tell us what&apos;s going on and we&apos;ll figure out the right path together.
                </p>
                <Link href="#" className="block">
                  <Button
                    size="lg"
                    className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-full px-8 py-6 text-base group"
                  >
                    Book Free Call
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Option B: Evaluation Session */}
            <div className="reveal opacity-0 animation-delay-400">
              <div className="h-full bg-card rounded-3xl p-8 lg:p-10 border border-border/50 shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-300 flex flex-col">
                <h3 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-3">
                  Book an Evaluation Session
                </h3>
                <p className="text-primary font-semibold mb-4">$100 · 75 minutes · In-person assessment</p>
                <p className="text-muted-foreground leading-relaxed mb-8 flex-grow">
                  If you already know you want to start, skip straight to the evaluation.
                </p>
                <Link href="#" className="block">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full rounded-full px-8 py-6 text-base group border-primary/30 hover:bg-primary/5"
                  >
                    Book Evaluation
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Contact Info */}
      <section className="py-16 lg:py-24 px-6 lg:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="reveal opacity-0 font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-12 text-center">
            Contact Us
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="reveal opacity-0">
                <a
                  href="tel:+15145551234"
                  className="flex items-center gap-4 text-foreground hover:text-primary transition-colors group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">(514) 555-1234</p>
                  </div>
                </a>
              </div>
              <div className="reveal opacity-0 animation-delay-200">
                <a
                  href="mailto:info@mtlcaninetraining.com"
                  className="flex items-center gap-4 text-foreground hover:text-primary transition-colors group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">info@mtlcaninetraining.com</p>
                  </div>
                </a>
              </div>
              <div className="reveal opacity-0 animation-delay-400">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">7770 Boul Henri-Bourassa E, Anjou, Montreal</p>
                  </div>
                </div>
              </div>
              <div className="reveal opacity-0 animation-delay-600">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hours</p>
                    <p className="font-medium">Mon–Sat, 8AM–6PM</p>
                  </div>
                </div>
              </div>
              <div className="reveal opacity-0 animation-delay-600">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Response time</p>
                    <p className="font-medium">We respond to all inquiries within 24 hours.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="reveal opacity-0 animation-delay-400">
              <div className="h-64 lg:h-80 rounded-3xl bg-muted border border-border/50 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Map placeholder</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Cancellation Policy */}
      <section className="py-16 lg:py-24 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="reveal opacity-0 font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-8 text-center">
            Cancellation Policy
          </h2>
          <div className="reveal opacity-0 animation-delay-200 bg-card rounded-3xl p-8 lg:p-10 border border-border/50 shadow-lg">
            <p className="text-muted-foreground leading-relaxed mb-4">
              Life happens. We get it. If you need to reschedule or cancel your evaluation or discovery call,
              please let us know at least 24 hours in advance. We&apos;ll do our best to find a new time that works.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              For evaluation sessions, cancellations with less than 24 hours notice may be subject to a fee.
              No-shows will be charged in full. We&apos;re happy to work with you if something unexpected comes up —
              just reach out and we&apos;ll figure it out together.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our goal is to help you and your dog, not to make things harder. If you have questions about
              our policy, give us a call — we&apos;re here to help.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
