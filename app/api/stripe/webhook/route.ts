import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  void request
  return NextResponse.json({ error: "Stripe webhook disabled in Square-first mode. Use /api/square/webhook." }, { status: 410 })
}
