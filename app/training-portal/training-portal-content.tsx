"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useBookingForm } from "@/components/booking-form-provider"
import { X, Search, CheckCircle2, AlertCircle, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CONTRACT_LABEL, CONTRACT_VERSION, contractBody } from "@/lib/contract-terms"
import {
  PLAN_TYPE_LABEL,
  SERVICE_TYPE_LABEL,
  type ApprovedGroupProgram,
  type GroupSeriesListItem,
  type PrivatePackage,
  type StatusResponse,
} from "./training-portal-types"

type PortalBooking = {
  id: string
  startAt: string
  label: string
  type: "one_on_one" | "group"
  bookingStatus: string
  squareBookingStatus: string | null
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-CA", {
    timeZone: "America/Toronto",
    dateStyle: "medium",
    timeStyle: "short",
  })
}

/** `private_only`: service-page sign-up modal — private packages & sessions only (no group enrollment UI). */
export type TrainingPortalMode = "full" | "private_only"

export function TrainingPortalContent({
  onClose,
  mode = "full",
}: {
  onClose?: () => void
  mode?: TrainingPortalMode
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { openBookingForm, openFreeCallModal } = useBookingForm()
  const privateOnly = mode === "private_only"
  const groupOnly = mode === "full"
  const [clientEmail, setClientEmail] = useState("")
  const [dogName, setDogName] = useState("")
  const [statusData, setStatusData] = useState<StatusResponse | null>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(false)
  const [isSelectingPackage, setIsSelectingPackage] = useState(false)
  const [selectedServiceType, setSelectedServiceType] = useState<PrivatePackage["serviceType"]>("in_facility")
  const [selectedPlanType, setSelectedPlanType] = useState<PrivatePackage["planType"]>("pack_3")
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [privateContractAccepted, setPrivateContractAccepted] = useState(false)
  const [groupPrograms, setGroupPrograms] = useState<ApprovedGroupProgram[]>([])
  const [groupLoading, setGroupLoading] = useState(false)
  const [groupErr, setGroupErr] = useState<string | null>(null)
  const [groupSeries, setGroupSeries] = useState<GroupSeriesListItem[]>([])
  const [groupSeriesLoading, setGroupSeriesLoading] = useState(false)
  const [groupSeriesErr, setGroupSeriesErr] = useState<string | null>(null)
  const [groupSeriesCheckoutId, setGroupSeriesCheckoutId] = useState<string | null>(null)
  const [selectedGroupSessionBySeries, setSelectedGroupSessionBySeries] = useState<Record<string, string>>({})

  const activePackage = statusData?.activePrivatePackage || null

  const selectionMatchesActive = useMemo(() => {
    if (!activePackage) return false
    return (
      selectedServiceType === activePackage.serviceType && selectedPlanType === activePackage.planType
    )
  }, [activePackage, selectedServiceType, selectedPlanType])

  const goToBookingPage = () => {
    const params = new URLSearchParams()
    params.set("email", clientEmail.trim().toLowerCase())
    params.set("dog", (statusData?.lookup?.dogName || dogName).trim() || "Guest")
    onClose?.()
    router.push(`/training-portal/book?${params.toString()}`)
  }

  const oneOnOneUpcoming = useMemo(
    () => statusData?.existingBookings.find((item) => item.type === "one_on_one") || null,
    [statusData],
  )

  useEffect(() => {
    const emailFromUrl = searchParams.get("email") || ""
    const dogFromUrl = searchParams.get("dog") || ""
    if (emailFromUrl && !clientEmail) setClientEmail(emailFromUrl)
    if (dogFromUrl && !dogName) setDogName(dogFromUrl)
  }, [searchParams, clientEmail, dogName])

  useEffect(() => {
    if (searchParams.get("group") !== "success") return
    const email = (searchParams.get("email") || "").trim().toLowerCase()
    const dog = (searchParams.get("dog") || "").trim()
    setSuccessMessage(
      "Thanks! After Square confirms payment, your group class series will appear under upcoming sessions.",
    )
    if (email) setClientEmail(email)
    if (dog) setDogName(dog)
    router.replace("/training-portal", { scroll: false })
    if (!email) return
    void (async () => {
      setIsLoadingStatus(true)
      setError(null)
      try {
        const response = await fetch("/api/training-portal/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientEmail: email, dogName: dog || "Guest" }),
        })
        const data = (await response.json()) as StatusResponse & { error?: string }
        if (!response.ok) throw new Error(data.error || "Could not load profile.")
        setPrivateContractAccepted(false)
        setStatusData(data)
        if (data.activePrivatePackage) {
          setSelectedServiceType(data.activePrivatePackage.serviceType)
          setSelectedPlanType(data.activePrivatePackage.planType)
        }
        if (data.inHomeBookingAllowed !== true) {
          setSelectedServiceType((prev) => (prev === "in_home" ? "in_facility" : prev))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load profile.")
      } finally {
        setIsLoadingStatus(false)
      }
    })()
  }, [searchParams, router])

  useEffect(() => {
    if (privateOnly) {
      setGroupPrograms([])
      setGroupErr(null)
      setGroupSeries([])
      setGroupSeriesErr(null)
      return
    }
    if (!statusData?.options.groupClasses?.eligible) {
      setGroupPrograms([])
      setGroupErr(null)
      setGroupSeries([])
      setGroupSeriesErr(null)
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
  }, [privateOnly, statusData?.options.groupClasses?.eligible, statusData?.lookup.dogName, clientEmail, dogName])

  useEffect(() => {
    if (privateOnly) {
      setGroupSeries([])
      setGroupSeriesErr(null)
      setSelectedGroupSessionBySeries({})
      return
    }
    if (!statusData?.options.groupClasses?.eligible) {
      setGroupSeries([])
      setGroupSeriesErr(null)
      setSelectedGroupSessionBySeries({})
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
  }, [privateOnly, statusData?.options.groupClasses?.eligible, statusData?.lookup.dogName, clientEmail, dogName])

  useEffect(() => {
    setSelectedGroupSessionBySeries((prev) => {
      const next: Record<string, string> = {}
      for (const series of groupSeries) {
        const existing = prev[series.seriesId]
        if (existing && series.sessions.some((session) => session.id === existing)) {
          next[series.seriesId] = existing
        } else if (series.sessions.length > 0) {
          next[series.seriesId] = series.sessions[0].id
        }
      }
      return next
    })
  }, [groupSeries])

  async function fetchStatus() {
    setError(null)
    setSuccessMessage(null)
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
      if (!response.ok) throw new Error(data.error || "Could not load training portal status.")
      setPrivateContractAccepted(false)
      setStatusData(data)
      if (data.activePrivatePackage) {
        setSelectedServiceType(data.activePrivatePackage.serviceType)
        setSelectedPlanType(data.activePrivatePackage.planType)
      }
      if (data.inHomeBookingAllowed !== true) {
        setSelectedServiceType((prev) => (prev === "in_home" ? "in_facility" : prev))
      }
    } catch (err) {
      setStatusData(null)
      setError(err instanceof Error ? err.message : "Could not load training portal status.")
    } finally {
      setIsLoadingStatus(false)
    }
  }

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await fetchStatus()
  }

  async function savePrivatePackage() {
    if (!statusData) return
    if (!privateContractAccepted) {
      setError("Please read and accept the private training agreement before saving a package.")
      return
    }
    setError(null)
    setSuccessMessage(null)
    setIsSelectingPackage(true)
    try {
      const effectiveDogName = (statusData?.lookup?.dogName || dogName).trim() || "Guest"
      const response = await fetch("/api/training-portal/private-package/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEmail: clientEmail.trim(),
          dogName: effectiveDogName,
          serviceType: selectedServiceType,
          planType: selectedPlanType,
        }),
      })
      const text = await response.text()
      let data: { ok?: boolean; error?: string }
      try {
        data = text ? (JSON.parse(text) as { ok?: boolean; error?: string }) : {}
      } catch {
        throw new Error(response.ok ? "Invalid response from server." : `Server error: ${response.status}`)
      }
      if (!response.ok) throw new Error(data.error || "Could not save private package.")
      try {
        await fetch("/api/contract-acceptance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientEmail: clientEmail.trim().toLowerCase(),
            contractKind: "private_classes",
            version: CONTRACT_VERSION,
            source: "/training-portal",
            dogName: effectiveDogName,
          }),
        })
      } catch {
        /* non-blocking */
      }
      await fetchStatus()
      goToBookingPage()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save private package.")
    } finally {
      setIsSelectingPackage(false)
    }
  }

  function handlePrivatePackageContinue() {
    if (!statusData) return
    if (selectionMatchesActive) {
      goToBookingPage()
      return
    }
    void savePrivatePackage()
  }

  async function handleGroupSeriesCheckout(seriesId: string, sessionId?: string) {
    if (!statusData) return
    setGroupSeriesErr(null)
    setGroupSeriesCheckoutId(seriesId)
    try {
      const response = await fetch("/api/training-portal/group-series/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEmail: clientEmail.trim().toLowerCase(),
          dogName: (statusData.lookup.dogName || dogName).trim(),
          seriesId,
          sessionId,
        }),
      })
      const data = (await response.json()) as { checkoutUrl?: string; error?: string }
      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Could not start group class checkout.")
      }
      window.location.assign(data.checkoutUrl)
    } catch (err) {
      setGroupSeriesErr(err instanceof Error ? err.message : "Could not start group class checkout.")
    } finally {
      setGroupSeriesCheckoutId(null)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8 overflow-y-auto">
        {(
          <>
            <section className="space-y-2 shrink-0">
              <div className="flex items-center justify-between gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {privateOnly ? "Private Training" : "Group Classes"}
            </h1>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Close portal"
              >
                <X className="w-5 h-5" />
              </button>
            ) : null}
          </div>
              <p className="text-muted-foreground text-lg">
                {privateOnly
                  ? "Verify your profile to choose a private training package and book one-on-one sessions."
                  : "Verify your profile to see the group classes your dog has been approved for."}
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div className="space-y-1">
            <h2 className="font-semibold text-foreground">Find your profile</h2>
            <p className="text-sm text-muted-foreground">Enter the email (and dog name if known) used for your assessment.</p>
          </div>
          
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleLookup}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email address</label>
              <input
                type="email"
                required
                value={clientEmail}
                onChange={(event) => setClientEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Dog&apos;s name <span className="text-muted-foreground font-normal">(optional)</span></label>
              <input
                type="text"
                value={dogName}
                onChange={(event) => setDogName(event.target.value)}
                placeholder="e.g. Max"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="sm:col-span-2 pt-2">
              <Button type="submit" disabled={isLoadingStatus} className="w-full sm:w-auto rounded-full px-8">
                {isLoadingStatus ? "Searching..." : "Find Profile"}
                {!isLoadingStatus && <Search className="ml-2 w-4 h-4" />}
              </Button>
            </div>
          </form>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              {successMessage ? <p className="text-sm text-green-700">{successMessage}</p> : null}
            </section>
          </>
        )}

        {statusData ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!statusData.assessmentCompleted ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 sm:p-8 text-center space-y-6">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h2 className="text-xl font-semibold text-amber-900">Assessment Required</h2>
                  <p className="text-amber-800/80 leading-relaxed">
                    {statusData.lookup.dogName ? (
                      <>It looks like <strong>{statusData.lookup.dogName}</strong> hasn&apos;t completed an assessment yet.</>
                    ) : (
                      <>We couldn&apos;t find a completed assessment for this email.</>
                    )}
                    {" "}We require an initial evaluation to build a personalized training plan for you.
                  </p>
                  <p className="text-sm text-amber-800/90 mt-4 pt-4 border-t border-amber-200/60">
                    If you believe this is a mistake, please contact us:
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-amber-900 font-medium">
                    <button
                      type="button"
                      className="hover:underline"
                      onClick={() => {
                        onClose?.()
                        openFreeCallModal()
                      }}
                    >
                      514 826 9558
                    </button>
                    <span className="hidden sm:inline text-amber-700">·</span>
                    <a href="mailto:mtlcaninetraining@gmail.com" className="hover:underline break-all">mtlcaninetraining@gmail.com</a>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto rounded-full bg-amber-600 hover:bg-amber-700 text-white border-none"
                    onClick={() => {
                      onClose?.()
                      openBookingForm()
                    }}
                  >
                    Book Assessment
                  </Button>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 sm:flex-none w-full rounded-full border-amber-200 text-amber-900 hover:bg-amber-100 hover:text-amber-950"
                      onClick={() => {
                        onClose?.()
                        openFreeCallModal()
                      }}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                    <a href="mailto:mtlcaninetraining@gmail.com" className="flex-1 sm:flex-none">
                      <Button variant="outline" className="w-full rounded-full border-amber-200 text-amber-900 hover:bg-amber-100 hover:text-amber-950">
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-green-200 bg-green-50/50 p-4 flex items-start gap-4">
                <div className="p-2 bg-green-100 rounded-full text-green-700 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-green-900">Assessment Verified</h3>
                  <p className="text-sm text-green-800/80 mt-0.5">
                    {groupOnly
                      ? "Welcome back! You can now view approved group class options for this dog."
                      : "Welcome back! You are eligible to book private training sessions."}
                  </p>
                </div>
              </div>
            )}

            {statusData.assessmentCompleted && (
              <section className="grid gap-4">
                <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                  <h3 className="text-lg font-medium">Client summary</h3>
                  {statusData.clientSummary ? (
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      <p><span className="font-medium">Client:</span> {statusData.clientSummary.clientName || "-"}</p>
                      <p><span className="font-medium">Email:</span> {statusData.clientSummary.clientEmail || "-"}</p>
                      <p><span className="font-medium">Phone:</span> {statusData.clientSummary.clientPhone || "-"}</p>
                      <p><span className="font-medium">Dog:</span> {statusData.clientSummary.dogName || "-"}</p>
                      <p><span className="font-medium">Breed:</span> {statusData.clientSummary.dogBreed || "-"}</p>
                      <p><span className="font-medium">Age:</span> {statusData.clientSummary.dogAge || "-"}</p>
                      <p className="sm:col-span-2">
                        <span className="font-medium">Primary issue:</span> {statusData.clientSummary.issue || "-"}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No consultation profile details found.</p>
                  )}
                </div>

                {!privateOnly && statusData.options.groupClasses ? (
                  <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                    <h3 className="text-lg font-medium">Approved group classes</h3>
                    {!statusData.options.groupClasses.eligible ? (
                      <p className="text-sm text-muted-foreground">
                        {statusData.options.groupClasses.blockedReason === "no_group_program_access"
                          ? "No group program is enabled for this dog yet. Ask staff after your assessment to turn on the programs you need."
                          : "Complete your assessment to enroll in group classes online."}
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">
                          These are the group programs your dog is approved for. Use the scheduled classes section below to continue booking.
                        </p>
                        {groupErr ? <p className="text-sm text-destructive">{groupErr}</p> : null}
                        {groupLoading ? (
                          <p className="text-sm text-muted-foreground">Loading approved group classes…</p>
                        ) : groupPrograms.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No approved group classes are available right now.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {groupPrograms.map((row) => (
                              <div key={row.programId} className="rounded-xl border border-border p-4 bg-muted/10">
                                <p className="font-medium text-foreground">{row.programLabel}</p>
                                <p className="text-sm text-muted-foreground">Approved for this dog.</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : null}

                {!privateOnly && statusData.options.groupClasses ? (
                  <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                    <h3 className="text-lg font-medium">Available scheduled group classes</h3>
                    {!statusData.options.groupClasses.eligible ? (
                      <p className="text-sm text-muted-foreground">
                        Eligible scheduled classes will appear here after group access is enabled for this dog.
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Only upcoming group classes approved for this dog are shown here. Selecting one continues to Square checkout.
                        </p>
                        {groupSeriesErr ? <p className="text-sm text-destructive">{groupSeriesErr}</p> : null}
                        {groupSeriesLoading ? (
                          <p className="text-sm text-muted-foreground">Loading scheduled group classes…</p>
                        ) : groupSeries.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No upcoming scheduled classes are open for this dog right now.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {groupSeries.map((series) => (
                              <div key={series.seriesId} className="rounded-xl border border-border p-4 space-y-3 bg-muted/10">
                                {(() => {
                                  const selectedSessionId = selectedGroupSessionBySeries[series.seriesId] || series.sessions[0]?.id
                                  return (
                                    <>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="font-medium text-foreground">{series.programLabel}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {series.sessionCount} session{series.sessionCount !== 1 ? "s" : ""} included
                                    </p>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {series.spotsRemaining} spot{series.spotsRemaining !== 1 ? "s" : ""} remaining
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  {series.sessions.map((session) => (
                                    <button
                                      key={session.id}
                                      type="button"
                                      className="w-full rounded-lg border bg-background/80 p-3 text-left transition-colors"
                                      style={{
                                        borderColor: selectedSessionId === session.id ? "var(--foreground)" : "var(--border)",
                                        boxShadow: selectedSessionId === session.id ? "inset 0 0 0 1px var(--foreground)" : undefined,
                                      }}
                                      onClick={() =>
                                        setSelectedGroupSessionBySeries((prev) => ({
                                          ...prev,
                                          [series.seriesId]: session.id,
                                        }))
                                      }
                                    >
                                      <p className="font-medium">{session.title || series.programLabel}</p>
                                      <p className="text-sm text-muted-foreground">{formatDateTime(session.startsAtIso)}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {session.spotsRemaining} spot{session.spotsRemaining !== 1 ? "s" : ""} remaining
                                      </p>
                                      {session.locationLabel ? (
                                        <p className="text-xs text-muted-foreground">{session.locationLabel}</p>
                                      ) : null}
                                    </button>
                                  ))}
                                </div>
                                {series.sessions.length > 1 ? (
                                  <p className="text-xs text-muted-foreground">
                                    Choose a class date before continuing to Square.
                                  </p>
                                ) : null}
                                <Button
                                  type="button"
                                  size="sm"
                                  className="rounded-full"
                                  disabled={groupSeriesCheckoutId !== null || !selectedSessionId}
                                  onClick={() => void handleGroupSeriesCheckout(series.seriesId, selectedSessionId)}
                                >
                                  {groupSeriesCheckoutId === series.seriesId ? "Opening Square…" : "Continue in Square"}
                                </Button>
                                    </>
                                  )
                                })()}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : null}

                {!privateOnly ? (
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
                ) : null}

                {privateOnly ? (
                  <>
                    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                      <h3 className="text-lg font-medium">Existing private sessions</h3>
                      {statusData.privateUpcomingBookings.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No upcoming private sessions found.</p>
                      ) : (
                        <div className="space-y-2">
                          {statusData.privateUpcomingBookings.map((booking) => (
                            <div key={booking.id} className="rounded-lg border border-border p-3">
                              <p className="font-medium">{booking.label}</p>
                              <p className="text-sm text-muted-foreground">{formatDateTime(booking.startAt)}</p>
                              <p className="text-xs text-muted-foreground">
                                Status: {booking.bookingStatus || "-"} {booking.squareBookingStatus ? `(${booking.squareBookingStatus})` : ""}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
                      <h3 className="text-lg font-medium">Private package</h3>
                      {statusData.privateTrainingAllowed === false ? (
                        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-4">
                          Private 1-on-1 training is not enabled on your account. Please contact us if you need access or think this is a mistake.
                          {activePackage ? (
                            <span className="block mt-2 text-muted-foreground">
                              If you already have a package on file, our team can help you book or adjust it.
                            </span>
                          ) : null}
                        </p>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">
                            Choose the package first. Payment is collected in-store, and each booking consumes one session.
                          </p>
                          {activePackage ? (
                            <div className="rounded-lg border border-border p-3 space-y-1">
                              {statusData.inHomeBookingAllowed !== true && activePackage.serviceType === "in_home" ? (
                                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2 mb-2">
                                  Your package is in-home, but in-home booking is not enabled on your account. Contact us to restore access or ask staff to switch you to in-facility.
                                </p>
                              ) : null}
                              <p className="font-medium">
                                Active: {SERVICE_TYPE_LABEL[activePackage.serviceType]} · {PLAN_TYPE_LABEL[activePackage.planType]}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Sessions: {activePackage.sessionsRemaining} remaining / {activePackage.sessionLimit} total
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Payment: {activePackage.paymentStatus === "pending_in_store" ? "Pending in-store" : activePackage.paymentStatus}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No active private package yet.</p>
                          )}

                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Service type</p>
                              <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm">
                                  <input
                                    type="radio"
                                    checked={selectedServiceType === "in_facility"}
                                    onChange={() => setSelectedServiceType("in_facility")}
                                  />
                                  In-Facility Training
                                </label>
                                {statusData.inHomeBookingAllowed === true ? (
                                  <label className="flex items-center gap-2 text-sm">
                                    <input
                                      type="radio"
                                      checked={selectedServiceType === "in_home"}
                                      onChange={() => setSelectedServiceType("in_home")}
                                    />
                                    In-Home Training
                                  </label>
                                ) : (
                                  <p className="text-xs text-muted-foreground pl-6">
                                    In-home training is available by request. Contact us if you need sessions at your location.
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Package option</p>
                              <div className="space-y-2">
                                {(["pack_3", "pack_5", "pack_7", "unit"] as const).map((plan) => (
                                  <label key={plan} className="flex items-center gap-2 text-sm">
                                    <input type="radio" checked={selectedPlanType === plan} onChange={() => setSelectedPlanType(plan)} />
                                    {PLAN_TYPE_LABEL[plan]}
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                          <details className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
                            <summary className="cursor-pointer font-medium">
                              {CONTRACT_LABEL.private_classes} ({CONTRACT_VERSION})
                            </summary>
                            <p className="mt-2 text-muted-foreground leading-relaxed">{contractBody("private_classes")}</p>
                          </details>
                          <label className="flex items-start gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={privateContractAccepted}
                              onChange={(e) => setPrivateContractAccepted(e.target.checked)}
                              className="mt-1"
                            />
                            <span>I have read and agree to the private training agreement (version {CONTRACT_VERSION}).</span>
                          </label>
                          <div className="flex flex-wrap items-center gap-3">
                            <Button
                              type="button"
                              disabled={
                                isSelectingPackage || (!selectionMatchesActive && !privateContractAccepted)
                              }
                              onClick={handlePrivatePackageContinue}
                            >
                              {isSelectingPackage ? "Saving…" : "Continue to booking"}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : null}
              </section>
            )}
          </div>
        ) : null}
      </main>
    </div>
  )
}