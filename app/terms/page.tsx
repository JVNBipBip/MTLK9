import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Terms of Service",
  description:
    "Terms and conditions for using Montreal Canine Training services and website.",
  alternates: { canonical: "https://mtlcaninetraining.com/terms" },
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto prose prose-neutral">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground mb-10">
            Last updated: April 7, 2026
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">
            1. Agreement to Terms
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            By accessing or using the Montreal Canine Training website and
            services, you agree to be bound by these Terms of Service. If you do
            not agree, please do not use our website or services.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">
            2. Services
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Montreal Canine Training Inc. provides dog training programs,
            consultations, and related services in the Montreal area. All
            services are subject to availability and our professional assessment
            of suitability for your dog.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">
            3. Bookings & Payments
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Bookings are confirmed upon receipt of payment. All prices are listed
            in Canadian dollars (CAD) and are subject to applicable taxes.
            Payment is processed securely through Stripe.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">
            4. Cancellation & Rescheduling
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We require at least 24 hours notice for cancellations or
            rescheduling. Late cancellations (less than 24 hours) may incur a
            fee. No-shows are charged in full. Refunds for unused sessions in a
            package are issued at our discretion and may be subject to a
            prorated adjustment.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">
            5. Client Responsibilities
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            You agree to provide accurate information about your dog&apos;s
            health, behavior history, and vaccination status. You are responsible
            for following the training plan and homework provided between
            sessions. You must inform us of any known bite history or aggressive
            behavior prior to the first session.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">
            6. Assumption of Risk
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Dog training involves inherent risks including, but not limited to,
            scratches, bites, and other injuries. By participating in our
            programs, you acknowledge and accept these risks. Montreal Canine
            Training Inc. is not liable for injuries to persons or animals that
            occur during or as a result of training, except where caused by our
            gross negligence.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">
            7. No Guarantee of Results
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            While we are committed to providing professional, evidence-based
            training, we cannot guarantee specific outcomes. Results depend on
            many factors including the dog&apos;s temperament, history, and the
            owner&apos;s consistency in applying training techniques. We will
            always provide an honest assessment of what is achievable.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">
            8. Intellectual Property
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            All content on this website — including text, images, videos, logos,
            and training materials — is the property of Montreal Canine Training
            Inc. and is protected by Canadian copyright law. You may not
            reproduce, distribute, or use our content without written permission.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">
            9. Photos & Testimonials
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We may take photos or videos during training sessions for use on our
            website, social media, or marketing materials. If you do not wish to
            be photographed, please let us know before your session. Testimonials
            are shared with the client&apos;s consent.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">
            10. Limitation of Liability
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            To the maximum extent permitted by law, Montreal Canine Training
            Inc. shall not be liable for any indirect, incidental, or
            consequential damages arising from the use of our services or
            website.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">
            11. Governing Law
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            These terms are governed by and construed in accordance with the laws
            of the Province of Quebec and the federal laws of Canada applicable
            therein.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">
            12. Changes to These Terms
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We reserve the right to update these terms at any time. Changes take
            effect when posted on this page. Continued use of our services
            constitutes acceptance of the updated terms.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">
            13. Contact Us
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Montreal Canine Training Inc.
            <br />
            7770 Boul Henri-Bourassa E, Anjou, Montreal
            <br />
            <a
              href="mailto:mtlcaninetraining@gmail.com"
              className="text-primary hover:underline"
            >
              mtlcaninetraining@gmail.com
            </a>
            <br />
            <a
              href="tel:+15148269558"
              className="text-primary hover:underline"
            >
              514 826 9558
            </a>
          </p>
        </div>
      </section>
      <Footer />
    </main>
  )
}
