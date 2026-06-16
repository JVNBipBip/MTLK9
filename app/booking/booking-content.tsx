"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Loader2, X, Calendar, MapPin, MessageSquare, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useAppLocale } from "@/components/locale-provider"
import { getIntlLocale } from "@/lib/i18n/config"
import { TORONTO_TIME_ZONE } from "@/lib/i18n/format"
import { SITE_FIXED_HEADER_STICKY_TOP_CLASS } from "@/lib/site-header-layout"
import { cn } from "@/lib/utils"
import { StepIssue } from "./steps/step-issue"
import { StepYouAndDog } from "./steps/step-you-and-dog"
import { StepConfirmation } from "./steps/step-confirmation"
import { CONTRACT_VERSION } from "@/lib/contract-terms"
import { ContractAcceptanceAccordion } from "@/components/contract-acceptance-accordion"
import { INITIAL_FORM_DATA, type BookingFormData } from "./types"
import { trackFBLead } from "@/lib/facebook-pixel"
import posthog from "posthog-js"
import { FOLLOW_UP_QUESTIONS_BY_ISSUE, GOALS_OPTIONS_BY_ISSUE } from "./constants"

const CONSULTATION_LOCATION = "7770 Boul Henri-Bourassa E, Anjou, Montreal"

const TOTAL_STEPS = 2

const AUTO_ADVANCE_STEPS = new Set([0])

function isStepValid(step: number, formData: BookingFormData): boolean {
  switch (step) {
    case 0:
      return formData.issue !== ""
    case 1:
      return (
        formData.contactName.trim() !== "" &&
        formData.contactEmail.trim() !== "" &&
        formData.contactPhone.trim() !== "" &&
        formData.dogName.trim() !== "" &&
        formData.dogBreed.trim() !== "" &&
        formData.dogAge !== ""
      )
    default:
      return false
  }
}

const bookingContentCopy = {
  en: {
    close: "Close",
    closeForm: "Close form",
    goBack: "Go back",
    stepProgress: (current: number, total: number) => `Step ${current} of ${total}`,
    schedulingTitle: "Pick your consultation slot",
    schedulingSubtitle: "Choose the time that works best, then confirm your appointment.",
    loadingTimes: "Loading available times...",
    specialistMatched:
      "We've narrowed openings based on what you described.",
    specialistPricing:
      "Please note: some assessments may have different pricing than our standard evaluation.",
    recommendedSpecialist: "Recommended openings",
    recommendedPricing:
      "Specialist assessment is $165 CAD (standard is $145 CAD). Recommended slots are marked with a dot below.",
    noSlotsFallback: "No slots available right now. Use the free call option on the site to reach us.",
    noFilteredSlotsNick:
      "No assessment times matched these answers right now. Please call or email us and we will help you schedule.",
    noFilteredSlotsMatched:
      "No assessment times matched these answers right now. Please call or email us and we will help you schedule.",
    noMatchingTimes:
      "No openings available for this booking path right now. Please contact us and we'll help you schedule.",
    pickADay: "Pick a day",
    slotCount: (count: number) => `${count} ${count === 1 ? "slot" : "slots"}`,
    timesOn: "Times on",
    recommendedSpecialistAria: "Recommended time slot",
    bookingSummary: "Booking Summary",
    trainer: "Trainer",
    trainerNotSpecified: "We’ll confirm your trainer after booking.",
    dateTime: "Date & Time",
    location: "Location",
    service: "Service",
    inPersonAssessment: "In-person assessment",
    // deposit: "Deposit",
    // depositDescription:
    //   "$30 deposit required. Your consultation is confirmed after payment is complete. Late cancellations or no-shows may forfeit the deposit.",
    // openingCheckout: "Opening checkout...",
    // payDeposit: "Pay $30 deposit",
    bookNow: "Book now",
    bookingInProgress: "Booking...",
    submitting: "Submitting...",
    continue: "Continue",
    submitErrorFallback: "Could not submit right now. Please try again in a moment.",
    bookingSubmitFallback: "Failed to submit booking form.",
    specialistCalendarError: "Specialist calendar is not configured. Please contact us by phone or email.",
    schedulingChooseTitle: "How would you like to proceed?",
    schedulingChooseSubtitle:
      "Proceed with booking right away, or send an inquiry and we'll get back to you by email.",
    optionBookTitle: "Pick a time & book",
    optionBookDesc: "Pick a time and your consultation is booked right away.",
    optionInquiryTitle: "Send an inquiry",
    optionInquiryDesc:
      "We'll receive your details immediately — no extra forms. We'll reply by email shortly.",
    contractRequiredHint: "Please accept the waiver before continuing.",
    acceptWaiverToContinue: "Accept the waiver above to choose an option.",
    inquiryNotesLabel: "Your message",
    inquiryNotesPlaceholder:
      "Questions, scheduling preferences, or anything else we should know…",
    sendInquiry: "Send inquiry",
    inquirySending: "Sending…",
    noSlotsForPinnedTrainer:
      "No assessment times are available on this booking link right now. Please contact us and we will help you schedule.",
    noSlotsForStaffTrainerSubset:
      "No assessment times are available on this booking link right now. Please contact us and we will help you schedule.",
  },
  fr: {
    close: "Fermer",
    closeForm: "Fermer le formulaire",
    goBack: "Retour",
    stepProgress: (current: number, total: number) => `Étape ${current} sur ${total}`,
    schedulingTitle: "Choisissez votre créneau de consultation",
    schedulingSubtitle:
      "Choisissez l'heure qui vous convient, puis confirmez votre rendez-vous.",
    loadingTimes: "Chargement des disponibilités...",
    specialistMatched:
      "Nous avons filtré les disponibilités selon ce que vous avez décrit.",
    specialistPricing:
      "Veuillez noter que certaines évaluations peuvent avoir un tarif différent de notre évaluation standard.",
    recommendedSpecialist: "Créneaux recommandés",
    recommendedPricing:
      "L'évaluation spécialisée est de 165 $ CAD (145 $ CAD pour l'évaluation standard). Les créneaux recommandés sont indiqués par un point ci-dessous.",
    noSlotsFallback:
      "Aucun créneau n'est disponible pour le moment. Utilisez l'option d'appel gratuit sur le site pour nous joindre.",
    noFilteredSlotsNick:
      "Aucun créneau ne correspond à ces réponses pour le moment. Appelez-nous ou écrivez-nous et nous vous aiderons à réserver.",
    noFilteredSlotsMatched:
      "Aucun créneau ne correspond à ces réponses pour le moment. Appelez-nous ou écrivez-nous et nous vous aiderons à réserver.",
    noMatchingTimes:
      "Aucune disponibilité pour ce parcours de réservation pour le moment. Contactez-nous et nous vous aiderons à planifier.",
    pickADay: "Choisissez une journée",
    slotCount: (count: number) => `${count} créneau${count > 1 ? "x" : ""}`,
    timesOn: "Heures le",
    recommendedSpecialistAria: "Créneau recommandé",
    bookingSummary: "Résumé de la réservation",
    trainer: "Formateur",
    trainerNotSpecified: "Nous confirmerons votre formateur après la réservation.",
    dateTime: "Date et heure",
    location: "Lieu",
    service: "Service",
    inPersonAssessment: "Évaluation en personne",
    // deposit: "Dépôt",
    // depositDescription:
    //   "Un dépôt de 30 $ est requis. Votre consultation est confirmée une fois le paiement complété. Les annulations tardives ou les absences peuvent entraîner la perte du dépôt.",
    // openingCheckout: "Ouverture du paiement...",
    // payDeposit: "Payer le dépôt de 30 $",
    bookNow: "Réserver",
    bookingInProgress: "Réservation...",
    submitting: "Envoi...",
    continue: "Continuer",
    submitErrorFallback: "Impossible d'envoyer pour le moment. Veuillez réessayer dans un instant.",
    bookingSubmitFallback: "Impossible d'envoyer le formulaire de réservation.",
    specialistCalendarError:
      "Le calendrier du spécialiste n'est pas configuré. Veuillez nous contacter par téléphone ou par courriel.",
    schedulingChooseTitle: "Comment souhaitez-vous procéder?",
    schedulingChooseSubtitle:
      "Réservez tout de suite avec un dépôt, ou envoyez une demande et nous vous répondrons par courriel.",
    optionBookTitle: "Choisir une heure et réserver",
    optionBookDesc: "Choisissez une heure — votre consultation est réservée sur-le-champ.",
    optionInquiryTitle: "Envoyer une demande",
    optionInquiryDesc:
      "Nous recevons vos renseignements tout de suite — aucun formulaire de plus. Nous répondrons par courriel sous peu.",
    contractRequiredHint: "Veuillez accepter la décharge avant de continuer.",
    acceptWaiverToContinue: "Acceptez la décharge ci-dessus pour choisir une option.",
    inquiryNotesLabel: "Votre message",
    inquiryNotesPlaceholder:
      "Questions, préférences d'horaire ou tout autre détail utile…",
    sendInquiry: "Envoyer la demande",
    inquirySending: "Envoi…",
    noSlotsForPinnedTrainer:
      "Aucun créneau n'est disponible sur ce lien de réservation pour le moment. Contactez-nous et nous vous aiderons à planifier.",
    noSlotsForStaffTrainerSubset:
      "Aucun créneau n'est disponible sur ce lien de réservation pour le moment. Contactez-nous et nous vous aiderons à planifier.",
  },
} as const

export function BookingContent({
  onClose,
  pinnedTeamMemberId = null,
  trainerPageSlug = null,
  layout = "modal",
  depositResume = null,
  trainerPageDisplayName = null,
  /** Submit inquiry directly after intake — no scheduling or deposit step */
  inquiryOnly = false,
}: {
  onClose: () => void
  pinnedTeamMemberId?: string | null
  trainerPageSlug?: string | null
  layout?: "modal" | "page"
  depositResume?: {
    initialFormData: Partial<BookingFormData>
    openSchedulingDeposit: true
    /** From inquiry scheduling link — limits which trainers’ slots are fetched. */
    allowTeamMemberIds?: string[] | null
  } | null
  /** Shown as preferred trainer on inquiry when slots (names) have not been loaded yet. */
  trainerPageDisplayName?: string | null
  inquiryOnly?: boolean
}) {
  const locale = useAppLocale()
  const copy = bookingContentCopy[locale]
  const intlLocale = getIntlLocale(locale)
  /** Modal uses nested flex scroll; page variant scrolls with the document (avoids zero-height flex collapse on resume/trainer pages). */
  const shellClass = cn(
    "flex w-full flex-col",
    layout === "modal" && "min-h-0 flex-1 overflow-hidden",
  )
  const pageTopChromeClass =
    layout === "page"
      ? cn("sticky z-40 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80", SITE_FIXED_HEADER_STICKY_TOP_CLASS)
      : "shrink-0 bg-background"
  const topBarPaddingClass = layout === "page" ? "pt-4 pb-4" : "pt-3 pb-3 sm:pt-4 sm:pb-4"
  const stepScrollClass =
    layout === "page"
      ? "px-6 py-4"
      : "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-3 touch-pan-y [-webkit-overflow-scrolling:touch] sm:px-6 sm:py-4"
  const contentWidthClass = layout === "modal" ? "max-w-2xl" : "max-w-lg"

  type ConsultationSchedulingKind = "unset" | "deposit"
  const resumeScheduling = Boolean(depositResume?.openSchedulingDeposit)
  const mergedResumeForm: BookingFormData =
    resumeScheduling && depositResume
      ? { ...INITIAL_FORM_DATA, ...depositResume.initialFormData }
      : INITIAL_FORM_DATA

  /** String key so deps stay stable — a fresh array literal from props every render must not retrigger slot-fetch. */
  const resumeTrainerAllowIdsKey =
    resumeScheduling && depositResume?.allowTeamMemberIds?.length
      ? [...new Set(depositResume.allowTeamMemberIds.map((id) => String(id).trim()).filter(Boolean))]
          .sort()
          .join("|")
      : ""

  const resumeAllowTeamMemberIds = useMemo((): string[] | null => {
    if (!resumeTrainerAllowIdsKey) return null
    return resumeTrainerAllowIdsKey.split("|").filter(Boolean)
  }, [resumeTrainerAllowIdsKey])

  const [currentStep, setCurrentStep] = useState(() => (resumeScheduling ? TOTAL_STEPS - 1 : 0))
  const [direction, setDirection] = useState(1)
  const [formData, setFormData] = useState<BookingFormData>(() => mergedResumeForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showSchedulingStep, setShowSchedulingStep] = useState(() => resumeScheduling)

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
  const consultationSlotsLoadIdRef = useRef(0)
  const [slotsMeta, setSlotsMeta] = useState<{
    recommendedTeamMemberId: string | null
    nickRoutingActive: boolean
    slotsMessage: string | null
    forcedTrainerFilter: boolean
  }>({
    recommendedTeamMemberId: null,
    nickRoutingActive: false,
    slotsMessage: null,
    forcedTrainerFilter: false,
  })

  const [consultationSchedulingKind, setConsultationSchedulingKind] =
    useState<ConsultationSchedulingKind>(() => (resumeScheduling ? "deposit" : "unset"))
  const [pinnedTrainerDisplayName, setPinnedTrainerDisplayName] = useState<string | null>(null)
  const [completionKind, setCompletionKind] = useState<"inquiry" | null>(null)

  const displaySlots = useMemo(() => {
    if (!trainerFilterId) return consultationSlots
    return consultationSlots.filter((s) => s.teamMemberId === trainerFilterId)
  }, [consultationSlots, trainerFilterId])

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
      setConsultationSchedulingKind("unset")
    }
  }, [showSchedulingStep])

  useEffect(() => {
    if (!pinnedTeamMemberId || consultationSlots.length === 0) {
      setPinnedTrainerDisplayName(null)
      return
    }
    const match = consultationSlots.find((s) => s.teamMemberId === pinnedTeamMemberId)
    const label = match?.teamMemberName?.trim()
    setPinnedTrainerDisplayName(label || null)
  }, [pinnedTeamMemberId, consultationSlots])

  useEffect(() => {
    if (pinnedTeamMemberId && showSchedulingStep && consultationSchedulingKind === "deposit") {
      setTrainerFilterId(pinnedTeamMemberId)
    }
  }, [pinnedTeamMemberId, showSchedulingStep, consultationSchedulingKind])

  useEffect(() => {
    if (!showSchedulingStep || formData.connectMethod !== "in-person-evaluation") return
    if (consultationSchedulingKind !== "deposit") return

    const loadId = ++consultationSlotsLoadIdRef.current
    const isStale = () => loadId !== consultationSlotsLoadIdRef.current

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
        if (resumeAllowTeamMemberIds?.length) {
          for (const id of resumeAllowTeamMemberIds) {
            params.append("allowTeamMemberId", id)
          }
        } else if (pinnedTeamMemberId) {
          params.set("teamMemberId", pinnedTeamMemberId)
        }
        const response = await fetch(`/api/consultation-slots?${params.toString()}`)
        const data = (await response.json().catch(() => null)) as {
          slots?: Array<{ startAt: string; slotKey: string; teamMemberId?: string; teamMemberName?: string | null }>
          recommendedTeamMemberId?: string | null
          nickRoutingActive?: boolean
          forcedTrainerFilter?: boolean
          slotsMessage?: string | null
          error?: string
        } | null
        const slotsPayload = Array.isArray(data?.slots) ? data.slots : undefined

        if (isStale()) return
        if (response.status === 503) {
          setConsultationSlots([])
          setSlotsMeta({
            recommendedTeamMemberId: null,
            nickRoutingActive: true,
            slotsMessage: null,
            forcedTrainerFilter: false,
          })
          setSlotsFetchError(
            locale === "fr" ? copy.specialistCalendarError : data?.error || copy.specialistCalendarError,
          )
          return
        }
        if (response.ok && slotsPayload !== undefined) {
          const forced = data?.forcedTrainerFilter ?? false
          const localizedSlotsMessage =
            data?.slotsMessage && locale === "fr"
              ? forced
                ? resumeAllowTeamMemberIds && resumeAllowTeamMemberIds.length > 1
                  ? copy.noSlotsForStaffTrainerSubset
                  : copy.noSlotsForPinnedTrainer
                : data.nickRoutingActive
                  ? copy.noFilteredSlotsNick
                  : copy.noFilteredSlotsMatched
              : data?.slotsMessage ?? null
          setConsultationSlots(slotsPayload)
          setSlotsMeta({
            recommendedTeamMemberId: data?.recommendedTeamMemberId ?? null,
            nickRoutingActive: data?.nickRoutingActive ?? false,
            slotsMessage: localizedSlotsMessage,
            forcedTrainerFilter: forced,
          })
          setSlotsFetchError(null)
        } else {
          setConsultationSlots([])
          setSlotsMeta({
            recommendedTeamMemberId: null,
            nickRoutingActive: false,
            slotsMessage: null,
            forcedTrainerFilter: false,
          })
          setSlotsFetchError(
            typeof data?.error === "string" ? data.error : copy.specialistCalendarError,
          )
        }
      } catch {
        if (isStale()) return
        setConsultationSlots([])
        setSlotsMeta({
          recommendedTeamMemberId: null,
          nickRoutingActive: false,
          slotsMessage: null,
          forcedTrainerFilter: false,
        })
        setSlotsFetchError(copy.specialistCalendarError)
      } finally {
        if (!isStale()) setIsLoadingSlots(false)
      }
    }
    void loadSlots()

    return () => {
      consultationSlotsLoadIdRef.current += 1
      setIsLoadingSlots(false)
    }
  }, [
    copy.noFilteredSlotsMatched,
    copy.noFilteredSlotsNick,
    copy.noSlotsForPinnedTrainer,
    copy.noSlotsForStaffTrainerSubset,
    copy.specialistCalendarError,
    consultationSchedulingKind,
    formData.connectMethod,
    formData.followUps,
    formData.impact,
    formData.issue,
    locale,
    pinnedTeamMemberId,
    resumeAllowTeamMemberIds,
    showSchedulingStep,
  ])

  const goNext = useCallback(() => {
    setDirection(1)
    setCurrentStep((s) => Math.min(TOTAL_STEPS - 1, s + 1))
  }, [])

  const goBack = useCallback(() => {
    setDirection(-1)
    setCurrentStep((s) => Math.max(0, s - 1))
  }, [])

  const postBooking = useCallback(
    async (submissionMode: "deposit" | "inquiry") => {
      setSubmitError(null)
      setIsSubmitting(true)
      try {
        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formData,
            locale,
            consultationSubmissionKind: submissionMode === "inquiry" ? "inquiry" : "deposit",
            bookingSource: trainerPageSlug
              ? `website-booking-form/trainer/${trainerPageSlug}`
              : "website-booking-form",
            ...(pinnedTeamMemberId ? { trainerTeamMemberId: pinnedTeamMemberId } : {}),
            ...(trainerPageSlug ? { trainerPageSlug } : {}),
            ...(submissionMode === "inquiry"
              ? {
                  preferredTrainerLabel:
                    pinnedTrainerDisplayName?.trim() || trainerPageDisplayName?.trim() || null,
                }
              : {}),
          }),
        })

        if (!response.ok) {
          const errBody = (await response.json().catch(() => null)) as { error?: string } | null
          throw new Error(errBody?.error || copy.bookingSubmitFallback)
        }
        await response.json().catch(() => null)

        const contractSource = trainerPageSlug ? `/booking/${trainerPageSlug}` : "/booking"

        const recordContractAcceptance = async () => {
          try {
            await fetch("/api/contract-acceptance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                clientEmail: formData.contactEmail.trim().toLowerCase(),
                contractKind: "assessment_booking",
                version: CONTRACT_VERSION,
                source: contractSource,
                dogName: formData.dogName.trim(),
                locale,
              }),
            })
          } catch {
            /* non-blocking */
          }
        }

        const phEmail = formData.contactEmail.trim().toLowerCase()
        if (phEmail) {
          posthog.identify(phEmail, {
            email: phEmail,
            name: formData.contactName,
            phone: formData.contactPhone,
            dogName: formData.dogName,
            locale,
          })
        }

        if (submissionMode === "inquiry") {
          await recordContractAcceptance()
          setCompletionKind("inquiry")
          setIsComplete(true)
          trackFBLead({
            content_name: "Consultation Inquiry",
            content_category: "Dog Training Lead",
          })
          posthog.capture("consultation_inquiry_completed", {
            connectMethod: formData.connectMethod,
            issue: formData.issue,
            locale,
          })
          return
        }

        await recordContractAcceptance()

        // $30 deposit checkout disabled for now — book directly via API and show confirmation.
        // if (data?.checkoutUrl) {
        //   trackFBLead({
        //     content_name: "In-Person Evaluation Deposit",
        //     content_category: "Dog Training Lead",
        //   })
        //   trackFBInitiateCheckout({
        //     content_name: "In-Person Evaluation Deposit",
        //     content_category: "Dog Training Checkout",
        //   })
        //   posthog.capture("consultation_deposit_checkout_redirect", {
        //     connectMethod: formData.connectMethod,
        //     issue: formData.issue,
        //     locale,
        //   })
        //   window.location.assign(data.checkoutUrl)
        //   return
        // }

        setIsComplete(true)
        trackFBLead({
          content_name: "In-Person Evaluation",
          content_category: "Dog Training Lead",
        })
        posthog.capture("booking_form_completed", {
          connectMethod: formData.connectMethod,
          issue: formData.issue,
          locale,
        })
      } catch (error) {
        console.error("[Booking Form] Submission failed:", error)
        const message = error instanceof Error ? error.message : copy.submitErrorFallback
        setSubmitError(message)
      } finally {
        setIsSubmitting(false)
      }
    },
    [copy, formData, locale, pinnedTeamMemberId, pinnedTrainerDisplayName, trainerPageDisplayName, trainerPageSlug],
  )

  const handleSubmit = useCallback(async () => {
    setSubmitError(null)
    if (inquiryOnly) {
      await postBooking("inquiry")
      return
    }
    if (formData.connectMethod === "in-person-evaluation") {
      setShowSchedulingStep(true)
      return
    }
    await postBooking("inquiry")
  }, [formData.connectMethod, inquiryOnly, postBooking])

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
      <div className={shellClass}>
        <div
          className={cn(
            "shrink-0 border-b border-border/50 px-6",
            pageTopChromeClass,
            topBarPaddingClass,
          )}
        >
          <div className={cn(contentWidthClass, "mx-auto flex justify-end")}>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label={copy.close}
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
            className={cn("w-full", contentWidthClass)}
          >
            <StepConfirmation formData={formData} submissionKind={completionKind} />
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className={shellClass}>
      {/* Top bar: Back + Progress + Close */}
      <div
        className={cn(
          "shrink-0 border-b border-border/50 px-6",
          pageTopChromeClass,
          topBarPaddingClass,
        )}
      >
        <div className={cn(contentWidthClass, "mx-auto")}>
          <div className="flex items-center gap-3 mb-2">
            {currentStep > 0 ? (
              <button
                onClick={
                  showSchedulingStep
                    ? () => setShowSchedulingStep(false)
                    : goBack
                }
                className="p-1.5 -ml-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                aria-label={copy.goBack}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-8" />
            )}
            <div className="flex-1 text-center text-sm text-muted-foreground">
              {copy.stepProgress(currentStep + 1, TOTAL_STEPS)}
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 -mr-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label={copy.closeForm}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <Progress value={((currentStep + 1) / TOTAL_STEPS) * 100} className="h-1.5" />
        </div>
      </div>

      {/* Step content — scrollable */}
      <div className={stepScrollClass}>
        <div className={cn(contentWidthClass, "mx-auto w-full")}>
          {showSchedulingStep ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {consultationSchedulingKind === "unset"
                    ? copy.schedulingChooseTitle
                    : copy.schedulingTitle}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {consultationSchedulingKind === "unset"
                    ? copy.schedulingChooseSubtitle
                    : copy.schedulingSubtitle}
                </p>
              </div>

              {consultationSchedulingKind === "unset" ? (
                <div className="space-y-5">
                  <ContractAcceptanceAccordion
                    contractKind="assessment_booking"
                    locale={locale}
                    accepted={intakeContractAccepted}
                    onAcceptedChange={(value) => {
                      setIntakeContractAccepted(value)
                      setSubmitError(null)
                    }}
                    hint={copy.acceptWaiverToContinue}
                  />
                  {submitError ? (
                    <p className="text-sm text-destructive">{submitError}</p>
                  ) : null}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        setSubmitError(null)
                        if (!intakeContractAccepted) {
                          setSubmitError(copy.contractRequiredHint)
                          return
                        }
                        setConsultationSchedulingKind("deposit")
                      }}
                      className={cn(
                        "rounded-xl border border-border bg-background p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/30 disabled:pointer-events-none",
                        (!intakeContractAccepted || isSubmitting) &&
                          "opacity-60 hover:border-border hover:bg-background",
                      )}
                    >
                      <Calendar className="w-5 h-5 text-primary mb-2" />
                      <p className="font-semibold text-foreground">{copy.optionBookTitle}</p>
                      <p className="text-sm text-muted-foreground mt-1">{copy.optionBookDesc}</p>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        setSubmitError(null)
                        if (!intakeContractAccepted) {
                          setSubmitError(copy.contractRequiredHint)
                          return
                        }
                        void postBooking("inquiry")
                      }}
                      className={cn(
                        "rounded-xl border border-border bg-background p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/30 disabled:pointer-events-none",
                        (!intakeContractAccepted || isSubmitting) &&
                          "opacity-60 hover:border-border hover:bg-background",
                      )}
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 text-primary mb-2 animate-spin" />
                      ) : (
                        <MessageSquare className="w-5 h-5 text-primary mb-2" />
                      )}
                      <p className="font-semibold text-foreground">{copy.optionInquiryTitle}</p>
                      <p className="text-sm text-muted-foreground mt-1">{copy.optionInquiryDesc}</p>
                    </button>
                  </div>
                </div>
              ) : isLoadingSlots ? (
                <div className="p-12 flex flex-col items-center justify-center gap-4 border rounded-xl bg-muted/20">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{copy.loadingTimes}</p>
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
                        {copy.specialistMatched}
                      </p>
                      <p className="text-muted-foreground">
                        {copy.specialistPricing}
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
                        {copy.recommendedSpecialist}
                      </p>
                      <p className="text-muted-foreground pl-4">
                        {copy.recommendedPricing}
                      </p>
                    </div>
                  ) : null}
                  {consultationSlots.length === 0 ? (
                    <div className="p-8 text-center border rounded-xl bg-muted/20 space-y-2">
                      <p className="text-muted-foreground">
                        {slotsMeta.slotsMessage ||
                          copy.noSlotsFallback}
                      </p>
                    </div>
                  ) : (
                    <>
                      {displaySlots.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6 border rounded-xl bg-muted/10">
                          {copy.noMatchingTimes}
                        </p>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                              {copy.pickADay}
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
                                      {d.toLocaleDateString(intlLocale, { weekday: "short", timeZone: TORONTO_TIME_ZONE })}
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
                                      {d.toLocaleDateString(intlLocale, { month: "short", timeZone: TORONTO_TIME_ZONE })}
                                    </span>
                                    <span
                                      className={cn(
                                        "text-[10px] mt-1",
                                        isActive
                                          ? "text-primary-foreground/70"
                                          : "text-muted-foreground/80",
                                      )}
                                    >
                                      {copy.slotCount(count)}
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
                                {copy.timesOn}{" "}
                                {new Date(slotsByDay[selectedDay][0].startAt).toLocaleDateString(
                                  intlLocale,
                                  { weekday: "long", month: "long", day: "numeric", timeZone: TORONTO_TIME_ZONE },
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

                                  return (
                                    <button
                                      key={slot.slotKey}
                                      type="button"
                                      onClick={() =>
                                        updateFormData({
                                          consultationDateTime: slot.startAt,
                                          consultationSlotKey: slot.slotKey,
                                          consultationTeamMemberId: slot.teamMemberId || "",
                                          consultationTeamMemberName: slot.teamMemberName || "",
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
                                        {d.toLocaleTimeString(intlLocale, { timeStyle: "short", timeZone: TORONTO_TIME_ZONE })}
                                      </span>
                                      {consultationSchedulingKind === "deposit" && slot.teamMemberName?.trim() ? (
                                        <span
                                          className={cn(
                                            "text-[11px] font-normal mt-0.5 max-w-[8rem] truncate leading-snug",
                                            isSelected ? "text-primary-foreground/90" : "text-muted-foreground",
                                          )}
                                        >
                                          {slot.teamMemberName.trim()}
                                        </span>
                                      ) : null}
                                      {isRecommended ? (
                                        <span
                                          aria-label={copy.recommendedSpecialistAria}
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

              {consultationSchedulingKind === "deposit" && formData.consultationDateTime && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border bg-muted/30 overflow-hidden"
                >
                  <div className="bg-muted/50 px-4 py-3 border-b border-border/50">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      {copy.bookingSummary}
                    </h4>
                  </div>
                  <div className="p-4 space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">{copy.dateTime}</p>
                        <p className="text-muted-foreground">
                          {new Date(formData.consultationDateTime).toLocaleString(intlLocale, { 
                            timeZone: TORONTO_TIME_ZONE,
                            dateStyle: "full", 
                            timeStyle: "short" 
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <User className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">{copy.trainer}</p>
                        <p className="text-muted-foreground">
                          {formData.consultationTeamMemberName.trim() || copy.trainerNotSpecified}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">{copy.location}</p>
                        <p className="text-muted-foreground">{CONSULTATION_LOCATION}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-4 h-4 rounded-full border-2 border-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">{copy.service}</p>
                        <p className="text-muted-foreground">{copy.inPersonAssessment}</p>
                      </div>
                    </div>

                    {/* $30 deposit disabled for now
                    <div className="flex items-start gap-3">
                      <div className="w-4 h-4 rounded-full border-2 border-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">{copy.deposit}</p>
                        <p className="text-muted-foreground">
                          {copy.depositDescription}
                        </p>
                      </div>
                    </div>
                    */}
                  </div>
                </motion.div>
              )}

              {consultationSchedulingKind === "deposit" ? (
                <>
                  {!intakeContractAccepted ? (
                    <ContractAcceptanceAccordion
                      className="pt-2"
                      contractKind="assessment_booking"
                      locale={locale}
                      accepted={intakeContractAccepted}
                      onAcceptedChange={setIntakeContractAccepted}
                    />
                  ) : null}

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <p className="text-sm text-destructive min-h-5">{submitError ?? ""}</p>
                    <Button
                      type="button"
                      onClick={() => void postBooking("deposit")}
                      disabled={!consultationReadyForPayment || isSubmitting || !intakeContractAccepted}
                      className="rounded-full px-8 h-12 text-base"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {copy.bookingInProgress}
                        </>
                      ) : (
                        copy.bookNow
                      )}
                    </Button>
                  </div>
                </>
              ) : null}
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
                {currentStep === 1 && <StepYouAndDog formData={formData} updateFormData={updateFormData} />}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Bottom nav — only for multi-select / form steps */}
      {showBottomNav && (
        <div className="shrink-0 bg-background border-t border-border/50 px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className={cn(contentWidthClass, "mx-auto flex flex-col gap-3")}>
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
                  {inquiryOnly ? copy.inquirySending : copy.submitting}
                </>
              ) : currentStep === TOTAL_STEPS - 1 ? (
                inquiryOnly ? (
                  copy.sendInquiry
                ) : (
                  copy.continue
                )
              ) : (
                <>
                  {copy.continue}
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
