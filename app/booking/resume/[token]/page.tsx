import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { BookingResumeClient } from "./booking-resume-client"
import { loadConsultationDepositResumePageData } from "@/lib/consultation-deposit-resume"
import { getAdminDb } from "@/lib/firebase-admin"

type Props = {
  params: Promise<{ token: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    robots: { index: false, follow: false },
    title: "Continue booking",
  }
}

export default async function BookingResumePage(props: Props) {
  const { token } = await props.params
  const decoded = decodeURIComponent(token.trim())
  if (!decoded) notFound()

  const db = getAdminDb()
  const data = await loadConsultationDepositResumePageData(db, decoded)
  if (!data) notFound()

  return (
    <BookingResumeClient
      initialFormData={data.initialFormData}
      pinnedTeamMemberId={data.pinnedTeamMemberId}
      trainerPageSlug={data.trainerPageSlug}
      allowTeamMemberIds={data.allowTeamMemberIds}
    />
  )
}
