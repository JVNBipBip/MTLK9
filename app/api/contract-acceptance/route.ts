import { FieldValue } from "firebase-admin/firestore"
import { NextResponse } from "next/server"
import { CONTRACT_ACCEPTANCES_COLLECTION, type ContractKind } from "@/lib/domain"
import { getAdminDb } from "@/lib/firebase-admin"
import { CONTRACT_VERSION } from "@/lib/contract-terms"

export const runtime = "nodejs"

const KINDS: readonly ContractKind[] = ["daycare", "private_classes", "group_classes", "assessment_booking"]

function isContractKind(v: unknown): v is ContractKind {
  return typeof v === "string" && (KINDS as readonly string[]).includes(v)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const clientEmail = String(url.searchParams.get("clientEmail") || "").trim().toLowerCase()
  const contractKind = url.searchParams.get("contractKind")
  const version = String(url.searchParams.get("version") || CONTRACT_VERSION).trim() || CONTRACT_VERSION

  if (!clientEmail || !clientEmail.includes("@")) {
    return NextResponse.json({ error: "Valid clientEmail is required." }, { status: 400 })
  }
  if (!isContractKind(contractKind)) {
    return NextResponse.json({ error: "Invalid contractKind." }, { status: 400 })
  }

  const snap = await getAdminDb()
    .collection(CONTRACT_ACCEPTANCES_COLLECTION)
    .where("clientEmail", "==", clientEmail)
    .limit(100)
    .get()

  const match = snap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as { contractKind?: string; version?: string; acceptedAtIso?: string }) }))
    .find((row) => row.contractKind === contractKind && row.version === version)

  return NextResponse.json({
    ok: true,
    accepted: Boolean(match),
    acceptedAtIso: match?.acceptedAtIso || null,
  })
}

export async function POST(request: Request) {
  let body: {
    clientEmail?: string
    contractKind?: unknown
    version?: string
    source?: string
    dogName?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const clientEmail = String(body.clientEmail || "").trim().toLowerCase()
  if (!clientEmail || !clientEmail.includes("@")) {
    return NextResponse.json({ error: "Valid clientEmail is required." }, { status: 400 })
  }
  if (!isContractKind(body.contractKind)) {
    return NextResponse.json({ error: "Invalid contractKind." }, { status: 400 })
  }

  const version = String(body.version || CONTRACT_VERSION).trim() || CONTRACT_VERSION
  const source = String(body.source || "").trim().slice(0, 500)
  const dogName = String(body.dogName || "").trim().slice(0, 200)

  const acceptedAtIso = new Date().toISOString()
  const db = getAdminDb()
  const ref = await db.collection(CONTRACT_ACCEPTANCES_COLLECTION).add({
    clientEmail,
    contractKind: body.contractKind,
    version,
    acceptedAtIso,
    source: source || null,
    dogName: dogName || null,
    createdAt: FieldValue.serverTimestamp(),
  })

  return NextResponse.json({ ok: true, id: ref.id })
}
