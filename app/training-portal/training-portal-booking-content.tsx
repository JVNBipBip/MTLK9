"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  PLAN_TYPE_LABEL,
  SERVICE_TYPE_LABEL,
  type PrivatePackage,
  type Slot,
  type StatusResponse,
} from "./training-portal-types"
import {
  formatDayHeader,
  formatSlotDate,
  formatSlotTime,
  formatWeekLabel,
  getWeekRange,
  slotsByWeekday,
  slotsInWeek,
  WEEKDAYS,
} from "./training-portal-utils"

export function TrainingPortalBookingContent({
  clientEmail,
  dogName,
}: {
  clientEmail: string
  dogName: string
}) {
  const [statusData, setStatusData] = useState<StatusResponse | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlotKeys, setSelectedSlotKeys] = useState<string[]>([])
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [isSelectingPackage, setIsSelectingPackage] = useState(false)
  const [selectedServiceType, setSelectedServiceType] = useState<PrivatePackage["serviceType"]>("in_facility")
  const [selectedPlanType, setSelectedPlanType] = useState<PrivatePackage["planType"]>("pack_3")
  const [isEditingPackage, setIsEditingPackage] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const activePackage = statusData?.activePrivatePackage || null
  const oneOnOneUpcoming = statusData?.existingBookings.find((b) => b.type === "one_on_one") || null

  const fetchStatus = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false
    if (!silent) setError(null)
    setIsLoadingStatus(true)
    try {
      const response = await fetch("/api/training-portal/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEmail: clientEmail.trim(),
          dogName: dogName.trim(),
        }),
      })
      const data = (await response.json()) as StatusResponse & { error?: string }
      if (!response.ok) throw new Error(data.error || "Could not load status.")
      setStatusData(data)
      if (data.activePrivatePackage) {
        setSelectedServiceType(data.activePrivatePackage.serviceType)
        setSelectedPlanType(data.activePrivatePackage.planType)
      }
    } catch (err) {
      if (!silent) {
        setStatusData(null)
        setError(err instanceof Error ? err.message : "Could not load status.")
      }
    } finally {
      setIsLoadingStatus(false)
    }
  }, [clientEmail, dogName])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const loadOneOnOneSlots = useCallback(async () => {
    setError(null)
    setSuccessMessage(null)
    setIsLoadingSlots(true)
    try {
      const response = await fetch("/api/training-portal/one-on-one-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEmail: clientEmail.trim(),
          dogName: dogName.trim(),
        }),
      })
      const text = await response.text()
      let data: { slots?: Slot[]; error?: string }
      try {
        data = text ? (JSON.parse(text) as { slots?: Slot[]; error?: string }) : {}
      } catch {
        throw new Error(response.ok ? "Invalid response." : `Server error: ${response.status}`)
      }
      if (!response.ok) throw new Error(data.error || "Could not load available times.")
      setSlots(data.slots || [])
      setSelectedSlotKeys([])
      setWeekOffset(0)
    } catch (err) {
      setSlots([])
      setError(err instanceof Error ? err.message : "Could not load available times.")
    } finally {
      setIsLoadingSlots(false)
    }
  }, [clientEmail, dogName])

  useEffect(() => {
    if (
      statusData &&
      !isLoadingStatus &&
      slots.length === 0 &&
      !isLoadingSlots &&
      statusData.options.oneOnOne.eligible &&
      activePackage
    ) {
      loadOneOnOneSlots()
    }
  }, [statusData, isLoadingStatus, slots.length, isLoadingSlots, activePackage, loadOneOnOneSlots])

  async function savePrivatePackage() {
    if (!statusData) return
    setError(null)
    setSuccessMessage(null)
    setIsSelectingPackage(true)
    try {
      const response = await fetch("/api/training-portal/private-package/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEmail: clientEmail.trim(),
          dogName: dogName.trim(),
          serviceType: selectedServiceType,
          planType: selectedPlanType,
        }),
      })
      const text = await response.text()
      let data: { ok?: boolean; error?: string }
      try {
        data = text ? (JSON.parse(text) as { ok?: boolean; error?: string }) : {}
      } catch {
        throw new Error(response.ok ? "Invalid response." : `Server error: ${response.status}`)
      }
      if (!response.ok) throw new Error(data.error || "Could not save package.")
      await fetchStatus()
      setSlots([])
      setSelectedSlotKeys([])
      setIsEditingPackage(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save package.")
    } finally {
      setIsSelectingPackage(false)
    }
  }

  function toggleSlot(slotKey: string) {
    if (!activePackage) return
    const maxSelect = activePackage.sessionsRemaining
    setSelectedSlotKeys((prev) => {
      const has = prev.includes(slotKey)
      if (has) return prev.filter((k) => k !== slotKey)
      if (prev.length >= maxSelect) return prev
      return [...prev, slotKey]
    })
  }

  async function confirmBookings() {
    if (selectedSlotKeys.length === 0) return
    setError(null)
    setSuccessMessage(null)
    setIsBooking(true)
    let booked = 0
    let duplicates = 0
    try {
      for (const slotKey of selectedSlotKeys) {
        const response = await fetch("/api/training-portal/one-on-one-book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientEmail: clientEmail.trim(),
            dogName: dogName.trim(),
            selectedSlotKey: slotKey,
          }),
        })
        const text = await response.text()
        let data: { ok?: boolean; duplicate?: boolean; error?: string }
        try {
          data = text ? (JSON.parse(text) as { ok?: boolean; duplicate?: boolean; error?: string }) : {}
        } catch {
          throw new Error(response.ok ? "Invalid response." : `Server error: ${response.status}`)
        }
        if (!response.ok) throw new Error(data.error || "Could not create booking.")
        if (data.duplicate) duplicates += 1
        else booked += 1
      }
      const parts: string[] = []
      if (booked > 0) parts.push(`${booked} booking${booked === 1 ? "" : "s"} confirmed`)
      if (duplicates > 0) parts.push(`${duplicates} already booked`)
      setSuccessMessage(parts.join(". "))
      setSlots([])
      setSelectedSlotKeys([])
      await fetchStatus({ silent: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create booking.")
    } finally {
      setIsBooking(false)
    }
  }

  if (isLoadingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!statusData?.assessmentCompleted || !activePackage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <p className="text-muted-foreground text-center mb-6">
          {!statusData
            ? "Could not load your profile."
            : !statusData.assessmentCompleted
              ? "Assessment required before booking."
              : "Please select a package first."}
        </p>
        <Link href="/services">
          <Button variant="outline">Back to Services</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 mx-auto w-full max-w-[1920px] px-6 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/services">
            <Button variant="ghost" size="sm" className="gap-2 -ml-2">
              <ArrowLeft className="w-4 h-4" />
              Back to portal
            </Button>
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <h1 className="text-2xl font-bold">Book your sessions</h1>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {successMessage && <p className="text-sm text-green-700">{successMessage}</p>}

          {activePackage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/10">
                <div>
                  <p className="font-medium text-foreground">
                    {SERVICE_TYPE_LABEL[activePackage.serviceType]} · {PLAN_TYPE_LABEL[activePackage.planType]}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activePackage.sessionsRemaining} session{activePackage.sessionsRemaining === 1 ? "" : "s"} remaining
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsEditingPackage(!isEditingPackage)}>
                  {isEditingPackage ? "Cancel" : "Change Package"}
                </Button>
              </div>

              {isEditingPackage && (
                <div className="p-4 border rounded-xl bg-card space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Service type</p>
                      <div className="space-y-2">
                        {(["in_facility", "in_home"] as const).map((t) => (
                          <label key={t} className="flex items-center gap-2 text-sm p-2 rounded hover:bg-muted/50 cursor-pointer">
                            <input
                              type="radio"
                              checked={selectedServiceType === t}
                              onChange={() => setSelectedServiceType(t)}
                              className="text-primary focus:ring-primary"
                            />
                            {SERVICE_TYPE_LABEL[t]}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Package option</p>
                      <div className="space-y-2">
                        {(["pack_3", "pack_5", "pack_7", "unit"] as const).map((plan) => (
                          <label key={plan} className="flex items-center gap-2 text-sm p-2 rounded hover:bg-muted/50 cursor-pointer">
                            <input
                              type="radio"
                              checked={selectedPlanType === plan}
                              onChange={() => setSelectedPlanType(plan)}
                              className="text-primary focus:ring-primary"
                            />
                            {PLAN_TYPE_LABEL[plan]}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      disabled={isSelectingPackage}
                      onClick={async () => {
                        await savePrivatePackage()
                      }}
                    >
                      {isSelectingPackage ? "Saving..." : "Update Package"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-semibold">Available times</h2>
              <div className="flex items-center gap-2">
                {oneOnOneUpcoming && (
                  <p className="text-sm text-muted-foreground">
                    Upcoming: {formatSlotDate(oneOnOneUpcoming.startAt)} at {formatSlotTime(oneOnOneUpcoming.startAt)}
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadOneOnOneSlots}
                  disabled={isLoadingSlots || !statusData.options.oneOnOne.eligible}
                >
                  {isLoadingSlots ? "Loading..." : "Load available times"}
                </Button>
              </div>
            </div>

            {isLoadingSlots ? (
              <div className="py-16 text-center text-muted-foreground">Loading available times...</div>
            ) : slots.length > 0 && activePackage ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border border-border">
                  <p className="text-sm font-medium">
                    Select up to <span className="text-primary font-bold">{activePackage.sessionsRemaining}</span> sessions.
                    <span className="ml-2 text-muted-foreground">({selectedSlotKeys.length} selected)</span>
                  </p>
                  <Button
                    type="button"
                    disabled={selectedSlotKeys.length === 0 || isBooking}
                    onClick={confirmBookings}
                    size="sm"
                  >
                    {isBooking ? "Booking..." : "Confirm Bookings"}
                  </Button>
                </div>

                {(() => {
                  const weekSlots = slotsInWeek(slots, weekOffset)
                  const byDay = slotsByWeekday(weekSlots)
                  const hasPrev = weekOffset > 0
                  const hasNext = slots.some((s) => {
                    const { end } = getWeekRange(weekOffset + 1)
                    return new Date(s.startAt).getTime() > end.getTime()
                  })
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="font-semibold text-lg">{formatWeekLabel(weekOffset)}</h3>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setWeekOffset((o) => Math.max(0, o - 1))}
                            disabled={!hasPrev}
                            className="h-9 w-9 rounded-full"
                            aria-label="Previous week"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setWeekOffset((o) => o + 1)}
                            disabled={!hasNext}
                            className="h-9 w-9 rounded-full"
                            aria-label="Next week"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-card overflow-hidden">
                        <p className="text-xs text-muted-foreground text-center py-1.5 bg-muted/30 border-b border-border">
                          Scroll horizontally to see all days
                        </p>
                        <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
                          <div
                            className="grid divide-x divide-border"
                            style={{
                              gridTemplateColumns: "repeat(7, minmax(180px, 1fr))",
                              minWidth: "1260px",
                              minHeight: "400px",
                            }}
                          >
                            {WEEKDAYS.map((_, dayIdx) => (
                              <div key={dayIdx} className="flex flex-col min-h-[400px]">
                                <div className="sticky top-0 z-10 p-4 text-center border-b border-border bg-background/95 backdrop-blur shadow-sm">
                                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    {formatDayHeader(weekOffset, dayIdx).split(" · ")[0]}
                                  </p>
                                  <p className="text-xl font-bold text-foreground mt-1">
                                    {formatDayHeader(weekOffset, dayIdx).split(" · ")[1]}
                                  </p>
                                </div>
                                <div className="p-3 space-y-3 flex-1 bg-muted/5">
                                  {(byDay[dayIdx] || []).map((slot) => {
                                    const isSelected = selectedSlotKeys.includes(slot.slotKey)
                                    const atLimit = selectedSlotKeys.length >= activePackage.sessionsRemaining
                                    const canSelect = isSelected || !atLimit
                                    const staffName = slot.teamMemberName || "Trainer"
                                    return (
                                      <button
                                        key={slot.slotKey}
                                        type="button"
                                        onClick={() => canSelect && toggleSlot(slot.slotKey)}
                                        disabled={!canSelect && !isSelected}
                                        className={`w-full text-left flex flex-col gap-1.5 rounded-xl border p-4 transition-all duration-200 ${
                                          isSelected
                                            ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary scale-[1.02]"
                                            : canSelect
                                              ? "border-border bg-card hover:border-primary/50 hover:shadow-lg hover:-translate-y-1"
                                              : "border-transparent opacity-40 cursor-not-allowed bg-muted"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between w-full">
                                          <span className={`text-lg font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>
                                            {formatSlotTime(slot.startAt)}
                                          </span>
                                          {isSelected && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                          <User className="w-4 h-4 shrink-0" />
                                          <span className="truncate font-medium">{staffName}</span>
                                        </div>
                                      </button>
                                    )
                                  })}
                                  {(!byDay[dayIdx] || byDay[dayIdx].length === 0) && (
                                    <div className="h-full flex items-center justify-center p-4 opacity-20">
                                      <div className="flex gap-1">
                                        <div className="w-1 h-1 rounded-full bg-foreground" />
                                        <div className="w-1 h-1 rounded-full bg-foreground" />
                                        <div className="w-1 h-1 rounded-full bg-foreground" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border space-y-4">
                <p>
                  {statusData.options.oneOnOne.eligible
                    ? "No available times found. Try loading again or check another week."
                    : "You are not eligible to book sessions at this time."}
                </p>
                {statusData.options.oneOnOne.eligible && (
                  <Button type="button" variant="outline" onClick={loadOneOnOneSlots} disabled={isLoadingSlots}>
                    {isLoadingSlots ? "Loading..." : "Load available times"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
