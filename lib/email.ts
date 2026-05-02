import nodemailer from "nodemailer"

type EmailConfig =
  | { method: "smtp"; from: string; transporter: nodemailer.Transporter }
  | { method: "resend"; apiKey: string; from: string }

function getEmailConfig(): EmailConfig | null {
  const smtpHost = process.env.SMTP_HOST
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const emailFrom = process.env.EMAIL_FROM || process.env.SMTP_USER

  if (smtpHost && smtpUser && smtpPass) {
    const port = Number(process.env.SMTP_PORT) || 587
    const secure = process.env.SMTP_SECURE === "true"
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port,
      secure,
      auth: { user: smtpUser, pass: smtpPass },
    })
    return { method: "smtp", from: emailFrom ?? smtpUser, transporter }
  }

  const resendKey = process.env.RESEND_API_KEY
  const resendFrom = process.env.RESEND_FROM_EMAIL
  if (resendKey && resendFrom) {
    return { method: "resend", apiKey: resendKey, from: resendFrom }
  }

  return null
}

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
}): Promise<{ sent: boolean; reason?: string }> {
  const config = getEmailConfig()
  if (!config) {
    return {
      sent: false,
      reason: "Missing email config. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and EMAIL_FROM, or RESEND_API_KEY and RESEND_FROM_EMAIL.",
    }
  }

  if (config.method === "smtp") {
    try {
      await config.transporter.sendMail({
        from: config.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      })
      return { sent: true }
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err)
      return { sent: false, reason: `SMTP error: ${reason}` }
    }
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    return { sent: false, reason: `Resend API error: ${body}` }
  }
  return { sent: true }
}
