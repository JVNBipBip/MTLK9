"use client"

import { useLocalizedText } from "@/lib/i18n/use-localized-text"

export function GroupClassesBookLoading() {
  const t = useLocalizedText()
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-xl shadow-primary/10 animate-pulse text-muted-foreground text-sm text-center">
      {t("Loading group classes…")}
    </div>
  )
}
