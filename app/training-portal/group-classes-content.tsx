"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CalendarCheck } from "lucide-react"
import { BookingLink } from "@/components/booking-form-provider"
import { useAppLocale } from "@/components/locale-provider"
import { Button } from "@/components/ui/button"
import { PuppySocialDropInIntakeDialog } from "@/app/group-classes/puppy-social-drop-in-intake-dialog"
import { CONTRACT_VERSION } from "@/lib/contract-terms"
import { ContractAcceptanceAccordion } from "@/components/contract-acceptance-accordion"
import { trackFBLead } from "@/lib/facebook-pixel"
import { getIntlLocale } from "@/lib/i18n/config"
import { useLocalizedText } from "@/lib/i18n/use-localized-text"
import { PUPPY_SOCIALIZATION_CLASS_TYPE_ID } from "@/lib/puppy-social-drop-in"
import type { ApprovedGroupProgram, GroupSeriesListItem, StatusResponse } from "./training-portal-types"

function formatDateTime(iso: string, intlLocale: string) {
  return new Date(iso).toLocaleString(intlLocale, {
    timeZone: "America/Toronto",
    dateStyle: "medium",
    timeStyle: "short",
  })
}

const PUPPY_SOCIALIZATION_PROGRAM: ApprovedGroupProgram = {
  programId: PUPPY_SOCIALIZATION_CLASS_TYPE_ID,
  programLabel: "Puppy Socialization Class",
  squareUrl: null,
}

export function GroupClassesContent({
  statusData,
  clientEmail,
  dogName,
  redirectPath,
  dropInPuppySocialization = null,
  preferredCoachId = null,
  preferredCoachLabel = null,
  highlightSeriesId = null,
}: {
  statusData: StatusResponse
  clientEmail: string
  dogName: string
  redirectPath: string
  /** Puppy socialization drop-in — no assessment required. */
  dropInPuppySocialization?: { depositCents: number; currency: string } | null
  preferredCoachId?: string | null
  preferredCoachLabel?: string | null
  /** When set (e.g. from `?series=` on group-classes), opens that program and scrolls to the class. */
  highlightSeriesId?: string | null
}) {
  const locale = useAppLocale()
  const t = useLocalizedText()
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
  const [puppyDropInSeries, setPuppyDropInSeries] = useState<GroupSeriesListItem[]>([])
  const [puppyDropInLoading, setPuppyDropInLoading] = useState(false)
  const [puppyDropInErr, setPuppyDropInErr] = useState<string | null>(null)
  const [puppyIntakeOpen, setPuppyIntakeOpen] = useState(false)
  const [puppyIntakeSeriesId, setPuppyIntakeSeriesId] = useState<string | null>(null)
  const highlightAppliedRef = useRef<string | null>(null)

  const groupClassesEligible = Boolean(statusData.options.groupClasses?.eligible)
  const puppyDropInAvailable = Boolean(dropInPuppySocialization)
  const canPickClasses = groupClassesEligible || puppyDropInAvailable

  useEffect(() => {
    if (!groupClassesEligible) {
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
          setGroupErr(data.error || t("Could not load approved group classes."))
          setGroupPrograms([])
          return
        }
        setGroupPrograms(data.programs || [])
      } catch {
        if (!cancelled) {
          setGroupErr(t("Could not load approved group classes."))
          setGroupPrograms([])
        }
      } finally {
        if (!cancelled) setGroupLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [statusData, clientEmail, dogName, groupClassesEligible])

  useEffect(() => {
    if (!puppyDropInAvailable) {
      setPuppyDropInSeries([])
      setPuppyDropInErr(null)
      return
    }
    const email = clientEmail.trim().toLowerCase()
    const dog = (statusData.lookup.dogName || dogName).trim()
    if (!email) return
    let cancelled = false
    setPuppyDropInLoading(true)
    setPuppyDropInErr(null)
    void (async () => {
      try {
        const response = await fetch("/api/training-portal/group-series/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientEmail: email,
            dogName: dog,
            dropInPuppySocialization: true,
          }),
        })
        const data = (await response.json()) as { series?: GroupSeriesListItem[]; error?: string }
        if (cancelled) return
        if (!response.ok) {
          setPuppyDropInErr(data.error || t("Could not load puppy socialization dates."))
          setPuppyDropInSeries([])
          return
        }
        setPuppyDropInSeries(data.series || [])
      } catch {
        if (!cancelled) {
          setPuppyDropInErr(t("Could not load puppy socialization dates."))
          setPuppyDropInSeries([])
        }
      } finally {
        if (!cancelled) setPuppyDropInLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [puppyDropInAvailable, statusData, clientEmail, dogName, t])

  useEffect(() => {
    if (!groupClassesEligible) {
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
  }, [statusData, clientEmail, groupClassesEligible])

  useEffect(() => {
    if (!groupClassesEligible) {
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
          setGroupSeriesErr(data.error || t("Could not load scheduled group classes."))
          setGroupSeries([])
          return
        }
        setGroupSeries(data.series || [])
      } catch {
        if (!cancelled) {
          setGroupSeriesErr(t("Could not load scheduled group classes."))
          setGroupSeries([])
        }
      } finally {
        if (!cancelled) setGroupSeriesLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [statusData, clientEmail, dogName, groupClassesEligible])

  const seriesForDisplay = useMemo(() => {
    const id = preferredCoachId?.trim()
    if (!id) return groupSeries
    const labelNorm = preferredCoachLabel?.trim().toLowerCase() || ""
    return groupSeries.filter((s) => {
      if (s.coachId === id) return true
      if (labelNorm && s.coachLabel?.trim().toLowerCase() === labelNorm) return true
      return false
    })
  }, [groupSeries, preferredCoachId, preferredCoachLabel])

  useEffect(() => {
    highlightAppliedRef.current = null
  }, [highlightSeriesId])

  useEffect(() => {
    const raw = highlightSeriesId?.trim()
    if (!raw || !canPickClasses) return
    if (groupSeriesLoading || groupLoading || puppyDropInLoading) return
    if (highlightAppliedRef.current === raw) return

    const match =
      seriesForDisplay.find((s) => s.seriesId === raw) ||
      puppyDropInSeries.find((s) => s.seriesId === raw)
    if (!match) return

    setSelectedProgramId(match.classType)

    const scrollToSeries = () => {
      const el = document.getElementById(`group-series-${raw}`)
      if (!el) return
      highlightAppliedRef.current = raw
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    const timeout = window.setTimeout(scrollToSeries, 250)
    return () => window.clearTimeout(timeout)
  }, [
    highlightSeriesId,
    seriesForDisplay,
    puppyDropInSeries,
    groupSeriesLoading,
    groupLoading,
    puppyDropInLoading,
    canPickClasses,
  ])

  const programsForPicker = useMemo(() => {
    const byId = new Map<string, ApprovedGroupProgram>()
    if (puppyDropInAvailable) {
      byId.set(PUPPY_SOCIALIZATION_CLASS_TYPE_ID, PUPPY_SOCIALIZATION_PROGRAM)
    }
    for (const program of groupPrograms) {
      byId.set(program.programId, program)
    }
    return [...byId.values()]
  }, [groupPrograms, puppyDropInAvailable])

  const seriesByProgram = useMemo(() => {
    const map = new Map<string, GroupSeriesListItem[]>()
    for (const series of seriesForDisplay) {
      const list = map.get(series.classType) || []
      list.push(series)
      map.set(series.classType, list)
    }
    if (puppyDropInAvailable) {
      const sorted = [...puppyDropInSeries].sort((a, b) =>
        a.sessions[0].startsAtIso.localeCompare(b.sessions[0].startsAtIso),
      )
      map.set(PUPPY_SOCIALIZATION_CLASS_TYPE_ID, sorted)
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.sessions[0].startsAtIso.localeCompare(b.sessions[0].startsAtIso))
    }
    return map
  }, [seriesForDisplay, puppyDropInSeries, puppyDropInAvailable])

  const programLabelByProgramId = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of programsForPicker) map.set(p.programId, p.programLabel)
    for (const [programId, seriesList] of seriesByProgram) {
      if (!map.has(programId) && seriesList[0]) map.set(programId, seriesList[0].programLabel)
    }
    return map
  }, [programsForPicker, seriesByProgram])

  const isPuppyDropInProgram =
    selectedProgramId === PUPPY_SOCIALIZATION_CLASS_TYPE_ID && puppyDropInAvailable

  function openPuppyDropInIntake(seriesId: string) {
    setPuppyIntakeSeriesId(seriesId)
    setPuppyIntakeOpen(true)
  }

  useEffect(() => {
    if (selectedProgramId && !programLabelByProgramId.has(selectedProgramId)) {
      setSelectedProgramId(null)
    }
  }, [programLabelByProgramId, selectedProgramId])

  async function handleSeriesRequest(seriesId: string) {
    setGroupSeriesErr(null)
    setRequestMsg(null)
    if (!groupContractAlreadyAccepted && !groupContractAccepted) {
      setGroupSeriesErr(t("Please read and accept the group class agreement before requesting a spot."))
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
            locale,
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
        throw new Error(data.error || t("Could not request this group class."))
      }
      const bookingId = data.bookingId
      trackFBLead({
        content_name: requestedSeries?.programLabel || "Group Class Request",
        content_category: "Group Class Lead",
      })
      setRequestMsg(
        t("Request sent. Staff will review it and email you once it has been accepted or declined."),
      )
      if (requestedSeries?.sessions[0]) {
        setLocalPendingRequests((prev) => [
          ...prev,
          {
            id: bookingId,
            startAt: requestedSeries.sessions[0].startsAtIso,
            label: t("{label} request").replace("{label}", requestedSeries.programLabel),
          },
        ])
      }
      setGroupSeries((prev) => prev.filter((series) => series.seriesId !== seriesId))
    } catch (err) {
      setGroupSeriesErr(err instanceof Error ? err.message : t("Could not request this group class."))
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

  function upcomingSeriesSummary(count: number) {
    if (count === 0) return t("No upcoming series")
    if (count === 1) return t("1 upcoming series")
    return t("{n} upcoming series").replace("{n}", String(count))
  }

  function sessionsIncludedPhrase(count: number) {
    if (count === 1) return t("1 session included")
    return t("{n} sessions included").replace("{n}", String(count))
  }

  function spotsRemainingPhrase(count: number) {
    if (count === 1) return t("1 spot remaining")
    return t("{n} spots remaining").replace("{n}", String(count))
  }

  function spotsLeftPhrase(count: number) {
    return t("{n} spots left").replace("{n}", String(count))
  }

  if (requestMsg) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 sm:p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
          ✓
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-emerald-950">{t("Request received")}</h3>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-emerald-900/80">
            {t(
              "Everything is set. Staff will review your group class request and email you once it has been accepted or declined.",
            )}
          </p>
        </div>
        <p className="mx-auto max-w-lg text-xs leading-relaxed text-emerald-900/70">
          {t("You do not need to submit anything else right now.")}
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
          {t("Back to group classes")}
        </Button>
      </div>
    )
  }

  return (
    <div id="portal-group-classes" className="grid gap-4">
      {statusData.options.groupClasses ? (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-medium">{t("Request a group class")}</h3>
          {preferredCoachId ? (
            <p className="text-sm rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-foreground/90">
              {preferredCoachLabel
                ? t(
                    "Showing series led by {coach} (from schedule coach assignments). Series without a coach on file are hidden.",
                  ).replace("{coach}", preferredCoachLabel)
                : t(
                    "Filtering series for the trainer you chose. Series without a coach id on class sessions may not appear.",
                  )}
            </p>
          ) : null}
          {!canPickClasses ? (
            <p className="text-sm text-muted-foreground">
              {statusData.options.groupClasses.blockedReason === "no_group_program_access"
                ? t(
                    "No group program is enabled for this dog yet. Ask staff after your assessment to turn on the programs you need.",
                  )
                : t("Complete your assessment to enroll in group classes online.")}
            </p>
          ) : (
            <>
              {groupErr ? <p className="text-sm text-destructive">{groupErr}</p> : null}
              {groupSeriesErr ? <p className="text-sm text-destructive">{groupSeriesErr}</p> : null}
              {puppyDropInErr ? <p className="text-sm text-destructive">{puppyDropInErr}</p> : null}
              {requestMsg ? <p className="text-sm text-emerald-700">{requestMsg}</p> : null}

              {groupLoading || groupSeriesLoading || puppyDropInLoading ? (
                <p className="text-sm text-muted-foreground">{t("Loading classes…")}</p>
              ) : programsForPicker.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("No approved group programs are available right now.")}
                </p>
              ) : selectedProgramId === null ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t("Choose a class type to see upcoming full-series classes.")}
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {programsForPicker.map((program) => {
                      const count = countUpcomingForProgram(program.programId)
                      return (
                        <button
                          type="button"
                          key={program.programId}
                          onClick={() => setSelectedProgramId(program.programId)}
                          className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background/60 p-4 text-left transition-colors hover:bg-background/80"
                        >
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{t(program.programLabel)}</p>
                            <p className="text-sm text-muted-foreground">{upcomingSeriesSummary(count)}</p>
                          </div>
                          <span aria-hidden className="text-muted-foreground">
                            →
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {!groupClassesEligible && puppyDropInAvailable ? (
                    <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-4 text-sm text-muted-foreground leading-relaxed">
                      <p className="font-medium text-foreground mb-1">{t("Other group programs")}</p>
                      <p>
                        {t(
                          "This path is only for puppy socialization drop-ins. For teen puppy, reactivity, or obedience series, book an assessment first so your trainer can approve the right program.",
                        )}
                      </p>
                      <BookingLink className="inline-flex mt-3 underline underline-offset-4 text-primary font-medium hover:text-primary/80">
                        {t("Book an assessment")}
                      </BookingLink>
                    </div>
                  ) : null}
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
                      ← {t("All programs")}
                    </Button>
                    <p className="font-medium text-right">
                      {selectedProgramLabel ? t(selectedProgramLabel) : selectedProgramId}
                    </p>
                  </div>

                  {selectedProgramSeries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t("No upcoming series for this program right now. Check back later.")}
                    </p>
                  ) : isPuppyDropInProgram ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {t(
                          "Reserve a spot in an upcoming puppy socialization class. Answer a few questions, then pay a deposit to hold your place.",
                        )}
                      </p>
                      <ul className="space-y-3">
                        {selectedProgramSeries.map((series) => {
                          const first = series.sessions[0]
                          const full = series.spotsRemaining <= 0
                          return (
                            <li
                              id={`group-series-${series.seriesId}`}
                              key={series.seriesId}
                              className="scroll-mt-28 md:scroll-mt-36 flex flex-col gap-3 rounded-xl border border-border bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="flex items-start gap-3">
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary mt-0.5">
                                  <CalendarCheck className="w-4 h-4" />
                                </span>
                                <div>
                                  <p className="font-medium text-foreground">
                                    {t(series.programLabel || "Puppy socialization")}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-0.5">
                                    {t("Starts")}{" "}
                                    {first ? formatDateTime(first.startsAtIso, intlLocale) : "—"} · {series.sessionCount}{" "}
                                    {series.sessionCount === 1 ? t("session") : t("sessions")}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {full
                                      ? t("Full — join waitlist by contacting us")
                                      : t("{n} spots left").replace("{n}", String(series.spotsRemaining))}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                className="rounded-full shrink-0"
                                disabled={full}
                                onClick={() => openPuppyDropInIntake(series.seriesId)}
                              >
                                {t("Reserve with deposit")}
                              </Button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {t(
                          "Group classes are requested as full series only. Submit your request and staff will email you once it has been accepted or declined.",
                        )}
                      </p>
                      <ContractAcceptanceAccordion
                        contractKind="group_classes"
                        locale={locale}
                        accepted={groupContractAccepted}
                        onAcceptedChange={setGroupContractAccepted}
                        alreadyAccepted={groupContractAlreadyAccepted}
                      />
                      {selectedProgramSeries.map((series) => {
                        const isFull = series.spotsRemaining <= 0
                        const isRequesting = requestSeriesId === series.seriesId
                        const firstSession = series.sessions[0]
                        const lastSession = series.sessions[series.sessions.length - 1]
                        return (
                          <div
                            id={`group-series-${series.seriesId}`}
                            key={series.seriesId}
                            className="scroll-mt-28 md:scroll-mt-36 rounded-xl border border-border bg-muted/10 p-4 space-y-3"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="font-medium text-foreground">
                                  {firstSession && lastSession && firstSession.id !== lastSession.id
                                    ? `${formatDateTime(firstSession.startsAtIso, intlLocale)} - ${formatDateTime(lastSession.startsAtIso, intlLocale)}`
                                    : firstSession
                                      ? formatDateTime(firstSession.startsAtIso, intlLocale)
                                      : series.programLabel
                                          ? t(series.programLabel)
                                          : ""}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {sessionsIncludedPhrase(series.sessionCount)}
                                </p>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {spotsRemainingPhrase(series.spotsRemaining)}
                              </p>
                            </div>

                            <div className="space-y-2 rounded-lg border border-border bg-background/70 p-3">
                              {series.sessions.map((session) => (
                                <div key={session.id} className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                                  <span>{formatDateTime(session.startsAtIso, intlLocale)}</span>
                                  <span className="text-muted-foreground">
                                    {session.locationLabel ? `${session.locationLabel} · ` : ""}
                                    {spotsLeftPhrase(session.spotsRemaining)}
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
                                {isRequesting
                                  ? t("Sending request...")
                                  : isFull
                                    ? t("Full")
                                    : t("Request full series")}
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
          <h3 className="text-lg font-medium text-amber-950">{t("Pending requests")}</h3>
          <p className="text-sm text-amber-900/80">
            {t(
              "These requests were sent successfully. Staff is reviewing them and will notify you by email.",
            )}
          </p>
          <div className="space-y-2">
            {pendingGroupRequests.map((request) => (
              <div key={request.id} className="rounded-lg border border-amber-200 bg-white/70 p-3">
                <p className="font-medium text-amber-950">{t(request.label)}</p>
                <p className="text-sm text-amber-900/70">{formatDateTime(request.startAt, intlLocale)}</p>
                <p className="mt-1 text-xs text-amber-900/70">{t("Status: waiting for staff review")}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-medium">{t("Upcoming group sessions")}</h3>
        {visibleGroupBookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("No upcoming group sessions on file.")}</p>
        ) : (
          <div className="space-y-2">
            {visibleGroupBookings.map((booking) => (
                <div key={booking.id} className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{t(booking.label)}</p>
                    <p className="text-sm text-muted-foreground">{formatDateTime(booking.startAt, intlLocale)}</p>
                    <p className="text-xs text-muted-foreground">
                      Status: {booking.bookingStatus || "-"}
                      {booking.squareBookingStatus ? ` (${booking.squareBookingStatus})` : ""}
                    </p>
                  </div>
                  {booking.bookingStatus === "requested" ? (
                    <p className="text-sm text-muted-foreground">
                      {t("Staff is reviewing this request and will notify you by email.")}
                    </p>
                  ) : null}
                </div>
              ))}
          </div>
        )}
      </div>

      {dropInPuppySocialization ? (
        <PuppySocialDropInIntakeDialog
          open={puppyIntakeOpen}
          onOpenChange={setPuppyIntakeOpen}
          clientEmail={clientEmail}
          dogNameHint={dogName}
          seriesId={puppyIntakeSeriesId}
          depositCents={dropInPuppySocialization.depositCents}
          currency={dropInPuppySocialization.currency}
          redirectPath={redirectPath}
        />
      ) : null}
    </div>
  )
}
