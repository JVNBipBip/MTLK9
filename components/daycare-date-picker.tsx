"use client";
import { ChevronDown } from "lucide-react";
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
  const label = (day: string) =>
    new Date(day + "T12:00:00Z").toLocaleDateString(fr ? "fr-CA" : "en-CA", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "America/Toronto",
    });
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
        {t("First date to book", "Première date à réserver")}
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
                {label(d.date)} · {d.remaining}{" "}
                {t("spots available", "places disponibles")}
              </option>
            ))}
        </DaycareSelect>
      </label>
      {first && limit > 1 && (
        <>
          <p className="text-sm leading-relaxed">
            {t(
              "Tap the other dates you want, or select the next available dates together.",
              "Cochez les autres dates souhaitées ou sélectionnez les prochaines disponibilités en un clic.",
            )}
            {until && (
              <>
                {" "}
                {t("Book through", "Jusqu’au")} <strong>{label(until)}</strong>.
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
              className="min-h-11 rounded-lg border border-current px-3 text-sm font-semibold"
            >
              {t(
                "Select next available dates",
                "Choisir les prochaines dates disponibles",
              )}
            </button>
          </div>
          <div
            className="grid grid-cols-2 gap-2 sm:grid-cols-3"
            aria-label={t("Available dates", "Dates disponibles")}
          >
            {days.map((day) => {
              const picked = dates.includes(day.date);
              return (
                <label
                  key={day.date}
                  className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-current/25 p-2.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-secondary has-[:checked]:text-foreground has-[:disabled]:cursor-default"
                >
                  <input
                    type="checkbox"
                    className="size-4 shrink-0 accent-primary"
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
                  <span>
                    {label(day.date)}
                    {!canUseDay(day.date) && (
                      <small className="block">
                        {t("Unavailable", "Non disponible")}
                      </small>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </>
      )}
    </fieldset>
  );
}
