import { FieldValue } from "firebase-admin/firestore"
import { NextResponse } from "next/server"
import { PRIVATE_TRAINING_PACKAGES_COLLECTION } from "@/lib/domain"
import { getAdminDb } from "@/lib/firebase-admin"
import {
  PRIVATE_PLAN_TYPES,
  PRIVATE_SERVICE_TYPES,
  loadTrainingPortalContext,
  privatePlanSessionLimit,
  type PrivatePlanType,
  type PrivateServiceType,
} from "@/lib/training-portal"

export const runtime = "nodejs"

type Payload = {
  clientEmail?: string
  dogName?: string
  serviceType?: string
  planType?: string
}

export async function POST(request: Request) {
  try {
    let payload: Payload
    try {
      payload = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
    }

    const clientEmail = String(payload.clientEmail || "").trim().toLowerCase()
    const dogName = String(payload.dogName || "").trim()
    const serviceType = String(payload.serviceType || "").trim() as PrivateServiceType
    const planType = String(payload.planType || "").trim() as PrivatePlanType
    if (!clientEmail || !dogName || !serviceType || !planType) {
      return NextResponse.json({ error: "clientEmail, dogName, serviceType and planType are required." }, { status: 400 })
    }
    if (!PRIVATE_SERVICE_TYPES.includes(serviceType)) {
      return NextResponse.json({ error: "Invalid serviceType." }, { status: 400 })
    }
    if (!PRIVATE_PLAN_TYPES.includes(planType)) {
      return NextResponse.json({ error: "Invalid planType." }, { status: 400 })
    }

    const portal = await loadTrainingPortalContext({
      clientEmail,
      dogName,
      oneOnOneServiceVariationIds: [],
    })
    if (!portal.assessmentCompleted) {
      return NextResponse.json({ error: "Assessment must be completed before selecting a private package." }, { status: 403 })
    }

    const db = getAdminDb()
    const sessionLimit = privatePlanSessionLimit(planType)
    const selectedAtIso = new Date().toISOString()
    const activeSnap = await db
      .collection(PRIVATE_TRAINING_PACKAGES_COLLECTION)
      .where("clientId", "==", portal.clientId)
      .where("status", "==", "active")
      .limit(50)
      .get()

    const activeForDog = activeSnap.docs.filter((doc) => {
      const data = doc.data() as { dogName?: string }
      return String(data.dogName || "").trim().toLowerCase() === portal.dogName
    })
    const newPackageRef = db.collection(PRIVATE_TRAINING_PACKAGES_COLLECTION).doc()

    await db.runTransaction(async (transaction) => {
      for (const existing of activeForDog) {
        transaction.update(existing.ref, {
          status: "cancelled",
          paymentStatus: "cancelled",
          cancelledAtIso: selectedAtIso,
          replacedByPackageId: newPackageRef.id,
          updatedAt: FieldValue.serverTimestamp(),
        })
      }
      transaction.set(newPackageRef, {
        consultationId: portal.latestConsultation?.id || null,
        clientId: portal.clientId,
        clientEmail,
        dogName,
        serviceType,
        planType,
        sessionLimit,
        sessionsBookedCount: 0,
        sessionsRemaining: sessionLimit,
        paymentStatus: "pending_in_store",
        status: "active",
        selectedAtIso,
        source: "training-portal-private-package-selection",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    })

    return NextResponse.json({
      ok: true,
      package: {
        id: newPackageRef.id,
        serviceType,
        planType,
        sessionLimit,
        sessionsBookedCount: 0,
        sessionsRemaining: sessionLimit,
        paymentStatus: "pending_in_store",
        status: "active",
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save private package."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
