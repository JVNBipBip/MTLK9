import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Privacy Policy",
  description:
    "How Montreal Canine Training collects, uses, and protects your personal information.",
  alternates: { canonical: "https://mtlcaninetraining.com/privacy" },
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto prose prose-neutral">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground mb-10">
            Last updated: April 7, 2026
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">
            1. Information We Collect
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            When you book a consultation, sign up for a program, or contact us,
            we may collect your name, email address, phone number, mailing
            address, and information about your dog (breed, age, behavioral
            concerns). We also collect standard analytics data such as IP
            address, browser type, and pages visited.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">
            2. How We Use Your Information
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We use your information to provide and improve our training services,
            communicate with you about bookings and programs, process payments,
            send occasional updates or tips (only with your consent), and analyze
            site usage to improve our website experience.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">
            3. Information Sharing
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We do not sell, rent, or trade your personal information. We may
            share data with trusted third-party service providers (payment
            processors, email platforms, analytics tools) solely to operate our
            business. These providers are contractually obligated to protect your
            information.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">
            4. Payment Processing
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Payments are processed securely through Stripe. We do not store your
            credit card information on our servers. All transactions are
            encrypted and handled in accordance with PCI-DSS standards.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">
            5. Cookies & Analytics
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We use cookies and similar technologies to analyze traffic and
            improve your browsing experience. You can disable cookies in your
            browser settings, though some features of the site may not function
            as intended.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">
            6. Data Retention
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We retain your personal information for as long as necessary to
            provide our services and comply with legal obligations. You may
            request deletion of your data at any time by contacting us.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">
            7. Your Rights
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Under applicable Canadian and Quebec privacy laws, you have the
            right to access, correct, or delete your personal information. To
            exercise these rights, contact us at{" "}
            <a
              href="mailto:mtlcaninetraining@gmail.com"
              className="text-primary hover:underline"
            >
              mtlcaninetraining@gmail.com
            </a>
            .
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">
            8. Changes to This Policy
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We may update this policy from time to time. Changes will be posted
            on this page with an updated revision date.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">
            9. Contact Us
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
