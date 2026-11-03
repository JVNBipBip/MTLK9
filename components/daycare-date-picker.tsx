"use client";
import { Check, ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { lastBundleDay, type DaycareDateWindow } from "@/lib/daycare-plan";
import type { DaycarePortal } from "@/lib/daycare-portal-types";

export function DaycareSelect({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative mt-2 block">
      <select
        {...props}
        className={className + " !mt-0 min-h-12 appearance-none !pr-12"}
      />
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3.5 top-1/2 size-6 -translate-y-1/2 stroke-[2.5] text-foreground"
      />
    </span>
  );
}

export function DaycareDatePicker({
  availability,
  windows,
  limit,
  dates,
  onChange,
  canUseDay,
  locale,
  disabled = false,
  preview = false,
}: {
  availability: DaycarePortal["availability"];
  windows: DaycareDateWindow[];
  limit: number;
  dates: string[];
  onChange: (dates: string[]) => void;
  canUseDay: (date: string) => boolean;
  locale: "en" | "fr";
  disabled?: boolean;
  preview?: boolean;
}) {
  const fr = locale === "fr",
    t = (en: string, french: string) => (fr ? french : en);
  const format = (day: string, options: Intl.DateTimeFormatOptions) =>
    new Date(day + "T12:00:00Z").toLocaleDateString(fr ? "fr-CA" : "en-CA", { ...options, timeZone: "America/Toronto" });
  const label = (day: string) => format(day, { weekday: "short", month: "short", day: "numeric" });
  const first = dates[0] || "";
  const validFirst = (d: string) =>
    windows.every((w) => {
      const end = lastBundleDay(w, d);
      return d <= end && (!w.lastVisitDate || w.lastVisitDate <= end);
    });
  const until =
    first && windows.length
      ? windows.map((w) => lastBundleDay(w, first)).sort()[0]
      : "";
  const days = first
    ? availability.filter((d) => d.date >= first && (!until || d.date <= until))
    : [];
  const eligible = days.filter((d) => canUseDay(d.date));
  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-3">
      <legend className="font-semibold">
        {preview
          ? t("Plan your dates", "Planifiez vos dates")
          : t("Choose your visit dates", "Choisissez vos dates de visite")}
      </legend>
      <label className="block text-sm font-medium">
        {limit > 1 ? t("First date", "Première date") : t("Date", "Date")}
        <DaycareSelect
          required={!preview}
          aria-label={t("First visit date", "Première date de visite")}
          className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base text-foreground"
          value={first}
          onChange={(e) => onChange(e.target.value ? [e.target.value] : [])}
        >
          <option value="">{t("Choose a day", "Choisir un jour")}</option>
          {availability
            .filter((d) => validFirst(d.date) || first === d.date)
            .map((d) => (
              <option key={d.date} value={d.date} disabled={!canUseDay(d.date)}>
                {label(d.date)} · {d.remaining} {t("spots left", "places")}
              </option>
            ))}
        </DaycareSelect>
      </label>
      {first && limit > 1 && (
        <>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(
              "Tap the other dates you want, or fill the next available dates in one click.",
              "Touchez les autres dates souhaitées, ou remplissez les prochaines disponibilités en un clic.",
            )}
            {until && (
              <>
                {" "}
                {t("Book through", "Jusqu’au")} <strong>{label(until)}</strong>{label(until).endsWith(".") ? "" : "."}
              </>
            )}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span aria-live="polite" className="text-sm font-semibold">
              {dates.length} / {limit} {t("dates selected", "dates choisies")}
            </span>
            <button
              type="button"
              disabled={!eligible.length || !canUseDay(first)}
              onClick={() =>
                onChange(eligible.slice(0, limit).map((d) => d.date))
              }
              className="min-h-11 rounded-full border border-primary/40 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 disabled:opacity-50"
            >
              {t(
                "Select next available dates",
                "Choisir les prochaines dates disponibles",
              )}
            </button>
          </div>
          <div
            className="grid grid-cols-3 gap-2 sm:grid-cols-4"
            aria-label={t("Available dates", "Dates disponibles")}
          >
            {days.map((day) => {
              const picked = dates.includes(day.date);
              const usable = canUseDay(day.date);
              return (
                <label
                  key={day.date}
                  className={`relative flex min-h-14 min-w-0 items-center rounded-xl border px-2.5 py-2 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${picked ? "border-primary bg-primary text-primary-foreground" : usable && dates.length < limit ? "cursor-pointer border-border bg-background hover:border-primary/50" : "border-dashed border-border text-muted-foreground"}`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={picked}
                    disabled={
                      day.date === first ||
                      (!picked &&
                        (dates.length >= limit || !canUseDay(day.date)))
                    }
                    onChange={() =>
                      onChange(
                        picked
                          ? dates.filter((d) => d !== day.date)
                          : [...dates, day.date].sort(),
                      )
                    }
                  />
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block text-xs font-semibold uppercase tracking-wide opacity-80">{format(day.date, { weekday: "short" })}</span>
                    <span className="block whitespace-nowrap font-semibold">{format(day.date, { month: "short", day: "numeric" })}</span>
                    {!usable && !picked && (
                      <small className="block">{t("Unavailable", "Non disponible")}</small>
                    )}
                  </span>
                  {picked && <Check aria-hidden className="absolute top-2 right-2 size-3.5" />}
                </label>
              );
            })}
          </div>
        </>
      )}
    </fieldset>
  );
}
