"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Dog,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { BookingLink } from "@/components/booking-form-provider"
import { useAppLocale } from "@/components/locale-provider"
import { Button } from "@/components/ui/button"
import { useLocalizedText } from "@/lib/i18n/use-localized-text"
import { GroupClassesContent } from "@/app/training-portal/group-classes-content"
import { addLocaleToPathname, stripLocaleFromPathname } from "@/lib/i18n/config"
import type { StatusResponse } from "@/app/training-portal/training-portal-types"
import { PuppySocialDropInPanel } from "@/app/group-classes/puppy-social-drop-in-panel"

type VerifyState = "idle" | "loading" | "error"

export function GroupClassesBookingPanel({
  preferredCoachId = null,
  preferredCoachLabel = null,
  variant = "default",
}: {
  preferredCoachId?: string | null
  preferredCoachLabel?: string | null
  variant?: "default" | "invite"
} = {}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const locale = useAppLocale()
  const t = useLocalizedText()
  const bookingBasePath =
    variant === "invite"
      ? addLocaleToPathname("/group-classes/book", locale)
      : addLocaleToPathname("/group-classes", locale)

  const emailFromUrl = searchParams.get("email") || ""
  const dogFromUrl = searchParams.get("dog") || ""
  const justBooked = searchParams.get("group") === "success"
  const puppyDropInSuccess = searchParams.get("dropin") === "puppy-social"

  const [email, setEmail] = useState(emailFromUrl)
  const [dogName, setDogName] = useState(dogFromUrl)
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [state, setState] = useState<VerifyState>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const autoVerified = useRef(false)

  const strippedPath = stripLocaleFromPathname(pathname)
  const seriesFromUrl = searchParams.get("series")?.trim() || ""
  const shouldRedirectFromMarketingToBook =
    variant === "default" &&
    strippedPath === "/group-classes" &&
    Boolean(seriesFromUrl) &&
    emailFromUrl.trim().length > 0

  useLayoutEffect(() => {
    if (!shouldRedirectFromMarketingToBook) return
    const bookPath = addLocaleToPathname("/group-classes/book", locale)
    const q = searchParams.toString()
    router.replace(q ? `${bookPath}?${q}` : bookPath)
  }, [shouldRedirectFromMarketingToBook, locale, router, searchParams])

  async function runVerify(targetEmail: string, targetDog: string) {
    const cleanedEmail = targetEmail.trim().toLowerCase()
    const cleanedDog = targetDog.trim()
    if (!cleanedEmail) {
      setErrorMessage(t("Please enter your email."))
      setState("error")
      return
    }
    setState("loading")
    setErrorMessage(null)
    try {
      const response = await fetch("/api/training-portal/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientEmail: cleanedEmail, dogName: cleanedDog }),
      })
      const data = (await response.json()) as StatusResponse & { error?: string }
      if (!response.ok || !data.ok) {
        throw new Error(data.error || t("Could not verify your profile."))
      }
      setStatus(data)
      setState("idle")
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t("Could not verify your profile."))
      setState("error")
      setStatus(null)
    }
  }

  useEffect(() => {
    if (autoVerified.current) return
    if (emailFromUrl.trim().length > 0) {
      if (shouldRedirectFromMarketingToBook) return
      autoVerified.current = true
      void runVerify(emailFromUrl, dogFromUrl)
    }
  }, [emailFromUrl, dogFromUrl, shouldRedirectFromMarketingToBook])

  function handleReset() {
    setStatus(null)
    setErrorMessage(null)
    setState("idle")
    if (searchParams.get("group") || searchParams.get("booking")) {
      router.replace(bookingBasePath)
    }
  }

  if (status) {
    return (
      <VerifiedView
        status={status}
        email={email}
        dogName={dogName}
        justBooked={justBooked}
        puppyDropInSuccess={puppyDropInSuccess}
        bookingId={searchParams.get("booking")}
        bookingBasePath={bookingBasePath}
        onReset={handleReset}
        preferredCoachId={preferredCoachId}
        preferredCoachLabel={preferredCoachLabel}
        highlightSeriesId={searchParams.get("series")}
      />
    )
  }

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-border/60 bg-card shadow-xl shadow-primary/10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary"
        aria-hidden="true"
      />
      <div className="grid gap-0 lg:grid-cols-[1.3fr_1fr]">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void runVerify(email, dogName)
          }}
          className="p-6 sm:p-8 lg:p-10 space-y-6"
        >
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary mb-4">
              <Sparkles className="w-3 h-3" />
              {variant === "invite" ? t("From your email") : t("Look up your classes")}
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
              {variant === "invite"
                ? t("Almost there — we're opening your booking")
                : t("Find the group classes your dog can request")}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {variant === "invite"
                ? t(
                    "Your details are pre-filled from your invitation. Access is verified automatically—then you can request your spot.",
                  )
                : t(
                    "Enter your email to look up approved programs and puppy socialization drop-ins. Puppy socialization does not require an assessment; other group programs do after your trainer approves them.",
                  )}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label={t("Email")}
              icon={<Mail className="w-4 h-4" />}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={setEmail}
              placeholder={t("you@email.com")}
            />
            <InputField
              label={t("Dog's name")}
              hint={t("optional")}
              icon={<Dog className="w-4 h-4" />}
              type="text"
              autoComplete="off"
              value={dogName}
              onChange={setDogName}
              placeholder={t("e.g. Luna")}
            />
          </div>

          {errorMessage ? (
            <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <CircleAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>{errorMessage}</p>
            </div>
          ) : null}

          <div className="space-y-4 pt-1">
            <Button
              type="submit"
              size="lg"
              className="w-full rounded-full group"
              disabled={state === "loading"}
            >
              {state === "loading" ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  {variant === "invite" ? t("Opening your booking…") : t("Checking your access…")}
                </>
              ) : (
                <>
                  {t("Check my group classes")}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {t("Haven't done an assessment yet?")}{" "}
              <BookingLink className="underline underline-offset-4 text-primary hover:text-primary/80 font-medium">
                {t("Book one here")}
              </BookingLink>
              .
            </p>
          </div>
        </form>

        <aside className="relative hidden lg:flex flex-col justify-center p-10 bg-gradient-to-br from-primary/10 via-muted/30 to-secondary/10 border-l border-border/60">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-card/80 border border-border/50 px-3 py-1 text-xs font-medium text-foreground/80 w-fit">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              {t("Private to you")}
            </div>
            <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">
              {t("What you'll see")}
            </h3>
            <ul className="space-y-4">
              <InfoRow
                icon={<ClipboardList className="w-4 h-4" />}
                title={t("Your approved programs")}
                body={t("Only the group programs your trainer enabled for your dog.")}
              />
              <InfoRow
                icon={<CalendarCheck className="w-4 h-4" />}
                title={t("Upcoming scheduled classes")}
                body={t("Pick an upcoming full-series class and send a request to staff.")}
              />
              <InfoRow
                icon={<CheckCircle2 className="w-4 h-4" />}
                title={t("Your current bookings")}
                body={t("See what's already on your calendar.")}
              />
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

function InputField({
  label,
  hint,
  icon,
  value,
  onChange,
  type,
  required,
  placeholder,
  autoComplete,
}: {
  label: string
  hint?: string
  icon: React.ReactNode
  value: string
  onChange: (value: string) => void
  type: string
  required?: boolean
  placeholder?: string
  autoComplete?: string
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="flex items-center gap-1.5 font-medium text-foreground">
        {label}
        {hint ? <span className="text-xs font-normal text-muted-foreground">({hint})</span> : null}
      </span>
      <span className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        <input
          type={type}
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </span>
    </label>
  )
}

function InfoRow({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
        {icon}
      </span>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{body}</p>
      </div>
    </li>
  )
}

function VerifiedView({
  status,
  email,
  dogName,
  justBooked,
  puppyDropInSuccess,
  bookingId,
  bookingBasePath,
  onReset,
  preferredCoachId = null,
  preferredCoachLabel = null,
  highlightSeriesId = null,
}: {
  status: StatusResponse
  email: string
  dogName: string
  justBooked: boolean
  puppyDropInSuccess: boolean
  bookingId: string | null
  bookingBasePath: string
  onReset: () => void
  preferredCoachId?: string | null
  preferredCoachLabel?: string | null
  highlightSeriesId?: string | null
}) {
  const t = useLocalizedText()
  const rawDogName = (status.lookup.dogName || dogName).trim()
  const resolvedDogDisplay = rawDogName || t("your dog")
  const displayEmail = (status.lookup.clientEmail || email).trim()
  const dropIn = status.options.groupClasses.dropInPuppySocialization

  if (!dropIn?.available && !status.hasConsultation) {
    return (
      <GatePanel
        onReset={onReset}
        title={t("We couldn't find an assessment on file")}
        body={
          <>
            {t("We didn't find an assessment under")}{" "}
            <span className="font-medium text-foreground">{displayEmail}</span>
            {rawDogName ? (
              <>
                {" "}
                {t("for")}{" "}
                <span className="font-medium text-foreground">{rawDogName}</span>
              </>
            ) : null}
            {t(". Book an assessment first and we'll place you in the right group class.")}
          </>
        }
        ctaLabel={t("Book Assessment")}
      />
    )
  }

  if (!dropIn?.available && !status.assessmentCompleted) {
    return (
      <GatePanel
        onReset={onReset}
        title={t("Your assessment is still in progress")}
        body={
          <>
            {t("We have ")}
            <span className="font-medium text-foreground">{resolvedDogDisplay}</span>
            {t(
              " on file, but the assessment isn't complete yet. Once the trainer wraps it up, approved group classes will show up here.",
            )}
          </>
        }
        ctaLabel={t("Book or Reschedule Assessment")}
      />
    )
  }

  if (!dropIn?.available && !status.options.groupClasses.eligible) {
    const reason = status.options.groupClasses.blockedReason
    const bodyText =
      reason === "no_group_program_access"
        ? t(
            "No group program is enabled for this dog yet. Your trainer needs to approve a program before you can request a class online.",
          )
        : t("Complete your assessment to unlock group class requests online.")
    return (
      <GatePanel
        onReset={onReset}
        title={
          reason === "no_group_program_access"
            ? t("No approved group programs yet")
            : t("Assessment required")
        }
        body={bodyText}
        ctaLabel={t("Book Assessment")}
      />
    )
  }

  const highlightSeries = highlightSeriesId?.trim() || ""
  const hidePuppyDropInForClassInvite = Boolean(highlightSeries)

  return (
    <div className="space-y-6">
      {justBooked ? (
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5 sm:p-6 flex items-start gap-4">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </span>
          <div>
            <p className="font-medium text-emerald-900">
              {puppyDropInSuccess ? t("Deposit checkout started") : t("Request received")}
            </p>
            <p className="text-sm text-emerald-800/90 mt-1 leading-relaxed">
              {puppyDropInSuccess ? (
                <>
                  {t(
                    "Complete payment on the next screen to reserve your puppy socialization spot. If anything goes wrong, reach out and reference booking ",
                  )}
                  {bookingId ? <span className="font-medium">{bookingId}</span> : t("ID from your email")}.
                </>
              ) : bookingId ? (
                <>
                  {t("We received your group class request. Staff will add you to Square and follow up at ")}
                  <span className="font-medium">{displayEmail}</span>.
                </>
              ) : (
                <>
                  {t("Staff will add you to Square and follow up at ")}
                  <span className="font-medium">{displayEmail}</span>.
                </>
              )}
            </p>
          </div>
        </div>
      ) : null}

      {dropIn?.available && !hidePuppyDropInForClassInvite ? (
        <PuppySocialDropInPanel
          clientEmail={email}
          dogNameHint={dogName}
          redirectPath={bookingBasePath}
          depositCents={dropIn.depositCents}
          currency={dropIn.currency}
          eligibleForAssessedPrograms={status.options.groupClasses.eligible}
          onReset={onReset}
        />
      ) : null}

      {status.options.groupClasses.eligible ? (
        <div className="relative overflow-hidden rounded-[32px] border border-border/60 bg-card shadow-xl shadow-primary/10">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary"
            aria-hidden="true"
          />
          <div className="p-6 sm:p-8 lg:p-10 border-b border-border/60 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Dog className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-secondary font-medium">
                    {t("Welcome back")}
                  </p>
                  <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground mt-1">
                    {t("Classes for")} {resolvedDogDisplay}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("Linked to")}{" "}
                    <span className="font-medium text-foreground">{displayEmail}</span>
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={onReset}
              >
                {t("Use a different email")}
              </Button>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10 bg-muted/20 space-y-5">
            <GroupClassesContent
              statusData={status}
              clientEmail={email}
              dogName={dogName}
              redirectPath={bookingBasePath}
              preferredCoachId={preferredCoachId}
              preferredCoachLabel={preferredCoachLabel}
              highlightSeriesId={highlightSeriesId}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function GatePanel({
  title,
  body,
  ctaLabel,
  onReset,
}: {
  title: string
  body: React.ReactNode
  ctaLabel: string
  onReset: () => void
}) {
  const t = useLocalizedText()
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-border/60 bg-card shadow-xl shadow-primary/10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500/70 via-primary/60 to-secondary/60"
        aria-hidden="true"
      />
      <div className="p-6 sm:p-8 lg:p-10">
        <div className="flex items-start gap-3 mb-4">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 flex-shrink-0">
            <ClipboardList className="w-5 h-5" />
          </span>
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{body}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <BookingLink>
            <Button className="rounded-full group">
              {ctaLabel}
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </BookingLink>
          <Button type="button" variant="ghost" className="rounded-full" onClick={onReset}>
            {t("Try a different email")}
          </Button>
        </div>
      </div>
    </div>
  )
}
