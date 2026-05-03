import { NextResponse } from "next/server"
import { findClientConsultationByAccessTokenHash } from "@/lib/client-records"
import { buildApprovedGroupClassesForClientDog } from "@/lib/group-dog-program-access"
import { getAdminDb } from "@/lib/firebase-admin"
import { hashAccessToken } from "@/lib/tokens"

type RouteContext = {
  params: Promise<{ token: string }>
}

export const runtime = "nodejs"

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params
  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 })

  const tokenHash = hashAccessToken(token)
  const db = getAdminDb()
  const doc = await findClientConsultationByAccessTokenHash(db, tokenHash)

  if (!doc) {
    return NextResponse.json({ error: "Invalid or expired booking link." }, { status: 404 })
  }

  const consultation = { id: doc.id, ...doc.data() } as {
    id: string
    status?: string
    bookingAccess?: { expiresAtIso?: string; revokedAtIso?: string }
  }
  const expiresAt = consultation.bookingAccess?.expiresAtIso ? new Date(consultation.bookingAccess.expiresAtIso).getTime() : 0
  const isExpired = !expiresAt || expiresAt < Date.now()

  if (consultation.bookingAccess?.revokedAtIso || isExpired || consultation.status !== "completed") {
    return NextResponse.json({ error: "This booking link is no longer available." }, { status: 410 })
  }

  const clientId = String((doc.data().clientId as string) || (doc.data().clientEmail as string) || "").trim().toLowerCase()
  const dogName = String((doc.data().dogName as string) || "")
  const approvedClasses = await buildApprovedGroupClassesForClientDog(clientId, dogName)

  return NextResponse.json({
    ok: true,
    consultation: {
      id: consultation.id,
      clientName: (doc.data().clientName as string) || "",
      clientEmail: (doc.data().clientEmail as string) || "",
      clientPhone: (doc.data().clientPhone as string) || "",
      dogName: (doc.data().dogName as string) || "",
      recommendedClassTypes: (doc.data().recommendedClassTypes as string[]) || [],
      approvedClasses,
      staffNotes: (doc.data().staffNotes as string) || "",
      expiresAtIso: consultation.bookingAccess?.expiresAtIso || "",
    },
  })
}
