import Link from "next/link"
import type { Metadata } from "next"
import { noIndexMetadata } from "@/lib/seo"
import { FacebookCheckoutSuccessEvent } from "./facebook-checkout-success-event"

export const metadata: Metadata = noIndexMetadata("Payment Successful — Montreal Canine Training", "Your payment was successful.")

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
  return "Your evaluation deposit was received. Your selected appointment time will be confirmed shortly."
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const query = await searchParams
  const type = query.type
  const recordId = query.bookingId || query.signupId || ""

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-16">
      <FacebookCheckoutSuccessEvent checkoutType={type} recordId={recordId} />
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
            Contact us again
          </Link>
        </div>
      </section>
    </main>
  )
}
