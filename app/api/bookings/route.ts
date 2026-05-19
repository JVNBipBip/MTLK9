import { NextResponse } from "next/server"
import crypto from "crypto"
import { FieldValue, type Firestore } from "firebase-admin/firestore"
import {
  ISSUE_SERVICE_MAP,
  goalLabelsForIssue,
  intakeResponsesForIssue,
  issueLabel,
} from "@/app/booking/constants"
import type { BookingFormData } from "@/app/booking/types"
import { getAdminDb } from "@/lib/firebase-admin"
import { pushLeadToGHL } from "@/lib/gohighlevel"
import { defaultLocale, isAppLocale, type AppLocale } from "@/lib/i18n/config"
import { normalizePhoneForMatch } from "@/lib/contact-normalize"
import { clientConsultationRef, clientConsultationsCollection, upsertClientProfile } from "@/lib/client-records"
import { notifyConsultationInquiryStaffAndClient, notifyStaffOfBooking } from "@/lib/staff-booking-notify"
import { captureServerEvent } from "@/lib/posthog-server"
import {
  CONSULTATION_DEPOSIT_CURRENCY,
  buildConsultationCheckoutRedirectUrl,
  buildConsultationDepositResumeUrl,
  consultationDepositAmountCentsForEmail,
  consultationDepositResumeExpiryIso,
} from "@/lib/consultation-deposit"
import { isFacilityRoomAvailable } from "@/lib/facility-room-capacity"
import { createSquareBooking, getOrCreateSquareCustomer, syncInquirySquareCustomer } from "@/lib/square"
import { buildInquirySquareCustomerNoteAppendixLines } from "@/lib/square-customer-note"
import {
  getConsultationServiceVariationId,
  getConsultationServiceVariationIds,
} from "@/lib/square-service-config"
import { generateAccessToken, hashAccessToken } from "@/lib/tokens"

export const runtime = "nodejs"

function isBookingFormData(value: unknown): value is BookingFormData {
  if (!value || typeof value !== "object") return false

  const data = value as Partial<BookingFormData>
  return typeof data.connectMethod === "string" && data.connectMethod.length > 0
}

const bookingErrors = {
  en: {
    invalidPayload: "Invalid booking payload.",
    emailRequired: "Email is required.",
    contactRequired: "Contact name is required.",
    dogRequired: "Dog name is required.",
    unsupportedType: "Unsupported booking type.",
    submitFailed: "Failed to submit booking form.",
    slotRequired: "Please select a consultation time.",
    invalidSlot: "Invalid consultation slot.",
    slotExpired: "That time is no longer available. Please choose another slot.",
    configIncomplete: "Booking is not configured yet. Please contact us.",
    roomUnavailable: "That time is no longer available. Please choose another slot.",
  },
  fr: {
    invalidPayload: "La demande de réservation est invalide.",
    emailRequired: "L'adresse courriel est requise.",
    contactRequired: "Le nom du contact est requis.",
    dogRequired: "Le nom du chien est requis.",
    unsupportedType: "Ce type de réservation n'est pas pris en charge.",
    submitFailed: "Impossible d'envoyer le formulaire de réservation.",
    slotRequired: "Veuillez choisir une heure de consultation.",
    invalidSlot: "Créneau de consultation invalide.",
    slotExpired: "Ce créneau n'est plus disponible. Veuillez en choisir un autre.",
    configIncomplete: "La réservation n'est pas encore configurée. Contactez-nous.",
    roomUnavailable: "Ce créneau n'est plus disponible. Veuillez en choisir un autre.",
  },
} satisfies Record<AppLocale, Record<string, string>>

function resolvePayloadLocale(value: unknown): AppLocale {
  const candidate = typeof value === "string" ? value : null
  return isAppLocale(candidate) ? candidate : defaultLocale
}

function normalizedDogName(value?: string | null) {
  return String(value || "").trim().toLowerCase()
}

function isReplaceableConsultationStatus(value: unknown) {
  const status = String(value || "").trim().toLowerCase()
  return (
    status === "intake_submitted" ||
    status === "payment_failed" ||
    status === "expired" ||
    status === "pending_payment"
  )
}

function consultationActivityTime(data: Record<string, unknown>) {
  const candidate =
    data.submittedAtIso ||
    data.scheduledAtIso ||
    data.requestedScheduledAtIso ||
    data.consultationDateTime ||
    data.updatedAtIso ||
    data.createdAtIso
  const time = candidate ? new Date(String(candidate)).getTime() : 0
  return Number.isFinite(time) ? time : 0
}

async function findReplaceableConsultationId(db: Firestore, clientId: string, dogName: string) {
  const targetDogName = normalizedDogName(dogName)
  if (!clientId || !targetDogName) return null

  const snap = await clientConsultationsCollection(db, clientId).limit(100).get()

  const candidates = snap.docs
    .map((doc) => ({ id: doc.id, data: doc.data() as Record<string, unknown> }))
    .filter(({ data }) => normalizedDogName(String(data.dogName || "")) === targetDogName)
    .filter(({ data }) => isReplaceableConsultationStatus(data.status))
    .filter(({ data }) => String(data.initialPaymentStatus || "") !== "paid")
    .sort((a, b) => consultationActivityTime(b.data) - consultationActivityTime(a.data))

  return candidates[0]?.id || null
}

export async function POST(request: Request) {
  let locale: AppLocale = defaultLocale
  try {
    const payload = (await request.json()) as {
      formData?: unknown
      locale?: unknown
      consultationSubmissionKind?: unknown
      bookingSource?: unknown
      preferredTrainerLabel?: unknown
      trainerTeamMemberId?: unknown
      trainerPageSlug?: unknown
    }
    locale = resolvePayloadLocale(payload.locale)
    const errorText = bookingErrors[locale]

    if (!isBookingFormData(payload.formData)) {
      return NextResponse.json({ error: errorText.invalidPayload }, { status: 400 })
    }

    const consultationSubmissionKindRaw = payload.consultationSubmissionKind
    const consultationSubmissionKind =
      consultationSubmissionKindRaw === "inquiry" || consultationSubmissionKindRaw === "deposit"
        ? consultationSubmissionKindRaw
        : null

    const bookingSourceRaw = payload.bookingSource
    const bookingSource =
      typeof bookingSourceRaw === "string" && bookingSourceRaw.trim()
        ? bookingSourceRaw.trim()
        : "website-booking-form"

    const preferredTrainerLabelRaw = payload.preferredTrainerLabel
    const preferredTrainerLabel =
      typeof preferredTrainerLabelRaw === "string" ? preferredTrainerLabelRaw.trim() || null : null

    const trainerTeamMemberIdRaw = payload.trainerTeamMemberId
    const trainerTeamMemberIdFromPayload =
      typeof trainerTeamMemberIdRaw === "string" && trainerTeamMemberIdRaw.trim()
        ? trainerTeamMemberIdRaw.trim()
        : null

    const trainerPageSlugRaw = payload.trainerPageSlug
    const trainerPageSlugFromPayload =
      typeof trainerPageSlugRaw === "string" && trainerPageSlugRaw.trim() ? trainerPageSlugRaw.trim() : null

    const formData = payload.formData
    if (!formData.contactEmail) {
      return NextResponse.json({ error: errorText.emailRequired }, { status: 400 })
    }
    if (!formData.contactName) {
      return NextResponse.json({ error: errorText.contactRequired }, { status: 400 })
    }
    if (!formData.dogName) {
      return NextResponse.json({ error: errorText.dogRequired }, { status: 400 })
    }
    if (!formData.connectMethod) {
      return NextResponse.json({ error: errorText.unsupportedType }, { status: 400 })
    }

    const clientId = formData.contactEmail.trim().toLowerCase()
    const consultationDepositAmountCents = consultationDepositAmountCentsForEmail(clientId)
    const isConsultation = formData.connectMethod === "in-person-evaluation"
    const isConsultationInquiry = isConsultation && consultationSubmissionKind === "inquiry"
    const isConsultationDirectBook = isConsultation && consultationSubmissionKind === "deposit"

    const db = getAdminDb()
    const replaceConsultationId = await findReplaceableConsultationId(db, clientId, formData.dogName)
    let squareCustomerId: string | null = null
    const squareConsultationBookingId: string | null = null
    const squareConsultationStatus: string | null = null
    let requestedScheduledAtIso: string | null = null
    let consultationServiceVariationId: string | null = null
    let consultationTeamMemberId: string | null = null
    let consultationTeamMemberName: string | null = null

    if (isConsultationDirectBook) {
      if (!String(formData.consultationDateTime || "").trim()) {
        return NextResponse.json({ error: errorText.slotRequired }, { status: 400 })
      }
      const allowedServiceVariationIds = await getConsultationServiceVariationIds()
      if (allowedServiceVariationIds.length === 0) {
        return NextResponse.json({ error: errorText.configIncomplete }, { status: 500 })
      }
      const consultationSlotKey = String(formData.consultationSlotKey || "").trim()
      if (!consultationSlotKey) {
        return NextResponse.json({ error: errorText.slotRequired }, { status: 400 })
      }
      const [slotStartAt, slotServiceVariationId, slotTeamMemberId] = consultationSlotKey.split("|")
      if (!slotStartAt || !slotServiceVariationId || !slotTeamMemberId) {
        return NextResponse.json({ error: errorText.invalidSlot }, { status: 400 })
      }
      if (!allowedServiceVariationIds.includes(slotServiceVariationId)) {
        return NextResponse.json({ error: errorText.slotExpired }, { status: 400 })
      }
      const primaryConsultationVariationId = (await getConsultationServiceVariationId())?.trim() || null
      if (!primaryConsultationVariationId) {
        return NextResponse.json({ error: errorText.configIncomplete }, { status: 500 })
      }
      requestedScheduledAtIso = new Date(slotStartAt).toISOString()
      consultationServiceVariationId = primaryConsultationVariationId
      consultationTeamMemberId = slotTeamMemberId
      consultationTeamMemberName = formData.consultationTeamMemberName?.trim() || null
      const roomAvailable = await isFacilityRoomAvailable({
        startAt: requestedScheduledAtIso,
        serviceVariationId: primaryConsultationVariationId,
        teamMemberId: slotTeamMemberId,
      })
      if (!roomAvailable) {
        return NextResponse.json({ error: errorText.roomUnavailable }, { status: 409 })
      }
    }

    // $30 deposit checkout disabled — direct Square booking when a slot is selected.
    // const requiresConsultationDeposit = isConsultationDirectBook && Boolean(requestedScheduledAtIso)
    const requiresConsultationDeposit = false

    let inquiryDepositResumePlainToken: string | null = null
    let inquiryDepositResumeAccess:
      | { tokenHash: string; expiresAtIso: string; emailSentAtIso?: null; revokedAtIso?: null }
      | undefined
    if (isConsultationInquiry) {
      inquiryDepositResumePlainToken = generateAccessToken()
      inquiryDepositResumeAccess = {
        tokenHash: hashAccessToken(inquiryDepositResumePlainToken),
        expiresAtIso: consultationDepositResumeExpiryIso(),
        emailSentAtIso: null,
        revokedAtIso: null,
      }
    }

    const intakeResponses = intakeResponsesForIssue(formData.issue, formData.followUps || {})
    const intakeResponseSummary = intakeResponses
      .map((response) => `${response.questionLabel}: ${response.answerLabel}`)
      .join("\n")
    const goalLabels = goalLabelsForIssue(formData.issue, formData.goals || [])
    const submittedAtIso = new Date().toISOString()

    if (isConsultationInquiry) {
      try {
        squareCustomerId = await syncInquirySquareCustomer({
          name: formData.contactName,
          email: formData.contactEmail,
          phone: formData.contactPhone || undefined,
          appendixLines: buildInquirySquareCustomerNoteAppendixLines({
            formData,
            issueLabel: issueLabel(formData.issue),
            goalLabels,
            intakeResponseSummary,
            locale,
            preferredTrainerLabel,
            submittedAtIso,
          }),
        })
      } catch (err) {
        console.error("[Booking API] Square customer sync failed for inquiry (non-blocking):", err)
      }
    }
    const clientPhoneNormalized = normalizePhoneForMatch(formData.contactPhone || undefined)
    const submission = {
      clientId,
      clientName: formData.contactName,
      clientEmail: clientId,
      clientPhone: formData.contactPhone,
      ...(clientPhoneNormalized ? { clientPhoneNormalized } : {}),
      dogName: formData.dogName,
      issue: formData.issue,
      issueLabel: issueLabel(formData.issue),
      issueOther: formData.issueOther,
      connectMethod: formData.connectMethod,
      followUps: formData.followUps || {},
      intakeQuestionVersion: "2026-05-dynamic-intake-v1",
      intakeResponses,
      intakeResponseSummary,
      duration: formData.duration,
      tried: formData.tried,
      impact: formData.impact,
      goals: formData.goals,
      goalLabels,
      dogBreed: formData.dogBreed,
      dogAge: formData.dogAge,
      dogDuration: formData.dogDuration,
      dogSource: formData.dogSource,
      contactBestTime: formData.contactBestTime,
      contactNotes: formData.contactNotes,
      consultationDateTime: formData.consultationDateTime || null,
      consultationSlotKey: formData.consultationSlotKey || null,
      requestedScheduledAtIso,
      scheduledAtIso: null,
      locationLabel: formData.consultationLocation || null,
      consultationLocation: formData.consultationLocation || null,
      consultationWhat: formData.consultationWhat || "In-person evaluation (60-75 minutes)",
      consultationServiceVariationId,
      consultationTeamMemberId,
      consultationTeamMemberName,
      teamMemberId: consultationTeamMemberId,
      teamMemberName: consultationTeamMemberName,
      suggestedService: ISSUE_SERVICE_MAP[formData.issue] || "Manual Review",
      highPriority:
        formData.impact.includes("thought-about-rehoming") ||
        formData.followUps["bitten-human"] === "yes" ||
        formData.followUps["bitten-dog"] === "yes" ||
        formData.followUps["bitten-or-nipped-human"] === "yes",
      status: "intake_submitted",
      recommendedClassTypes: [],
      completedAtIso: null,
      completedBy: null,
      staffNotes: "",
      bookingAccess: null,
      initialPaymentIntentId: null,
      initialPaymentStatus: requiresConsultationDeposit ? "pending_payment" : "not_required",
      initialPaymentProvider: requiresConsultationDeposit ? "square" : null,
      initialPaymentAmountCents: requiresConsultationDeposit ? consultationDepositAmountCents : 0,
      initialPaymentCurrency: requiresConsultationDeposit ? CONSULTATION_DEPOSIT_CURRENCY.toLowerCase() : null,
      initialPaymentPaidAtIso: null,
      squarePaymentLinkId: null,
      squarePaymentLinkUrl: null,
      squareOrderId: null,
      squareCustomerId,
      squareConsultationBookingId,
      squareConsultationStatus,
      preferredLocale: locale,
      websiteLocale: locale,
      source: bookingSource,
      consultationSubmissionKind: isConsultation ? consultationSubmissionKind : null,
      consultationPreferredTrainerName: isConsultationInquiry ? preferredTrainerLabel : null,
      consultationPreferredTrainerTeamMemberId: isConsultation ? trainerTeamMemberIdFromPayload : null,
      consultationBookingTrainerPageSlug: isConsultation ? trainerPageSlugFromPayload : null,
      ...(isConsultationInquiry && inquiryDepositResumeAccess && inquiryDepositResumePlainToken
        ? {
            depositResumeAccess: inquiryDepositResumeAccess,
            depositResumeUrl:
              buildConsultationDepositResumeUrl(request, locale, inquiryDepositResumePlainToken) ?? null,
          }
        : {}),
      submittedAtIso,
      updatedAt: FieldValue.serverTimestamp(),
    }

    await upsertClientProfile(db, {
      clientEmail: formData.contactEmail,
      clientName: formData.contactName,
      clientPhone: formData.contactPhone,
      dogName: formData.dogName,
      squareCustomerId,
      source: bookingSource,
      preferredLocale: locale,
    })
    const docRef = clientConsultationRef(db, clientId, replaceConsultationId || undefined)
    const writePayload = {
      ...submission,
      id: docRef.id,
      clientCollectionPath: docRef.path,
      ...(replaceConsultationId ? {} : { createdAt: FieldValue.serverTimestamp() }),
      ...(replaceConsultationId ? { replacedByLatestSubmissionAtIso: new Date().toISOString() } : {}),
    }
    await docRef.set(writePayload, { merge: Boolean(replaceConsultationId) })

    if (isConsultationInquiry) {
      notifyConsultationInquiryStaffAndClient({
        consultationId: docRef.id,
        clientName: formData.contactName,
        clientEmail: formData.contactEmail,
        clientPhone: formData.contactPhone,
        dogName: formData.dogName,
        issueLabel: issueLabel(formData.issue),
        inquiryNotes: formData.contactNotes || null,
        preferredTrainerLabel,
        intakeSummary: intakeResponseSummary,
        locale,
      })
    }

    let checkoutUrl: string | null = null
    if (isConsultationDirectBook && requestedScheduledAtIso && consultationServiceVariationId && consultationTeamMemberId) {
      try {
        const bookingCustomerId =
          squareCustomerId ||
          (await getOrCreateSquareCustomer({
            name: formData.contactName,
            email: formData.contactEmail,
            phone: formData.contactPhone || undefined,
          }))
        const idempotencyKey = crypto
          .createHash("sha256")
          .update(`${docRef.id}:${requestedScheduledAtIso}`)
          .digest("hex")
          .slice(0, 45)
        const squareBooking = await createSquareBooking({
          customerId: bookingCustomerId,
          startAt: requestedScheduledAtIso,
          serviceVariationId: consultationServiceVariationId,
          teamMemberId: consultationTeamMemberId,
          idempotencyKey,
          note: [
            `Dog: ${formData.dogName}`,
            issueLabel(formData.issue) ? `Issue: ${issueLabel(formData.issue)}` : null,
            formData.contactBestTime ? `Contact pref: ${formData.contactBestTime}` : null,
            formData.contactNotes ? `Client notes: ${String(formData.contactNotes).slice(0, 180)}` : null,
          ]
            .filter(Boolean)
            .join(" | ")
            .slice(0, 900),
        })
        const squareConsultationBookingId = squareBooking.booking?.id || null
        if (!squareConsultationBookingId) {
          throw new Error("Square did not return a consultation booking id.")
        }
        await docRef.set(
          {
            status: "scheduled",
            scheduledAtIso: requestedScheduledAtIso,
            consultationDateTime: requestedScheduledAtIso,
            squareCustomerId: bookingCustomerId,
            squareConsultationBookingId,
            squareConsultationStatus: squareBooking.booking?.status || null,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        )
        notifyStaffOfBooking({
          kind: "consultation",
          consultationId: docRef.id,
          clientName: formData.contactName,
          clientEmail: formData.contactEmail,
          clientPhone: formData.contactPhone,
          dogName: formData.dogName,
          scheduledAtIso: requestedScheduledAtIso,
          squareBookingId: squareConsultationBookingId,
          issueLabel: issueLabel(formData.issue),
        })
      } catch (err) {
        console.error("[Booking API] Failed to create direct consultation booking:", err)
        await docRef.set(
          {
            status: "booking_failed",
            bookingError: err instanceof Error ? err.message : "Square booking failed.",
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        )
        return NextResponse.json(
          {
            error: "Could not complete the booking. Please try again or contact us.",
          },
          { status: 502 },
        )
      }
    }

    /* $30 deposit checkout disabled for now
    if (requiresConsultationDeposit) {
      try {
        const link = await createSquarePaymentLinkForItems({
          items: [
            {
              name: "Consultation reservation deposit",
              amountCents: consultationDepositAmountCents,
              currency: CONSULTATION_DEPOSIT_CURRENCY,
              quantity: "1",
            },
          ],
          buyerEmail: formData.contactEmail,
          note: `Consultation deposit - ${formData.dogName} - ${formData.contactName}`,
          redirectUrl: buildConsultationCheckoutRedirectUrl(request, docRef.id),
          orderReferenceId: docRef.id,
        })
        checkoutUrl = link.payment_link?.url || null
        const linkId = link.payment_link?.id || null
        if (!checkoutUrl) {
          throw new Error("Square did not return a checkout URL.")
        }
        await docRef.set(
          {
            squarePaymentLinkId: linkId,
            squarePaymentLinkUrl: checkoutUrl,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        )
      } catch (err) {
        console.error("[Booking API] Failed to create consultation deposit checkout:", err)
        await docRef.set(
          {
            initialPaymentStatus: "link_failed",
            status: "payment_failed",
            initialPaymentError: err instanceof Error ? err.message : "Payment link failed.",
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        )
        return NextResponse.json(
          {
            error:
              "Payment checkout could not be created. Please try again or contact us to complete the deposit.",
          },
          { status: 502 },
        )
      }
    }
    */

    pushLeadToGHL(formData).catch((err) =>
      console.error("[Booking API] GHL push failed (non-blocking):", err),
    )

    captureServerEvent({
      distinctId: clientId,
      event: isConsultationInquiry
        ? "consultation_inquiry_submitted"
        : isConsultationDirectBook
          ? "consultation_booked"
          : requiresConsultationDeposit
            ? "consultation_deposit_initiated"
            : "booking_submitted",
      properties: {
        consultationId: docRef.id,
        connectMethod: formData.connectMethod,
        issue: formData.issue,
        issueLabel: issueLabel(formData.issue),
        dogName: formData.dogName,
        clientEmail: formData.contactEmail,
        clientName: formData.contactName,
        locale,
        bookingSource,
        highPriority: submission.highPriority,
        consultationSubmissionKind: isConsultation ? consultationSubmissionKind : null,
        preferredTrainerLabel,
        requestedScheduledAtIso,
        depositAmountCents: requiresConsultationDeposit ? consultationDepositAmountCents : 0,
        replacedExisting: Boolean(replaceConsultationId),
      },
    }).catch(() => {})

    return NextResponse.json({
      ok: true,
      id: docRef.id,
      collection: docRef.path,
      checkoutUrl,
    })
  } catch (error) {
    console.error("[Booking API] Failed to save booking:", error)
    return NextResponse.json({ error: bookingErrors[locale].submitFailed }, { status: 500 })
  }
}
