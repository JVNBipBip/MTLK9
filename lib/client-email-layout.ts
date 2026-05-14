/**
 * Customer-facing transactional email shell (Montreal Canine Training brand).
 * MTLK9-Admin keeps a duplicate at `MTLK9-Admin/lib/client-email-layout.ts` for standalone CI/deploy — copy edits there.
 */

export const CLIENT_EMAIL_BRAND = "Montreal Canine Training"
/** Deep olive (`:root --primary`), not admin/teal. */
export const CLIENT_EMAIL_ACCENT_PRIMARY = "#3d5248"
/** Moss / secondary text (site muted-foreground family). */
export const CLIENT_EMAIL_ACCENT_MUTED = "#5f6f64"
/** Headline & strong (site foreground on light). */
export const CLIENT_EMAIL_HEADING = "#1a231c"
/** Main body copy on light. */
export const CLIENT_EMAIL_BODY = "#3a4540"

/** Injected by {@link clientFacingEmailShell}; used to assert customer mail uses the site layout. */
export const CLIENT_EMAIL_SHELL_MARKER = "<!-- mct-client-email-shell -->"

const EMAIL_FONT =
  "Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif"

export function escapeHtmlForEmail(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Reply / contact shown in footer and mailto: links. */
export function clientFacingContactEmail(): string {
  return (
    process.env.CLIENT_CONTACT_EMAIL?.trim() ||
    process.env.BUSINESS_REPLY_TO?.trim() ||
    process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ||
    "mtlcaninetraining@gmail.com"
  )
}

function clientSiteOrigin(): string | null {
  const u = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!u) return null
  return u.replace(/\/$/, "")
}

export type ClientFacingEmailShellInput = {
  preheader: string
  headline: string
  accentRgb: string
  innerHtml: string
  /** Line under the signature block (e.g. why they got this email). */
  footerNote?: string
}

/**
 * Builds the full branded HTML document for customer mail (`<!DOCTYPE>` … ).
 * Outputs {@link CLIENT_EMAIL_SHELL_MARKER}; use {@link sendClientFacingEmail} in `lib/email.ts` so sends are validated.
 */
export function clientFacingEmailShell(input: ClientFacingEmailShellInput): string {
  const pre = escapeHtmlForEmail(input.preheader)
  const headline = escapeHtmlForEmail(input.headline)
  const contact = clientFacingContactEmail()
  const origin = clientSiteOrigin()
  const footerNote =
    input.footerNote ??
    (origin
      ? `You're receiving this because you used <a href="${escapeHtmlForEmail(origin)}" style="color:${CLIENT_EMAIL_ACCENT_PRIMARY};text-decoration:none;">our website</a>.`
      : "You're receiving this because you used Montreal Canine Training online.")

  /** Warm cream outer — matches `:root --background`. */
  const pageBg = "#f5f3ef"

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${headline}</title>
</head>
<body style="margin:0;padding:0;background-color:${pageBg};">
${CLIENT_EMAIL_SHELL_MARKER}
<span style="display:none!important;font-size:1px;color:${pageBg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${pre}</span>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${pageBg};">
<tr>
<td align="center" style="padding:28px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 16px rgba(26,35,28,0.07);border:1px solid #eae6df;">
<tr>
<td style="height:6px;background:${input.accentRgb};font-size:0;line-height:0;">&nbsp;</td>
</tr>
<tr>
<td style="padding:26px 32px 20px;background:#f9f7f4;border-bottom:1px solid #eae6df;">
<p style="margin:0;font-family:${EMAIL_FONT};font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${CLIENT_EMAIL_ACCENT_MUTED};">${escapeHtmlForEmail(CLIENT_EMAIL_BRAND)}</p>
<h1 style="margin:10px 0 0;font-family:${EMAIL_FONT};font-size:24px;font-weight:700;line-height:1.28;color:${CLIENT_EMAIL_HEADING};">${headline}</h1>
</td>
</tr>
<tr>
<td style="padding:28px 32px 36px;font-family:${EMAIL_FONT};font-size:16px;line-height:1.65;color:${CLIENT_EMAIL_BODY};">
${input.innerHtml}
<hr style="border:none;border-top:1px solid #eae6df;margin:28px 0 20px;" />
<p style="margin:0;font-size:14px;line-height:1.55;color:${CLIENT_EMAIL_ACCENT_MUTED};">${escapeHtmlForEmail(CLIENT_EMAIL_BRAND)}<br />
<a href="mailto:${escapeHtmlForEmail(contact)}" style="color:${CLIENT_EMAIL_ACCENT_PRIMARY};text-decoration:none;">${escapeHtmlForEmail(contact)}</a></p>
</td>
</tr>
</table>
<p style="margin:16px 0 0;font-family:${EMAIL_FONT};font-size:12px;color:${CLIENT_EMAIL_ACCENT_MUTED};text-align:center;max-width:520px;">${footerNote}</p>
</td>
</tr>
</table>
</body>
</html>`
}

/** Primary CTA button (inline CSS for email clients). */
export function clientEmailCtaButton(href: string, label: string): string {
  const h = escapeHtmlForEmail(href)
  const t = escapeHtmlForEmail(label)
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
<tr>
<td style="border-radius:10px;background:${CLIENT_EMAIL_ACCENT_PRIMARY};">
<a href="${h}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-family:${EMAIL_FONT};font-size:15px;font-weight:700;color:#faf9f6;text-decoration:none;border-radius:10px;">${t}</a>
</td>
</tr>
</table>`
}
