import publishedEdits from "@/content/site-edits.json"

/**
 * The business's public contact details, in one place.
 *
 * Every page, call and email link, map link, Google's business data
 * (json-ld.tsx), llms.txt and client email footers read from here, so when the
 * owner changes them in the Website editor (business.* fields, the same in both
 * languages) they change everywhere at once. These defaults are the source;
 * the registry mirrors them (source: "data") and fields.test.ts checks they match.
 *
 * Not covered on purpose: the staff notification inbox (alerts sent *to* the
 * business), so changing the public email never reroutes staff alerts.
 */
export const BUSINESS_DEFAULTS = {
  phone: "514 826 9558",
  email: "mtlcaninetraining@gmail.com",
  street: "7770 Boulevard Henri-Bourassa E",
  city: "Montreal",
  province: "Quebec",
  postalCode: "H1E 1P2",
} as const

/** The Google Maps short link for the current address (also the Google Business listing). */
const DEFAULT_MAPS_URL = "https://maps.app.goo.gl/GoTny9wRbvZ1Y81fA"

const PROVINCE_CODES: Record<string, string> = {
  quebec: "QC", québec: "QC", ontario: "ON", "british columbia": "BC", alberta: "AB", manitoba: "MB", saskatchewan: "SK",
  "nova scotia": "NS", "new brunswick": "NB", "newfoundland and labrador": "NL", "prince edward island": "PE",
}

type EditsLike = { text?: Record<string, { en?: string } | undefined> }

export type BusinessDetails = {
  phone: string
  /** tel: link, e.g. "tel:+15148269558". */
  phoneHref: string
  /** For structured data, e.g. "+1-514-826-9558". */
  phoneInternational: string
  email: string
  emailHref: string
  street: string
  city: string
  province: string
  provinceCode: string
  postalCode: string
  /** "7770 Boulevard Henri-Bourassa E, Montreal, Quebec H1E 1P2" */
  addressLine: string
  mapsUrl: string
  /** True once he has changed any part of the address (the stored map coordinates no longer apply). */
  addressChanged: boolean
}

function digitsOf(phone: string) {
  const digits = phone.replace(/\D/g, "")
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits
}

export function getBusinessDetails(edits: EditsLike = publishedEdits as EditsLike): BusinessDetails {
  const value = (key: keyof typeof BUSINESS_DEFAULTS) => edits.text?.[`business.${key}`]?.en?.trim() || BUSINESS_DEFAULTS[key]
  const phone = value("phone")
  const digits = digitsOf(phone)
  const street = value("street")
  const city = value("city")
  const province = value("province")
  const postalCode = value("postalCode")
  const addressLine = `${street}, ${city}, ${province} ${postalCode}`
  const addressChanged =
    street !== BUSINESS_DEFAULTS.street || city !== BUSINESS_DEFAULTS.city || province !== BUSINESS_DEFAULTS.province || postalCode !== BUSINESS_DEFAULTS.postalCode
  const email = value("email")
  return {
    phone,
    phoneHref: `tel:+1${digits}`,
    phoneInternational: `+1-${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`,
    email,
    emailHref: `mailto:${email}`,
    street,
    city,
    province,
    provinceCode: PROVINCE_CODES[province.toLowerCase()] ?? province,
    postalCode,
    addressLine,
    mapsUrl: addressChanged ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLine)}` : DEFAULT_MAPS_URL,
    addressChanged,
  }
}
