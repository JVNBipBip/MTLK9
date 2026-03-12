import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  let payload: { bookingId?: string }
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const bookingId = String(payload.bookingId || "")
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId is required." }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
