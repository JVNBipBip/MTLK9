"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useBookingForm } from "@/components/booking-form-provider"
import { X, Search, CheckCircle2, AlertCircle, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

type PortalBooking = {
  id: string
  startAt: string
  label: string
  type: "one_on_one" | "group"
  bookingStatus: string
  squareBookingStatus: string | null
}

type PrivatePackage = {
  id: string
  consultationId: string | null
  serviceType: "in_facility" | "in_home"
  planType: "pack_3" | "pack_5" | "pack_7" | "unit"
  sessionLimit: number
  sessionsBookedCount: number
  sessionsRemaining: number
  paymentStatus: "pending_in_store" | "paid_in_store" | "cancelled"
  status: "active" | "exhausted" | "cancelled"
}

type StatusResponse = {
  ok: boolean
  hasConsultation: boolean
  assessmentCompleted: boolean
  latestConsultationStatus: string | null
  clientSummary: {
    clientName: string | null
    clientEmail: string | null
    clientPhone: string | null
    dogName: string | null
    dogBreed: string | null
    dogAge: string | null
    issue: string | null
  } | null
  lookup: { clientEmail: string; dogName: string }
  existingBookings: PortalBooking[]
  privateUpcomingBookings: PortalBooking[]
  activePrivatePackage: PrivatePackage | null
  options: {
    oneOnOne: {
      eligible: boolean
      hasUpcoming: boolean
      blockedReason: string | null
      sessionsRemaining: number
    }
  }
}

const SERVICE_TYPE_LABEL: Record<PrivatePackage["serviceType"], string> = {
  in_facility: "In-Facility Training",
  in_home: "In-Home Training",
}

const PLAN_TYPE_LABEL: Record<PrivatePackage["planType"], string> = {
  pack_3: "Option A · 3 sessions",
  pack_5: "Option B · 5 sessions",
  pack_7: "Option C · 7 sessions",
  unit: "Unit · 1 session",
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-CA", {
    timeZone: "America/Toronto",
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function TrainingPortalContent({ onClose }: { onClose?: () => void }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { openBookingForm } = useBookingForm()
  const [clientEmail, setClientEmail] = useState("")
  const [dogName, setDogName] = useState("")
  const [statusData, setStatusData] = useState<StatusResponse | null>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(false)
  const [isSelectingPackage, setIsSelectingPackage] = useState(false)
  const [selectedServiceType, setSelectedServiceType] = useState<PrivatePackage["serviceType"]>("in_facility")
  const [selectedPlanType, setSelectedPlanType] = useState<PrivatePackage["planType"]>("pack_3")
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const activePackage = statusData?.activePrivatePackage || null

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
      setStatusData(data)
      if (data.activePrivatePackage) {
        setSelectedServiceType(data.activePrivatePackage.serviceType)
        setSelectedPlanType(data.activePrivatePackage.planType)
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
      await fetchStatus()
      goToBookingPage()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save private package.")
    } finally {
      setIsSelectingPackage(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8 overflow-y-auto">
        {(
          <>
            <section className="space-y-2 shrink-0">
              <div className="flex items-center justify-between gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Private Training</h1>
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
                To book sessions, we first need to verify your profile and assessment status.
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
                    <a href="tel:+15148269558" className="hover:underline">514 826 9558</a>
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
                    <a href="tel:+15148269558" className="flex-1 sm:flex-none">
                      <Button variant="outline" className="w-full rounded-full border-amber-200 text-amber-900 hover:bg-amber-100 hover:text-amber-950">
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </Button>
                    </a>
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
                    Welcome back! You are eligible to book private training sessions.
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
                  <p className="text-sm text-muted-foreground">
                    Choose the package first. Payment is collected in-store, and each booking consumes one session.
                  </p>
                  {activePackage ? (
                    <div className="rounded-lg border border-border p-3 space-y-1">
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
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            checked={selectedServiceType === "in_home"}
                            onChange={() => setSelectedServiceType("in_home")}
                          />
                          In-Home Training
                        </label>
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
                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="button" disabled={isSelectingPackage} onClick={savePrivatePackage}>
                      {isSelectingPackage ? "Saving package..." : "Save package"}
                    </Button>
                    {activePackage ? (
                      <Button type="button" variant="outline" onClick={goToBookingPage}>
                        Book sessions
                      </Button>
                    ) : null}
                  </div>
                </div>
              </section>
            )}
          </div>
        ) : null}
      </main>
    </div>
  )
}