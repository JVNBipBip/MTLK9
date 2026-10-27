import { escapeHtmlForEmail } from "@/lib/client-email-layout"

/** Keep identical in the website and admin repositories. No applicant data belongs in this alert. */
export function buildDaycareNotification(applicationId: string, adminOrigin: string) {
  if (!/^[a-f0-9]{64}$/.test(applicationId)) throw new Error("Invalid application ID")
  const url = new URL(`/daycare-applications/${applicationId}`, adminOrigin)
  const localHttp = url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  if ((url.protocol !== "https:" && !localHttp) || url.username || url.password) throw new Error("Invalid admin URL")
  return {
    to: "mtlcaninetraining@gmail.com",
    subject: "New daycare application to review",
    html: `<p style="margin:0 0 20px;line-height:1.6">A new daycare / day training questionnaire is ready for review.</p><p style="margin:0 0 20px;line-height:1.6"><a href="${escapeHtmlForEmail(url.toString())}">Open the application in your admin portal</a></p><p style="margin:0 0 20px;line-height:1.6">Please review the answers and arrange the complimentary phone evaluation before approving admission.</p><p style="margin:0;line-height:1.6">This application has not created a booking or a payment.</p>`,
  }
}
