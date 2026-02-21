# Approach Section - Component Backup

This file contains the complete code for the `ApproachSection` component for reference and potential redesign.

## Component Path
- **File:** `/components/approach-section.tsx`
- **DOM ID:** `#approach`
- **React Component:** `ApproachSection`

---

## Full Component Code

```tsx
"use client"

import { useRef, useEffect, useState } from "react"
import { HighlightText } from "@/components/highlight-text"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export function ApproachSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const principlesRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  const principles = [
    {
      number: "01",
      titleParts: [
        { text: "MOMENTS", highlight: true },
        { text: " UNIQUES", highlight: false },
      ],
      description:
        "Chaque spectacle est conçu sur mesure pour créer des souvenirs inoubliables adaptés à votre événement.",
      align: "left",
    },
    {
      number: "02",
      titleParts: [
        { text: "PROXIMITÉ", highlight: true },
        { text: " & INTERACTION", highlight: false },
      ],
      description: "La magie close-up crée une connexion intime. Vos invités deviennent acteurs du spectacle.",
      align: "right",
    },
    {
      number: "03",
      titleParts: [
        { text: "EXPERTISE ", highlight: false },
        { text: "LOCALE", highlight: true },
      ],
      description: "Basé à Montréal, je connais la scène événementielle locale et m'adapte à vos besoins spécifiques.",
      align: "left",
    },
    {
      number: "04",
      titleParts: [
        { text: "TRANSMISSION ", highlight: false },
        { text: "PASSION", highlight: true },
      ],
      description: "Mes cours de magie partagent non seulement des techniques, mais aussi l'art de captiver un public.",
      align: "right",
    },
  ]

  useEffect(() => {
    // Detect mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (!sectionRef.current || !headerRef.current || !principlesRef.current) return

    // Force a refresh to ensure ScrollTrigger detects elements properly
    setTimeout(() => ScrollTrigger.refresh(), 100)

    const ctx = gsap.context(() => {
      // Simpler, more reliable animations for both mobile and desktop
      const animationDistance = isMobile ? 30 : 60 // Smaller movement on mobile
      const animationDuration = isMobile ? 0.6 : 0.8 // Faster on mobile

      gsap.fromTo(
        headerRef.current,
        { y: 20, opacity: 0 }, // Use Y instead of X for more reliable mobile performance
        {
          y: 0,
          opacity: 1,
          duration: animationDuration,
          ease: "power2.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: isMobile ? "top 95%" : "top 80%", // More aggressive trigger on mobile
            once: true,
            immediateRender: false,
          },
        }
      )

      const articles = principlesRef.current?.querySelectorAll("article")
      articles?.forEach((article, index) => {
        gsap.fromTo(
          article,
          { y: 30, opacity: 0 }, // Simple vertical movement for reliability
          {
            y: 0,
            opacity: 1,
            duration: animationDuration,
            ease: "power2.out",
            delay: index * 0.1, // Stagger effect
            scrollTrigger: {
              trigger: article,
              start: isMobile ? "top 95%" : "top 80%",
              once: true,
              immediateRender: false,
            },
          }
        )
      })
    }, sectionRef)

    return () => {
      ctx.revert()
      ScrollTrigger.refresh()
    }
  }, [isMobile])

  return (
    <section ref={sectionRef} id="approach" className="relative pt-12 pb-12 md:pt-16 md:pb-16 pl-6 md:pl-28 pr-6 md:pr-12">
      <div ref={headerRef} className="mb-24">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">03 / Approche</span>
        <h2 className="mt-4 font-[var(--font-bebas)] text-5xl md:text-7xl tracking-tight">POURQUOI MOI</h2>
      </div>

      <div ref={principlesRef} className="space-y-24 md:space-y-32">
        {principles.map((principle, index) => (
          <article
            key={index}
            className={`flex flex-col ${
              principle.align === "right" ? "items-end text-right" : "items-start text-left"
            }`}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
              {principle.number} / {principle.titleParts[0].text.split(" ")[0]}
            </span>

            <h3 className="font-[var(--font-bebas)] text-4xl md:text-6xl lg:text-8xl tracking-tight leading-none">
              {principle.titleParts.map((part, i) =>
                part.highlight ? (
                  <HighlightText key={i} parallaxSpeed={0.6}>
                    {part.text}
                  </HighlightText>
                ) : (
                  <span key={i}>{part.text}</span>
                ),
              )}
            </h3>

            <p className="mt-6 max-w-md font-mono text-sm text-muted-foreground leading-relaxed">
              {principle.description}
            </p>

            <div className={`mt-8 h-[1px] bg-border w-24 md:w-48 ${principle.align === "right" ? "mr-0" : "ml-0"}`} />
          </article>
        ))}
      </div>

      {/* CTA Button */}
      <div className="mt-24 flex justify-center">
        <a
          href="#contact"
          className="inline-flex items-center gap-2 bg-accent px-8 py-4 font-mono text-xs uppercase tracking-widest text-background hover:bg-accent/90 hover:scale-105 transition-all duration-300 shadow-lg shadow-accent/20"
        >
          Réserver
          <span className="text-lg">→</span>
        </a>
      </div>
    </section>
  )
}
```

---

## Component Structure

### Dependencies
- `react` - useRef, useEffect, useState
- `@/components/highlight-text` - HighlightText component for gold highlighting
- `gsap` - Animation library
- `gsap/ScrollTrigger` - Scroll-based animations

### Key Features
1. **Responsive Animations** - Different animations for mobile vs desktop
2. **Scroll Triggers** - Content animates into view on scroll
3. **Alternating Layout** - Articles alternate between left and right alignment
4. **Gold Highlights** - Specific words highlighted in gold accent color
5. **CTA Button** - "Réserver" button at the bottom

### Animation Settings
- **Mobile:** 
  - Movement: 30px vertical
  - Duration: 0.6s
  - Trigger: top 95%
  
- **Desktop:**
  - Movement: 60px vertical
  - Duration: 0.8s
  - Trigger: top 80%

### Styling Classes
- Section: `pt-12 pb-12 md:pt-16 md:pb-16 pl-6 md:pl-28 pr-6 md:pr-12`
- Header: `mb-24`
- Principles: `space-y-24 md:space-y-32`
- Titles: `text-4xl md:text-6xl lg:text-8xl`

---

## Content Data

The `principles` array contains 4 items:
1. **MOMENTS UNIQUES** - Custom tailored shows
2. **PROXIMITÉ & INTERACTION** - Close-up magic creates intimate connection
3. **EXPERTISE LOCALE** - Montreal-based, local expertise
4. **TRANSMISSION PASSION** - Magic courses share techniques and performance art

---

## Usage Notes

To redesign this section:
1. Keep the same data structure in the `principles` array
2. Maintain the ref structure for animations
3. Update className strings for styling changes
4. Test animations on both mobile and desktop
5. Ensure ScrollTrigger.refresh() is called after DOM changes

---

**Backup Date:** 2026-02-20
**Component Version:** Latest with mobile-optimized animations
