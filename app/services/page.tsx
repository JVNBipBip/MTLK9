"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, PawPrint } from "lucide-react"

const services = [
  {
    title: "Puppy Foundations",
    href: "/services/puppy-foundations",
    for: "Puppies 8–20 weeks",
    solves: "Biting/nipping, socialization, house training, building calm routines",
    format: "Group classes + private sessions available",
    price: "$349",
    cta: "Start Your Puppy's Plan",
  },
  {
    title: "City Manners",
    href: "/services/city-manners",
    for: "Dogs of any age who need urban life skills",
    solves: "Leash pulling, jumping on guests, ignoring commands outside, impulse control",
    format: "Private sessions in real-world environments",
    price: "$449",
    cta: "Build Better Manners",
  },
  {
    title: "Reactivity & Anxiety",
    href: "/services/reactivity",
    for: "Dogs who lunge, bark, or shut down around triggers",
    solves: "Leash reactivity, dog-dog aggression, fear/anxiety, separation anxiety",
    format: "Structured multi-week protocol with clear milestones",
    price: "$599",
    cta: "Get Help with Reactivity",
  },
  {
    title: "High-Risk Behaviors",
    href: "/services/high-risk",
    for: "Dogs with aggression, resource guarding, bite history",
    solves: "Safety concerns, escalating behaviors, cases other trainers have turned away",
    format: "Evaluation-gated, private intensive sessions",
    price: "$699",
    cta: "Book a Safety Evaluation",
  },
  {
    title: "Day Training",
    href: "/services/day-training",
    for: "Busy owners who need professional training during working hours",
    solves: "Behavior modification + obedience while you're at work",
    format: "Your dog trains with us during the day, we transfer skills to you in handoff sessions",
    price: "$799",
    cta: "Learn About Day Training",
  },
]

export default function ServicesPage() {
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
    <main className="min-h-screen bg-background">
      <Header />

      <div ref={contentRef}>
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 lg:mb-20">
            <h1 className="reveal opacity-0 font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance mb-6">
              Choose Your Training Path
            </h1>
            <p className="reveal opacity-0 animation-delay-200 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Every dog is different. Every path starts with understanding yours.
            </p>
          </div>

          <div className="space-y-8 lg:space-y-10">
            {services.map((service, index) => (
              <article
                key={service.href}
                className={`reveal opacity-0 ${
                  index === 1
                    ? "animation-delay-200"
                    : index === 2
                      ? "animation-delay-400"
                      : index === 3
                        ? "animation-delay-200"
                        : index === 4
                          ? "animation-delay-600"
                          : ""
                }`}
              >
                <div className="bg-card rounded-3xl border border-border/50 shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-300 overflow-hidden">
                  <div className="grid lg:grid-cols-2">
                    <div
                      className={`relative min-h-[240px] md:min-h-[300px] bg-gradient-to-br from-primary/20 via-secondary/10 to-muted flex items-center justify-center p-8 ${
                        index % 2 === 1 ? "lg:order-2" : ""
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                          <PawPrint className="w-7 h-7 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">[Image: {service.title}]</p>
                      </div>
                    </div>

                    <div className={`p-8 lg:p-10 flex flex-col ${index % 2 === 1 ? "lg:order-1" : ""}`}>
                      <h3 className="font-display text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-2">
                        {service.title}
                      </h3>
                      <p className="text-sm font-medium text-primary mb-4">{service.for}</p>
                      <p className="text-muted-foreground leading-relaxed mb-4 flex-grow">
                        {service.solves}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">{service.format}</p>
                      <p className="text-sm font-semibold text-foreground mb-6">
                        Starting at {service.price}
                      </p>
                      <Link href={service.href} className="block">
                        <Button className="w-full rounded-full group/btn">
                          {service.cta}
                          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                      <p className="text-xs text-muted-foreground mt-4 text-center">
                        Not sure which path?{" "}
                        <Link
                          href="/booking"
                          className="text-primary font-medium hover:underline underline-offset-4"
                        >
                          Book a free discovery call
                        </Link>{" "}
                        and we&apos;ll help you decide.
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 lg:py-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-border/50 shadow-lg bg-gradient-to-br from-primary/10 via-muted/30 to-secondary/10">
            <div className="relative px-8 lg:px-16 py-16 lg:py-24 text-center">
              <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-secondary font-medium mb-4">
                Need Guidance?
              </p>
              <h2 className="reveal opacity-0 animation-delay-200 font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground text-balance mb-6 max-w-3xl mx-auto">
                Not Sure Where to Start?
              </h2>
              <p className="reveal opacity-0 animation-delay-400 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10">
                Book a free 15-minute discovery call. Tell us about your dog, and we&apos;ll help you
                find the right training path — no pressure, no commitment.
              </p>
              <div className="reveal opacity-0 animation-delay-600">
                <Link href="/booking">
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 text-base group"
                  >
                    Book Your Free Call
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>

      <Footer />
    </main>
  )
}
