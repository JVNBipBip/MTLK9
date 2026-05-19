"use client"

import { useState } from "react"
import { CircleAlert, Dog, Loader2 } from "lucide-react"
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
import posthog from "posthog-js"
import { useAppLocale } from "@/components/locale-provider"
import { useLocalizedText } from "@/lib/i18n/use-localized-text"

function formatDeposit(cents: number, currencyRaw: string) {
  const upper = currencyRaw.trim().toUpperCase()
  const code = upper === "USD" ? "USD" : "CAD"
  const amount = cents / 100
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: code }).format(amount)
}

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

export function PuppySocialDropInIntakeDialog({
  open,
  onOpenChange,
  clientEmail,
  dogNameHint,
  seriesId,
  depositCents,
  currency,
  redirectPath,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientEmail: string
  dogNameHint: string
  seriesId: string | null
  depositCents: number
  currency: string
  redirectPath: string
}) {
  const locale = useAppLocale()
  const t = useLocalizedText()
  const emailNorm = clientEmail.trim().toLowerCase()

  const [clientName, setClientName] = useState("")
  const [dogName, setDogName] = useState(dogNameHint.trim())
  const [dogAge, setDogAge] = useState("")
  const [vaccinationsYes, setVaccinationsYes] = useState<boolean | null>(null)
  const [agreeProof, setAgreeProof] = useState(false)
  const [agreeIllness, setAgreeIllness] = useState(false)
  const [agreeAggression, setAgreeAggression] = useState(false)
  const [agreeRefund48h, setAgreeRefund48h] = useState(false)
  const [agreeLiability, setAgreeLiability] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null)

  function resetForm() {
    setClientName("")
    setDogName(dogNameHint.trim())
    setDogAge("")
    setVaccinationsYes(null)
    setAgreeProof(false)
    setAgreeIllness(false)
    setAgreeAggression(false)
    setAgreeRefund48h(false)
    setAgreeLiability(false)
    setCheckoutErr(null)
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm()
    onOpenChange(next)
  }

  async function submitCheckout() {
    if (!seriesId || !emailNorm) return
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
          seriesId,
          intake,
          locale,
          redirectPath,
        }),
      })
      const data = (await response.json()) as { checkoutUrl?: string; error?: string }
      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || t("Could not start checkout."))
      }
      if (emailNorm) {
        posthog.identify(emailNorm, { email: emailNorm, name: intake.clientName, dogName: intake.dogName })
      }
      posthog.capture("puppy_drop_in_checkout_redirect", {
        seriesId,
        dogAge: intake.dogAge,
        locale,
      })
      window.location.href = data.checkoutUrl
    } catch (e) {
      setCheckoutErr(e instanceof Error ? e.message : t("Could not start checkout."))
    } finally {
      setCheckoutLoading(false)
    }
  }

  const depositLabel = formatDeposit(depositCents, currency)
  const policyCopy = DROP_IN_POLICY_COPY[locale === "fr" ? "fr" : "en"]
  const intakeIntro = t(
    "Answer each question, confirm the agreements, then continue to pay your {deposit} deposit.",
  ).replace("{deposit}", depositLabel)
  const depositFooter = t(
    "{deposit} deposit reserves your spot. You'll complete payment on the next step.",
  ).replace("{deposit}", depositLabel)
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden rounded-2xl border-border/60 p-0 shadow-xl sm:max-w-[440px]",
        )}
        showCloseButton={!checkoutLoading}
      >
        <DialogHeader className="shrink-0 space-y-2 border-b border-border/60 bg-muted/20 px-5 pb-4 pt-5 text-left sm:px-6">
          <DialogTitle className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-[1.35rem]">
            {t("Puppy socialization · intake")}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">{intakeIntro}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("About you")}
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ps-name" className="text-foreground">
                    {t("Your name")}
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
                    {t("Dog's name")}
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
                    {t("Dog's age")}
                  </Label>
                  <Input
                    id="ps-age"
                    className="h-11 rounded-xl border-input bg-background px-3.5 text-base md:text-sm transition-[box-shadow,border-color]"
                    placeholder={t("e.g. 12 weeks")}
                    value={dogAge}
                    onChange={(e) => setDogAge(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium leading-none text-foreground">
                {t("Is your dog up to date with their vaccinations?")}
              </p>
              <RadioGroup
                value={vaccinationsYes === null ? undefined : vaccinationsYes ? "yes" : "no"}
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
                  <span>{t("Yes")}</span>
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
                  <span>{t("No")}</span>
                </label>
              </RadioGroup>
              {vaccinationsYes === false ? (
                <p className="rounded-lg bg-destructive/8 px-3 py-2 text-xs leading-relaxed text-destructive">
                  {t(
                    "Puppy socialization requires current vaccinations. Please update vaccines before registering.",
                  )}
                </p>
              ) : null}
            </div>

            <div className="space-y-3 rounded-2xl border border-border/50 bg-muted/25 p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("Agreements")}
              </p>
              <div className="space-y-4">
                <label className="flex cursor-pointer gap-3 text-sm leading-snug text-foreground/90">
                  <Checkbox
                    id="ps-a1"
                    checked={agreeProof}
                    onCheckedChange={(v) => setAgreeProof(v === true)}
                    className="mt-0.5 shrink-0"
                  />
                  <span>{t("I agree to show proof of vaccinations.")}</span>
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
                    {t(
                      "I agree to not bring my dog to a scheduled group class if they are showing signs of an illness or any contagious disease.",
                    )}
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
                    {t(
                      "I agree to not bring my puppy to a scheduled group class if my puppy is already showing signs of aggression towards humans and dogs.",
                    )}
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
              <p className="text-sm leading-snug text-foreground/90">{depositFooter}</p>
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
            onClick={() => handleOpenChange(false)}
          >
            {t("Cancel")}
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
                {t("Starting checkout…")}
              </>
            ) : (
              t("Continue to pay {deposit}").replace("{deposit}", depositLabel)
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
