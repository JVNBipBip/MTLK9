import { BookingAccessContent } from "./portal-content"

type PageProps = {
  params: Promise<{ token: string }>
}

export default async function BookingAccessPage({ params }: PageProps) {
  const { token } = await params
  return <BookingAccessContent token={token} />
}
