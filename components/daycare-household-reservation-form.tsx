"use client";
import { useRef, useState } from "react";
import { torontoDate, validateSlot } from "@/lib/daycare-booking";
import { lastBundleDay, type DaycareDateWindow } from "@/lib/daycare-plan";
import { DaycareDatePicker, DaycareSelect } from "./daycare-date-picker";
import type { DaycareReservation } from "@/lib/daycare-household";
import {
  bookableDaycarePasses,
  type DaycarePortal,
} from "@/lib/daycare-portal-types";

export function DaycareHouseholdReservationForm({
  dogs,
  availability,
  locale,
  busy,
  onBook,
}: {
  dogs: DaycarePortal["dogs"];
  availability: DaycarePortal["availability"];
  locale: "en" | "fr";
  busy: boolean;
  onBook: (
    requestId: string,
    reservations: DaycareReservation[],
  ) => Promise<boolean>;
}) {
  const fr = locale === "fr",
    t = (en: string, french: string) => (fr ? french : en);
  const [selected, setSelected] = useState(() => {
    const withPlan = dogs.filter((d) =>
      bookableDaycarePasses(d, torontoDate()).some(
        (p) => p.plannedDates?.length && !p.firstVisitDate,
      ),
    );
    return (withPlan.length ? withPlan : dogs).map((d) => d.id);
  });
  const [pickedDates, setDates] = useState<string[] | null>(null);
  const [choices, setChoices] = useState<
    Record<string, { passId?: string; arrival?: string; departure?: string }>
  >({});
  const [error, setError] = useState("");
  const request = useRef<{ signature: string; id: string } | null>(null);
  const today = torontoDate();
  const field =
    "mt-2 min-h-12 w-full rounded-xl border border-border bg-background px-3 py-3 text-base focus:outline-2 focus:outline-primary disabled:opacity-50";
  const picked = dogs.filter((dog) => selected.includes(dog.id));
  const choiceFor = (dog: DaycarePortal["dogs"][number]) => {
    const passes = bookableDaycarePasses(dog, today);
    const choice = choices[dog.id] || {};
    const plannedPass = passes.find(
      (p) => p.plannedDates?.length && !p.firstVisitDate,
    );
    const passId =
      choice.passId ??
      (plannedPass?.id || (passes.length === 1 ? passes[0].id : ""));
    const pass = passes.find((p) => p.id === passId);
    return {
      passes,
      pass,
      passId,
      arrival: choice.arrival || "07:30",
      departure:
        choice.departure || (pass?.stay === "half" ? "13:30" : "18:30"),
    };
  };
  const updateChoice = (id: string, values: (typeof choices)[string]) =>
    setChoices((current) => ({
      ...current,
      [id]: { ...current[id], ...values },
    }));
  const chosen = picked.map((dog) => ({ dog, ...choiceFor(dog) }));
  const ready = chosen.length > 0 && chosen.every((c) => c.pass);
  const limit = ready
    ? Math.min(...chosen.map((c) => c.pass!.remaining), 20)
    : 0;
  const windows: DaycareDateWindow[] = chosen.flatMap((c) =>
    c.pass
      ? [
          {
            ...c.pass,
            lastVisitDate: c.dog.bookings
              .filter((b) => b.passId === c.passId && b.status !== "cancelled")
              .map((b) => b.date)
              .sort()
              .pop(),
          },
        ]
      : [],
  );
  const canUseDay = (date: string) => {
    if (
      !ready ||
      (availability.find((d) => d.date === date)?.remaining || 0) <
        picked.length
    )
      return false;
    return chosen.every((c) => {
      if (c.dog.bookings.some((b) => b.status === "booked" && b.date === date))
        return false;
      try {
        validateSlot(
          { date, arrival: c.arrival, departure: c.departure },
          c.pass!.stay,
        );
        return true;
      } catch {
        return false;
      }
    });
  };
  const planned = ready
    ? (chosen[0].pass?.plannedDates || []).filter((d) =>
        chosen.every(
          (c) => !c.pass!.firstVisitDate && c.pass!.plannedDates?.includes(d),
        ),
      )
    : [];
  const dates = pickedDates ?? planned;
  const validSelection =
    ready &&
    dates.length > 0 &&
    dates.length <= limit &&
    dates.every(canUseDay) &&
    windows.every((w) => {
      const end = lastBundleDay(w, dates[0]);
      return (
        dates[dates.length - 1] <= end &&
        (!w.lastVisitDate || w.lastVisitDate <= end)
      );
    });
  return (
    <form
      className="mt-5 space-y-6"
      aria-busy={busy}
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        if (busy) return;
        if (!picked.length) {
          setError(
            t("Select at least one dog.", "Choisissez au moins un chien."),
          );
          return;
        }
        if (!validSelection) {
          setError(
            t(
              "Check your dates, hours and paid balances before confirming.",
              "Vérifiez vos dates, les heures et les soldes payés avant de confirmer.",
            ),
          );
          return;
        }
        const reservations = dates.flatMap((date) =>
          chosen.map((c) => ({
            applicationId: c.dog.id,
            passId: c.passId,
            slot: { date, arrival: c.arrival, departure: c.departure },
          })),
        );
        const signature = JSON.stringify(reservations);
        if (request.current?.signature !== signature)
          request.current = { signature, id: crypto.randomUUID() };
        if (await onBook(request.current.id, reservations)) {
          setDates([]);
          request.current = null;
        }
      }}
    >
      {dogs.length > 1 && (
        <fieldset disabled={busy}>
          <legend className="mb-3 font-semibold">
            {t("Who’s coming?", "Qui vient?")}
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {dogs.map((dog) => (
              <label
                key={dog.id}
                className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-border p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input
                  type="checkbox"
                  className="size-5 shrink-0 accent-primary"
                  checked={selected.includes(dog.id)}
                  onChange={(event) => {
                    setSelected((ids) =>
                      event.target.checked
                        ? [...ids, dog.id]
                        : ids.filter((id) => id !== dog.id),
                    );
                    setError("");
                  }}
                />
                <span className="min-w-0 break-words font-medium">
                  {dog.dogName}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {t(
              "Select both dogs to reserve together, or just one. Each dog uses its own paid visits.",
              "Sélectionnez les deux chiens pour réserver ensemble, ou un seul. Chaque chien utilise ses propres visites payées.",
            )}
          </p>
        </fieldset>
      )}
      {ready && (
        <DaycareDatePicker
          availability={availability}
          windows={windows}
          limit={limit}
          dates={dates}
          onChange={setDates}
          canUseDay={canUseDay}
          locale={locale}
          disabled={busy}
        />
      )}
      {ready && dates.length > 0 && !validSelection && (
        <p role="alert">
          {t(
            "One or more dates no longer fit. Adjust the hours or choose new dates before confirming.",
            "Certaines dates ne sont plus disponibles. Ajustez les heures ou choisissez de nouvelles dates avant de confirmer.",
          )}
        </p>
      )}
      {picked.map((dog) => {
        const choice = choiceFor(dog);
        return (
          <fieldset
            key={dog.id}
            disabled={busy}
            className="min-w-0 rounded-2xl border border-border p-4 sm:p-5"
          >
            <legend className="max-w-full px-1 text-lg font-semibold break-words">
              {dog.dogName}
            </legend>
            {!choice.passes.length ? (
              <p className="text-sm leading-relaxed">
                {t(
                  "This dog needs paid visits before booking.",
                  "Ce chien a besoin de visites payées avant de réserver.",
                )}{" "}
                <a
                  className="font-semibold text-primary underline underline-offset-4"
                  href="#daycare-purchases"
                >
                  {t("Add visits below", "Ajouter des visites ci-dessous")}
                </a>
              </p>
            ) : (
              <>
                <label className="block font-medium">
                  {t("Use a paid visit", "Utiliser une visite payée")}
                  <DaycareSelect
                    className={field}
                    required
                    value={choice.passId}
                    onChange={(event) => {
                      updateChoice(dog.id, {
                        passId: event.target.value,
                        departure: undefined,
                      });
                      setDates(null);
                    }}
                  >
                    <option value="">
                      {t("Select a balance", "Choisir un solde")}
                    </option>
                    {choice.passes.map((pass) => (
                      <option value={pass.id} key={pass.id}>
                        {pass.stay === "half"
                          ? t("Half day", "Demi-journée")
                          : t("Full day", "Journée complète")}{" "}
                        · {pass.remaining} {t("left", "restantes")}
                        {pass.addOns.length
                          ? " · " +
                            pass.addOns
                              .map(
                                (a) =>
                                  ({
                                    training: t("training", "entraînement"),
                                    treadmill: t("treadmill", "tapis roulant"),
                                    individual: t(
                                      "one-on-one play",
                                      "jeux individuels",
                                    ),
                                  })[a],
                              )
                              .join(", ")
                          : ""}
                        {pass.expiresOn
                          ? ` · ${t("until", "jusqu’au")} ${pass.expiresOn}`
                          : ""}
                      </option>
                    ))}
                  </DaycareSelect>
                </label>
                {choice.pass && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {choice.pass.stay === "half"
                      ? t(
                          "Up to 6 hours, including exactly 6 hours.",
                          "Jusqu’à 6 heures, incluant exactement 6 heures.",
                        )
                      : t(
                          "More than 6 hours, up to 11 hours.",
                          "Plus de 6 heures, jusqu’à 11 heures.",
                        )}
                  </p>
                )}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {(["arrival", "departure"] as const).map((key) => (
                    <label key={key} className="min-w-0 font-medium">
                      {key === "arrival"
                        ? t("Drop-off", "Arrivée")
                        : t("Pick-up", "Départ")}
                      <input
                        type="time"
                        className={`${field} min-w-0`}
                        required
                        min="07:30"
                        max="18:30"
                        step="900"
                        value={choice[key]}
                        onChange={(event) =>
                          updateChoice(dog.id, { [key]: event.target.value })
                        }
                      />
                    </label>
                  ))}
                </div>
              </>
            )}
          </fieldset>
        );
      })}
      {(picked.length > 1 || dates.length > 1) && (
        <p className="rounded-xl bg-primary/5 p-4 text-sm leading-relaxed">
          {t(
            "These hours apply to every selected date. All dates are confirmed together. If a spot is taken, none of your credits are used.",
            "Ces heures s’appliquent à chaque date choisie. Toutes les dates sont confirmées ensemble. Si une place n’est plus libre, aucune visite n’est déduite.",
          )}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || !validSelection}
        className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-primary px-5 py-4 text-center font-semibold text-primary-foreground disabled:opacity-50"
      >
        {busy
          ? t("Saving…", "Enregistrement…")
          : dates.length > 1
            ? t(
                "Confirm " + dates.length + " dates",
                "Confirmer " + dates.length + " dates",
              )
            : picked.length > 1
              ? t(
                  "Confirm both dogs’ visits",
                  "Confirmer les visites des deux chiens",
                )
              : t("Confirm my dog’s visit", "Confirmer la visite de mon chien")}
      </button>
    </form>
  );
}
