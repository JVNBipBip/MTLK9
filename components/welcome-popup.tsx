"use client"

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { usePathname } from "next/navigation"
import { Calendar, CheckCircle2, Phone } from "lucide-react"
import posthog from "posthog-js"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useBookingForm } from "@/components/booking-form-provider"
import { useAppLocale } from "@/components/locale-provider"
import { stripLocaleFromPathname } from "@/lib/i18n/config"
import {
  WELCOME_POPUP_BLOCKED_PATH_PREFIXES,
  WELCOME_POPUP_DISMISS_SUPPRESS_DAYS,
  WELCOME_POPUP_SCROLL_DEPTH,
  WELCOME_POPUP_STORAGE_KEY,
  WELCOME_POPUP_TIME_TRIGGER_MS,
  welcomePopupContent,
  type WelcomePopupVariant,
} from "@/lib/welcome-popup-content"
import {
  WELCOME_EXPERIMENT_COOKIE_NAME,
  WELCOME_EXPERIMENT_MAX_AGE_SECONDS,
  assignWelcomeExperiment,
  parseWelcomeExperimentCookieHeader,
  serializeWelcomeExperiment,
  type WelcomeExperimentCohort,
} from "@/lib/welcome-experiment"
import { normalizeWelcomePhone } from "@/lib/welcome-signup"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type StoredPopupState = {
  state?: "dismissed" | "subscribed"
  at?: string
  variant?: WelcomePopupVariant
  cohort?: WelcomeExperimentCohort
}

/** localStorage can throw (private mode, disabled storage) — never let that crash the page. */
function readStoredState(): StoredPopupState | null {
  try {
    const raw = window.localStorage.getItem(WELCOME_POPUP_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? (parsed as StoredPopupState) : null
  } catch {
    return null
  }
}

function writeStoredState(next: StoredPopupState) {
  try {
    window.localStorage.setItem(WELCOME_POPUP_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage unavailable — the popup just won't be suppressed across visits.
  }
}

function isSuppressed(stored: StoredPopupState | null): boolean {
  if (!stored) return false
  if (stored.state === "subscribed") return true
  if (stored.state === "dismissed") {
    const dismissedAt = stored.at ? Date.parse(stored.at) : Number.NaN
    if (Number.isNaN(dismissedAt)) return false
    return Date.now() - dismissedAt < WELCOME_POPUP_DISMISS_SUPPRESS_DAYS * 24 * 60 * 60 * 1000
  }
  return false
}

function storedVariant(stored: StoredPopupState | null): WelcomePopupVariant | null {
  return stored?.variant === "a" || stored?.variant === "b" ? stored.variant : null
}

function storedCohort(stored: StoredPopupState | null): WelcomeExperimentCohort | null {
  return stored?.cohort === "holdout" || stored?.cohort === "treatment" ? stored.cohort : null
}

function writeExperimentCookie(cohort: WelcomeExperimentCohort, variant: WelcomePopupVariant | null) {
  try {
    const value = serializeWelcomeExperiment({ cohort, variant })
    const secure = window.location.protocol === "https:" ? "; Secure" : ""
    document.cookie = `${WELCOME_EXPERIMENT_COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; Max-Age=${WELCOME_EXPERIMENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`
  } catch {
    // The PostHog super properties still preserve the experiment assignment.
  }
}

/** Feature-flag gate — the whole popup ships dark unless NEXT_PUBLIC_WELCOME_POPUP="1". */
export function WelcomePopup() {
  if (process.env.NEXT_PUBLIC_WELCOME_POPUP !== "1") return null
  return <WelcomePopupInner />
}

function WelcomePopupInner() {
  const { openBookingForm } = useBookingForm()
  const locale = useAppLocale()
  const pathname = usePathname() || "/"
  const [open, setOpen] = useState(false)
  const [variant, setVariant] = useState<WelcomePopupVariant>("a")
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [emailInvalid, setEmailInvalid] = useState(false)
  const [phoneInvalid, setPhoneInvalid] = useState(false)
  const hasShownRef = useRef(false)
  const statusRef = useRef(status)
  statusRef.current = status

  const strippedPath = stripLocaleFromPathname(pathname)
  const blockedPath = WELCOME_POPUP_BLOCKED_PATH_PREFIXES.some((prefix) => strippedPath.startsWith(prefix))

  const openPopup = useCallback(() => {
    if (hasShownRef.current) return
    hasShownRef.current = true
    const stored = readStoredState()
    // Sticky 50/50 assignment: reuse a previously assigned variant so the
    // visitor always sees the same copy.
    const assigned = storedVariant(stored) ?? (Math.random() < 0.5 ? "a" : "b")
    if (storedVariant(stored) !== assigned) {
      writeStoredState({ ...stored, variant: assigned })
    }
    setVariant(assigned)
    setOpen(true)
    posthog.capture("welcome_popup_shown", { variant: assigned, locale, path: pathname })
  }, [locale, pathname])

  // Trigger: scroll depth >= 40% of document height OR 10s on page, whichever
  // comes first. Re-armed per pathname so blocked pages stay quiet.
  useEffect(() => {
    if (hasShownRef.current || blockedPath) return
    const stored = readStoredState()
    if (isSuppressed(stored)) return

    const cookieAssignment = parseWelcomeExperimentCookieHeader(document.cookie)
    const previousCohort = storedCohort(stored) || cookieAssignment?.cohort || null
    const previousVariant = storedVariant(stored) || cookieAssignment?.variant || null
    const freshAssignment = assignWelcomeExperiment(Math.random(), Math.random())
    const cohort = previousCohort || freshAssignment.cohort
    const assignedVariant = cohort === "treatment" ? previousVariant || freshAssignment.variant || "a" : null

    if (previousCohort !== cohort || previousVariant !== assignedVariant) {
      writeStoredState({ ...stored, cohort, variant: assignedVariant || undefined })
    }
    writeExperimentCookie(cohort, assignedVariant)
    posthog.register({
      welcome_flow_cohort: cohort,
      welcome_flow_variant: assignedVariant || "none",
    })

    if (!previousCohort) {
      posthog.capture("welcome_flow_cohort_assigned", {
        cohort,
        variant: assignedVariant || "none",
        locale,
        path: pathname,
      })
    }

    if (cohort === "holdout") return
    setVariant(assignedVariant || "a")

    let fired = false
    const cleanup = () => {
      window.clearTimeout(timer)
      window.removeEventListener("scroll", onScroll)
    }
    const trigger = () => {
      if (fired) return
      fired = true
      cleanup()
      openPopup()
    }
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight
      if (scrollable <= 0) return
      if ((window.scrollY + window.innerHeight) / scrollable >= WELCOME_POPUP_SCROLL_DEPTH) trigger()
    }

    const timer = window.setTimeout(trigger, WELCOME_POPUP_TIME_TRIGGER_MS)
    window.addEventListener("scroll", onScroll, { passive: true })
    return cleanup
  }, [blockedPath, locale, openPopup, pathname])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen)
      if (nextOpen) return
      // Close via X / backdrop / Escape counts as a dismissal. A successful
      // signup has already been marked subscribed and stays suppressed.
      if (statusRef.current === "success") return
      const stored = readStoredState()
      if (stored?.state === "subscribed") return
      writeStoredState({ ...stored, state: "dismissed", at: new Date().toISOString(), variant })
      posthog.capture("welcome_popup_dismissed", { variant, locale })
    },
    [locale, variant],
  )

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const trimmedEmail = email.trim()
      if (!EMAIL_REGEX.test(trimmedEmail)) {
        setEmailInvalid(true)
        return
      }
      const trimmedPhone = phone.trim()
      const normalizedPhone = trimmedPhone ? normalizeWelcomePhone(trimmedPhone) : null
      if (trimmedPhone && !normalizedPhone) {
        setPhoneInvalid(true)
        return
      }
      setEmailInvalid(false)
      setPhoneInvalid(false)
      setStatus("submitting")
      try {
        const res = await fetch("/api/welcome-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: trimmedEmail,
            phone: normalizedPhone || undefined,
            message: variant === "a" && message.trim() ? message.trim() : undefined,
            variant,
            locale,
            path: pathname,
          }),
        })
        if (!res.ok) throw new Error(`welcome-signup failed (${res.status})`)
        writeStoredState({ ...readStoredState(), state: "subscribed", variant })
        posthog.capture("welcome_popup_submitted", { variant, locale })
        setStatus("success")
      } catch {
        setStatus("error")
      }
    },
    [email, locale, message, pathname, phone, variant],
  )

  const content = welcomePopupContent[locale]
  const variantCopy = content.variants[variant]

  const handleStartConsultation = () => {
    posthog.capture("welcome_popup_consultation_clicked", { variant, locale, path: pathname })
    setOpen(false)
    openBookingForm({ source: "welcome_popup" })
  }

  const handleCallNick = () => {
    posthog.capture("welcome_popup_call_clicked", { variant, locale, path: pathname })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md gap-0 rounded-3xl border-border/60 p-6 shadow-2xl sm:p-8">
        {status === "success" ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </span>
            <DialogTitle className="font-display text-2xl font-semibold leading-snug tracking-tight text-foreground">
              {content.successHeadline}
            </DialogTitle>
            <p className="text-sm leading-relaxed text-muted-foreground" role="status">
              {content.success}
            </p>
            <div className="mt-1 grid w-full gap-2.5">
              <Button
                type="button"
                onClick={handleStartConsultation}
                className="h-11 w-full rounded-full text-sm font-semibold"
              >
                <Calendar className="mr-2 h-4 w-4" aria-hidden="true" />
                {content.bookCta}
              </Button>
              <a
                href="tel:+15148269558"
                data-conversion-location="welcome_popup"
                onClick={handleCallNick}
                className="inline-flex h-11 w-full items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
                {content.callCta}
              </a>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {content.laterCta}
            </button>
          </div>
        ) : (
          <>
            <DialogTitle className="text-balance pr-6 font-display text-2xl font-semibold leading-snug tracking-tight text-foreground">
              {variantCopy.headline}
            </DialogTitle>
            <DialogDescription className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
              {variantCopy.body}
            </DialogDescription>
            <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-3">
              <div>
                <label htmlFor="welcome-popup-email" className="sr-only">
                  {content.emailLabel}
                </label>
                <Input
                  id="welcome-popup-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={content.emailPlaceholder}
                  aria-invalid={emailInvalid || undefined}
                  className="h-11 rounded-xl"
                />
                {emailInvalid && (
                  <p className="mt-1.5 text-xs text-destructive" role="alert">
                    {content.emailError}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="welcome-popup-phone" className="sr-only">
                  {content.phoneLabel}
                </label>
                <Input
                  id="welcome-popup-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={40}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder={content.phonePlaceholder}
                  aria-invalid={phoneInvalid || undefined}
                  className="h-11 rounded-xl"
                />
                {phoneInvalid && (
                  <p className="mt-1.5 text-xs text-destructive" role="alert">
                    {content.phoneError}
                  </p>
                )}
              </div>
              {variant === "a" && (
                <div>
                  <label htmlFor="welcome-popup-message" className="sr-only">
                    {variantCopy.messageLabel}
                  </label>
                  <Input
                    id="welcome-popup-message"
                    name="message"
                    type="text"
                    maxLength={280}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder={variantCopy.messagePlaceholder}
                    className="h-11 rounded-xl"
                  />
                </div>
              )}
              {status === "error" && (
                <p className="text-sm text-destructive" role="alert">
                  {content.error}
                </p>
              )}
              <Button
                type="submit"
                disabled={status === "submitting"}
                className="h-11 w-full rounded-full text-base font-semibold shadow-sm"
              >
                {status === "submitting" ? content.submitting : variantCopy.cta}
              </Button>
              <p className="text-center text-xs leading-relaxed text-muted-foreground">{content.microcopy}</p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
