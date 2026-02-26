import { NextResponse } from "next/server"
import type { BookingFormData } from "@/app/booking/types"
import { getStripe } from "@/lib/stripe"

export const runtime = "nodejs"

const IN_PERSON_PRICE_CENTS = 10000
const CURRENCY = "cad"

function isBookingFormData(value: unknown): value is BookingFormData {
  if (!value || typeof value !== "object") return false
  const data = value as Partial<BookingFormData>
  return typeof data.connectMethod === "string" && data.connectMethod.length > 0
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { formData?: unknown }
    if (!isBookingFormData(payload.formData)) {
      return NextResponse.json({ error: "Invalid booking payload." }, { status: 400 })
    }

    const formData = payload.formData
    if (formData.connectMethod !== "in-person-evaluation") {
      return NextResponse.json({ error: "Payment intent is only required for in-person bookings." }, { status: 400 })
    }

    const stripe = getStripe()
    const paymentIntent = await stripe.paymentIntents.create({
      amount: IN_PERSON_PRICE_CENTS,
      currency: CURRENCY,
      automatic_payment_methods: { enabled: true },
      receipt_email: formData.contactEmail || undefined,
      description: "Montreal Canine Training - In-person evaluation",
      metadata: {
        bookingType: formData.connectMethod,
        contactName: formData.contactName || "",
        contactEmail: formData.contactEmail || "",
        contactPhone: formData.contactPhone || "",
        dogName: formData.dogName || "",
      },
    })

    return NextResponse.json({
      ok: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    })
  } catch (error) {
    console.error("[Stripe] Failed to create payment intent:", error)
    return NextResponse.json({ error: "Failed to create payment intent." }, { status: 500 })
  }
}
