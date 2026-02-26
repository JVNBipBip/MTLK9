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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { BookingContent } from "@/app/booking/booking-content"
import { ProgramSignupContent } from "@/app/program-signup/program-signup-content"

type BookingFormContextType = {
  openBookingForm: () => void
  openProgramSignupForm: () => void
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

  return (
    <BookingFormContext.Provider value={{ openBookingForm, openProgramSignupForm }}>
      {children}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent
          showCloseButton={false}
          className="!flex !flex-col w-screen h-[100dvh] max-h-[100dvh] !top-0 !left-0 !translate-x-0 !translate-y-0 rounded-none border-none p-0 gap-0 sm:!top-[50%] sm:!left-[50%] sm:!translate-x-[-50%] sm:!translate-y-[-50%] sm:w-[95vw] sm:max-w-[600px] sm:h-[85dvh] sm:rounded-2xl sm:shadow-2xl"
        >
          <DialogTitle className="sr-only">Book your evaluation</DialogTitle>
          <BookingContent key={bookingFormKey} onClose={closeBookingForm} />
        </DialogContent>
      </Dialog>
      <Dialog open={programSignupOpen} onOpenChange={setProgramSignupOpen}>
        <DialogContent
          showCloseButton={false}
          className="!flex !flex-col w-screen h-[100dvh] max-h-[100dvh] !top-0 !left-0 !translate-x-0 !translate-y-0 rounded-none border-none p-0 gap-0 sm:!top-[50%] sm:!left-[50%] sm:!translate-x-[-50%] sm:!translate-y-[-50%] sm:w-[95vw] sm:max-w-[600px] sm:h-[85dvh] sm:rounded-2xl sm:shadow-2xl"
        >
          <DialogTitle className="sr-only">Program sign-up</DialogTitle>
          <ProgramSignupContent key={programSignupKey} onClose={closeProgramSignupForm} />
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
