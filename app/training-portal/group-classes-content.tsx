"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import type { ApprovedGroupProgram, GroupSeriesListItem, StatusResponse } from "./training-portal-types"

const TIMEZONE = "America/Toronto"

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-CA", {
    timeZone: TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function formatPrice(amountCents: number | null, currency: string | null) {
  if (!Number.isFinite(amountCents)) return "Price unavailable"
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: (currency || "CAD").toUpperCase(),
  }).format(Number(amountCents) / 100)
}

type CartItem = {
  sessionId: string
}

type ProgramSession = {
  sessionId: string
  seriesId: string
  classType: string
  programLabel: string
  title: string
  startsAtIso: string
  endsAtIso: string
  locationLabel: string
  spotsRemaining: number
  priceAmountCents: number | null
  priceCurrency: string | null
  seriesSessionCount: number
}

export function GroupClassesContent({
  statusData,
  clientEmail,
  dogName,
  redirectPath,
}: {
  statusData: StatusResponse
  clientEmail: string
  dogName: string
  redirectPath: string
}) {
  const [groupPrograms, setGroupPrograms] = useState<ApprovedGroupProgram[]>([])
  const [groupLoading, setGroupLoading] = useState(false)
  const [groupErr, setGroupErr] = useState<string | null>(null)
  const [groupSeries, setGroupSeries] = useState<GroupSeriesListItem[]>([])
  const [groupSeriesLoading, setGroupSeriesLoading] = useState(false)
  const [groupSeriesErr, setGroupSeriesErr] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)

  useEffect(() => {
    if (!statusData.options.groupClasses?.eligible) {
      setGroupPrograms([])
      setGroupErr(null)
      return
    }
    const email = clientEmail.trim().toLowerCase()
    const dog = (statusData.lookup.dogName || dogName).trim()
    if (!email) return
    let cancelled = false
    setGroupLoading(true)
    setGroupErr(null)
    void (async () => {
      try {
        const response = await fetch("/api/training-portal/group-programs/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientEmail: email, dogName: dog }),
        })
        const data = (await response.json()) as { programs?: ApprovedGroupProgram[]; error?: string }
        if (cancelled) return
        if (!response.ok) {
          setGroupErr(data.error || "Could not load approved group classes.")
          setGroupPrograms([])
          return
        }
        setGroupPrograms(data.programs || [])
      } catch {
        if (!cancelled) {
          setGroupErr("Could not load approved group classes.")
          setGroupPrograms([])
        }
      } finally {
        if (!cancelled) setGroupLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [statusData, clientEmail, dogName])

  useEffect(() => {
    if (!statusData.options.groupClasses?.eligible) {
      setGroupSeries([])
      setGroupSeriesErr(null)
      setCart([])
      setSelectedProgramId(null)
      return
    }
    const email = clientEmail.trim().toLowerCase()
    const dog = (statusData.lookup.dogName || dogName).trim()
    if (!email) return
    let cancelled = false
    setGroupSeriesLoading(true)
    setGroupSeriesErr(null)
    void (async () => {
      try {
        const response = await fetch("/api/training-portal/group-series/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientEmail: email, dogName: dog }),
        })
        const data = (await response.json()) as { series?: GroupSeriesListItem[]; error?: string }
        if (cancelled) return
        if (!response.ok) {
          setGroupSeriesErr(data.error || "Could not load scheduled group classes.")
          setGroupSeries([])
          return
        }
        setGroupSeries(data.series || [])
      } catch {
        if (!cancelled) {
          setGroupSeriesErr("Could not load scheduled group classes.")
          setGroupSeries([])
        }
      } finally {
        if (!cancelled) setGroupSeriesLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [statusData, clientEmail, dogName])

  const sessionsByProgram = useMemo(() => {
    const map = new Map<string, ProgramSession[]>()
    for (const series of groupSeries) {
      for (const session of series.sessions) {
        const list = map.get(series.classType) || []
        list.push({
          sessionId: session.id,
          seriesId: series.seriesId,
          classType: series.classType,
          programLabel: series.programLabel,
          title: session.title || series.programLabel,
          startsAtIso: session.startsAtIso,
          endsAtIso: session.endsAtIso,
          locationLabel: session.locationLabel,
          spotsRemaining: session.spotsRemaining,
          priceAmountCents: session.priceAmountCents,
          priceCurrency: session.priceCurrency,
          seriesSessionCount: series.sessionCount,
        })
        map.set(series.classType, list)
      }
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startsAtIso.localeCompare(b.startsAtIso))
    }
    return map
  }, [groupSeries])

  const sessionById = useMemo(() => {
    const map = new Map<string, ProgramSession>()
    for (const list of sessionsByProgram.values()) {
      for (const session of list) map.set(session.sessionId, session)
    }
    return map
  }, [sessionsByProgram])

  const programLabelByProgramId = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of groupPrograms) map.set(p.programId, p.programLabel)
    for (const [programId, sessions] of sessionsByProgram) {
      if (!map.has(programId) && sessions[0]) map.set(programId, sessions[0].programLabel)
    }
    return map
  }, [groupPrograms, sessionsByProgram])

  useEffect(() => {
    setCart((prev) => {
      const next = prev.filter((item) => sessionById.has(item.sessionId))
      return next.length === prev.length ? prev : next
    })
  }, [sessionById])

  useEffect(() => {
    if (selectedProgramId && !programLabelByProgramId.has(selectedProgramId)) {
      setSelectedProgramId(null)
    }
  }, [programLabelByProgramId, selectedProgramId])

  function isInCart(sessionId: string) {
    return cart.some((item) => item.sessionId === sessionId)
  }

  function addSessionToCart(sessionId: string) {
    setGroupSeriesErr(null)
    setCart((prev) => (prev.some((item) => item.sessionId === sessionId) ? prev : [...prev, { sessionId }]))
  }

  function removeFromCart(sessionId: string) {
    setCart((prev) => prev.filter((item) => item.sessionId !== sessionId))
  }

  async function handleCartCheckout() {
    if (cart.length === 0) return
    setGroupSeriesErr(null)
    setCheckoutLoading(true)
    try {
      const response = await fetch("/api/training-portal/group-series/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEmail: clientEmail.trim().toLowerCase(),
          dogName: (statusData.lookup.dogName || dogName).trim(),
          items: cart.map((item) => ({ sessionId: item.sessionId })),
          redirectPath,
        }),
      })
      const data = (await response.json()) as { checkoutUrl?: string; error?: string }
      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Could not start group class checkout.")
      }
      setCart([])
      window.location.assign(data.checkoutUrl)
    } catch (err) {
      setGroupSeriesErr(err instanceof Error ? err.message : "Could not start group class checkout.")
    } finally {
      setCheckoutLoading(false)
    }
  }

  const selectedProgramLabel = selectedProgramId ? programLabelByProgramId.get(selectedProgramId) || selectedProgramId : null
  const selectedProgramSessions = selectedProgramId ? sessionsByProgram.get(selectedProgramId) || [] : []
  const cartSessions = cart.map((item) => sessionById.get(item.sessionId)).filter((session): session is ProgramSession => Boolean(session))
  const totalAmountCents = cartSessions.reduce((sum, session) => sum + Number(session.priceAmountCents || 0), 0)

  function countUpcomingForProgram(programId: string) {
    return (sessionsByProgram.get(programId) || []).length
  }

  return (
    <>
      {statusData.options.groupClasses ? (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-medium">Book a group class</h3>
          {!statusData.options.groupClasses.eligible ? (
            <p className="text-sm text-muted-foreground">
              {statusData.options.groupClasses.blockedReason === "no_group_program_access"
                ? "No group program is enabled for this dog yet. Ask staff after your assessment to turn on the programs you need."
                : "Complete your assessment to enroll in group classes online."}
            </p>
          ) : (
            <>
              {groupErr ? <p className="text-sm text-destructive">{groupErr}</p> : null}
              {groupSeriesErr ? <p className="text-sm text-destructive">{groupSeriesErr}</p> : null}

              {cartSessions.length > 0 ? (
                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium">
                      Your cart · {cartSessions.length} class{cartSessions.length !== 1 ? "es" : ""} ·{" "}
                      {formatPrice(totalAmountCents, cartSessions[0]?.priceCurrency || "CAD")}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full"
                      disabled={checkoutLoading}
                      onClick={() => void handleCartCheckout()}
                    >
                      {checkoutLoading ? "Opening Square…" : "Continue in Square"}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {cartSessions.map((session) => (
                      <div
                        key={session.sessionId}
                        className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background/80 p-3"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">{session.programLabel}</p>
                          <p className="text-sm text-muted-foreground">{formatDateTime(session.startsAtIso)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(session.priceAmountCents, session.priceCurrency)}
                            {session.locationLabel ? ` · ${session.locationLabel}` : ""}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="rounded-full"
                          disabled={checkoutLoading}
                          onClick={() => removeFromCart(session.sessionId)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {groupLoading || groupSeriesLoading ? (
                <p className="text-sm text-muted-foreground">Loading classes…</p>
              ) : groupPrograms.length === 0 ? (
                <p className="text-sm text-muted-foreground">No approved group programs are available right now.</p>
              ) : selectedProgramId === null ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Choose a class type to see all of its upcoming dates.
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {groupPrograms.map((program) => {
                      const count = countUpcomingForProgram(program.programId)
                      return (
                        <button
                          type="button"
                          key={program.programId}
                          onClick={() => setSelectedProgramId(program.programId)}
                          className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background/60 p-4 text-left transition-colors hover:bg-background/80"
                        >
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{program.programLabel}</p>
                            <p className="text-sm text-muted-foreground">
                              {count === 0 ? "No upcoming class dates" : `${count} upcoming class date${count !== 1 ? "s" : ""}`}
                            </p>
                          </div>
                          <span aria-hidden className="text-muted-foreground">
                            →
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                      onClick={() => setSelectedProgramId(null)}
                    >
                      ← All programs
                    </Button>
                    <p className="font-medium text-right">{selectedProgramLabel}</p>
                  </div>

                  {selectedProgramSessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No upcoming dates for this program right now. Check back later.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Pick any dates you want. Each selected class session becomes its own line item in one Square checkout.
                      </p>
                      {selectedProgramSessions.map((session) => {
                        const inCart = isInCart(session.sessionId)
                        const isFull = session.spotsRemaining <= 0
                        return (
                          <div key={session.sessionId} className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="font-medium text-foreground">{formatDateTime(session.startsAtIso)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatPrice(session.priceAmountCents, session.priceCurrency)}
                                  {session.locationLabel ? ` · ${session.locationLabel}` : ""}
                                </p>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {session.spotsRemaining} spot{session.spotsRemaining !== 1 ? "s" : ""} remaining
                              </p>
                            </div>

                            {session.seriesSessionCount > 1 ? (
                              <p className="text-xs text-muted-foreground">
                                Part of a {session.seriesSessionCount}-session class series. You can add this date on its own.
                              </p>
                            ) : null}

                            <div className="flex justify-end">
                              <Button
                                type="button"
                                size="sm"
                                variant={inCart ? "outline" : "default"}
                                className="rounded-full"
                                disabled={checkoutLoading || (!inCart && isFull)}
                                onClick={() => (inCart ? removeFromCart(session.sessionId) : addSessionToCart(session.sessionId))}
                              >
                                {inCart ? "Remove from cart" : isFull ? "Full" : "Add to cart"}
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-medium">Upcoming group sessions</h3>
        {statusData.existingBookings.filter((b) => b.type === "group").length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming group sessions on file.</p>
        ) : (
          <div className="space-y-2">
            {statusData.existingBookings
              .filter((b) => b.type === "group")
              .map((booking) => (
                <div key={booking.id} className="rounded-lg border border-border p-3">
                  <p className="font-medium">{booking.label}</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(booking.startAt)}</p>
                  <p className="text-xs text-muted-foreground">
                    Status: {booking.bookingStatus || "-"}
                    {booking.squareBookingStatus ? ` (${booking.squareBookingStatus})` : ""}
                  </p>
                </div>
              ))}
          </div>
        )}
      </div>
    </>
  )
}
