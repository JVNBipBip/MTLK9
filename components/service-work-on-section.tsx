"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

type ServiceWorkOnSectionProps = {
  goals: string[]
}

export function ServiceWorkOnSection({ goals }: ServiceWorkOnSectionProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    const updateActiveIndex = () => {
      const items = Array.from(scroller.querySelectorAll("[data-goal-card]"))
      if (!items.length) return
      const scrollLeft = scroller.scrollLeft

      let closestIndex = 0
      let closestDistance = Number.POSITIVE_INFINITY

      items.forEach((item, index) => {
        const distance = Math.abs((item as HTMLElement).offsetLeft - scrollLeft)
        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      })

      setActiveIndex(closestIndex)
    }

    updateActiveIndex()
    scroller.addEventListener("scroll", updateActiveIndex, { passive: true })
    return () => scroller.removeEventListener("scroll", updateActiveIndex)
  }, [])

  const goToSlide = (index: number) => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const items = Array.from(scroller.querySelectorAll("[data-goal-card]"))
    const target = items[index] as HTMLElement | undefined
    if (!target) return
    scroller.scrollTo({ left: target.offsetLeft, behavior: "smooth" })
  }

  return (
    <section className="py-20 lg:py-28 px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <h2 className="reveal opacity-0 font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-8">
          What we&apos;ll work on
        </h2>

        <div className="reveal opacity-0">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-xs md:text-sm uppercase tracking-[0.14em] text-muted-foreground/80">
              Swipe/Scroll to see each focus area
            </p>
            <div className="hidden lg:flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToSlide(Math.max(0, activeIndex - 1))}
                disabled={activeIndex === 0}
                className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-border/60 bg-card text-foreground transition-colors hover:bg-muted disabled:opacity-45 disabled:cursor-not-allowed"
                aria-label="Previous goal"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => goToSlide(Math.min(goals.length - 1, activeIndex + 1))}
                disabled={activeIndex === goals.length - 1}
                className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-border/60 bg-card text-foreground transition-colors hover:bg-muted disabled:opacity-45 disabled:cursor-not-allowed"
                aria-label="Next goal"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div ref={scrollerRef} className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2">
            {goals.map((goal, index) => (
              <article
                key={goal}
                data-goal-card
                className="snap-start shrink-0 w-[88%] sm:w-[70%] lg:w-[32%] group bg-card rounded-3xl border border-border/50 shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-500 overflow-hidden"
              >
                <div className="p-7 md:p-8 min-h-[220px] flex flex-col">
                  <p className="text-xs uppercase tracking-[0.16em] text-secondary font-semibold mb-3">
                    Training Focus
                  </p>
                  <h3 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-4">
                    {goal}
                  </h3>
                  <p className="text-muted-foreground text-base leading-relaxed mt-auto">
                    Clear steps, real-world reps, and practical homework to build lasting behavior.
                  </p>
                  <Check className="w-5 h-5 text-primary mt-5" />
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2.5">
            {goals.map((goal, index) => (
              <button
                key={goal}
                type="button"
                onClick={() => goToSlide(index)}
                className={`h-2.5 rounded-full transition-all ${
                  index === activeIndex ? "w-7 bg-primary" : "w-2.5 bg-border hover:bg-muted-foreground/40"
                }`}
                aria-label={`Go to goal ${index + 1}`}
              />
            ))}
            <span className="ml-2 text-xs font-medium tracking-wide text-muted-foreground">
              {activeIndex + 1} / {goals.length}
            </span>
          </div>
        </div>

        <div className="reveal opacity-0 animation-delay-600 mt-10 text-center">
          <Link href="/booking">
            <Button className="rounded-full px-6 py-5 text-sm md:text-base group">
              Book a Free Discovery Call
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
