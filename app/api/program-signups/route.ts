import { NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { getAdminDb } from "@/lib/firebase-admin"
import { getStripe } from "@/lib/stripe"

export const runtime = "nodejs"

type ProgramSignupPayload = {
  dogName: string
  dogBreed: string
  problems: string[]
  preferredDay: string
  preferredTimeSlot: string
  sessionsCount: number
  ownerName: string
  ownerEmail: string
  ownerPhone: string
}

const PACKAGE_PRICING_CENTS: Record<number, number> = {
  3: 30000,
  5: 47500,
  7: 63000,
}

function isValidPayload(value: unknown): value is ProgramSignupPayload {
  if (!value || typeof value !== "object") return false
  const data = value as Partial<ProgramSignupPayload>

  return (
    typeof data.dogName === "string" &&
    typeof data.dogBreed === "string" &&
    Array.isArray(data.problems) &&
    typeof data.preferredDay === "string" &&
    typeof data.preferredTimeSlot === "string" &&
    typeof data.sessionsCount === "number" &&
    typeof data.ownerName === "string" &&
    typeof data.ownerEmail === "string" &&
    typeof data.ownerPhone === "string"
  )
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { formData?: unknown }
    if (!isValidPayload(payload.formData)) {
      return NextResponse.json({ error: "Invalid program signup payload." }, { status: 400 })
    }

    const formData = payload.formData
    const amount = PACKAGE_PRICING_CENTS[formData.sessionsCount]
    if (!amount) {
      return NextResponse.json({ error: "Unsupported session package." }, { status: 400 })
    }

    const stripe = getStripe()
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "cad",
      automatic_payment_methods: { enabled: true },
      receipt_email: formData.ownerEmail || undefined,
      description: `Montreal Canine Training - ${formData.sessionsCount} session pack`,
      metadata: {
        source: "program-signup",
        dogName: formData.dogName,
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail,
        ownerPhone: formData.ownerPhone,
        sessionsCount: String(formData.sessionsCount),
      },
    })

    const signupDoc = {
      ...formData,
      paymentIntentId: paymentIntent.id,
      paymentStatus: paymentIntent.status,
      priceCents: amount,
      source: "program-signup-form",
      submittedAtIso: new Date().toISOString(),
      createdAt: FieldValue.serverTimestamp(),
    }

    const docRef = await getAdminDb().collection("program_signups").add(signupDoc)

    return NextResponse.json({
      ok: true,
      signupId: docRef.id,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    })
  } catch (error) {
    console.error("[Program Signup API] Failed to create signup:", error)
    return NextResponse.json({ error: "Failed to initialize checkout." }, { status: 500 })
  }
}
