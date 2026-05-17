"use client"

import { useLocalizedText } from "@/lib/i18n/use-localized-text"

export function GroupClassesBookHero() {
  const t = useLocalizedText()

  return (
    <section className="relative overflow-hidden px-6 lg:px-8 pt-28 pb-10 lg:pt-36 lg:pb-12">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-muted/30 to-secondary/10"
        aria-hidden="true"
      />
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground text-balance mb-4">
          {t("Your class link")}
        </h1>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          {t(
            "This page opened from your trainer’s email. Your details are filled in below—give us a moment to confirm access, then you can request your spot.",
          )}
        </p>
      </div>
    </section>
  )
}
