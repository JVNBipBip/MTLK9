"use client"

import { useLocalizedText } from "@/lib/i18n/use-localized-text"
import type { InFacilityPriceSection } from "@/lib/in-facility-training-pricing"

export function InFacilityDetailPricing({
  section,
  variant = "panel",
}: {
  section: InFacilityPriceSection
  variant?: "panel" | "embed"
}) {
  const t = useLocalizedText()

  const inner = (
    <>
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground text-center mb-2">
        {t("In-facility · CAD + tax")}
      </p>
      <h2
        className={
          variant === "embed"
            ? "font-display text-lg font-semibold text-center text-foreground mb-4"
            : "font-display text-2xl font-semibold text-center text-foreground mb-6"
        }
      >
        {t(section.title)}
      </h2>
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden divide-y divide-border/50 shadow-sm text-left">
        {section.rows.map((row) => (
          <div key={row.label} className="px-4 py-3 sm:px-5 sm:py-3.5">
            <div className="flex justify-between gap-4 items-start">
              <span className="text-sm text-muted-foreground leading-snug min-w-0">{t(row.label)}</span>
              <span className="text-sm font-semibold text-primary tabular-nums shrink-0">{row.price}</span>
            </div>
            {row.note ? <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{t(row.note)}</p> : null}
          </div>
        ))}
      </div>
    </>
  )

  if (variant === "embed") {
    return <div className="w-full max-w-md mx-auto mb-10">{inner}</div>
  }

  return (
    <section className="px-6 lg:px-8 py-14 lg:py-16 border-y border-border/40 bg-muted/20">
      <div className="max-w-lg mx-auto">{inner}</div>
    </section>
  )
}
