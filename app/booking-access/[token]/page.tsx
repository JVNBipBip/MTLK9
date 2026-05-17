import type { Metadata } from "next"
import { noIndexMetadata } from "@/lib/seo"
import { BookingAccessContent } from "./portal-content"

export const metadata: Metadata = noIndexMetadata(
  "Booking Access — Montreal Canine Training",
  "Private booking access page for Montreal Canine Training clients.",
)

type PageProps = {
  params: Promise<{ token: string }>
  searchParams: Promise<{ focus?: string }>
}

export default async function BookingAccessPage({ params, searchParams }: PageProps) {
  const { token } = await params
  const { focus } = await searchParams
  return <BookingAccessContent token={token} initialFocus={focus === "private" ? "private" : null} />
}
