"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeft, User, UserRound, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { trackFBSchedule } from "@/lib/facebook-pixel"
import { formatTorontoDateTime } from "@/lib/toronto-time"

type PortalTrainerRow = {
  slug: string
  teamMemberId: string
  displayName: string
}

type ConsultationPayload = {
  id: string
  clientName: string
  clientEmail: string
  dogName: string
  recommendedClassTypes: string[]
  approvedClasses?: Array<{ classTypeId: string; classLabel: string; squareServiceVariationId: string }>
  staffNotes: string
  expiresAtIso: string
  /** Filtered list from server (client settings + consultation). */
  privateTrainers?: PortalTrainerRow[]
}

type ScheduleSlot = {
  slotKey: string
  startAt: string
  programId?: string
  programLabel: string
  teamMemberId?: string
  teamMemberName?: string | null
  serviceVariationId?: string
}

type ApprovedProgramOption = {
  classTypeId: string
  classLabel: string
  squareServiceVariationId: string
}

type HubStep = "choose" | "private_trainers" | "group_classes"

function formatSlotDisplay(slot: ScheduleSlot) {
  const dateStr = formatTorontoDateTime(slot.startAt)
  return `${dateStr} · ${slot.programLabel}`
}

function buildPrivateBookUrl(email: string, dog: string, teamMemberId: string, bookingAccessToken: string) {
  const params = new URLSearchParams()
  params.set("email", email.trim().toLowerCase())
  params.set("dog", dog.trim())
  params.set("trainerTeamMemberId", teamMemberId)
  params.set("bookingAccessToken", bookingAccessToken)
  return `/training-portal/book?${params.toString()}`
}

export function BookingAccessContent({
  token,
  initialFocus = null,
}: {
  token: string
  /** When `"private"`, open the private-trainer picker immediately (e.g. `/booking-access/TOKEN?focus=private`). */
  initialFocus?: "private" | null
}) {
  const [consultation, setConsultation] = useState<ConsultationPayload | null>(null)
  const [slots, setSlots] = useState<ScheduleSlot[]>([])
  const [slotsLoadNote, setSlotsLoadNote] = useState<string | null>(null)

  const [selected, setSelected] = useState<string[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [hubStep, setHubStep] = useState<HubStep>(() => (initialFocus === "private" ? "private_trainers" : "choose"))
  const [trainers, setTrainers] = useState<PortalTrainerRow[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const accessRes = await fetch(`/api/booking-access/${token}`)
        const accessData = (await accessRes.json()) as { consultation?: ConsultationPayload; error?: string }
        if (!accessRes.ok || !accessData.consultation) {
          throw new Error(accessData.error || "Could not validate this booking link.")
        }

        let nextSlots: ScheduleSlot[] = []
        let slotsNote: string | null = null
        try {
          const slotsRes = await fetch(`/api/schedule-slots?token=${encodeURIComponent(token)}`)
          const slotsData = (await slotsRes.json()) as { slots?: ScheduleSlot[]; error?: string }
          if (slotsRes.ok) {
            nextSlots = slotsData.slots || []
          } else {
            slotsNote = slotsData.error || "Could not load group class times."
          }
        } catch {
          slotsNote = "Could not load group class times."
        }

        if (!active) return
        setConsultation(accessData.consultation)
        setTrainers(accessData.consultation.privateTrainers || [])
        setSlots(nextSlots)
        setSlotsLoadNote(slotsNote)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : "Could not load booking access data.")
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [token])

  const programOptions: ApprovedProgramOption[] = useMemo(() => {
    if (!consultation) return []
    if (consultation.approvedClasses && consultation.approvedClasses.length > 0) {
      return consultation.approvedClasses
    }
    const seen = new Map<string, ApprovedProgramOption>()
    for (const s of slots) {
      const id = String(s.programId || "").trim()
      if (!id || seen.has(id)) continue
      seen.set(id, {
        classTypeId: id,
        classLabel: String(s.programLabel || id),
        squareServiceVariationId: String(s.serviceVariationId || ""),
      })
    }
    return [...seen.values()]
  }, [consultation, slots])

  useEffect(() => {
    if (programOptions.length !== 1) return
    setSelectedProgramId((prev) => prev ?? programOptions[0]!.classTypeId)
  }, [programOptions])

  const filteredSlots = useMemo(() => {
    if (!selectedProgramId) return []
    return slots.filter((s) => String(s.programId || "") === selectedProgramId)
  }, [slots, selectedProgramId])

  const selectedSlots = useMemo(() => filteredSlots.filter((slot) => selected.includes(slot.slotKey)), [selected, filteredSlots])

  const handleStartPayment = useCallback(async () => {
    if (!consultation) return
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/schedule-bookings/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          consultationId: consultation.id,
          selectedSlotKey: selected[0],
        }),
      })
      const data = (await response.json()) as { bookingId?: string; error?: string }
      if (!response.ok || !data.bookingId) {
        throw new Error(data.error || "Could not create booking.")
      }
      const chosen = filteredSlots.find((slot) => slot.slotKey === selected[0])
      trackFBSchedule({
        content_name: chosen?.programLabel || "Recommended Class",
        content_category: "Dog Training Booking",
      })
      setIsComplete(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not create booking.")
    } finally {
      setIsSubmitting(false)
    }
  }, [consultation, selected, filteredSlots, token])

  if (loading) {
    return <main className="mx-auto max-w-3xl px-6 py-12">Loading secure booking access...</main>
  }
  if (error && !consultation) {
    return <main className="mx-auto max-w-3xl px-6 py-12 text-destructive">{error}</main>
  }
  if (!consultation) return null
  if (isComplete) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12 space-y-3">
        <h1 className="text-2xl font-semibold">Booking confirmed</h1>
        <p className="text-muted-foreground">Your class booking is complete. We&apos;ll email confirmation details shortly.</p>
      </main>
    )
  }

  const clientEmail = consultation.clientEmail.trim().toLowerCase()
  const dogName = consultation.dogName.trim()
  const canShowGroupClasses = Boolean(selectedProgramId) && filteredSlots.length > 0
  const showGroupUnavailable =
    hubStep === "group_classes" && programOptions.length === 0 && (slotsLoadNote || slots.length === 0)

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Book with Montreal Canine Training</h1>
        <p className="text-muted-foreground">
          Hi {consultation.clientName}, pick what you&apos;d like to do next for {consultation.dogName}.
        </p>
        {consultation.staffNotes ? (
          <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3 py-1">
            Notes from your visit: {consultation.staffNotes}
          </p>
        ) : null}
      </section>

      {hubStep === "choose" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setHubStep("private_trainers")}
            className="rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:bg-muted/40 flex flex-col gap-3 min-h-[150px]"
          >
            <UserRound className="w-8 h-8 text-primary shrink-0" aria-hidden />
            <div>
              <p className="font-medium">Private lessons</p>
              <p className="text-sm text-muted-foreground mt-1">Pick a trainer, then schedule your one-on-one sessions.</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setHubStep("group_classes")}
            className="rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:bg-muted/40 flex flex-col gap-3 min-h-[150px]"
          >
            <Users className="w-8 h-8 text-primary shrink-0" aria-hidden />
            <div>
              <p className="font-medium">Group classes</p>
              <p className="text-sm text-muted-foreground mt-1">
                Pick a program you&apos;re cleared for, then choose an open spot.
              </p>
            </div>
          </button>
        </div>
      ) : null}

      {hubStep === "private_trainers" ? (
        <section className="space-y-4">
          <Button type="button" variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => setHubStep("choose")}>
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Back
          </Button>
          <h2 className="text-lg font-semibold">Choose your trainer</h2>
          {trainers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No trainers are available for your profile online right now. Please contact us.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {trainers.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={buildPrivateBookUrl(clientEmail, dogName, t.teamMemberId, token)}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-medium">{t.displayName}</span>
                    <span className="text-sm text-primary">Continue →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {hubStep === "group_classes" && (
        <section className="space-y-6">
          <Button type="button" variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => setHubStep("choose")}>
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Back
          </Button>

          {slotsLoadNote && slots.length === 0 ? (
            <p className="text-sm text-muted-foreground border border-border rounded-xl p-4">{slotsLoadNote}</p>
          ) : null}

          {programOptions.length > 0 ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium">Which program?</span>
              <select
                className="flex h-10 w-full max-w-lg rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={
                  programOptions.length === 1 ? (selectedProgramId || programOptions[0]?.classTypeId || "") : (selectedProgramId || "")
                }
                onChange={(e) => {
                  const v = e.target.value
                  setSelectedProgramId(v || null)
                  setSelected([])
                }}
              >
                {programOptions.length > 1 ? <option value="">Choose a program…</option> : null}
                {programOptions.map((p) => (
                  <option key={p.classTypeId} value={p.classTypeId}>
                    {p.classLabel}
                  </option>
                ))}
              </select>
              <span className="text-xs text-muted-foreground">
                Only programs you&apos;ve been cleared for appear here ({programOptions.length} available).
              </span>
            </label>
          ) : (
            showGroupUnavailable && (
              <p className="text-sm text-muted-foreground">
                No approved group programs are on your profile yet. Try private lessons above or contact us.
              </p>
            )
          )}

          {selectedProgramId && filteredSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No open times for this program in the calendar window yet. Try another approved program or check back soon.
            </p>
          ) : null}

          {canShowGroupClasses ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Pick a time</h2>
              <div className="space-y-3">
                {filteredSlots.map((slot) => {
                  const staffName = slot.teamMemberName || (slot.teamMemberId ? "Staff" : null)
                  return (
                    <label key={slot.slotKey} className="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer">
                      <input
                        type="radio"
                        checked={selected.includes(slot.slotKey)}
                        onChange={() => setSelected([slot.slotKey])}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{formatSlotDisplay(slot)}</p>
                        <p className="text-sm text-muted-foreground">{slot.programLabel}</p>
                        {staffName ? (
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 shrink-0" />
                            {staffName}
                          </p>
                        ) : null}
                      </div>
                    </label>
                  )
                })}
              </div>

              {selectedSlots.length > 0 ? (
                <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm space-y-1">
                  <p className="font-medium text-foreground">Booking summary</p>
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">When:</span> {formatSlotDisplay(selectedSlots[0])}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">What:</span> {selectedSlots[0].programLabel}
                  </p>
                  {(selectedSlots[0].teamMemberName || selectedSlots[0].teamMemberId) && (
                    <p className="text-muted-foreground flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-medium text-foreground">With:</span> {selectedSlots[0].teamMemberName || "Staff"}
                    </p>
                  )}
                </div>
              ) : null}

              <Button type="button" onClick={handleStartPayment} disabled={selected.length === 0 || isSubmitting}>
                {isSubmitting ? "Booking..." : "Confirm booking"}
              </Button>
              {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
            </div>
          ) : null}
        </section>
      )}
    </main>
  )
}
