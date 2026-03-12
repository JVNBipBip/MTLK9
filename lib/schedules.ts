import { getAdminDb } from "@/lib/firebase-admin"

export type ScheduleRecord = {
  id: string
  type: "recurring" | "one-off"
  dayOfWeek?: number
  dateIso?: string
  timeSlot?: string
  programId?: string
  label?: string
  isBlocked?: boolean
  capacity?: number
  status?: "active" | "cancelled"
  createdAtIso?: string
}

const COLLECTION = "staff_schedules"

export async function getSchedules(): Promise<ScheduleRecord[]> {
  const db = getAdminDb()
  const snap = await db.collection(COLLECTION).limit(200).get()

  const records = snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<ScheduleRecord, "id">),
  }))

  return records.sort((a, b) => {
    const aTime = a.createdAtIso ? new Date(a.createdAtIso).getTime() : 0
    const bTime = b.createdAtIso ? new Date(b.createdAtIso).getTime() : 0
    return bTime - aTime
  })
}
