"use client"

import {
  Suspense,
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useState,
  type ReactElement,
  type ReactNode,
} from "react"
import { Mail, Phone, Calendar, X } from "lucide-react"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BookingContent } from "@/app/booking/booking-content"
import { GroupClassesBookingPanel } from "@/app/group-classes/group-classes-booking-panel"
import { ProgramSignupContent } from "@/app/program-signup/program-signup-content"
import {
  TrainingPortalContent,
  type TrainingPortalEmbeddedTrainer,
  type TrainingPortalMode,
} from "@/app/training-portal/training-portal-content"
import { useLocalizedText } from "@/lib/i18n/use-localized-text"

type OpenTrainingPortalOptions = {
  mode?: TrainingPortalMode
  trainerTeamMemberId?: string
  trainerSlug?: string
  trainerName?: string
}

type OpenGroupClassesBookingOptions = {
  preferredCoachId?: string
  preferredCoachLabel?: string
}

const defaultPortalLaunch: {
  mode: TrainingPortalMode
  embeddedTrainer: TrainingPortalEmbeddedTrainer | null
} = {
  mode: "private_only",
  embeddedTrainer: null,
}

function buildEmbeddedTrainer(opts?: OpenTrainingPortalOptions): TrainingPortalEmbeddedTrainer | null {
  const id = opts?.trainerTeamMemberId?.trim()
  const slug = opts?.trainerSlug?.trim().toLowerCase()
  const name = opts?.trainerName?.trim()
  if (!id && !slug && !name) return null
  return {
    trainerTeamMemberId: id || null,
    trainerSlug: slug || null,
    trainerName: name || null,
  }
}

export type FreeCallModalVariant = "contact" | "consultation"

type BookingFormContextType = {
  openBookingForm: () => void
  openProgramSignupForm: () => void
  openFreeCallModal: (opts?: { variant?: FreeCallModalVariant }) => void
  openTrainingPortal: (opts?: OpenTrainingPortalOptions) => void
  openGroupClassesBooking: (opts?: OpenGroupClassesBookingOptions) => void
}

const BookingFormContext = createContext<BookingFormContextType | null>(null)

export function useBookingForm() {
  const ctx = useContext(BookingFormContext)
  if (!ctx) throw new Error("useBookingForm must be used within BookingFormProvider")
  return ctx
}

export function BookingFormProvider({ children }: { children: ReactNode }) {
  const t = useLocalizedText()
  const [bookingOpen, setBookingOpen] = useState(false)
  const [bookingFormKey, setBookingFormKey] = useState(0)
  const [programSignupOpen, setProgramSignupOpen] = useState(false)
  const [programSignupKey, setProgramSignupKey] = useState(0)
  const [freeCallOpen, setFreeCallOpen] = useState(false)
  const [freeCallVariant, setFreeCallVariant] = useState<FreeCallModalVariant>("contact")
  const [trainingPortalOpen, setTrainingPortalOpen] = useState(false)
  const [trainingPortalKey, setTrainingPortalKey] = useState(0)
  const [portalLaunch, setPortalLaunch] = useState(defaultPortalLaunch)
  const [groupClassesOpen, setGroupClassesOpen] = useState(false)
  const [groupClassesKey, setGroupClassesKey] = useState(0)
  const [groupClassesCoach, setGroupClassesCoach] = useState<OpenGroupClassesBookingOptions | undefined>(undefined)

  const openBookingForm = useCallback(() => {
    setBookingFormKey((k) => k + 1) // reset form state on each open
    setBookingOpen(true)
  }, [])

  const closeBookingForm = useCallback(() => {
    setBookingOpen(false)
  }, [])

  const openProgramSignupForm = useCallback(() => {
    setProgramSignupKey((k) => k + 1)
    setProgramSignupOpen(true)
  }, [])

  const closeProgramSignupForm = useCallback(() => {
    setProgramSignupOpen(false)
  }, [])

  const openFreeCallModal = useCallback((opts?: { variant?: FreeCallModalVariant }) => {
    setFreeCallVariant(opts?.variant ?? "contact")
    setFreeCallOpen(true)
  }, [])

  const handleFreeCallOpenChange = useCallback((open: boolean) => {
    setFreeCallOpen(open)
    if (!open) setFreeCallVariant("contact")
  }, [])

  const openTrainingPortal = useCallback((opts?: OpenTrainingPortalOptions) => {
    const mode = opts?.mode ?? "private_only"
    setPortalLaunch({
      mode,
      embeddedTrainer: buildEmbeddedTrainer(opts),
    })
    setTrainingPortalKey((k) => k + 1)
    setTrainingPortalOpen(true)
  }, [])

  const resetPortalLaunch = useCallback(() => {
    setPortalLaunch(defaultPortalLaunch)
  }, [])

  const handleTrainingPortalOpenChange = useCallback(
    (open: boolean) => {
      setTrainingPortalOpen(open)
      if (!open) resetPortalLaunch()
    },
    [resetPortalLaunch],
  )

  const closeTrainingPortal = useCallback(() => {
    setTrainingPortalOpen(false)
    resetPortalLaunch()
  }, [resetPortalLaunch])

  const openGroupClassesBooking = useCallback((opts?: OpenGroupClassesBookingOptions) => {
    setGroupClassesCoach(opts)
    setGroupClassesKey((k) => k + 1)
    setGroupClassesOpen(true)
  }, [])

  const handleGroupClassesOpenChange = useCallback((open: boolean) => {
    setGroupClassesOpen(open)
    if (!open) setGroupClassesCoach(undefined)
  }, [])

  const closeFreeCallModal = useCallback(() => {
    setFreeCallOpen(false)
    setFreeCallVariant("contact")
  }, [])

  const handleOpenAssessmentFromFreeCall = useCallback(() => {
    closeFreeCallModal()
    openBookingForm()
  }, [closeFreeCallModal, openBookingForm])

  return (
    <BookingFormContext.Provider
      value={{
        openBookingForm,
        openProgramSignupForm,
        openFreeCallModal,
        openTrainingPortal,
        openGroupClassesBooking,
      }}
    >
      {children}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent
          showCloseButton={false}
          className="!flex !flex-col w-screen h-[100dvh] max-h-[100dvh] !top-0 !left-0 !translate-x-0 !translate-y-0 rounded-t-3xl sm:rounded-2xl border-none p-0 gap-0 overflow-hidden sm:!top-[50%] sm:!left-[50%] sm:!translate-x-[-50%] sm:!translate-y-[-50%] sm:w-[95vw] sm:max-w-[600px] sm:h-[85dvh] sm:shadow-2xl"
        >
          <DialogTitle className="sr-only">{t("Book your evaluation")}</DialogTitle>
          <BookingContent key={bookingFormKey} onClose={closeBookingForm} />
        </DialogContent>
      </Dialog>
      <Dialog open={programSignupOpen} onOpenChange={setProgramSignupOpen}>
        <DialogContent
          showCloseButton={false}
          className="!flex !flex-col w-screen h-[100dvh] max-h-[100dvh] !top-0 !left-0 !translate-x-0 !translate-y-0 rounded-t-3xl sm:rounded-2xl border-none p-0 gap-0 overflow-hidden sm:!top-[50%] sm:!left-[50%] sm:!translate-x-[-50%] sm:!translate-y-[-50%] sm:w-[95vw] sm:max-w-[600px] sm:h-[85dvh] sm:shadow-2xl"
        >
          <DialogTitle className="sr-only">{t("Program sign-up")}</DialogTitle>
          <ProgramSignupContent key={programSignupKey} onClose={closeProgramSignupForm} />
        </DialogContent>
      </Dialog>
      <Dialog open={freeCallOpen} onOpenChange={handleFreeCallOpenChange}>
        <DialogContent className="w-[95vw] max-w-[520px] rounded-2xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">
            {freeCallVariant === "consultation" ? t("Book a Consultation") : t("Contact us for a free call")}
          </DialogTitle>
          <div className="p-6 sm:p-7 space-y-5">
            <div>
              <h3 className="text-xl font-semibold tracking-tight">
                {freeCallVariant === "consultation"
                  ? t("Book a Consultation")
                  : t("Contact Us for a Free Call")}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {freeCallVariant === "consultation"
                  ? t(
                      "Schedule your in-person evaluation online, or reach us by phone or email — we'll help you choose the right next step.",
                    )
                  : t("Reach us directly and we will guide you to the right next step.")}
              </p>
            </div>
            <Button
              type="button"
              className="w-full rounded-full py-3.5 px-5 h-auto text-base font-semibold shadow-sm gap-2"
              onClick={handleOpenAssessmentFromFreeCall}
            >
              <Calendar className="size-5 shrink-0" aria-hidden />
              {freeCallVariant === "consultation"
                ? t("Continue to book")
                : t("Fill out your inquiry now")}
            </Button>
            <div className="space-y-2 pt-1">
              <a
                href="tel:+15148269558"
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs sm:text-sm hover:bg-muted/40 transition-colors"
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <Phone className="size-3.5 shrink-0 text-primary" aria-hidden />
                  <span className="font-medium truncate">{t("Call us")}</span>
                </span>
                <span className="text-muted-foreground shrink-0 ml-2 tabular-nums">514 826 9558</span>
              </a>
              <a
                href="mailto:mtlcaninetraining@gmail.com"
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs sm:text-sm hover:bg-muted/40 transition-colors gap-2"
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <Mail className="size-3.5 shrink-0 text-primary" aria-hidden />
                  <span className="font-medium truncate">{t("Email us")}</span>
                </span>
                <span className="text-muted-foreground truncate max-w-[52%] sm:max-w-[58%]">
                  mtlcaninetraining@gmail.com
                </span>
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={trainingPortalOpen} onOpenChange={handleTrainingPortalOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="!flex !flex-col w-screen h-[100dvh] max-h-[100dvh] !top-0 !left-0 !translate-x-0 !translate-y-0 rounded-t-3xl sm:rounded-2xl border-none p-0 gap-0 overflow-hidden sm:!top-[50%] sm:!left-[50%] sm:!translate-x-[-50%] sm:!translate-y-[-50%] sm:w-[95vw] sm:max-w-[600px] sm:h-[85dvh] sm:shadow-2xl"
        >
          <DialogTitle className="sr-only">
            {portalLaunch.mode === "private_only"
              ? t("Private training portal")
              : t("Group Classes")}
          </DialogTitle>
          <TrainingPortalContent
            key={trainingPortalKey}
            onClose={closeTrainingPortal}
            mode={portalLaunch.mode}
            embeddedTrainer={portalLaunch.embeddedTrainer}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={groupClassesOpen} onOpenChange={handleGroupClassesOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="!flex !flex-col w-screen h-[100dvh] max-h-[100dvh] !top-0 !left-0 !translate-x-0 !translate-y-0 rounded-t-3xl sm:rounded-2xl border-none p-0 gap-0 overflow-hidden sm:!top-[50%] sm:!left-[50%] sm:!translate-x-[-50%] sm:!translate-y-[-50%] sm:w-[95vw] sm:max-w-[960px] sm:h-[85dvh] sm:shadow-2xl"
        >
          <DialogTitle className="sr-only">{t("Group Classes")}</DialogTitle>
          <div className="flex shrink-0 items-center justify-end border-b border-border/45 px-4 py-3 sm:px-6">
            <DialogClose
              type="button"
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={t("Close")}
            >
              <X className="size-5" aria-hidden />
              <span className="sr-only">{t("Close")}</span>
            </DialogClose>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-2 sm:px-6">
            <Suspense
              fallback={
                <div className="rounded-3xl border border-border/60 bg-card p-8 text-muted-foreground text-sm animate-pulse">
                  {t("Loading group classes…")}
                </div>
              }
            >
              <GroupClassesBookingPanel
                key={groupClassesKey}
                preferredCoachId={groupClassesCoach?.preferredCoachId?.trim() || null}
                preferredCoachLabel={groupClassesCoach?.preferredCoachLabel?.trim() || null}
              />
            </Suspense>
          </div>
        </DialogContent>
      </Dialog>
    </BookingFormContext.Provider>
  )
}

export function ProgramSignupLink({
  children,
  className,
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  const { openProgramSignupForm } = useBookingForm()

  const handleOpen = () => {
    onClick?.()
    openProgramSignupForm()
  }

  if (isValidElement(children)) {
    const child = children as ReactElement<{
      className?: string
      onClick?: () => void
      type?: string
    }>
    const childProps = child.props
    const mergedClassName = [childProps.className, className].filter(Boolean).join(" ") || undefined
    const mergedType =
      typeof child.type === "string" && child.type === "button"
        ? (childProps.type ?? "button")
        : childProps.type

    return cloneElement(child, {
      className: mergedClassName,
      onClick: () => {
        childProps.onClick?.()
        handleOpen()
      },
      type: mergedType,
    })
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleOpen}
    >
      {children}
    </button>
  )
}

export function BookingLink({
  children,
  className,
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  const { openBookingForm } = useBookingForm()

  const handleOpen = () => {
    onClick?.()
    openBookingForm()
  }

  if (isValidElement(children)) {
    const child = children as ReactElement<{
      className?: string
      onClick?: () => void
      type?: string
    }>
    const childProps = child.props
    const mergedClassName = [childProps.className, className].filter(Boolean).join(" ") || undefined
    const mergedType =
      typeof child.type === "string" && child.type === "button"
        ? (childProps.type ?? "button")
        : childProps.type

    return cloneElement(child, {
      className: mergedClassName,
      onClick: () => {
        childProps.onClick?.()
        handleOpen()
      },
      type: mergedType,
    })
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleOpen}
    >
      {children}
    </button>
  )
}

export function FreeCallLink({
  children,
  className,
  onClick,
  modalVariant = "contact",
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
  modalVariant?: FreeCallModalVariant
}) {
  const { openFreeCallModal } = useBookingForm()

  const handleOpen = () => {
    onClick?.()
    openFreeCallModal({ variant: modalVariant })
  }

  if (isValidElement(children)) {
    const child = children as ReactElement<{
      className?: string
      onClick?: () => void
      type?: string
    }>
    const childProps = child.props
    const mergedClassName = [childProps.className, className].filter(Boolean).join(" ") || undefined
    const mergedType =
      typeof child.type === "string" && child.type === "button"
        ? (childProps.type ?? "button")
        : childProps.type

    return cloneElement(child, {
      className: mergedClassName,
      onClick: () => {
        childProps.onClick?.()
        handleOpen()
      },
      type: mergedType,
    })
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleOpen}
    >
      {children}
    </button>
  )
}

export function TrainingPortalLink({
  children,
  className,
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  const { openTrainingPortal } = useBookingForm()

  const handleOpen = () => {
    onClick?.()
    openTrainingPortal()
  }

  if (isValidElement(children)) {
    const child = children as ReactElement<{
      className?: string
      onClick?: () => void
      type?: string
    }>
    const childProps = child.props
    const mergedClassName = [childProps.className, className].filter(Boolean).join(" ") || undefined
    const mergedType =
      typeof child.type === "string" && child.type === "button"
        ? (childProps.type ?? "button")
        : childProps.type

    return cloneElement(child, {
      className: mergedClassName,
      onClick: () => {
        childProps.onClick?.()
        handleOpen()
      },
      type: mergedType,
    })
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleOpen}
    >
      {children}
    </button>
  )
}
