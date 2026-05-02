"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Loader2, X, Calendar, MapPin, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { StepIssue } from "./steps/step-issue"
import { StepFollowUps } from "./steps/step-follow-ups"
import { StepDogInfo } from "./steps/step-dog-info"
import { StepGoals } from "./steps/step-goals"
import { StepContact } from "./steps/step-contact"
import { StepConfirmation } from "./steps/step-confirmation"
import { CONTRACT_LABEL, CONTRACT_VERSION, contractBody } from "@/lib/contract-terms"
import { INITIAL_FORM_DATA, type BookingFormData } from "./types"
import { trackFBLead } from "@/lib/facebook-pixel"
import { FOLLOW_UP_QUESTIONS_BY_ISSUE, GOALS_OPTIONS_BY_ISSUE } from "./constants"

const TOTAL_STEPS = 5

// Single-select steps auto-advance on click — no Continue button needed
const AUTO_ADVANCE_STEPS = new Set([0])

function hasAnsweredFollowUps(formData: BookingFormData): boolean {
  const questions = FOLLOW_UP_QUESTIONS_BY_ISSUE[formData.issue] || []
  return questions.every((question) => Boolean(formData.followUps[question.value]))
}

function hasAnsweredGoals(formData: BookingFormData): boolean {
  const goals = GOALS_OPTIONS_BY_ISSUE[formData.issue] || []
  return goals.length === 0 || formData.goals.length > 0
}

function isStepValid(step: number, formData: BookingFormData): boolean {
  switch (step) {
    case 0:
      return formData.issue !== ""
    case 1:
      return hasAnsweredFollowUps(formData)
    case 2:
      return hasAnsweredGoals(formData)
    case 3:
      return (
        formData.dogName.trim() !== "" &&
        formData.dogBreed.trim() !== "" &&
        formData.dogAge !== ""
      )
    case 4:
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

  const slotsByDay = useMemo(() => {
    const groups: Record<string, typeof displaySlots> = {}
    for (const slot of displaySlots) {
      const d = new Date(slot.startAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      if (!groups[key]) groups[key] = []
      groups[key].push(slot)
    }
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    }
    return groups
  }, [displaySlots])

  const dayKeys = useMemo(() => Object.keys(slotsByDay).sort(), [slotsByDay])
  const [selectedDay, setSelectedDay] = useState<string>("")

  useEffect(() => {
    if (dayKeys.length === 0) {
      setSelectedDay("")
      return
    }
    setSelectedDay((prev) => (prev && dayKeys.includes(prev) ? prev : dayKeys[0]))
  }, [dayKeys])

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
        for (const [key, value] of Object.entries(formData.followUps)) {
          if (value) params.append("followUp", `${key}:${value}`)
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
  }, [formData.connectMethod, formData.followUps, formData.impact, formData.issue, showSchedulingStep])

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
                    <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground space-y-1">
                      <p>
                        Based on your answers, you&apos;re booking with the trainer matched to your dog&apos;s needs.
                      </p>
                      <p className="text-muted-foreground">
                        Please note: specialist assessments may have different pricing than our standard assessment.
                      </p>
                    </div>
                  ) : null}
                  {!slotsMeta.nickRoutingActive &&
                  slotsMeta.recommendedTeamMemberId &&
                  consultationSlots.length > 0 ? (
                    <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm space-y-1">
                      <p className="flex items-center gap-2 font-medium text-foreground">
                        <span
                          aria-hidden="true"
                          className="w-2 h-2 rounded-full bg-primary"
                        />
                        Recommended specialist for your dog&apos;s needs
                      </p>
                      <p className="text-muted-foreground pl-4">
                        Specialist assessment is $165 CAD (standard is $145 CAD). Look for the dot on
                        the recommended trainer and time slots below.
                      </p>
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
                            {uniqueTrainers.map((t) => {
                              const isRecommendedTrainer =
                                !!slotsMeta.recommendedTeamMemberId &&
                                t.id === slotsMeta.recommendedTeamMemberId
                              const isActive = trainerFilterId === t.id
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => setTrainerFilterAndClearSlot(t.id)}
                                  className={cn(
                                    "relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                                    isActive
                                      ? "bg-foreground text-background border-foreground"
                                      : "bg-background text-muted-foreground border-border hover:border-primary/40",
                                  )}
                                >
                                  {isRecommendedTrainer ? (
                                    <span
                                      aria-hidden="true"
                                      className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        isActive ? "bg-background" : "bg-primary",
                                      )}
                                    />
                                  ) : null}
                                  {t.name}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ) : null}
                      {displaySlots.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6 border rounded-xl bg-muted/10">
                          No times for this trainer. Choose &quot;All trainers&quot; to see every opening.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                              Pick a day
                            </p>
                            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar snap-x">
                              {dayKeys.map((dayKey) => {
                                const daySlots = slotsByDay[dayKey] || []
                                const first = daySlots[0]
                                if (!first) return null
                                const d = new Date(first.startAt)
                                const isActive = selectedDay === dayKey
                                const count = daySlots.length
                                const hasRecommended =
                                  !slotsMeta.nickRoutingActive &&
                                  slotsMeta.recommendedTeamMemberId &&
                                  daySlots.some(
                                    (s) => s.teamMemberId === slotsMeta.recommendedTeamMemberId,
                                  )
                                return (
                                  <button
                                    key={dayKey}
                                    type="button"
                                    onClick={() => setSelectedDay(dayKey)}
                                    className={cn(
                                      "relative snap-start shrink-0 flex flex-col items-center justify-center px-4 py-3 rounded-xl border min-w-[76px] transition-colors",
                                      isActive
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border bg-background hover:border-primary/40 hover:bg-muted/40",
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "text-[10px] font-semibold uppercase tracking-wide",
                                        isActive ? "text-primary-foreground/80" : "text-muted-foreground",
                                      )}
                                    >
                                      {d.toLocaleDateString("en-CA", { weekday: "short" })}
                                    </span>
                                    <span className="text-lg font-bold leading-none mt-1">
                                      {d.getDate()}
                                    </span>
                                    <span
                                      className={cn(
                                        "text-[10px] mt-1",
                                        isActive ? "text-primary-foreground/80" : "text-muted-foreground",
                                      )}
                                    >
                                      {d.toLocaleDateString("en-CA", { month: "short" })}
                                    </span>
                                    <span
                                      className={cn(
                                        "text-[10px] mt-1",
                                        isActive
                                          ? "text-primary-foreground/70"
                                          : "text-muted-foreground/80",
                                      )}
                                    >
                                      {count} {count === 1 ? "slot" : "slots"}
                                    </span>
                                    {hasRecommended ? (
                                      <span
                                        aria-hidden="true"
                                        className={cn(
                                          "absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full",
                                          isActive ? "bg-primary-foreground" : "bg-primary",
                                        )}
                                      />
                                    ) : null}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {selectedDay && slotsByDay[selectedDay]?.length ? (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                Times on{" "}
                                {new Date(slotsByDay[selectedDay][0].startAt).toLocaleDateString(
                                  "en-CA",
                                  { weekday: "long", month: "long", day: "numeric" },
                                )}
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {slotsByDay[selectedDay].map((slot) => {
                                  const isSelected =
                                    formData.consultationSlotKey === slot.slotKey
                                  const d = new Date(slot.startAt)
                                  const isRecommended = Boolean(
                                    slotsMeta.recommendedTeamMemberId &&
                                      slot.teamMemberId === slotsMeta.recommendedTeamMemberId &&
                                      !slotsMeta.nickRoutingActive,
                                  )
                                  const showTrainerName =
                                    !trainerFilterId &&
                                    uniqueTrainers.length > 1 &&
                                    (slot.teamMemberName || slot.teamMemberId)

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
                                        "relative flex flex-col items-center justify-center py-3 px-3 rounded-xl border text-center transition-colors",
                                        isSelected
                                          ? "border-primary bg-primary text-primary-foreground ring-1 ring-primary"
                                          : "border-border bg-background hover:border-primary/40 hover:bg-muted/40",
                                      )}
                                    >
                                      <span className="text-sm font-semibold">
                                        {d.toLocaleTimeString("en-CA", { timeStyle: "short" })}
                                      </span>
                                      {showTrainerName ? (
                                        <span
                                          className={cn(
                                            "text-[11px] mt-0.5 leading-tight",
                                            isSelected
                                              ? "text-primary-foreground/85"
                                              : "text-muted-foreground",
                                          )}
                                        >
                                          {slot.teamMemberName || "Staff"}
                                        </span>
                                      ) : null}
                                      {isRecommended ? (
                                        <span
                                          aria-label="Recommended specialist"
                                          className={cn(
                                            "absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full",
                                            isSelected ? "bg-primary-foreground" : "bg-primary",
                                          )}
                                        />
                                      ) : null}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          ) : null}
                        </div>
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
                {currentStep === 1 && <StepFollowUps formData={formData} updateFormData={updateFormData} />}
                {currentStep === 2 && <StepGoals formData={formData} updateFormData={updateFormData} />}
                {currentStep === 3 && <StepDogInfo formData={formData} updateFormData={updateFormData} />}
                {currentStep === 4 && <StepContact formData={formData} updateFormData={updateFormData} />}
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
