"use client"

import { useEffect, useState } from "react"
import { CalendarCheck, CircleAlert, Dog, Loader2, Sparkles } from "lucide-react"
import { BookingLink } from "@/components/booking-form-provider"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { useAppLocale } from "@/components/locale-provider"
import type { GroupSeriesListItem } from "@/app/training-portal/training-portal-types"
import { getIntlLocale } from "@/lib/i18n/config"

function formatDateTime(iso: string, intlLocale: string) {
  return new Date(iso).toLocaleString(intlLocale, {
    timeZone: "America/Toronto",
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function formatDeposit(cents: number, currencyRaw: string) {
  const upper = currencyRaw.trim().toUpperCase()
  const code = upper === "USD" ? "USD" : "CAD"
  const amount = cents / 100
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: code }).format(amount)
}

/** Mirrors assessment-booking deposit policy + short group-participation liability. */
const DROP_IN_POLICY_COPY = {
  en: {
    refundTitle: "Deposit — 48-hour cancellation policy",
    refundBody:
      "I agree to give at least 48 hours’ notice to cancel or reschedule. I understand that late cancellation or late rescheduling (less than 48 hours’ notice) means my deposit will not be refunded.",
    liabilityTitle: "Participation & liability",
    liabilityBody:
      "Group training involves some risk. I agree to release and hold harmless Montreal Canine Training Inc., its owners, employees, and agents from claims or liability arising from my or my dog’s participation in this session, except where prohibited by law.",
  },
  fr: {
    refundTitle: "Dépôt — politique d’annulation (48 heures)",
    refundBody:
      "J’accepte de fournir un préavis d’au moins 48 heures pour annuler ou reporter. Je comprends qu’une annulation tardive ou un report tardif (moins de 48 heures de préavis) signifie que mon dépôt ne sera pas remboursé.",
    liabilityTitle: "Participation et responsabilité",
    liabilityBody:
      "La formation en groupe comporte certains risques. J’accepte de libérer et de tenir indemnes Montreal Canine Training Inc., ses propriétaires, employés et agents de toute réclamation ou responsabilité découlant de ma participation ou de celle de mon chien à cette séance, sauf lorsque la loi l’interdit.",
  },
} as const

export function PuppySocialDropInPanel({
  clientEmail,
  dogNameHint,
  redirectPath,
  depositCents,
  currency,
  eligibleForAssessedPrograms,
  onReset,
}: {
  clientEmail: string
  dogNameHint: string
  redirectPath: string
  depositCents: number
  currency: string
  eligibleForAssessedPrograms: boolean
  onReset: () => void
}) {
  const locale = useAppLocale()
  const intlLocale = getIntlLocale(locale)

  const [series, setSeries] = useState<GroupSeriesListItem[]>([])
  const [seriesLoading, setSeriesLoading] = useState(false)
  const [seriesErr, setSeriesErr] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null)

  const [clientName, setClientName] = useState("")
  const [dogName, setDogName] = useState("")
  const [dogAge, setDogAge] = useState("")
  const [vaccinationsYes, setVaccinationsYes] = useState<boolean | null>(null)
  const [agreeProof, setAgreeProof] = useState(false)
  const [agreeIllness, setAgreeIllness] = useState(false)
  const [agreeAggression, setAgreeAggression] = useState(false)
  const [agreeRefund48h, setAgreeRefund48h] = useState(false)
  const [agreeLiability, setAgreeLiability] = useState(false)

  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null)

  const emailNorm = clientEmail.trim().toLowerCase()

  useEffect(() => {
    if (!emailNorm) {
      setSeries([])
      setSeriesErr(null)
      return
    }
    let cancelled = false
    setSeriesLoading(true)
    setSeriesErr(null)
    void (async () => {
      try {
        const response = await fetch("/api/training-portal/group-series/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientEmail: emailNorm,
            dogName: dogNameHint.trim(),
            dropInPuppySocialization: true,
          }),
        })
        const data = (await response.json()) as { series?: GroupSeriesListItem[]; error?: string }
        if (cancelled) return
        if (!response.ok) {
          setSeriesErr(data.error || "Could not load puppy socialization dates.")
          setSeries([])
          return
        }
        setSeries(data.series || [])
      } catch {
        if (!cancelled) {
          setSeriesErr("Could not load puppy socialization dates.")
          setSeries([])
        }
      } finally {
        if (!cancelled) setSeriesLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [emailNorm, dogNameHint])

  function openForSeries(seriesId: string) {
    setSelectedSeriesId(seriesId)
    setCheckoutErr(null)
    setClientName("")
    setDogName(dogNameHint.trim())
    setDogAge("")
    setVaccinationsYes(null)
    setAgreeProof(false)
    setAgreeIllness(false)
    setAgreeAggression(false)
    setAgreeRefund48h(false)
    setAgreeLiability(false)
    setDialogOpen(true)
  }

  async function submitCheckout() {
    if (!selectedSeriesId || !emailNorm) return
    setCheckoutLoading(true)
    setCheckoutErr(null)
    try {
      const intake = {
        clientName: clientName.trim(),
        dogName: dogName.trim(),
        dogAge: dogAge.trim(),
        vaccinationsUpToDate: vaccinationsYes === true,
        agreeProofOfVaccination: agreeProof,
        agreeNoIllness: agreeIllness,
        agreeNoAggression: agreeAggression,
        agreeFortyEightHourDepositRefundPolicy: agreeRefund48h,
        agreeParticipationLiability: agreeLiability,
      }
      const response = await fetch("/api/training-portal/puppy-social-drop-in/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEmail: emailNorm,
          dogName: intake.dogName,
          seriesId: selectedSeriesId,
          intake,
          locale,
          redirectPath,
        }),
      })
      const data = (await response.json()) as { checkoutUrl?: string; error?: string }
      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Could not start checkout.")
      }
      window.location.href = data.checkoutUrl
    } catch (e) {
      setCheckoutErr(e instanceof Error ? e.message : "Could not start checkout.")
    } finally {
      setCheckoutLoading(false)
    }
  }

  const depositLabel = formatDeposit(depositCents, currency)
  const policyCopy = DROP_IN_POLICY_COPY[locale === "fr" ? "fr" : "en"]
  const canSubmit =
    clientName.trim().length > 0 &&
    dogName.trim().length > 0 &&
    dogAge.trim().length > 0 &&
    vaccinationsYes === true &&
    agreeProof &&
    agreeIllness &&
    agreeAggression &&
    agreeRefund48h &&
    agreeLiability

  return (
    <>
      <div className="relative overflow-hidden rounded-[32px] border border-border/60 bg-card shadow-xl shadow-primary/10">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary"
          aria-hidden="true"
        />
        <div className="p-6 sm:p-8 lg:p-10 border-b border-border/60 bg-gradient-to-br from-secondary/10 via-transparent to-primary/5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <p className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-secondary mb-3">
                  No assessment required
                </p>
                <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                  Puppy socialization · drop-in
                </h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-xl">
                  Reserve a spot in an upcoming puppy socialization cohort. Answer a few questions, then pay a{" "}
                  <span className="font-medium text-foreground">{depositLabel}</span> deposit to hold your place.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Signed in as{" "}
                  <span className="font-medium text-foreground">{emailNorm || "—"}</span>
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={onReset}>
              Use a different email
            </Button>
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10 bg-muted/20 space-y-4">
          {seriesLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading upcoming cohorts…
            </div>
          ) : null}

          {seriesErr ? (
            <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <CircleAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>{seriesErr}</p>
            </div>
          ) : null}

          {!seriesLoading && !seriesErr && series.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No puppy socialization sessions are scheduled yet. Check back soon or contact us to join the waitlist.
            </p>
          ) : null}

          <ul className="space-y-3">
            {series.map((row) => {
              const first = row.sessions[0]
              const full = row.spotsRemaining <= 0
              return (
                <li
                  key={row.seriesId}
                  className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary mt-0.5">
                      <CalendarCheck className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{row.programLabel || "Puppy socialization"}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Starts {first ? formatDateTime(first.startsAtIso, intlLocale) : "—"} · {row.sessionCount}{" "}
                        session{row.sessionCount === 1 ? "" : "s"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {full ? "Full — join waitlist by contacting us" : `${row.spotsRemaining} spot(s) left`}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="rounded-full shrink-0"
                    disabled={full}
                    onClick={() => openForSeries(row.seriesId)}
                  >
                    Reserve with deposit
                  </Button>
                </li>
              )
            })}
          </ul>

          {!eligibleForAssessedPrograms ? (
            <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-5 text-sm text-muted-foreground leading-relaxed">
              <p className="font-medium text-foreground mb-1">Other group programs</p>
              <p>
                This path is only for puppy socialization drop-ins. For teen puppy, reactivity, or obedience series,
                book an assessment first so your trainer can approve the right program.
              </p>
              <BookingLink className="inline-flex mt-3 underline underline-offset-4 text-primary font-medium hover:text-primary/80">
                Book an assessment
              </BookingLink>
            </div>
          ) : null}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className={cn(
            "flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden rounded-2xl border-border/60 p-0 shadow-xl sm:max-w-[440px]",
          )}
          showCloseButton={!checkoutLoading}
        >
          <DialogHeader className="shrink-0 space-y-2 border-b border-border/60 bg-muted/20 px-5 pb-4 pt-5 text-left sm:px-6">
            <DialogTitle className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-[1.35rem]">
              Puppy socialization · intake
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Answer each question, confirm the agreements, then continue to pay your{" "}
              <span className="font-medium text-foreground">{depositLabel}</span> deposit.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">About you</p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ps-name" className="text-foreground">
                      Your name
                    </Label>
                    <Input
                      id="ps-name"
                      className={cn(
                        "h-11 rounded-xl border-input bg-background px-3.5 text-base md:text-sm",
                        "transition-[box-shadow,border-color]",
                        "[&:-webkit-autofill]:[-webkit-text-fill-color:hsl(var(--foreground))]",
                        "[&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_hsl(var(--background))]",
                      )}
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ps-dog" className="text-foreground">
                      Dog&apos;s name
                    </Label>
                    <Input
                      id="ps-dog"
                      className="h-11 rounded-xl border-input bg-background px-3.5 text-base md:text-sm transition-[box-shadow,border-color]"
                      value={dogName}
                      onChange={(e) => setDogName(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ps-age" className="text-foreground">
                      Dog&apos;s age
                    </Label>
                    <Input
                      id="ps-age"
                      className="h-11 rounded-xl border-input bg-background px-3.5 text-base md:text-sm transition-[box-shadow,border-color]"
                      placeholder="e.g. 12 weeks"
                      value={dogAge}
                      onChange={(e) => setDogAge(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium leading-none text-foreground">
                  Is your dog up to date with their vaccinations?
                </p>
                <RadioGroup
                  value={
                    vaccinationsYes === null ? undefined : vaccinationsYes ? "yes" : "no"
                  }
                  onValueChange={(v) => setVaccinationsYes(v === "yes")}
                  className="grid grid-cols-2 gap-2"
                >
                  <label
                    htmlFor="ps-vacc-yes"
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border border-input bg-muted/20 px-4 py-3.5 text-sm font-medium shadow-xs transition-all",
                      "hover:border-primary/30 hover:bg-muted/35",
                      "has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                      vaccinationsYes === true && "border-primary bg-primary/8 ring-2 ring-primary/15",
                    )}
                  >
                    <RadioGroupItem value="yes" id="ps-vacc-yes" className="border-muted-foreground/40" />
                    <span>Yes</span>
                  </label>
                  <label
                    htmlFor="ps-vacc-no"
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border border-input bg-muted/20 px-4 py-3.5 text-sm font-medium shadow-xs transition-all",
                      "hover:border-primary/30 hover:bg-muted/35",
                      "has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                      vaccinationsYes === false && "border-destructive/40 bg-destructive/6 ring-2 ring-destructive/15",
                    )}
                  >
                    <RadioGroupItem value="no" id="ps-vacc-no" className="border-muted-foreground/40" />
                    <span>No</span>
                  </label>
                </RadioGroup>
                {vaccinationsYes === false ? (
                  <p className="rounded-lg bg-destructive/8 px-3 py-2 text-xs leading-relaxed text-destructive">
                    Puppy socialization requires current vaccinations. Please update vaccines before registering.
                  </p>
                ) : null}
              </div>

              <div className="space-y-3 rounded-2xl border border-border/50 bg-muted/25 p-4 sm:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Agreements</p>
                <div className="space-y-4">
                  <label className="flex cursor-pointer gap-3 text-sm leading-snug text-foreground/90">
                    <Checkbox
                      id="ps-a1"
                      checked={agreeProof}
                      onCheckedChange={(v) => setAgreeProof(v === true)}
                      className="mt-0.5 shrink-0"
                    />
                    <span>I agree to show proof of vaccinations.</span>
                  </label>
                  <div className="h-px bg-border/60" aria-hidden />
                  <label className="flex cursor-pointer gap-3 text-sm leading-snug text-foreground/90">
                    <Checkbox
                      id="ps-a2"
                      checked={agreeIllness}
                      onCheckedChange={(v) => setAgreeIllness(v === true)}
                      className="mt-0.5 shrink-0"
                    />
                    <span>
                      I agree to not bring my dog to a scheduled group class if they are showing signs of an illness or
                      any contagious disease.
                    </span>
                  </label>
                  <div className="h-px bg-border/60" aria-hidden />
                  <label className="flex cursor-pointer gap-3 text-sm leading-snug text-foreground/90">
                    <Checkbox
                      id="ps-a3"
                      checked={agreeAggression}
                      onCheckedChange={(v) => setAgreeAggression(v === true)}
                      className="mt-0.5 shrink-0"
                    />
                    <span>
                      I agree to not bring my puppy to a scheduled group class if my puppy is already showing signs of
                      aggression towards humans and dogs.
                    </span>
                  </label>
                  <div className="h-px bg-border/60" aria-hidden />
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-foreground">{policyCopy.refundTitle}</p>
                    <label className="flex cursor-pointer gap-3 text-sm leading-snug text-foreground/90">
                      <Checkbox
                        id="ps-a4"
                        checked={agreeRefund48h}
                        onCheckedChange={(v) => setAgreeRefund48h(v === true)}
                        className="mt-0.5 shrink-0"
                      />
                      <span>{policyCopy.refundBody}</span>
                    </label>
                  </div>
                  <div className="h-px bg-border/60" aria-hidden />
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-foreground">{policyCopy.liabilityTitle}</p>
                    <label className="flex cursor-pointer gap-3 text-sm leading-snug text-foreground/90">
                      <Checkbox
                        id="ps-a5"
                        checked={agreeLiability}
                        onCheckedChange={(v) => setAgreeLiability(v === true)}
                        className="mt-0.5 shrink-0"
                      />
                      <span>{policyCopy.liabilityBody}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-4 py-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Dog className="h-5 w-5" aria-hidden />
                </span>
                <p className="text-sm leading-snug text-foreground/90">
                  <span className="font-semibold text-foreground">{depositLabel} deposit</span> reserves your spot. You&apos;ll
                  complete payment on the next step.
                </p>
              </div>

              {checkoutErr ? (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{checkoutErr}</p>
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-border/60 bg-muted/15 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full sm:w-auto"
              disabled={checkoutLoading}
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="w-full rounded-full sm:w-auto"
              disabled={!canSubmit || checkoutLoading}
              onClick={() => void submitCheckout()}
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting checkout…
                </>
              ) : (
                `Continue to pay ${depositLabel}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
