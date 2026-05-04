import type { Metadata } from "next"
import { noIndexMetadata } from "@/lib/seo"
import { BookingAccessContent } from "./portal-content"

export const metadata: Metadata = noIndexMetadata(
  "Booking Access — Montreal Canine Training",
  "Private booking access page for Montreal Canine Training clients.",
)

type PageProps = {
  params: Promise<{ token: string }>
}

export default async function BookingAccessPage({ params }: PageProps) {
  const { token } = await params
  return <BookingAccessContent token={token} />
}
