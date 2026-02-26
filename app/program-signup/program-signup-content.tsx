"use client"

import { useCallback, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  X,
  PawPrint,
  Calendar,
  Clock,
  Package,
  User,
  Mail,
  Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const TOTAL_STEPS = 4

const PROBLEM_OPTIONS = [
  { label: "Leash pulling", icon: PawPrint },
  { label: "Reactivity to dogs or people", icon: PawPrint },
  { label: "Jumping on guests", icon: PawPrint },
  { label: "Poor recall", icon: PawPrint },
  { label: "Barking/excitability", icon: PawPrint },
  { label: "Separation anxiety", icon: PawPrint },
  { label: "Aggression/safety concerns", icon: PawPrint },
  { label: "General obedience", icon: PawPrint },
]

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const TIME_SLOTS = [
  "8:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "1:00 PM - 3:00 PM",
  "3:00 PM - 5:00 PM",
  "5:00 PM - 7:00 PM",
]

const SESSION_PACKS = [
  { sessions: 3, priceCents: 30000 },
  { sessions: 5, priceCents: 47500 },
  { sessions: 7, priceCents: 63000 },
]

type ProgramSignupData = {
  dogName: string
  dogBreed: string
  problems: string[]
  preferredDay: string
  preferredTimeSlot: string
  sessionsCount: number | null
  ownerName: string
  ownerEmail: string
  ownerPhone: string
}

const INITIAL_DATA: ProgramSignupData = {
  dogName: "",
  dogBreed: "",
  problems: [],
  preferredDay: "",
  preferredTimeSlot: "",
  sessionsCount: null,
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100)
}

function isStepValid(step: number, data: ProgramSignupData) {
  switch (step) {
    case 0:
      return data.dogName.trim() !== "" && data.dogBreed.trim() !== "" && data.problems.length > 0
    case 1:
      return data.preferredDay !== "" && data.preferredTimeSlot !== ""
    case 2:
      return data.sessionsCount !== null
    case 3:
      return (
        data.ownerName.trim() !== "" &&
        data.ownerEmail.trim() !== "" &&
        data.ownerPhone.trim() !== ""
      )
    default:
      return false
  }
}

const STEP_TITLES = [
  { headline: "Tell us about your dog", subtitle: "Enter your dog's details and select the issues you'd like help with." },
  { headline: "Pick your weekly session", subtitle: "Choose the day and timeslot that works best for your schedule." },
  { headline: "Select your plan", subtitle: "Choose the session package that fits your goals." },
  { headline: "Confirm your details", subtitle: "Review your booking and enter your contact information." },
]

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

export function ProgramSignupContent({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [formData, setFormData] = useState<ProgramSignupData>(INITIAL_DATA)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const selectedPack = useMemo(
    () => SESSION_PACKS.find((pack) => pack.sessions === formData.sessionsCount) ?? null,
    [formData.sessionsCount],
  )

  const stepValid = isStepValid(currentStep, formData)

  const updateData = useCallback((updates: Partial<ProgramSignupData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }, [])

  const toggleProblem = useCallback((problem: string) => {
    setFormData((prev) => {
      const hasProblem = prev.problems.includes(problem)
      return {
        ...prev,
        problems: hasProblem
          ? prev.problems.filter((p) => p !== problem)
          : [...prev.problems, problem],
      }
    })
  }, [])

  const goBack = useCallback(() => {
    setDirection(-1)
    setCurrentStep((s) => Math.max(0, s - 1))
  }, [])

  const goNext = useCallback(() => {
    setDirection(1)
    setCurrentStep((s) => Math.min(TOTAL_STEPS - 1, s + 1))
  }, [])

  const handleProceedToCheckout = useCallback(async () => {
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/program-signups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error || "Failed to start checkout.")
      }

      setIsComplete(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start checkout."
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }, [formData])

  // ── Confirmation screen ──
  if (isComplete) {
    return (
      <div className="flex flex-col bg-muted/30">
        <div className="shrink-0 px-6 pt-6 pb-2 flex justify-end">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-8 py-10 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="w-full max-w-md text-center"
          >
            <CheckCircle2 className="w-16 h-16 mx-auto text-primary mb-5" />
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-3">
              You&apos;re all set
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We saved your program details and prepared a secure payment intent. Next step is wiring
              Stripe Elements to complete card payment.
            </p>
            <Button className="mt-8 rounded-full px-10 h-12 text-base" onClick={onClose}>
              Done
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  const progressPercent = ((currentStep + 1) / TOTAL_STEPS) * 100

  // ── Main multi-step form ──
  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* ── Header: Title + Step + Progress ── */}
      <div className="shrink-0 px-6 pt-6 pb-4">
        {/* Close button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Close form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
          {STEP_TITLES[currentStep].headline}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {STEP_TITLES[currentStep].subtitle}
        </p>

        {/* Step indicator + progress bar */}
        <div className="mt-5">
          <p className="text-xs text-muted-foreground mb-1.5">
            Step {currentStep + 1} of {TOTAL_STEPS}
          </p>
          <div className="w-full h-2 rounded-full bg-primary/15 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={false}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          </div>
        </div>
      </div>

      {/* ── Step content — scrollable ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 overscroll-contain">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="space-y-5"
          >
            {/* ─── Step 0: Dog info + problems ─── */}
            {currentStep === 0 && (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Dog&apos;s name <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={formData.dogName}
                      onChange={(e) => updateData({ dogName: e.target.value })}
                      placeholder="e.g. Max"
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Breed <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={formData.dogBreed}
                      onChange={(e) => updateData({ dogBreed: e.target.value })}
                      placeholder="e.g. German Shepherd"
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-2">
                    Problems to solve <span className="text-destructive">*</span>
                  </p>
                  <div className="space-y-2">
                    {PROBLEM_OPTIONS.map((option) => {
                      const selected = formData.problems.includes(option.label)
                      const IconComp = option.icon
                      return (
                        <button
                          key={option.label}
                          type="button"
                          onClick={() => toggleProblem(option.label)}
                          className={cn(
                            "w-full text-left rounded-xl border px-4 py-3.5 flex items-center gap-3 transition-all duration-200",
                            "hover:shadow-sm hover:-translate-y-[1px]",
                            selected
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-border bg-background hover:border-primary/40",
                          )}
                        >
                          <IconComp
                            className={cn(
                              "w-4 h-4 shrink-0",
                              selected ? "text-primary-foreground" : "text-muted-foreground",
                            )}
                          />
                          <span className={cn("font-medium", selected ? "text-primary-foreground" : "text-foreground")}>
                            {option.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ─── Step 1: Day + timeslot ─── */}
            {currentStep === 1 && (
              <>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">
                    Day of the week <span className="text-destructive">*</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {DAYS_OF_WEEK.map((day) => {
                      const selected = formData.preferredDay === day
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => updateData({ preferredDay: day })}
                          className={cn(
                            "rounded-xl border px-4 py-3.5 text-left flex items-center gap-2.5 transition-all duration-200",
                            "hover:shadow-sm hover:-translate-y-[1px]",
                            selected
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-border bg-background hover:border-primary/40",
                          )}
                        >
                          <Calendar
                            className={cn(
                              "w-4 h-4 shrink-0",
                              selected ? "text-primary-foreground" : "text-muted-foreground",
                            )}
                          />
                          <span className={cn("font-medium", selected ? "text-primary-foreground" : "text-foreground")}>
                            {day}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-2">
                    Timeslot <span className="text-destructive">*</span>
                  </p>
                  <div className="space-y-2">
                    {TIME_SLOTS.map((slot) => {
                      const selected = formData.preferredTimeSlot === slot
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => updateData({ preferredTimeSlot: slot })}
                          className={cn(
                            "w-full rounded-xl border px-4 py-3.5 text-left flex items-center gap-2.5 transition-all duration-200",
                            "hover:shadow-sm hover:-translate-y-[1px]",
                            selected
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-border bg-background hover:border-primary/40",
                          )}
                        >
                          <Clock
                            className={cn(
                              "w-4 h-4 shrink-0",
                              selected ? "text-primary-foreground" : "text-muted-foreground",
                            )}
                          />
                          <span className={cn("font-medium", selected ? "text-primary-foreground" : "text-foreground")}>
                            {slot}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ─── Step 2: Session packs ─── */}
            {currentStep === 2 && (
              <>
                <div className="space-y-4">
                  {SESSION_PACKS.map((pack) => {
                    const selected = formData.sessionsCount === pack.sessions
                    return (
                      <div key={pack.sessions} className="relative">
                        <button
                          type="button"
                          onClick={() => updateData({ sessionsCount: pack.sessions })}
                          className={cn(
                            "w-full rounded-2xl border px-6 py-5 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 relative overflow-hidden",
                            "hover:shadow-md hover:-translate-y-[1px]",
                            selected
                              ? "border-primary bg-primary text-primary-foreground ring-1 ring-primary/20 shadow-md"
                              : "border-border bg-background hover:border-primary/30",
                          )}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <Package
                              className={cn(
                                "w-5 h-5 shrink-0",
                                selected ? "text-primary-foreground" : "text-muted-foreground",
                              )}
                            />
                            <div>
                              <span
                                className={cn(
                                  "font-bold text-lg block mb-0.5",
                                  selected ? "text-primary-foreground" : "text-foreground",
                                )}
                              >
                                {pack.sessions} sessions{" "}
                                <span
                                  className={cn(
                                    "font-normal text-base",
                                    selected ? "text-primary-foreground/80" : "text-muted-foreground",
                                  )}
                                >
                                  (1h each)
                                </span>
                              </span>
                              <span
                                className={cn(
                                  "text-sm font-medium inline-block",
                                  selected ? "text-primary-foreground/80" : "text-destructive",
                                )}
                              >
                                Limited spots available
                              </span>
                            </div>
                          </div>

                          <div className="text-left sm:text-right shrink-0">
                            <span
                              className={cn(
                                "font-bold text-2xl block",
                                selected ? "text-primary-foreground" : "text-foreground",
                              )}
                            >
                              {formatCurrency(pack.priceCents)}
                            </span>
                            <span
                              className={cn(
                                "text-sm block line-through opacity-70",
                                selected ? "text-primary-foreground/70" : "text-muted-foreground",
                              )}
                            >
                              {formatCurrency(Math.round((pack.priceCents * 1.2) / pack.sessions))} / session
                            </span>
                          </div>
                        </button>

                        {pack.sessions === 5 && (
                          <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-sm z-10">
                            Save $38
                          </div>
                        )}
                        {pack.sessions === 7 && (
                          <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-sm z-10">
                            Save $75
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="flex justify-center pt-2">
                  <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Results Guaranteed</span>
                  </div>
                </div>
              </>
            )}

            {/* ─── Step 3: Summary + contact info ─── */}
            {currentStep === 3 && (
              <>
                {/* Booking summary card */}
                <div className="rounded-2xl border border-border bg-background p-5 space-y-3">
                  <h3 className="font-bold text-base text-foreground">Booking Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Dog:</span>
                      <span className="text-foreground font-medium">
                        {formData.dogName || "-"} ({formData.dogBreed || "-"})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Problems:</span>
                      <span className="text-foreground font-medium text-right max-w-[60%]">
                        {formData.problems.join(", ") || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Schedule:</span>
                      <span className="text-foreground font-medium">
                        {formData.preferredDay || "-"}, {formData.preferredTimeSlot || "-"}
                      </span>
                    </div>
                  </div>

                  {/* Price breakdown */}
                  {selectedPack && (
                    <>
                      <div className="border-t border-border pt-3 mt-3 space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-medium">Package:</span>
                          <span className="text-foreground font-medium">
                            {selectedPack.sessions} sessions
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-base pt-1">
                          <span className="text-foreground">Total:</span>
                          <span className="text-foreground">{formatCurrency(selectedPack.priceCents)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Contact form */}
                <div className="space-y-3 pt-1">
                  <h3 className="font-bold text-base text-foreground">Your Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      <User className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5 text-muted-foreground" />
                      Full name <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={formData.ownerName}
                      onChange={(e) => updateData({ ownerName: e.target.value })}
                      placeholder="Enter your full name"
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      <Mail className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5 text-muted-foreground" />
                      Email <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={formData.ownerEmail}
                      onChange={(e) => updateData({ ownerEmail: e.target.value })}
                      placeholder="you@example.com"
                      type="email"
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      <Phone className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5 text-muted-foreground" />
                      Phone number <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={formData.ownerPhone}
                      onChange={(e) => updateData({ ownerPhone: e.target.value })}
                      placeholder="(514) 555-0199"
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Bottom navigation ── */}
      <div className="shrink-0 border-t border-border/50 px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3">
          {/* Back / Cancel left */}
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-muted"
            >
              Cancel
            </button>
          )}

          {/* Error message */}
          {submitError && (
            <p className="text-sm text-destructive flex-1 text-center">{submitError}</p>
          )}

          {/* Continue / Submit right */}
          <Button
            type="button"
            onClick={currentStep === TOTAL_STEPS - 1 ? handleProceedToCheckout : goNext}
            disabled={!stepValid || isSubmitting}
            className="rounded-full px-8 h-11 text-sm font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Preparing…
              </>
            ) : currentStep === TOTAL_STEPS - 1 ? (
              "Proceed to checkout"
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
