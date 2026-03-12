"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ExternalLink, Loader2 } from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"

type GroupClass = {
  classId: string
  variationId: string
  classLabel: string
  description: string
  priceCents: number
  currency: string
  locationAvailable: boolean
  bookingUrl: string
}

export default function GroupClassBookingPage() {
  const ignoreLocationGuard = process.env.NEXT_PUBLIC_GROUP_CLASS_IGNORE_LOCATION_GUARD === "true"
  const [classes, setClasses] = useState<GroupClass[]>([])
  const [selectedVariationId, setSelectedVariationId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function loadClasses() {
      try {
        const response = await fetch("/api/public-group-slots")
        const data = (await response.json()) as { classes?: GroupClass[]; error?: string }
        if (!response.ok) throw new Error(data.error || "Could not load classes.")
        if (!active) return
        setClasses(data.classes || [])
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : "Could not load classes.")
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadClasses()
    return () => {
      active = false
    }
  }, [])

  const selectedClass = useMemo(
    () => classes.find((item) => item.variationId === selectedVariationId),
    [classes, selectedVariationId],
  )

  const bookingUrl = selectedClass?.bookingUrl || ""
  const handleOpenSquare = useCallback(() => {
    if (!bookingUrl) return
    window.open(bookingUrl, "_blank", "noopener,noreferrer")
  }, [bookingUrl])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-6 pt-36 pb-12 space-y-6">
        <section className="space-y-2">
          <h1 className="text-3xl font-semibold">Book a Group Class</h1>
          <p className="text-muted-foreground">
            Pick a class and continue to Square booking. Class capacity and spots are managed directly by Square.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-background p-5 space-y-4">
          <h2 className="text-lg font-medium">1) Choose a class</h2>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading classes...
            </div>
          ) : classes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No group classes found in Square catalog.</p>
          ) : (
            <div className="space-y-2">
              {classes.map((item) => (
                <label key={item.variationId} className="flex items-start gap-3 rounded-xl border border-border p-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={selectedVariationId === item.variationId}
                    onChange={() => setSelectedVariationId(item.variationId)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium">{item.classLabel}</p>
                    {item.description ? <p className="text-sm text-muted-foreground mt-1">{item.description}</p> : null}
                    <p className="text-sm text-muted-foreground mt-1">
                      Price: {(item.priceCents / 100).toFixed(2)} {item.currency}
                    </p>
                    {!item.locationAvailable ? <p className="text-xs text-amber-700 mt-1">Not available at configured location yet.</p> : null}
                  </div>
                </label>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-muted/20 p-5 space-y-3">
          <h2 className="text-lg font-medium">2) Continue on Square</h2>
          {selectedClass ? (
            <p className="text-sm text-muted-foreground">
              Continue to Square to reserve <span className="text-foreground font-medium">{selectedClass.classLabel}</span>.  
              Payment settings and class capacity are managed in Square.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Select a class to continue.</p>
          )}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button
            type="button"
            disabled={!selectedClass || (!ignoreLocationGuard && !selectedClass.locationAvailable) || !bookingUrl}
            onClick={handleOpenSquare}
            className="rounded-full px-7"
          >
            Continue to Square
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
          {!bookingUrl ? (
            <p className="text-xs text-amber-700">
              Missing booking URL. Set <code>NEXT_PUBLIC_SQUARE_CLASS_BOOKING_URL</code> in `MTLK9/.env.local`.
            </p>
          ) : null}
        </section>
      </main>
    </div>
  )
}
