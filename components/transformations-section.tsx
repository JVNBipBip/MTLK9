"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollAnimatedText } from "@/components/scroll-animated-text"

const transformations = [
  {
    dogName: "Luna",
    breed: "German Shepherd Mix",
    before:
      "Luna lunged at every dog on the street. Her owner hadn't had a guest over in 8 months.",
    after:
      "Luna now walks calmly through the park. Guests come over every weekend.",
    imagePlaceholder:
      "[Photo: Luna walking on a loose leash through Parc Maisonneuve, owner smiling beside her]",
    path: "Reactivity & Anxiety",
    href: "/results",
  },
  {
    dogName: "Milo",
    breed: "French Bulldog",
    before:
      "Milo pulled so hard on walks his owner stopped taking him out. He destroyed furniture when left alone.",
    after:
      "Milo heels on a loose leash and settles calmly when his owner leaves for work.",
    imagePlaceholder:
      "[Photo: Milo heeling beside owner on a Montreal sidewalk, café tables in background]",
    path: "City Manners",
    href: "/results",
  },
  {
    dogName: "Bella",
    breed: "Rescue Pit Bull",
    before:
      "Bella resource-guarded food and toys. The family had a new baby on the way and were terrified.",
    after:
      "Bella is now gentle around the baby. The family kept their dog — and their peace of mind.",
    imagePlaceholder:
      "[Photo: Bella relaxing calmly on a blanket at Parc Angrignon, family nearby]",
    path: "High-Risk Behaviors",
    href: "/results",
  },
]

export function TransformationsSection() {
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
            Real Results
          </p>
          <ScrollAnimatedText
            text="Transformation stories"
            className="font-display text-3xl md:text-5xl lg:text-7xl text-foreground text-balance mb-6 font-semibold tracking-tight"
          />
          <p className="reveal opacity-0 animation-delay-400 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Every dog on this page started exactly where yours is now.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {transformations.map((story, index) => (
            <div
              key={story.dogName}
              className={`reveal opacity-0 ${index === 1 ? "animation-delay-200" : index === 2 ? "animation-delay-400" : ""} group`}
            >
              <div className="bg-card rounded-3xl overflow-hidden border border-border/50 shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 h-full flex flex-col">
                {/* Video/Image Placeholder */}
                <div className="relative aspect-[16/10] bg-muted flex items-center justify-center overflow-hidden">
                  <div className="text-center px-6">
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/30 transition-colors">
                      <Play className="w-6 h-6 text-primary ml-0.5" />
                    </div>
                    <p className="text-xs text-muted-foreground">{story.imagePlaceholder}</p>
                  </div>
                </div>

                <div className="p-6 lg:p-8 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-foreground">
                        {story.dogName}
                      </h3>
                      <p className="text-sm text-muted-foreground">{story.breed}</p>
                    </div>
                    <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                      {story.path}
                    </span>
                  </div>

                  <div className="space-y-4 flex-1">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-destructive mb-1">
                        Before
                      </p>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {story.before}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-primary mb-1">
                        After
                      </p>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {story.after}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={story.href}
                    className="text-primary text-sm font-medium flex items-center gap-2 mt-6 group-hover:gap-3 transition-all"
                  >
                    Read full story
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/results">
            <Button variant="outline" className="rounded-full px-8 group">
              See All Results
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
