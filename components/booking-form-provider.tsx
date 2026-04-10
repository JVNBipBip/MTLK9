"use client"

import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"
import { Mail, Phone, Calendar } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BookingContent } from "@/app/booking/booking-content"
import { ProgramSignupContent } from "@/app/program-signup/program-signup-content"
import { TrainingPortalContent } from "@/app/training-portal/training-portal-content"

type BookingFormContextType = {
  openBookingForm: () => void
  openProgramSignupForm: () => void
  openFreeCallModal: () => void
  openTrainingPortal: () => void
}

const BookingFormContext = createContext<BookingFormContextType | null>(null)

export function useBookingForm() {
  const ctx = useContext(BookingFormContext)
  if (!ctx) throw new Error("useBookingForm must be used within BookingFormProvider")
  return ctx
}

export function BookingFormProvider({ children }: { children: ReactNode }) {
  const [bookingOpen, setBookingOpen] = useState(false)
  const [bookingFormKey, setBookingFormKey] = useState(0)
  const [programSignupOpen, setProgramSignupOpen] = useState(false)
  const [programSignupKey, setProgramSignupKey] = useState(0)
  const [freeCallOpen, setFreeCallOpen] = useState(false)
  const [trainingPortalOpen, setTrainingPortalOpen] = useState(false)
  const [trainingPortalKey, setTrainingPortalKey] = useState(0)

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

  const openFreeCallModal = useCallback(() => {
    setFreeCallOpen(true)
  }, [])

  const openTrainingPortal = useCallback(() => {
    setTrainingPortalKey((k) => k + 1)
    setTrainingPortalOpen(true)
  }, [])

  const closeTrainingPortal = useCallback(() => {
    setTrainingPortalOpen(false)
  }, [])

  const closeFreeCallModal = useCallback(() => {
    setFreeCallOpen(false)
  }, [])

  const handleOpenAssessmentFromFreeCall = useCallback(() => {
    closeFreeCallModal()
    openBookingForm()
  }, [closeFreeCallModal, openBookingForm])

  return (
    <BookingFormContext.Provider value={{ openBookingForm, openProgramSignupForm, openFreeCallModal, openTrainingPortal }}>
      {children}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent
          showCloseButton={false}
          className="!flex !flex-col w-screen h-[100dvh] max-h-[100dvh] !top-0 !left-0 !translate-x-0 !translate-y-0 rounded-t-3xl sm:rounded-2xl border-none p-0 gap-0 overflow-hidden sm:!top-[50%] sm:!left-[50%] sm:!translate-x-[-50%] sm:!translate-y-[-50%] sm:w-[95vw] sm:max-w-[600px] sm:h-[85dvh] sm:shadow-2xl"
        >
          <DialogTitle className="sr-only">Book your evaluation</DialogTitle>
          <BookingContent key={bookingFormKey} onClose={closeBookingForm} />
        </DialogContent>
      </Dialog>
      <Dialog open={programSignupOpen} onOpenChange={setProgramSignupOpen}>
        <DialogContent
          showCloseButton={false}
          className="!flex !flex-col w-screen h-[100dvh] max-h-[100dvh] !top-0 !left-0 !translate-x-0 !translate-y-0 rounded-t-3xl sm:rounded-2xl border-none p-0 gap-0 overflow-hidden sm:!top-[50%] sm:!left-[50%] sm:!translate-x-[-50%] sm:!translate-y-[-50%] sm:w-[95vw] sm:max-w-[600px] sm:h-[85dvh] sm:shadow-2xl"
        >
          <DialogTitle className="sr-only">Program sign-up</DialogTitle>
          <ProgramSignupContent key={programSignupKey} onClose={closeProgramSignupForm} />
        </DialogContent>
      </Dialog>
      <Dialog open={freeCallOpen} onOpenChange={setFreeCallOpen}>
        <DialogContent className="w-[95vw] max-w-[520px] rounded-2xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Contact us for a free call</DialogTitle>
          <div className="p-6 sm:p-7 space-y-5">
            <div>
              <h3 className="text-xl font-semibold tracking-tight">Book a Free Call</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Reach us directly and we will guide you to the right next step.
              </p>
            </div>
            <div className="space-y-3">
              <a
                href="tel:+15148269558"
                className="flex items-center justify-between rounded-xl border border-border px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="font-medium">Call us</span>
                </span>
                <span className="text-sm text-muted-foreground">514 826 9558</span>
              </a>
              <a
                href="mailto:mtlcaninetraining@gmail.com"
                className="flex items-center justify-between rounded-xl border border-border px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="font-medium">Email us</span>
                </span>
                <span className="text-sm text-muted-foreground">mtlcaninetraining@gmail.com</span>
              </a>
            </div>
            <div className="pt-2 border-t border-border">
              <Button type="button" variant="outline" className="w-full rounded-full" onClick={handleOpenAssessmentFromFreeCall}>
                <Calendar className="w-4 h-4 mr-2" />
                Book your in-person assessment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={trainingPortalOpen} onOpenChange={setTrainingPortalOpen}>
        <DialogContent
          showCloseButton={false}
          className="!flex !flex-col w-screen h-[100dvh] max-h-[100dvh] !top-0 !left-0 !translate-x-0 !translate-y-0 rounded-t-3xl sm:rounded-2xl border-none p-0 gap-0 overflow-hidden sm:!top-[50%] sm:!left-[50%] sm:!translate-x-[-50%] sm:!translate-y-[-50%] sm:w-[95vw] sm:max-w-[1400px] sm:h-[90dvh] sm:shadow-2xl"
        >
          <DialogTitle className="sr-only">Private training portal</DialogTitle>
          <TrainingPortalContent key={trainingPortalKey} onClose={closeTrainingPortal} mode="private_only" />
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
    const childProps = children.props as {
      className?: string
      onClick?: () => void
      type?: string
    }
    const mergedClassName = [childProps.className, className].filter(Boolean).join(" ") || undefined
    const mergedType =
      typeof children.type === "string" && children.type === "button"
        ? (childProps.type ?? "button")
        : childProps.type

    return cloneElement(children, {
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
    const childProps = children.props as {
      className?: string
      onClick?: () => void
      type?: string
    }
    const mergedClassName = [childProps.className, className].filter(Boolean).join(" ") || undefined
    const mergedType =
      typeof children.type === "string" && children.type === "button"
        ? (childProps.type ?? "button")
        : childProps.type

    return cloneElement(children, {
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
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  const { openFreeCallModal } = useBookingForm()

  const handleOpen = () => {
    onClick?.()
    openFreeCallModal()
  }

  if (isValidElement(children)) {
    const childProps = children.props as {
      className?: string
      onClick?: () => void
      type?: string
    }
    const mergedClassName = [childProps.className, className].filter(Boolean).join(" ") || undefined
    const mergedType =
      typeof children.type === "string" && children.type === "button"
        ? (childProps.type ?? "button")
        : childProps.type

    return cloneElement(children, {
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
    const childProps = children.props as {
      className?: string
      onClick?: () => void
      type?: string
    }
    const mergedClassName = [childProps.className, className].filter(Boolean).join(" ") || undefined
    const mergedType =
      typeof children.type === "string" && children.type === "button"
        ? (childProps.type ?? "button")
        : childProps.type

    return cloneElement(children, {
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
