import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const useLegacyStripe = process.env.ENABLE_LEGACY_STRIPE_PAYMENTS === "true"
  if (!useLegacyStripe) {
    return NextResponse.json({ error: "Stripe booking payments are disabled in Square-first mode." }, { status: 410 })
  }
  return NextResponse.json({ error: "Legacy Stripe flow is no longer supported in this route." }, { status: 410 })
}
