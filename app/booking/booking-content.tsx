"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Loader2, X, Calendar, MapPin, Clock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { StepIssue } from "./steps/step-issue"
import { StepDuration } from "./steps/step-duration"
import { StepTried } from "./steps/step-tried"
import { StepImpact } from "./steps/step-impact"
import { StepDogInfo } from "./steps/step-dog-info"
import { StepGoals } from "./steps/step-goals"
import { StepContact } from "./steps/step-contact"
import { StepConfirmation } from "./steps/step-confirmation"
import { CONTRACT_LABEL, CONTRACT_VERSION, contractBody } from "@/lib/contract-terms"
import { INITIAL_FORM_DATA, type BookingFormData } from "./types"
import { trackFBLead } from "@/lib/facebook-pixel"

const TOTAL_STEPS = 7

// Single-select steps auto-advance on click — no Continue button needed
const AUTO_ADVANCE_STEPS = new Set([0, 1])

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
        formData.dogAge !== ""
      )
    case 5:
      return formData.goals.length > 0
    case 6:
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

const CONSULTATION_LOCATION = "7770 Boul Henri-Bourassa E, Anjou, Montreal"

export function BookingContent({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [formData, setFormData] = useState<BookingFormData>(INITIAL_FORM_DATA)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showSchedulingStep, setShowSchedulingStep] = useState(false)

  const updateFormData = useCallback((updates: Partial<BookingFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }, [])

  // Capture fbclid from URL, localStorage, or cookie on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fbclid =
      params.get("fbclid") ||
      localStorage.getItem("fbclid") ||
      document.cookie.match(/(?:^|;\s*)_fbc=([^;]*)/)?.[1] ||
      ""
    if (fbclid) updateFormData({ fbclid })
  }, [updateFormData])
  const [consultationSlots, setConsultationSlots] = useState<Array<{ startAt: string; slotKey: string; teamMemberId?: string; teamMemberName?: string | null }>>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [intakeContractAccepted, setIntakeContractAccepted] = useState(false)
  const [trainerFilterId, setTrainerFilterId] = useState<string | null>(null)
  const [slotsFetchError, setSlotsFetchError] = useState<string | null>(null)
  const [slotsMeta, setSlotsMeta] = useState<{
    recommendedTeamMemberId: string | null
    nickRoutingActive: boolean
    slotsMessage: string | null
  }>({
    recommendedTeamMemberId: null,
    nickRoutingActive: false,
    slotsMessage: null,
  })

  const displaySlots = useMemo(() => {
    if (!trainerFilterId) return consultationSlots
    return consultationSlots.filter((s) => s.teamMemberId === trainerFilterId)
  }, [consultationSlots, trainerFilterId])

  const uniqueTrainers = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of consultationSlots) {
      if (!s.teamMemberId) continue
      const label = (s.teamMemberName || "Staff").trim() || "Staff"
      if (!map.has(s.teamMemberId)) map.set(s.teamMemberId, label)
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }))
  }, [consultationSlots])

  const groupedSlots = useMemo(() => {
    const groups: Record<string, typeof displaySlots> = {}
    for (const slot of displaySlots) {
      const date = new Date(slot.startAt)
      
      // Get start of week (Sunday)
      const startOfWeek = new Date(date)
      startOfWeek.setDate(date.getDate() - date.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      
      // Get end of week (Saturday)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      
      const key = `${startOfWeek.toLocaleDateString("en-CA", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-CA", { month: "short", day: "numeric" })}`
      
      if (!groups[key]) groups[key] = []
      groups[key].push(slot)
    }
    return groups
  }, [displaySlots])

  const weekKeys = useMemo(() => Object.keys(groupedSlots), [groupedSlots])
  const [selectedWeek, setSelectedWeek] = useState<string>("")

  useEffect(() => {
    if (weekKeys.length === 0) {
      setSelectedWeek("")
      return
    }
    setSelectedWeek((prev) => (prev && weekKeys.includes(prev) ? prev : weekKeys[0]))
  }, [weekKeys])

  useEffect(() => {
    if (!showSchedulingStep) {
      setTrainerFilterId(null)
      setSlotsFetchError(null)
    }
  }, [showSchedulingStep])

  useEffect(() => {
    if (!showSchedulingStep || formData.connectMethod !== "in-person-evaluation") return
    let active = true
    setIsLoadingSlots(true)
    setSlotsFetchError(null)
    async function loadSlots() {
      try {
        const params = new URLSearchParams()
        if (formData.issue) params.set("issue", formData.issue)
        for (const imp of formData.impact) {
          params.append("impact", imp)
        }
        const response = await fetch(`/api/consultation-slots?${params.toString()}`)
        const data = (await response.json().catch(() => null)) as {
          slots?: Array<{ startAt: string; slotKey: string; teamMemberId?: string; teamMemberName?: string | null }>
          recommendedTeamMemberId?: string | null
          nickRoutingActive?: boolean
          slotsMessage?: string | null
          error?: string
        } | null
        if (!active) return
        if (response.status === 503) {
          setConsultationSlots([])
          setSlotsMeta({
            recommendedTeamMemberId: null,
            nickRoutingActive: true,
            slotsMessage: null,
          })
          setSlotsFetchError(data?.error || "Specialist calendar is not configured. Please contact us by phone or email.")
          return
        }
        if (response.ok && data?.slots) {
          setConsultationSlots(data.slots)
          setSlotsMeta({
            recommendedTeamMemberId: data.recommendedTeamMemberId ?? null,
            nickRoutingActive: data.nickRoutingActive ?? false,
            slotsMessage: data.slotsMessage ?? null,
          })
          setSlotsFetchError(null)
        } else {
          setConsultationSlots([])
          setSlotsMeta({
            recommendedTeamMemberId: null,
            nickRoutingActive: false,
            slotsMessage: null,
          })
        }
      } catch {
        if (!active) return
        setConsultationSlots([])
        setSlotsMeta({
          recommendedTeamMemberId: null,
          nickRoutingActive: false,
          slotsMessage: null,
        })
      } finally {
        if (active) setIsLoadingSlots(false)
      }
    }
    void loadSlots()
    return () => {
      active = false
    }
  }, [formData.connectMethod, formData.issue, formData.impact, showSchedulingStep])

  const setTrainerFilterAndClearSlot = useCallback(
    (id: string | null) => {
      setTrainerFilterId(id)
      setFormData((prev) => ({
        ...prev,
        consultationSlotKey: "",
        consultationDateTime: "",
      }))
    },
    [],
  )

  const goNext = useCallback(() => {
    setDirection(1)
    setCurrentStep((s) => Math.min(TOTAL_STEPS - 1, s + 1))
  }, [])

  const goBack = useCallback(() => {
    setDirection(-1)
    setCurrentStep((s) => Math.max(0, s - 1))
  }, [])

  const handleSubmit = useCallback(async () => {
    setSubmitError(null)
    const isInPerson = formData.connectMethod === "in-person-evaluation"
    if (isInPerson && !showSchedulingStep) {
      setShowSchedulingStep(true)
      return
    }

    setIsSubmitting(true)
    try {

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error || "Failed to submit booking form.")
      }

      try {
        await fetch("/api/contract-acceptance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientEmail: formData.contactEmail.trim().toLowerCase(),
            contractKind: "assessment_booking",
            version: CONTRACT_VERSION,
            source: "/booking",
            dogName: formData.dogName.trim(),
          }),
        })
      } catch {
        /* non-blocking */
      }

      setIsComplete(true)
      trackFBLead({
        content_name: formData.connectMethod === "in-person-evaluation"
          ? "In-Person Evaluation"
          : "Free Discovery Call",
        content_category: "Dog Training Lead",
      })
    } catch (error) {
      console.error("[Booking Form] Submission failed:", error)
      const message = error instanceof Error ? error.message : "Could not submit right now. Please try again in a moment."
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, showSchedulingStep])

  const handleClose = onClose

  const stepValid = isStepValid(currentStep, formData)
  const showBottomNav = !AUTO_ADVANCE_STEPS.has(currentStep) && !showSchedulingStep
  const consultationReadyForPayment =
    formData.consultationSlotKey.trim().length > 0 &&
    formData.consultationDateTime.trim().length > 0 &&
    formData.consultationLocation.trim().length > 0

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
                onClick={
                  showSchedulingStep
                    ? () => setShowSchedulingStep(false)
                    : goBack
                }
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
              <p className="font-medium text-foreground">In-person assessment booking</p>
              <p className="text-muted-foreground">
                Choose your preferred assessment slot and we will confirm it in Square.
              </p>
            </div>
          )}
          {showSchedulingStep ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Pick your assessment time</h3>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred in-house assessment slot. No payment is required on the website.
                </p>
              </div>

              {isLoadingSlots ? (
                <div className="p-12 flex flex-col items-center justify-center gap-4 border rounded-xl bg-muted/20">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading available times…</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {slotsFetchError ? (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                      {slotsFetchError}
                    </div>
                  ) : null}
                  {slotsMeta.nickRoutingActive && consultationSlots.length > 0 ? (
                    <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
                      Based on your answers, you&apos;re booking with our specialist for dogs with safety-related
                      concerns.
                    </div>
                  ) : null}
                  {consultationSlots.length === 0 ? (
                    <div className="p-8 text-center border rounded-xl bg-muted/20 space-y-2">
                      <p className="text-muted-foreground">
                        {slotsMeta.slotsMessage ||
                          "No slots available right now. Use the free call option on the site to reach us."}
                      </p>
                    </div>
                  ) : (
                    <>
                      {uniqueTrainers.length > 1 && !slotsMeta.nickRoutingActive ? (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            Trainer
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setTrainerFilterAndClearSlot(null)}
                              className={cn(
                                "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                                trainerFilterId === null
                                  ? "bg-foreground text-background border-foreground"
                                  : "bg-background text-muted-foreground border-border hover:border-primary/40",
                              )}
                            >
                              All trainers
                            </button>
                            {uniqueTrainers.map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setTrainerFilterAndClearSlot(t.id)}
                                className={cn(
                                  "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                                  trainerFilterId === t.id
                                    ? "bg-foreground text-background border-foreground"
                                    : "bg-background text-muted-foreground border-border hover:border-primary/40",
                                )}
                              >
                                {t.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {displaySlots.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6 border rounded-xl bg-muted/10">
                          No times for this trainer. Choose &quot;All trainers&quot; to see every opening.
                        </p>
                      ) : (
                        <>
                          {weekKeys.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                              {weekKeys.map((week) => (
                                <button
                                  key={week}
                                  type="button"
                                  onClick={() => setSelectedWeek(week)}
                                  className={cn(
                                    "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                                    selectedWeek === week
                                      ? "bg-foreground text-background"
                                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                                  )}
                                >
                                  {week}
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(groupedSlots[selectedWeek] || []).map((slot) => {
                              const isSelected = formData.consultationSlotKey === slot.slotKey
                              const date = new Date(slot.startAt)
                              const showRecommendedBadge =
                                Boolean(
                                  slotsMeta.recommendedTeamMemberId &&
                                    slot.teamMemberId === slotsMeta.recommendedTeamMemberId &&
                                    !slotsMeta.nickRoutingActive,
                                )

                              return (
                                <button
                                  key={slot.slotKey}
                                  type="button"
                                  onClick={() =>
                                    updateFormData({
                                      consultationDateTime: slot.startAt,
                                      consultationSlotKey: slot.slotKey,
                                      consultationLocation: CONSULTATION_LOCATION,
                                      consultationWhat: "In-person assessment",
                                    })
                                  }
                                  className={cn(
                                    "relative flex flex-col items-start p-4 rounded-xl border text-left transition-all",
                                    isSelected
                                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                                      : "border-border bg-background hover:border-primary/50 hover:bg-muted/50",
                                  )}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <Calendar
                                      className={cn("w-4 h-4", isSelected ? "text-primary" : "text-muted-foreground")}
                                    />
                                    <span
                                      className={cn(
                                        "text-sm font-medium",
                                        isSelected ? "text-primary" : "text-foreground",
                                      )}
                                    >
                                      {date.toLocaleDateString("en-CA", {
                                        weekday: "long",
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock
                                      className={cn("w-4 h-4", isSelected ? "text-primary" : "text-muted-foreground")}
                                    />
                                    <span
                                      className={cn("text-sm", isSelected ? "text-foreground" : "text-muted-foreground")}
                                    >
                                      {date.toLocaleTimeString("en-CA", { timeStyle: "short" })}
                                    </span>
                                  </div>
                                  {(slot.teamMemberName || slot.teamMemberId) && (
                                    <div className="flex items-center gap-2 mt-1">
                                      <User
                                        className={cn(
                                          "w-4 h-4 shrink-0",
                                          isSelected ? "text-primary" : "text-muted-foreground",
                                        )}
                                      />
                                      <span
                                        className={cn(
                                          "text-sm",
                                          isSelected ? "text-foreground" : "text-muted-foreground",
                                        )}
                                      >
                                        {slot.teamMemberName || "Staff"}
                                      </span>
                                    </div>
                                  )}
                                  {showRecommendedBadge ? (
                                    <Badge variant="secondary" className="mt-2">
                                      Recommended specialist
                                    </Badge>
                                  ) : null}
                                </button>
                              )
                            })}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {formData.consultationDateTime && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border bg-muted/30 overflow-hidden"
                >
                  <div className="bg-muted/50 px-4 py-3 border-b border-border/50">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      Booking Summary
                    </h4>
                  </div>
                  <div className="p-4 space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Date & Time</p>
                        <p className="text-muted-foreground">
                          {new Date(formData.consultationDateTime).toLocaleString("en-CA", { 
                            dateStyle: "full", 
                            timeStyle: "short" 
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Location</p>
                        <p className="text-muted-foreground">{CONSULTATION_LOCATION}</p>
                      </div>
                    </div>

                    {(() => {
                      const selectedSlot = consultationSlots.find((s) => s.slotKey === formData.consultationSlotKey)
                      const staffName = selectedSlot?.teamMemberName || (selectedSlot?.teamMemberId ? "Staff" : null)
                      return staffName ? (
                        <div className="flex items-start gap-3">
                          <User className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-foreground">With</p>
                            <p className="text-muted-foreground">{staffName}</p>
                          </div>
                        </div>
                      ) : null
                    })()}

                    <div className="flex items-start gap-3">
                      <div className="w-4 h-4 rounded-full border-2 border-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Service</p>
                        <p className="text-muted-foreground">In-person assessment</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="space-y-3 pt-2">
                <details className="rounded-xl border border-border bg-muted/20 p-4 text-sm text-left">
                  <summary className="cursor-pointer font-medium">{CONTRACT_LABEL.assessment_booking} ({CONTRACT_VERSION})</summary>
                  <p className="mt-2 text-muted-foreground leading-relaxed">{contractBody("assessment_booking")}</p>
                </details>
                <label className="flex items-start gap-2 text-sm text-left">
                  <input
                    type="checkbox"
                    checked={intakeContractAccepted}
                    onChange={(e) => setIntakeContractAccepted(e.target.checked)}
                    className="mt-1"
                  />
                  <span>I have read and agree to this agreement ({CONTRACT_VERSION}).</span>
                </label>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <p className="text-sm text-destructive min-h-5">{submitError ?? ""}</p>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!consultationReadyForPayment || isSubmitting || !intakeContractAccepted}
                  className="rounded-full px-8 h-12 text-base"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    "Confirm assessment booking"
                  )}
                </Button>
              </div>
            </div>
          ) : (
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
                {currentStep === 6 && <StepContact formData={formData} updateFormData={updateFormData} />}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Bottom nav — only for multi-select / form steps */}
      {showBottomNav && (
        <div className="shrink-0 bg-background border-t border-border/50 px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-lg mx-auto flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
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
                "Continue to scheduling"
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
      )}
    </div>
  )
}
