import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Checkout Cancelled — Montreal Canine Training",
  description: "Your checkout was cancelled.",
}

type CancelPageProps = {
  searchParams: Promise<{
    type?: string
    bookingId?: string
    signupId?: string
  }>
}

function subtitleForType(type?: string) {
  if (type === "program-signup") {
    return "No payment was processed for your program signup."
  }
  return "No payment was processed for your evaluation booking."
}

export default async function CheckoutCancelPage({ searchParams }: CancelPageProps) {
  const query = await searchParams
  const type = query.type
  const recordId = query.bookingId || query.signupId || ""

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-16">
      <section className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-3">Checkout cancelled</h1>
        <p className="text-muted-foreground mb-6">{subtitleForType(type)}</p>

        {recordId ? (
          <p className="text-xs text-muted-foreground mb-6">Reference ID: {recordId}</p>
        ) : null}

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/booking" className="inline-flex items-center justify-center rounded-full px-6 h-11 bg-primary text-primary-foreground font-semibold">
            Return to booking
          </Link>
          <Link href="/" className="inline-flex items-center justify-center rounded-full px-6 h-11 border border-border text-foreground font-semibold">
            Back to homepage
          </Link>
        </div>
      </section>
    </main>
  )
}
