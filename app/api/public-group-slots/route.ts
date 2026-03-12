import { NextResponse } from "next/server"
import { listSquareCatalogItems, type SquareCatalogObject } from "@/lib/square"

export const runtime = "nodejs"

type PublicGroupClass = {
  classId: string
  variationId: string
  classLabel: string
  description: string
  priceCents: number
  currency: string
  locationAvailable: boolean
  bookingUrl: string
}

export async function GET() {
  const locationId = process.env.SQUARE_LOCATION_ID?.trim() || ""
  if (!locationId) {
    return NextResponse.json({ error: "Missing SQUARE_LOCATION_ID." }, { status: 500 })
  }

  try {
    const objects = await listSquareCatalogItems()
    const items = objects.filter((obj) => obj.type === "ITEM")
    const whitelist = (process.env.SQUARE_GROUP_CLASS_TICKET_VARIATION_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
    const defaultBookingUrl = process.env.NEXT_PUBLIC_SQUARE_CLASS_BOOKING_URL?.trim() || ""
    const bookingUrlByVariation: Record<string, string> = {}
    const linksJson = process.env.SQUARE_GROUP_CLASS_LINKS_JSON?.trim()
    if (linksJson) {
      try {
        const parsed = JSON.parse(linksJson) as Record<string, string>
        for (const [variationId, url] of Object.entries(parsed)) {
          if (variationId && typeof url === "string" && url.trim()) {
            bookingUrlByVariation[variationId] = url.trim()
          }
        }
      } catch {
        // Ignore invalid JSON; fallback to default booking URL.
      }
    }

    const isAvailableAtLocation = (obj: SquareCatalogObject) => {
      if (obj.present_at_all_locations) return true
      const presentIds = obj.present_at_location_ids || []
      if (presentIds.length > 0) return presentIds.includes(locationId)
      const absentIds = obj.absent_at_location_ids || []
      if (absentIds.length > 0) return !absentIds.includes(locationId)
      return true
    }

    const classes: PublicGroupClass[] = []

    for (const item of items) {
      const itemData = item.item_data as (SquareCatalogObject["item_data"] & { variations?: SquareCatalogObject[] }) | undefined
      if (!itemData || itemData.product_type !== "CLASS_TICKET") continue

      const itemAvailable = isAvailableAtLocation(item)
      const variations = itemData.variations || []
      for (const variation of variations) {
        const isDeleted = Boolean((variation as { is_deleted?: boolean }).is_deleted)
        if (variation.type !== "ITEM_VARIATION" || isDeleted) continue
        const variationData = variation.item_variation_data || {}
        const variationAvailable = isAvailableAtLocation(variation)
        if (!variation.id) continue
        if (whitelist.length > 0 && !whitelist.includes(variation.id)) continue

        const variationName = variationData.name && variationData.name !== "Regular" ? ` (${variationData.name})` : ""
        const classLabel = `${itemData.name || "Group Class"}${variationName}`
        classes.push({
          classId: item.id || "unknown",
          variationId: variation.id,
          classLabel,
          description: itemData.description || "",
          priceCents: variationData.price_money?.amount || 0,
          currency: variationData.price_money?.currency || "CAD",
          locationAvailable: itemAvailable && variationAvailable,
          bookingUrl: bookingUrlByVariation[variation.id] || defaultBookingUrl,
        })
      }
    }

    classes.sort((a, b) => a.classLabel.localeCompare(b.classLabel))
    return NextResponse.json({ classes })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not load group class configuration.",
      },
      { status: 502 },
    )
  }
}
