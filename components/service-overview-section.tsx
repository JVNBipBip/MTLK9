"use client"

import type { ReactNode } from "react"
import { Check } from "lucide-react"
import type { InFacilityPriceRow } from "@/lib/in-facility-training-pricing"
import { useLocalizedText } from "@/lib/i18n/use-localized-text"
import { useAppLocale } from "@/components/locale-provider"
import { PriceTag } from "@/components/price-tag"

type ServiceOverviewSectionProps = {
  eyebrow: string
  title: string
  intro?: string
  items?: string[]
  body?: string
  calloutLabel?: string
  calloutText?: string
  pricingRows?: InFacilityPriceRow[]
  /** Side-by-side column in a split overview row (no full-width section wrapper). */
  layout?: "default" | "column"
  /** Makes the copy owner-editable: key is "eyebrow", "title", "intro" or "items.<n>". */
  edit?: (key: string, english: string) => ReactNode
}

function OverviewContent({
  items,
  body,
  calloutLabel,
  calloutText,
  pricingRows,
  edit,
}: Pick<
  ServiceOverviewSectionProps,
  "items" | "body" | "calloutLabel" | "calloutText" | "pricingRows" | "edit"
>) {
  const t = useLocalizedText()
  const locale = useAppLocale()
  const hasPricing = pricingRows && pricingRows.length > 0

  return (
    <article className="reveal opacity-0 animation-delay-200 bg-card rounded-3xl border border-border/50 shadow-lg shadow-primary/5 p-8 md:p-10 h-full">
      {items && items.length > 0 ? (
        <ul className="space-y-4">
          {items.map((item, index) => (
            <li key={item} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <span className="text-muted-foreground text-base md:text-lg leading-relaxed">{edit ? edit(`items.${index}`, item) : t(item)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {body ? (
        <p className="text-muted-foreground text-base md:text-lg leading-relaxed">{t(body)}</p>
      ) : null}

      {calloutLabel && calloutText ? (
        <div className={`${items?.length || body ? "mt-8 pt-8 border-t border-border/50" : ""}`}>
          <p className="text-xs uppercase tracking-[0.16em] text-secondary font-semibold mb-3">
            {t(calloutLabel)}
          </p>
          <p className="font-display text-xl md:text-2xl tracking-tight leading-snug text-foreground">
            {t(calloutText)}
          </p>
        </div>
      ) : null}

      {hasPricing ? (
        <div
          className={`space-y-4 ${
            items?.length || body || (calloutLabel && calloutText) ? "mt-8 pt-8 border-t border-border/50" : ""
          }`}
        >
          <p className="text-xs uppercase tracking-[0.16em] text-secondary font-semibold mb-1">
            {t("Pricing")}
          </p>
          {pricingRows.map((row) => (
            <div key={row.label}>
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4">
                <p className="font-display text-lg md:text-xl tracking-tight text-foreground">{t(row.label)}</p>
                <p className="text-muted-foreground text-base md:text-lg tabular-nums"><PriceTag locale={locale} price={t(row.price)} compareAt={row.compareAt && t(row.compareAt)} /></p>
              </div>
              {row.note ? (
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{t(row.note)}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </article>
  )
}

export function ServiceOverviewSection({
  eyebrow,
  title,
  intro,
  items,
  body,
  calloutLabel,
  calloutText,
  pricingRows,
  layout = "default",
  edit,
}: ServiceOverviewSectionProps) {
  const t = useLocalizedText()
  const show = (key: string, english: string) => (edit ? edit(key, english) : t(english))

  if (layout === "column") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="reveal opacity-0 font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground text-balance">
            {show("title", title)}
          </h2>
          {intro ? (
            <p className="reveal opacity-0 animation-delay-200 mt-4 text-base text-muted-foreground leading-relaxed">
              {show("intro", intro)}
            </p>
          ) : null}
        </div>
        <OverviewContent
          items={items}
          body={body}
          calloutLabel={calloutLabel}
          calloutText={calloutText}
          pricingRows={pricingRows}
          edit={edit}
        />
      </div>
    )
  }

  return (
    <section className="py-20 lg:py-28 px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-secondary font-medium mb-4">
              {show("eyebrow", eyebrow)}
            </p>
            <h2 className="reveal opacity-0 animation-delay-200 font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground text-balance mb-6">
              {show("title", title)}
            </h2>
            {intro ? (
              <p className="reveal opacity-0 animation-delay-400 text-lg text-muted-foreground leading-relaxed">
                {show("intro", intro)}
              </p>
            ) : null}
          </div>

          <div className="lg:col-span-7">
            <OverviewContent
              items={items}
              body={body}
              calloutLabel={calloutLabel}
              calloutText={calloutText}
              pricingRows={pricingRows}
              edit={edit}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
