"use client"

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { usePathname } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import posthog from "posthog-js"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type StoredPopupState = {
  state?: "dismissed" | "subscribed"
  at?: string
  variant?: WelcomePopupVariant
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

/** Feature-flag gate — the whole popup ships dark unless NEXT_PUBLIC_WELCOME_POPUP="1". */
export function WelcomePopup() {
  if (process.env.NEXT_PUBLIC_WELCOME_POPUP !== "1") return null
  return <WelcomePopupInner />
}

function WelcomePopupInner() {
  const locale = useAppLocale()
  const pathname = usePathname() || "/"
  const [open, setOpen] = useState(false)
  const [variant, setVariant] = useState<WelcomePopupVariant>("a")
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [emailInvalid, setEmailInvalid] = useState(false)
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
    if (isSuppressed(readStoredState())) return

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

  // Success → mark subscribed already happened; auto-close after ~2.5s.
  useEffect(() => {
    if (status !== "success") return
    const timer = window.setTimeout(() => setOpen(false), 2500)
    return () => window.clearTimeout(timer)
  }, [status])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen)
      if (nextOpen) return
      // Close via X / backdrop / Escape counts as a dismissal — but not the
      // auto-close after a successful signup (already marked subscribed).
      if (statusRef.current === "success") return
      const stored = readStoredState()
      if (stored?.state === "subscribed") return
      writeStoredState({ state: "dismissed", at: new Date().toISOString(), variant })
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
      setEmailInvalid(false)
      setStatus("submitting")
      try {
        const res = await fetch("/api/welcome-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: trimmedEmail,
            message: variant === "a" && message.trim() ? message.trim() : undefined,
            variant,
            locale,
            path: pathname,
          }),
        })
        if (!res.ok) throw new Error(`welcome-signup failed (${res.status})`)
        writeStoredState({ state: "subscribed", variant })
        posthog.capture("welcome_popup_submitted", { variant, locale })
        setStatus("success")
      } catch {
        setStatus("error")
      }
    },
    [email, locale, message, pathname, variant],
  )

  const content = welcomePopupContent[locale]
  const variantCopy = content.variants[variant]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md gap-0 rounded-3xl border-border/60 p-6 shadow-2xl sm:p-8">
        {status === "success" ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <DialogTitle className="sr-only">{variantCopy.headline}</DialogTitle>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="text-base leading-relaxed text-foreground" role="status">
              {content.success}
            </p>
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
