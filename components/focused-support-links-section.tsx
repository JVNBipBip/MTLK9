"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useAppLocale } from "@/components/locale-provider"
import { addLocaleToPathname } from "@/lib/i18n/config"

type LocalizedCopy = {
  en: string
  fr: string
}

export type FocusedSupportLink = {
  href: string
  title: LocalizedCopy
  body: LocalizedCopy
}

export function FocusedSupportLinksSection({
  eyebrow,
  title,
  intro,
  links,
}: {
  eyebrow: LocalizedCopy
  title: LocalizedCopy
  intro: LocalizedCopy
  links: FocusedSupportLink[]
}) {
  const locale = useAppLocale()

  return (
    <section className="bg-muted/30 px-6 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="reveal opacity-0 mb-4 text-sm font-medium uppercase tracking-[0.2em] text-secondary">
            {eyebrow[locale]}
          </p>
          <h2 className="reveal opacity-0 animation-delay-200 text-balance font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {title[locale]}
          </h2>
          <p className="reveal opacity-0 animation-delay-400 mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            {intro[locale]}
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {links.map((link, index) => (
            <Link
              key={link.href}
              href={addLocaleToPathname(link.href, locale)}
              className={`reveal opacity-0 group rounded-3xl border border-border/50 bg-card p-6 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/30 ${
                index === 1 ? "animation-delay-200" : index === 2 ? "animation-delay-400" : ""
              }`}
            >
              <h3 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                {link.title[locale]}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                {link.body[locale]}
              </p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary">
                {locale === "fr" ? "Voir le programme" : "View program"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
