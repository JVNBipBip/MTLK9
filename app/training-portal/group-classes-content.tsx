"use client"

import { useEffect, useMemo, useState } from "react"
import { useAppLocale } from "@/components/locale-provider"
import { Button } from "@/components/ui/button"
import { CONTRACT_LABEL, CONTRACT_VERSION, contractBody } from "@/lib/contract-terms"
import { getIntlLocale } from "@/lib/i18n/config"
import type { ApprovedGroupProgram, GroupSeriesListItem, StatusResponse } from "./training-portal-types"

function formatDateTime(iso: string, intlLocale: string) {
  return new Date(iso).toLocaleString(intlLocale, {
    timeZone: "America/Toronto",
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function GroupClassesContent({
  statusData,
  clientEmail,
  dogName,
}: {
  statusData: StatusResponse
  clientEmail: string
  dogName: string
  redirectPath: string
}) {
  const locale = useAppLocale()
  const intlLocale = getIntlLocale(locale)
  const [groupPrograms, setGroupPrograms] = useState<ApprovedGroupProgram[]>([])
  const [groupLoading, setGroupLoading] = useState(false)
  const [groupErr, setGroupErr] = useState<string | null>(null)
  const [groupSeries, setGroupSeries] = useState<GroupSeriesListItem[]>([])
  const [groupSeriesLoading, setGroupSeriesLoading] = useState(false)
  const [groupSeriesErr, setGroupSeriesErr] = useState<string | null>(null)
  const [requestSeriesId, setRequestSeriesId] = useState<string | null>(null)
  const [requestLoading, setRequestLoading] = useState(false)
  const [requestMsg, setRequestMsg] = useState<string | null>(null)
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)
  const [groupContractAccepted, setGroupContractAccepted] = useState(false)
  const [groupContractAlreadyAccepted, setGroupContractAlreadyAccepted] = useState(false)
  const [localPendingRequests, setLocalPendingRequests] = useState<Array<{ id: string; startAt: string; label: string }>>([])

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
      setGroupContractAccepted(false)
      setGroupContractAlreadyAccepted(false)
      return
    }
    const email = clientEmail.trim().toLowerCase()
    if (!email) return
    let cancelled = false
    setGroupContractAccepted(false)
    void (async () => {
      try {
        const params = new URLSearchParams({
          clientEmail: email,
          contractKind: "group_classes",
          version: CONTRACT_VERSION,
        })
        const response = await fetch(`/api/contract-acceptance?${params.toString()}`)
        const data = (await response.json()) as { accepted?: boolean }
        if (!cancelled) setGroupContractAlreadyAccepted(response.ok && Boolean(data.accepted))
      } catch {
        if (!cancelled) setGroupContractAlreadyAccepted(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [statusData, clientEmail])

  useEffect(() => {
    if (!statusData.options.groupClasses?.eligible) {
      setGroupSeries([])
      setGroupSeriesErr(null)
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

  const seriesByProgram = useMemo(() => {
    const map = new Map<string, GroupSeriesListItem[]>()
    for (const series of groupSeries) {
      const list = map.get(series.classType) || []
      list.push(series)
      map.set(series.classType, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.sessions[0].startsAtIso.localeCompare(b.sessions[0].startsAtIso))
    }
    return map
  }, [groupSeries])

  const programLabelByProgramId = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of groupPrograms) map.set(p.programId, p.programLabel)
    for (const [programId, seriesList] of seriesByProgram) {
      if (!map.has(programId) && seriesList[0]) map.set(programId, seriesList[0].programLabel)
    }
    return map
  }, [groupPrograms, seriesByProgram])

  useEffect(() => {
    if (selectedProgramId && !programLabelByProgramId.has(selectedProgramId)) {
      setSelectedProgramId(null)
    }
  }, [programLabelByProgramId, selectedProgramId])

  async function handleSeriesRequest(seriesId: string) {
    setGroupSeriesErr(null)
    setRequestMsg(null)
    if (!groupContractAlreadyAccepted && !groupContractAccepted) {
      setGroupSeriesErr("Please read and accept the group class agreement before requesting a spot.")
      return
    }
    setRequestSeriesId(seriesId)
    setRequestLoading(true)
    try {
      const requestedSeries = groupSeries.find((series) => series.seriesId === seriesId)
      const effectiveDogName = (statusData.lookup.dogName || dogName).trim()
      if (!groupContractAlreadyAccepted) {
        await fetch("/api/contract-acceptance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientEmail: clientEmail.trim().toLowerCase(),
            contractKind: "group_classes",
            version: CONTRACT_VERSION,
            source: "/training-portal/group-classes",
            dogName: effectiveDogName,
          }),
        }).catch(() => null)
        setGroupContractAlreadyAccepted(true)
      }
      const response = await fetch("/api/training-portal/group-series/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEmail: clientEmail.trim().toLowerCase(),
          dogName: effectiveDogName,
          seriesId,
          locale,
        }),
      })
      const data = (await response.json()) as { bookingId?: string; notificationEmailSent?: boolean; error?: string }
      if (!response.ok || !data.bookingId) {
        throw new Error(data.error || "Could not request this group class.")
      }
      setRequestMsg("Request sent. Staff will review it and email you once it has been accepted or declined.")
      if (requestedSeries?.sessions[0]) {
        setLocalPendingRequests((prev) => [
          ...prev,
          {
            id: data.bookingId,
            startAt: requestedSeries.sessions[0].startsAtIso,
            label: `${requestedSeries.programLabel} request`,
          },
        ])
      }
      setGroupSeries((prev) => prev.filter((series) => series.seriesId !== seriesId))
    } catch (err) {
      setGroupSeriesErr(err instanceof Error ? err.message : "Could not request this group class.")
    } finally {
      setRequestLoading(false)
      setRequestSeriesId(null)
    }
  }

  const selectedProgramLabel = selectedProgramId ? programLabelByProgramId.get(selectedProgramId) || selectedProgramId : null
  const selectedProgramSeries = selectedProgramId ? seriesByProgram.get(selectedProgramId) || [] : []
  const pendingGroupRequests = [
    ...statusData.existingBookings
      .filter((booking) => booking.type === "group" && booking.bookingStatus === "requested")
      .map((booking) => ({ id: booking.id, startAt: booking.startAt, label: booking.label })),
    ...localPendingRequests,
  ].filter((booking, index, list) => list.findIndex((item) => item.id === booking.id) === index)
  const visibleGroupBookings = statusData.existingBookings.filter(
    (booking) =>
      booking.type === "group" &&
      booking.bookingStatus !== "requested" &&
      booking.bookingStatus !== "pending_payment" &&
      booking.bookingStatus !== "processing",
  )

  function countUpcomingForProgram(programId: string) {
    return (seriesByProgram.get(programId) || []).length
  }

  if (requestMsg) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 sm:p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
          ✓
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-emerald-950">Request received</h3>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-emerald-900/80">
            Everything is set. Staff will review your group class request and email you once it has been accepted or declined.
          </p>
        </div>
        <p className="mx-auto max-w-lg text-xs leading-relaxed text-emerald-900/70">
          You do not need to submit anything else right now.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full border-emerald-200 bg-white/70 text-emerald-900 hover:bg-white"
          onClick={() => {
            setRequestMsg(null)
            setSelectedProgramId(null)
          }}
        >
          Back to group classes
        </Button>
      </div>
    )
  }

  return (
    <>
      {statusData.options.groupClasses ? (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-medium">Request a group class</h3>
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
              {requestMsg ? <p className="text-sm text-emerald-700">{requestMsg}</p> : null}

              {groupLoading || groupSeriesLoading ? (
                <p className="text-sm text-muted-foreground">Loading classes…</p>
              ) : groupPrograms.length === 0 ? (
                <p className="text-sm text-muted-foreground">No approved group programs are available right now.</p>
              ) : selectedProgramId === null ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Choose a class type to see upcoming full-series cohorts.
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
                              {count === 0 ? "No upcoming series" : `${count} upcoming series`}
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

                  {selectedProgramSeries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No upcoming series for this program right now. Check back later.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Group classes are requested as full series only. Submit your request and staff will email you once it has been accepted or declined.
                      </p>
                      {groupContractAlreadyAccepted ? (
                        <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                          Group class agreement already accepted for this version.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          <details className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
                            <summary className="cursor-pointer font-medium">
                              {CONTRACT_LABEL.group_classes} ({CONTRACT_VERSION})
                            </summary>
                            <p className="mt-2 text-muted-foreground leading-relaxed">{contractBody("group_classes")}</p>
                          </details>
                          <label className="flex items-start gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={groupContractAccepted}
                              onChange={(e) => setGroupContractAccepted(e.target.checked)}
                              className="mt-1"
                            />
                            <span>I have read and agree to the group class agreement ({CONTRACT_VERSION}).</span>
                          </label>
                        </div>
                      )}
                      {selectedProgramSeries.map((series) => {
                        const isFull = series.spotsRemaining <= 0
                        const isRequesting = requestSeriesId === series.seriesId
                        const firstSession = series.sessions[0]
                        const lastSession = series.sessions[series.sessions.length - 1]
                        return (
                          <div key={series.seriesId} className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="font-medium text-foreground">
                                  {firstSession && lastSession && firstSession.id !== lastSession.id
                                    ? `${formatDateTime(firstSession.startsAtIso, intlLocale)} - ${formatDateTime(lastSession.startsAtIso, intlLocale)}`
                                    : firstSession
                                      ? formatDateTime(firstSession.startsAtIso, intlLocale)
                                      : series.programLabel}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {series.sessionCount} session{series.sessionCount !== 1 ? "s" : ""} included
                                </p>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {series.spotsRemaining} spot{series.spotsRemaining !== 1 ? "s" : ""} remaining
                              </p>
                            </div>

                            <div className="space-y-2 rounded-lg border border-border bg-background/70 p-3">
                              {series.sessions.map((session) => (
                                <div key={session.id} className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                                  <span>{formatDateTime(session.startsAtIso, intlLocale)}</span>
                                  <span className="text-muted-foreground">
                                    {session.locationLabel ? `${session.locationLabel} · ` : ""}
                                    {session.spotsRemaining} spot{session.spotsRemaining !== 1 ? "s" : ""} left
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="flex justify-end">
                              <Button
                                type="button"
                                size="sm"
                                className="rounded-full"
                                disabled={requestLoading || isFull || (!groupContractAlreadyAccepted && !groupContractAccepted)}
                                onClick={() => void handleSeriesRequest(series.seriesId)}
                              >
                                {isRequesting ? "Sending request..." : isFull ? "Full" : "Request full series"}
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

      {pendingGroupRequests.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 space-y-4">
          <h3 className="text-lg font-medium text-amber-950">Pending requests</h3>
          <p className="text-sm text-amber-900/80">
            These requests were sent successfully. Staff is reviewing them and will notify you by email.
          </p>
          <div className="space-y-2">
            {pendingGroupRequests.map((request) => (
              <div key={request.id} className="rounded-lg border border-amber-200 bg-white/70 p-3">
                <p className="font-medium text-amber-950">{request.label}</p>
                <p className="text-sm text-amber-900/70">{formatDateTime(request.startAt, intlLocale)}</p>
                <p className="mt-1 text-xs text-amber-900/70">Status: waiting for staff review</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-medium">Upcoming group sessions</h3>
        {visibleGroupBookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming group sessions on file.</p>
        ) : (
          <div className="space-y-2">
            {visibleGroupBookings.map((booking) => (
                <div key={booking.id} className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{booking.label}</p>
                    <p className="text-sm text-muted-foreground">{formatDateTime(booking.startAt, intlLocale)}</p>
                    <p className="text-xs text-muted-foreground">
                      Status: {booking.bookingStatus || "-"}
                      {booking.squareBookingStatus ? ` (${booking.squareBookingStatus})` : ""}
                    </p>
                  </div>
                  {booking.bookingStatus === "requested" ? (
                    <p className="text-sm text-muted-foreground">
                      Staff is reviewing this request and will notify you by email.
                    </p>
                  ) : null}
                </div>
              ))}
          </div>
        )}
      </div>
    </>
  )
}
