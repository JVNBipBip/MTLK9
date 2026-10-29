import posthog from "posthog-js"
import { heroCtaExperimentProperties } from "@/lib/hero-cta-experiment"

const privateDaycarePage = typeof window !== "undefined" && /^\/(?:en\/|fr\/)?daycare\/(?:apply|book)(?:\/|$)/.test(window.location.pathname)
if (typeof window !== "undefined" && !privateDaycarePage && process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-01-30",
    debug: false,
    // Intake contains contact, emergency and dog-health details. Keep them out of replay/network capture.
    session_recording: {
      blockClass: "ph-no-capture",
      maskAllInputs: true,
      recordBody: false,
      recordHeaders: false,
      maskCapturedNetworkRequestFn: (request) => request.name.includes("/api/daycare/") ? undefined : request,
    },
  })
  const experiment = heroCtaExperimentProperties()
  if (experiment.hero_cta_variant) posthog.register(experiment)
  else {
    posthog.unregister("hero_cta_experiment")
    posthog.unregister("hero_cta_variant")
  }
}
