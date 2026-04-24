"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { Button } from "@/components/ui/button"
import { GroupClassesContent } from "@/app/training-portal/group-classes-content"
import type { StatusResponse } from "@/app/training-portal/training-portal-types"

type VerifyState = "idle" | "loading" | "error"

export function GroupClassesBookingPanel() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const emailFromUrl = searchParams.get("email") || ""
  const dogFromUrl = searchParams.get("dog") || ""
  const justBooked = searchParams.get("group") === "success"

  const [email, setEmail] = useState(emailFromUrl)
  const [dogName, setDogName] = useState(dogFromUrl)
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [state, setState] = useState<VerifyState>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const autoVerified = useRef(false)

  async function runVerify(targetEmail: string, targetDog: string) {
    const cleanedEmail = targetEmail.trim().toLowerCase()
    const cleanedDog = targetDog.trim()
    if (!cleanedEmail) {
      setErrorMessage("Please enter the email you used for your assessment.")
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
        throw new Error(data.error || "Could not verify your profile.")
      }
      setStatus(data)
      setState("idle")
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not verify your profile.")
      setState("error")
      setStatus(null)
    }
  }

  useEffect(() => {
    if (autoVerified.current) return
    if (emailFromUrl.trim().length > 0) {
      autoVerified.current = true
      void runVerify(emailFromUrl, dogFromUrl)
    }
  }, [emailFromUrl, dogFromUrl])

  function handleReset() {
    setStatus(null)
    setErrorMessage(null)
    setState("idle")
    if (searchParams.get("group") || searchParams.get("booking")) {
      router.replace("/group-classes")
    }
  }

  if (status) {
    return (
      <VerifiedView
        status={status}
        email={email}
        dogName={dogName}
        justBooked={justBooked}
        bookingId={searchParams.get("booking")}
        onReset={handleReset}
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
              Look up your classes
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
              Find the classes your dog can join
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Enter the email from your assessment. We&apos;ll check your dog&apos;s approved programs
              and show you the upcoming classes you can book into.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Email"
              icon={<Mail className="w-4 h-4" />}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={setEmail}
              placeholder="you@email.com"
            />
            <InputField
              label="Dog's name"
              hint="optional"
              icon={<Dog className="w-4 h-4" />}
              type="text"
              autoComplete="off"
              value={dogName}
              onChange={setDogName}
              placeholder="e.g. Luna"
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
                  Checking your access…
                </>
              ) : (
                <>
                  Check my group classes
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Haven&apos;t done an assessment yet?{" "}
              <BookingLink className="underline underline-offset-4 text-primary hover:text-primary/80 font-medium">
                Book one here
              </BookingLink>
              .
            </p>
          </div>
        </form>

        <aside className="relative hidden lg:flex flex-col justify-center p-10 bg-gradient-to-br from-primary/10 via-muted/30 to-secondary/10 border-l border-border/60">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-card/80 border border-border/50 px-3 py-1 text-xs font-medium text-foreground/80 w-fit">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              Private to you
            </div>
            <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">
              What you&apos;ll see
            </h3>
            <ul className="space-y-4">
              <InfoRow
                icon={<ClipboardList className="w-4 h-4" />}
                title="Your approved programs"
                body="Only the group programs your trainer enabled for your dog."
              />
              <InfoRow
                icon={<CalendarCheck className="w-4 h-4" />}
                title="Upcoming scheduled classes"
                body="Pick an upcoming class and go straight to Square checkout."
              />
              <InfoRow
                icon={<CheckCircle2 className="w-4 h-4" />}
                title="Your current bookings"
                body="See what's already on your calendar."
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
  bookingId,
  onReset,
}: {
  status: StatusResponse
  email: string
  dogName: string
  justBooked: boolean
  bookingId: string | null
  onReset: () => void
}) {
  const resolvedDog = (status.lookup.dogName || dogName).trim() || "your dog"
  const displayEmail = (status.lookup.clientEmail || email).trim()

  if (!status.hasConsultation) {
    return (
      <GatePanel
        onReset={onReset}
        title="We couldn't find an assessment on file"
        body={
          <>
            We didn&apos;t find an assessment under{" "}
            <span className="font-medium text-foreground">{displayEmail}</span>
            {resolvedDog !== "your dog" ? (
              <>
                {" "}
                for <span className="font-medium text-foreground">{resolvedDog}</span>
              </>
            ) : null}
            . Book an assessment first and we&apos;ll place you in the right group class.
          </>
        }
        ctaLabel="Book Assessment"
      />
    )
  }

  if (!status.assessmentCompleted) {
    return (
      <GatePanel
        onReset={onReset}
        title="Your assessment is still in progress"
        body={
          <>
            We have <span className="font-medium text-foreground">{resolvedDog}</span> on file, but
            the assessment isn&apos;t complete yet. Once the trainer wraps it up, approved group
            classes will show up here.
          </>
        }
        ctaLabel="Book or Reschedule Assessment"
      />
    )
  }

  if (!status.options.groupClasses.eligible) {
    const reason = status.options.groupClasses.blockedReason
    const bodyText =
      reason === "no_group_program_access"
        ? "No group program is enabled for this dog yet. Your trainer needs to approve a program before you can book a class online."
        : "Complete your assessment to unlock group class booking online."
    return (
      <GatePanel
        onReset={onReset}
        title={reason === "no_group_program_access" ? "No approved group programs yet" : "Assessment required"}
        body={bodyText}
        ctaLabel="Book Assessment"
      />
    )
  }

  return (
    <div className="space-y-6">
      {justBooked ? (
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5 sm:p-6 flex items-start gap-4">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </span>
          <div>
            <p className="font-medium text-emerald-900">You&apos;re signed up!</p>
            <p className="text-sm text-emerald-800/90 mt-1 leading-relaxed">
              {bookingId
                ? `We received your class booking. A confirmation will be sent to ${displayEmail} shortly.`
                : `A confirmation will be sent to ${displayEmail} shortly.`}
            </p>
          </div>
        </div>
      ) : null}

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
                  Welcome back
                </p>
                <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground mt-1">
                  Classes for {resolvedDog}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Linked to{" "}
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
              Use a different email
            </Button>
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10 bg-muted/20 space-y-5">
          <GroupClassesContent
            statusData={status}
            clientEmail={email}
            dogName={dogName}
            redirectPath="/group-classes"
          />
        </div>
      </div>
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
            Try a different email
          </Button>
        </div>
      </div>
    </div>
  )
}
