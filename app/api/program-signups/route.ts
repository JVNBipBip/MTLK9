import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  void request
  return NextResponse.json({ error: "Program signup checkout is disabled in Square-first mode." }, { status: 410 })
}
