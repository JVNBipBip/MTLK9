"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { User } from "lucide-react"
import { useAppLocale } from "@/components/locale-provider"
import { Button } from "@/components/ui/button"
import { getIntlLocale } from "@/lib/i18n/config"

type ConsultationPayload = {
  id: string
  clientName: string
  clientEmail: string
  dogName: string
  recommendedClassTypes: string[]
  approvedClasses?: Array<{ classTypeId: string; classLabel: string; squareServiceVariationId: string }>
  staffNotes: string
  expiresAtIso: string
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

function formatSlotDisplay(slot: ScheduleSlot, intlLocale: string) {
  const start = new Date(slot.startAt)
  const dateStr = start.toLocaleString(intlLocale, {
    timeZone: "America/Toronto",
    dateStyle: "medium",
    timeStyle: "short",
  })
  return `${dateStr} · ${slot.programLabel}`
}

export function BookingAccessContent({ token }: { token: string }) {
  const locale = useAppLocale()
  const intlLocale = getIntlLocale(locale)
  const [consultation, setConsultation] = useState<ConsultationPayload | null>(null)
  const [slots, setSlots] = useState<ScheduleSlot[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [accessRes, slotsRes] = await Promise.all([
          fetch(`/api/booking-access/${token}`),
          fetch(`/api/schedule-slots?token=${encodeURIComponent(token)}`),
        ])

        const accessData = (await accessRes.json()) as { consultation?: ConsultationPayload; error?: string }
        if (!accessRes.ok || !accessData.consultation) {
          throw new Error(accessData.error || "Could not validate this booking link.")
        }

        const slotsData = (await slotsRes.json()) as { slots?: ScheduleSlot[]; error?: string }
        if (!slotsRes.ok) throw new Error(slotsData.error || "Could not load available schedule slots.")

        if (!active) return
        setConsultation(accessData.consultation)
        setSlots(slotsData.slots || [])
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

  const selectedSlots = useMemo(() => slots.filter((slot) => selected.includes(slot.slotKey)), [selected, slots])

  const handleStartPayment = useCallback(async () => {
    if (!consultation) return
    setError(null)
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
      setIsComplete(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create booking.")
    } finally {
      setIsSubmitting(false)
    }
  }, [consultation, selected, token])

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

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Book your recommended classes</h1>
        <p className="text-muted-foreground">
          {consultation.clientName}, choose an approved schedule slot for {consultation.dogName}, then confirm your booking.
        </p>
        {consultation.staffNotes ? <p className="text-sm text-muted-foreground">Consultation notes: {consultation.staffNotes}</p> : null}
      </section>

      <section className="space-y-4">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm font-medium">Approved class types</p>
          <p className="text-sm text-muted-foreground">
            {(consultation.approvedClasses || []).map((item) => item.classLabel).join(", ") || consultation.recommendedClassTypes.join(", ") || "-"}
          </p>
        </div>

        <div className="space-y-3">
          {slots.map((slot) => {
            const staffName = slot.teamMemberName || (slot.teamMemberId ? "Staff" : null)
            return (
              <label key={slot.slotKey} className="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer">
                <input type="radio" checked={selected.includes(slot.slotKey)} onChange={() => setSelected([slot.slotKey])} className="mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{formatSlotDisplay(slot, intlLocale)}</p>
                  <p className="text-sm text-muted-foreground">{slot.programLabel}</p>
                  {staffName && (
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      {staffName}
                    </p>
                  )}
                </div>
              </label>
            )
          })}
          {slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No available schedule slots right now. Please check back later or contact us.</p>
          ) : null}
        </div>

        {selectedSlots.length > 0 ? (
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm space-y-1">
            <p className="font-medium text-foreground">Booking summary</p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">When:</span> {formatSlotDisplay(selectedSlots[0], intlLocale)}
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
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </section>
    </main>
  )
}
