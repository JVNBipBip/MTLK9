import { sendEmail } from "@/lib/email"
import { buildDaycareNotification } from "@/lib/daycare-notification-email"

/** Staff alert only: no questionnaire answers or health/emergency details in email. */
export async function notifyDaycareApplication(applicationId: string): Promise<boolean> {
  const adminOrigin = process.env.NEXT_PUBLIC_ADMIN_BASE_URL?.trim() || "https://mltk-9-admin.vercel.app"
  const result = await sendEmail(buildDaycareNotification(applicationId, adminOrigin))
  return result.sent
}
