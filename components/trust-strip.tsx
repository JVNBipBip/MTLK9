"use client"

import { useEffect, useRef } from "react"
import { Shield, MapPin, Users, Star, Clock } from "lucide-react"

const trustItems = [
  { icon: Clock, text: "10–15+ Years Experience" },
  { icon: Star, text: "5-Star Google Reviews" },
  { icon: Shield, text: "Humane, Evidence-Guided Methods" },
  { icon: MapPin, text: "Real-World Training — Not a Classroom" },
  { icon: Users, text: "A Team of 4 Specialists" },
]

export function TrustStrip() {
  const sectionRef = useRef<HTMLDivElement>(null)

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

    const elements = sectionRef.current?.querySelectorAll(".reveal")
    elements?.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={sectionRef} className="py-12 lg:py-16 bg-muted/30 border-y border-border/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="reveal opacity-0 flex flex-wrap justify-center gap-x-10 gap-y-6">
          {trustItems.map((item) => (
            <div key={item.text} className="flex items-center gap-2.5 text-muted-foreground">
              <item.icon className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm font-medium whitespace-nowrap">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
