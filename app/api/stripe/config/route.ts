import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  return NextResponse.json({ error: "Stripe config route is disabled in Square-first mode." }, { status: 410 })
}
