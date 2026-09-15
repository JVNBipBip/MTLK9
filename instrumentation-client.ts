import posthog from "posthog-js"
import { heroCtaExperimentProperties } from "@/lib/hero-cta-experiment"

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-01-30",
    debug: process.env.NODE_ENV === "development",
  })
  const experiment = heroCtaExperimentProperties()
  if (experiment.hero_cta_variant) posthog.register(experiment)
  else {
    posthog.unregister("hero_cta_experiment")
    posthog.unregister("hero_cta_variant")
  }
}
