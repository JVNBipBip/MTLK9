"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type ServiceForYouSectionProps = {
  items: string[]
}

function AnimatedCheck({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 52 52"
      className="h-10 w-10 md:h-12 md:w-12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="26"
        cy="26"
        r="24"
        stroke="currentColor"
        strokeWidth="2"
        className={`text-primary/30 transition-all duration-500 ${active ? "opacity-100" : "opacity-40"}`}
      />
      <circle
        cx="26"
        cy="26"
        r="24"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeDasharray="150.8"
        strokeDashoffset={active ? "0" : "150.8"}
        strokeLinecap="round"
        className="text-primary transition-all duration-700 ease-out"
        style={{ transitionDelay: "100ms" }}
      />
      <path
        d="M15 27l7 7 15-16"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="38"
        strokeDashoffset={active ? "0" : "38"}
        className="text-primary transition-all duration-500 ease-out"
        style={{ transitionDelay: "350ms" }}
      />
    </svg>
  )
}

export function ServiceForYouSection({ items }: ServiceForYouSectionProps) {
  const itemsRef = useRef<Array<HTMLElement | null>>([])
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({})

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const idx = Number((entry.target as HTMLElement).dataset.forYouIndex)
          if (Number.isNaN(idx)) return
          setCheckedItems((prev) => (prev[idx] ? prev : { ...prev, [idx]: true }))
        })
      },
      { threshold: 0.35 },
    )

    itemsRef.current.forEach((item) => {
      if (item) observer.observe(item)
    })

    return () => observer.disconnect()
  }, [items.length])

  return (
    <section className="py-20 lg:py-28 px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="reveal opacity-0 font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-10">
          This is for you if…
        </h2>

        <div className="space-y-10 md:space-y-12">
          {items.map((item, index) => {
            const isActive = !!checkedItems[index]
            return (
              <article
                key={item}
                ref={(el) => {
                  itemsRef.current[index] = el
                }}
                data-for-you-index={index}
                className={`reveal opacity-0 flex flex-col ${
                  index % 2 === 1 ? "items-end text-right" : "items-start text-left"
                } ${
                  index === 1
                    ? "animation-delay-200"
                    : index === 2
                      ? "animation-delay-400"
                      : index === 3
                        ? "animation-delay-200"
                        : index >= 4
                          ? "animation-delay-600"
                          : ""
                }`}
              >
                <div className="mb-4">
                  <AnimatedCheck active={isActive} />
                </div>
                <p className="font-display text-2xl md:text-3xl lg:text-4xl tracking-tight leading-tight text-foreground max-w-3xl">
                  {item}
                </p>
                <div
                  className={`mt-5 h-[2px] bg-primary w-24 md:w-48 transition-transform duration-600 ease-out ${
                    isActive ? "scale-x-100" : "scale-x-0"
                  } ${index % 2 === 1 ? "origin-left ml-auto" : "origin-right mr-auto"}`}
                  style={{ transitionDelay: "400ms", transitionDuration: "600ms" }}
                />
              </article>
            )
          })}
        </div>

        <div className="reveal opacity-0 animation-delay-600 mt-12 text-center">
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
