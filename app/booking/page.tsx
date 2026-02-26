import type { Metadata } from "next"
import { BookingPageRedirect } from "./booking-page-redirect"

export const metadata: Metadata = {
  title: "Book Your Evaluation — Montreal Canine Training",
  description:
    "Book a free discovery call or evaluation session. We respond within 1 business day. Real-world training in Montreal.",
}

export default function BookingPage() {
  return <BookingPageRedirect />
}
