import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BookingContent } from "./booking-content"

export const metadata: Metadata = {
  title: "Book Your Evaluation — Montreal Canine Training",
  description:
    "Book a free discovery call or evaluation session. We respond within 1 business day. Real-world training in Montreal.",
}

export default function BookingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <BookingContent />
      <Footer />
    </main>
  )
}
