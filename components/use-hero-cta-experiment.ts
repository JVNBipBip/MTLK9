"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import posthog from "posthog-js"
import { useAppLocale } from "@/components/locale-provider"
import {
  getOrCreateHeroCtaVariant,
  heroCtaExperimentProperties,
  heroCtaLabel,
  type HeroCtaVariant,
} from "@/lib/hero-cta-experiment"

export function useHeroCtaExperiment() {
  const locale = useAppLocale()
  const path = usePathname() || "/"
  const ctaRef = useRef<HTMLDivElement>(null)
  const assignmentRef = useRef<HeroCtaVariant | null>(null)
  const viewedRef = useRef(false)
  const [variant, setVariant] = useState<HeroCtaVariant | null>(null)

  useEffect(() => {
    assignmentRef.current ||= getOrCreateHeroCtaVariant()
    const assignment = assignmentRef.current
    posthog.register(heroCtaExperimentProperties(assignment))
    setVariant(assignment)
  }, [])

  const trackView = useCallback(() => {
    if (!variant || viewedRef.current) return
    viewedRef.current = true
    posthog.capture("hero_cta_experiment_viewed", {
      ...heroCtaExperimentProperties(variant), locale, path,
    })
  }, [variant, locale, path])

  useEffect(() => {
    if (!variant || !ctaRef.current) return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.5)) {
        trackView()
        observer.disconnect()
      }
    }, { threshold: 0.5 })
    observer.observe(ctaRef.current)
    return () => observer.disconnect()
  }, [variant, trackView])

  const trackCtaClick = useCallback(() => {
    if (!variant) return
    trackView()
    posthog.capture("hero_cta_clicked", {
      ...heroCtaExperimentProperties(variant), locale, path,
      action: "inquiry", cta_text: heroCtaLabel(variant),
    })
  }, [variant, locale, path, trackView])

  return { variant, ctaRef, trackCtaClick }
}
