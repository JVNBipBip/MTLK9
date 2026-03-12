import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Payment Successful — Montreal Canine Training",
  description: "Your payment was successful.",
}

type SuccessPageProps = {
  searchParams: Promise<{
    type?: string
    bookingId?: string
    signupId?: string
    session_id?: string
  }>
}

function titleForType(type?: string) {
  if (type === "program-signup") return "Program payment confirmed"
  return "Evaluation payment confirmed"
}

function subtitleForType(type?: string) {
  if (type === "program-signup") {
    return "Your program signup is confirmed. Our team will contact you with next steps."
  }
  return "Your in-person evaluation is confirmed. Our team will contact you shortly to schedule your session."
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const query = await searchParams
  const type = query.type
  const recordId = query.bookingId || query.signupId || ""

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-16">
      <section className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-3">{titleForType(type)}</h1>
        <p className="text-muted-foreground mb-6">{subtitleForType(type)}</p>

        {recordId ? (
          <p className="text-xs text-muted-foreground mb-6">Reference ID: {recordId}</p>
        ) : null}

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/" className="inline-flex items-center justify-center rounded-full px-6 h-11 bg-primary text-primary-foreground font-semibold">
            Back to homepage
          </Link>
          <Link href="/booking" className="inline-flex items-center justify-center rounded-full px-6 h-11 border border-border text-foreground font-semibold">
            Book another call
          </Link>
        </div>
      </section>
    </main>
  )
}
