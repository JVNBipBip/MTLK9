"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { StepIssue } from "./steps/step-issue"
import { StepDuration } from "./steps/step-duration"
import { StepTried } from "./steps/step-tried"
import { StepImpact } from "./steps/step-impact"
import { StepDogInfo } from "./steps/step-dog-info"
import { StepGoals } from "./steps/step-goals"
import { StepConnect } from "./steps/step-connect"
import { StepContact } from "./steps/step-contact"
import { StepConfirmation } from "./steps/step-confirmation"
import { INITIAL_FORM_DATA, type BookingFormData } from "./types"

const TOTAL_STEPS = 8

// Single-select steps auto-advance on click — no Continue button needed
const AUTO_ADVANCE_STEPS = new Set([0, 1, 6])
const IN_PERSON_PRICE_LABEL = "$100"

type PreparedPaymentIntent = {
  paymentIntentId: string
  clientSecret: string
  status: string
}

function isStepValid(step: number, formData: BookingFormData): boolean {
  switch (step) {
    case 0:
      if (formData.issue === "something-else") return formData.issueOther.trim().length > 0
      return formData.issue !== ""
    case 1:
      return formData.duration !== ""
    case 2:
      return formData.tried.length > 0
    case 3:
      return formData.impact.length > 0
    case 4:
      return (
        formData.dogName.trim() !== "" &&
        formData.dogBreed.trim() !== "" &&
        formData.dogAge !== "" &&
        formData.dogDuration !== "" &&
        formData.dogSource !== ""
      )
    case 5:
      return formData.goals.length > 0
    case 6:
      return formData.connectMethod !== ""
    case 7:
      return (
        formData.contactName.trim() !== "" &&
        formData.contactEmail.trim() !== "" &&
        formData.contactPhone.trim() !== "" &&
        formData.contactBestTime !== ""
      )
    default:
      return false
  }
}

export function BookingContent({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [formData, setFormData] = useState<BookingFormData>(INITIAL_FORM_DATA)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [preparedPaymentIntent, setPreparedPaymentIntent] = useState<PreparedPaymentIntent | null>(null)
  const [isPreparingPayment, setIsPreparingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const updateFormData = useCallback((updates: Partial<BookingFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }, [])

  const goNext = useCallback(() => {
    setDirection(1)
    setCurrentStep((s) => Math.min(TOTAL_STEPS - 1, s + 1))
  }, [])

  const goBack = useCallback(() => {
    setDirection(-1)
    setCurrentStep((s) => Math.max(0, s - 1))
  }, [])

  useEffect(() => {
    if (formData.connectMethod !== "in-person-evaluation") {
      setPreparedPaymentIntent(null)
      setPaymentError(null)
      setIsPreparingPayment(false)
      return
    }

    if (preparedPaymentIntent || isPreparingPayment) return

    let cancelled = false

    const preparePayment = async () => {
      setPaymentError(null)
      setIsPreparingPayment(true)

      try {
        const response = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formData }),
        })

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as { error?: string } | null
          throw new Error(data?.error || "Failed to prepare payment.")
        }

        const data = (await response.json()) as {
          paymentIntentId: string
          clientSecret: string
          status: string
        }

        if (!cancelled) {
          setPreparedPaymentIntent({
            paymentIntentId: data.paymentIntentId,
            clientSecret: data.clientSecret,
            status: data.status,
          })
        }
      } catch (error) {
        console.error("[Booking Form] Failed to prepare payment intent:", error)
        if (!cancelled) {
          setPaymentError("Could not prepare payment. You can still continue and retry before confirming.")
        }
      } finally {
        if (!cancelled) {
          setIsPreparingPayment(false)
        }
      }
    }

    void preparePayment()

    return () => {
      cancelled = true
    }
  }, [formData, preparedPaymentIntent, isPreparingPayment])

  const handleSubmit = useCallback(async () => {
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const isInPerson = formData.connectMethod === "in-person-evaluation"
      if (isInPerson && !preparedPaymentIntent?.paymentIntentId) {
        throw new Error("Payment setup is still preparing. Please wait a moment and try again.")
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData,
          paymentIntentId: preparedPaymentIntent?.paymentIntentId,
          paymentStatus:
            isInPerson && preparedPaymentIntent
              ? "requires_payment_method"
              : "not_required",
        }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error || "Failed to submit booking form.")
      }

      setIsComplete(true)
    } catch (error) {
      console.error("[Booking Form] Submission failed:", error)
      const message = error instanceof Error ? error.message : "Could not submit right now. Please try again in a moment."
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, preparedPaymentIntent])

  const handleClose = onClose

  const stepValid = isStepValid(currentStep, formData)
  const showBottomNav = !AUTO_ADVANCE_STEPS.has(currentStep)

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  }

  if (isComplete) {
    return (
      <div className="h-full flex flex-col">
        <div className="shrink-0 bg-background border-b border-border/50 px-6 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="max-w-lg mx-auto flex justify-end">
            <button
              onClick={handleClose}
              className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 flex items-center justify-center px-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="w-full max-w-lg"
          >
            <StepConfirmation formData={formData} />
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top bar: Back + Progress + Close */}
      <div className="shrink-0 bg-background border-b border-border/50 px-6 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-2">
            {currentStep > 0 ? (
              <button
                onClick={goBack}
                className="p-1.5 -ml-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-8" />
            )}
            <div className="flex-1 text-center text-sm text-muted-foreground">
              Step {currentStep + 1} of {TOTAL_STEPS}
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 -mr-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Close form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <Progress value={((currentStep + 1) / TOTAL_STEPS) * 100} className="h-1.5" />
        </div>
      </div>

      {/* Step content — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 overscroll-contain">
        <div className="max-w-lg mx-auto w-full">
          {formData.connectMethod === "in-person-evaluation" && (
            <div className="mb-4 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
              <p className="font-medium text-foreground">In-person evaluation payment: {IN_PERSON_PRICE_LABEL}</p>
              <p className="text-muted-foreground">
                {isPreparingPayment
                  ? "Preparing secure payment..."
                  : preparedPaymentIntent
                    ? "Payment intent ready. Next step is mounting Stripe Elements in this popup."
                    : "Payment intent has not been prepared yet."}
              </p>
              {paymentError && <p className="text-destructive mt-1">{paymentError}</p>}
            </div>
          )}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              {currentStep === 0 && <StepIssue formData={formData} updateFormData={updateFormData} onAutoAdvance={goNext} />}
              {currentStep === 1 && <StepDuration formData={formData} updateFormData={updateFormData} onAutoAdvance={goNext} />}
              {currentStep === 2 && <StepTried formData={formData} updateFormData={updateFormData} />}
              {currentStep === 3 && <StepImpact formData={formData} updateFormData={updateFormData} />}
              {currentStep === 4 && <StepDogInfo formData={formData} updateFormData={updateFormData} />}
              {currentStep === 5 && <StepGoals formData={formData} updateFormData={updateFormData} />}
              {currentStep === 6 && <StepConnect formData={formData} updateFormData={updateFormData} onAutoAdvance={goNext} />}
              {currentStep === 7 && <StepContact formData={formData} updateFormData={updateFormData} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom nav — only for multi-select / form steps */}
      {showBottomNav && (
        <div className="shrink-0 bg-background border-t border-border/50 px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
            <p className="text-sm text-destructive min-h-5">{submitError ?? ""}</p>
            <Button
              type="button"
              onClick={currentStep === TOTAL_STEPS - 1 ? handleSubmit : goNext}
              disabled={!stepValid || isSubmitting}
              className="rounded-full px-8 h-12 text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : currentStep === TOTAL_STEPS - 1 ? (
                "Submit"
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
