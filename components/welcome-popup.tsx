"use client"

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Calendar, CheckCircle2, Phone, X } from "lucide-react"
import posthog from "posthog-js"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
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
import { normalizeWelcomePhone } from "@/lib/welcome-signup"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type StoredPopupState = {
  state?: "dismissed" | "subscribed"
  at?: string
  variant?: WelcomePopupVariant
}

type WelcomePopupStep = "email" | "phone"

const WELCOME_POPUP_VARIANT: WelcomePopupVariant = "b"
const WELCOME_POPUP_STEPS: WelcomePopupStep[] = ["email", "phone"]

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
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [step, setStep] = useState<WelcomePopupStep>("email")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [emailInvalid, setEmailInvalid] = useState(false)
  const [phoneInvalid, setPhoneInvalid] = useState(false)
  const hasShownRef = useRef(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const statusRef = useRef(status)
  statusRef.current = status

  const strippedPath = stripLocaleFromPathname(pathname)
  const blockedPath = WELCOME_POPUP_BLOCKED_PATH_PREFIXES.some((prefix) => strippedPath.startsWith(prefix))

  const openPopup = useCallback(() => {
    if (hasShownRef.current) return
    hasShownRef.current = true
    const stored = readStoredState()
    writeStoredState({ ...stored, variant: WELCOME_POPUP_VARIANT })
    setStep("email")
    setOpen(true)
    posthog.capture("welcome_popup_shown", { variant: WELCOME_POPUP_VARIANT, locale, path: pathname })
  }, [locale, pathname])

  // Trigger: scroll depth >= 40% of document height OR 10s on page, whichever
  // comes first. Re-armed per pathname so blocked pages stay quiet.
  useEffect(() => {
    if (hasShownRef.current || blockedPath) return
    const stored = readStoredState()
    if (isSuppressed(stored)) return
    posthog.register({
      welcome_flow_cohort: "treatment",
      welcome_flow_variant: WELCOME_POPUP_VARIANT,
    })

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
  }, [blockedPath, openPopup])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen)
      if (nextOpen) return
      // Close via X / backdrop / Escape counts as a dismissal. A successful
      // signup has already been marked subscribed and stays suppressed.
      if (statusRef.current === "success") return
      const stored = readStoredState()
      if (stored?.state === "subscribed") return
      writeStoredState({
        ...stored,
        state: "dismissed",
        at: new Date().toISOString(),
        variant: WELCOME_POPUP_VARIANT,
      })
      posthog.capture("welcome_popup_dismissed", { variant: WELCOME_POPUP_VARIANT, locale })
    },
    [locale],
  )

  const submitSignup = useCallback(
    async () => {
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
            variant: WELCOME_POPUP_VARIANT,
            locale,
            path: pathname,
          }),
        })
        if (!res.ok) throw new Error(`welcome-signup failed (${res.status})`)
        writeStoredState({
          ...readStoredState(),
          state: "subscribed",
          variant: WELCOME_POPUP_VARIANT,
        })
        posthog.capture("welcome_popup_submitted", { variant: WELCOME_POPUP_VARIANT, locale })
        setStatus("success")
      } catch {
        setStatus("error")
      }
    },
    [email, locale, pathname, phone],
  )

  const content = welcomePopupContent[locale]
  const variantCopy = content.variants[WELCOME_POPUP_VARIANT]
  const stepIndex = Math.max(0, WELCOME_POPUP_STEPS.indexOf(step))
  const isFinalStep = stepIndex === WELCOME_POPUP_STEPS.length - 1

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (step === "email") {
        if (!EMAIL_REGEX.test(email.trim())) {
          setEmailInvalid(true)
          return
        }
        setEmailInvalid(false)
        posthog.capture("welcome_popup_step_completed", {
          step,
          variant: WELCOME_POPUP_VARIANT,
          locale,
        })
        setStep("phone")
        return
      }

      if (step === "phone") {
        const trimmedPhone = phone.trim()
        if (trimmedPhone && !normalizeWelcomePhone(trimmedPhone)) {
          setPhoneInvalid(true)
          return
        }
        setPhoneInvalid(false)
        posthog.capture("welcome_popup_step_completed", {
          step,
          variant: WELCOME_POPUP_VARIANT,
          locale,
        })
      }

      await submitSignup()
    },
    [email, locale, phone, step, submitSignup],
  )

  const handleBack = () => {
    setStatus("idle")
    setStep("email")
  }

  const handleStartConsultation = () => {
    posthog.capture("welcome_popup_consultation_clicked", {
      variant: WELCOME_POPUP_VARIANT,
      locale,
      path: pathname,
    })
    setOpen(false)
    openBookingForm({ source: "welcome_popup" })
  }

  const handleCallNick = () => {
    posthog.capture("welcome_popup_call_clicked", {
      variant: WELCOME_POPUP_VARIANT,
      locale,
      path: pathname,
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-testid="welcome-popup"
        showCloseButton={false}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          closeButtonRef.current?.focus({ preventScroll: true })
        }}
        className="block h-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-3xl border-border/60 p-0 shadow-2xl sm:max-w-md"
      >
        <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain">
        {status === "success" ? (
          <div className="flex flex-col items-center gap-4 px-6 pb-6 pt-16 text-center sm:px-7 sm:pb-7">
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
            <div data-testid="welcome-popup-photo" className="relative h-44 w-full overflow-hidden sm:h-52">
              <Image
                src="/images/Classes images/in-home.webp"
                alt={content.photoAlt}
                fill
                sizes="(max-width: 640px) calc(100vw - 2rem), 448px"
                className="object-cover object-[center_48%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              <p className="absolute bottom-3 left-5 right-5 text-sm font-semibold leading-snug text-white drop-shadow-sm sm:left-7 sm:right-7">
                {content.photoBadge}
              </p>
            </div>
            <div data-testid="welcome-popup-body" className="px-5 pb-5 pt-5 sm:px-7 sm:pb-7">
            <DialogTitle className="text-balance pr-6 font-display text-2xl font-semibold leading-snug tracking-tight text-foreground">
              {variantCopy.headline}
            </DialogTitle>
            <DialogDescription className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
              {variantCopy.body}
            </DialogDescription>
            <div
              className="mt-5 flex items-center justify-between gap-3"
              aria-label={`${content.stepLabel} ${stepIndex + 1} ${content.ofLabel} ${WELCOME_POPUP_STEPS.length}`}
            >
              <p className="shrink-0 text-xs font-medium text-muted-foreground">
                {content.stepLabel} {stepIndex + 1} {content.ofLabel} {WELCOME_POPUP_STEPS.length}
              </p>
              <div className="flex w-full max-w-28 gap-1.5" aria-hidden="true">
                {WELCOME_POPUP_STEPS.map((item, index) => (
                  <span
                    key={item}
                    className={`h-1.5 flex-1 rounded-full ${index <= stepIndex ? "bg-primary" : "bg-muted"}`}
                  />
                ))}
              </div>
            </div>
            <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-3">
              {step === "email" && (
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
                    onChange={(event) => {
                      setEmail(event.target.value)
                      if (emailInvalid) setEmailInvalid(false)
                    }}
                    placeholder={content.emailPlaceholder}
                    aria-invalid={emailInvalid || undefined}
                    className="h-12 rounded-xl text-base md:text-base"
                  />
                  {emailInvalid && (
                    <p className="mt-1.5 text-xs text-destructive" role="alert">
                      {content.emailError}
                    </p>
                  )}
                </div>
              )}
              {step === "phone" && (
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
                    onChange={(event) => {
                      setPhone(event.target.value)
                      if (phoneInvalid) setPhoneInvalid(false)
                    }}
                    placeholder={content.phonePlaceholder}
                    aria-invalid={phoneInvalid || undefined}
                    className="h-12 rounded-xl text-base md:text-base"
                  />
                  {phoneInvalid && (
                    <p className="mt-1.5 text-xs text-destructive" role="alert">
                      {content.phoneError}
                    </p>
                  )}
                </div>
              )}
              {status === "error" && (
                <p className="text-sm text-destructive" role="alert">
                  {content.error}
                </p>
              )}
              <div className="flex gap-2.5">
                {step !== "email" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={status === "submitting"}
                    className="h-11 rounded-full px-5 text-sm font-semibold"
                  >
                    {content.backCta}
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={status === "submitting"}
                  className="h-11 flex-1 rounded-full text-base font-semibold shadow-sm"
                >
                  {status === "submitting"
                    ? content.submitting
                    : isFinalStep
                      ? variantCopy.cta
                      : content.continueCta}
                </Button>
              </div>
              {isFinalStep && (
                <p className="text-center text-xs leading-relaxed text-muted-foreground">{content.microcopy}</p>
              )}
            </form>
            </div>
          </>
        )}
        </div>
        <DialogClose
          ref={closeButtonRef}
          aria-label={content.closeLabel}
          className="absolute right-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/15 bg-white text-black shadow-lg transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <X className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
