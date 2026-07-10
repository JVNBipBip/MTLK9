import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { getLocalizedText } from "@/lib/i18n/localized-text"
import { buildLocalizedMetadata, getRequestLocale } from "@/lib/seo"

const termsSections = [
  {
    heading: "1. Agreement to Terms",
    body: "By accessing or using the Montreal Canine Training website and services, you agree to be bound by these Terms of Service. If you do not agree, please do not use our website or services.",
  },
  {
    heading: "2. Services",
    body: "Montreal Canine Training Inc. provides dog training programs, consultations, and related services in the Montreal area. All services are subject to availability and our professional assessment of suitability for your dog.",
  },
  {
    heading: "3. Bookings & Payments",
    body: "Bookings are confirmed upon receipt of payment. All prices are listed in Canadian dollars (CAD) and are subject to applicable taxes. Payment is processed securely through Stripe.",
  },
  {
    heading: "4. Cancellation & Rescheduling",
    body: "We require at least 24 hours notice for cancellations or rescheduling. Late cancellations (less than 24 hours) may incur a fee. No-shows are charged in full. Refunds for unused sessions in a package are issued at our discretion and may be subject to a prorated adjustment.",
  },
  {
    heading: "5. Client Responsibilities",
    body: "You agree to provide accurate information about your dog's health, behavior history, and vaccination status. You are responsible for following the training plan and homework provided between sessions. You must inform us of any known bite history or aggressive behavior prior to the first session.",
  },
  {
    heading: "6. Assumption of Risk",
    body: "Dog training involves inherent risks including, but not limited to, scratches, bites, and other injuries. By participating in our programs, you acknowledge and accept these risks. Montreal Canine Training Inc. is not liable for injuries to persons or animals that occur during or as a result of training, except where caused by our gross negligence.",
  },
  {
    heading: "7. No Guarantee of Results",
    body: "While we are committed to providing professional, evidence-based training, we cannot guarantee specific outcomes. Results depend on many factors including the dog's temperament, history, and the owner's consistency in applying training techniques. We will always provide an honest assessment of what is achievable.",
  },
  {
    heading: "8. Intellectual Property",
    body: "All content on this website — including text, images, videos, logos, and training materials — is the property of Montreal Canine Training Inc. and is protected by Canadian copyright law. You may not reproduce, distribute, or use our content without written permission.",
  },
  {
    heading: "9. Photos & Testimonials",
    body: "We may take photos or videos during training sessions for use on our website, social media, or marketing materials. If you do not wish to be photographed, please let us know before your session. Testimonials are shared with the client's consent.",
  },
  {
    heading: "10. Limitation of Liability",
    body: "To the maximum extent permitted by law, Montreal Canine Training Inc. shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services or website.",
  },
  {
    heading: "11. Governing Law",
    body: "These terms are governed by and construed in accordance with the laws of the Province of Quebec and the federal laws of Canada applicable therein.",
  },
  {
    heading: "12. Changes to These Terms",
    body: "We reserve the right to update these terms at any time. Changes take effect when posted on this page. Continued use of our services constitutes acceptance of the updated terms.",
  },
]

export function generateMetadata() {
  return buildLocalizedMetadata({
    path: "/terms",
    title: { en: "Terms of Service", fr: "Conditions d'utilisation" },
    description: {
      en: "Terms and conditions for using Montreal Canine Training services and website.",
      fr: "Conditions applicables à l'utilisation du site et des services d'Entraînement Canin Montréal.",
    },
  })
}

export default async function TermsPage() {
  const locale = await getRequestLocale()
  const t = (text: string) => getLocalizedText(locale, text)

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto prose prose-neutral">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
            {t("Terms of Service")}
          </h1>
          <p className="text-sm text-muted-foreground mb-10">{t("Last updated: April 7, 2026")}</p>

          {termsSections.map((section) => (
            <div key={section.heading}>
              <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">{t(section.heading)}</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">{t(section.body)}</p>
            </div>
          ))}

          <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">{t("13. Contact Us")}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {locale === "fr" ? "Entraînement Canin Montréal inc." : "Montreal Canine Training Inc."}
            <br />
            7770 Boulevard Henri-Bourassa E, Montreal, Quebec H1E 1P2
            <br />
            <a href="mailto:mtlcaninetraining@gmail.com" className="text-primary hover:underline">
              mtlcaninetraining@gmail.com
            </a>
            <br />
            <a
              href="tel:+15148269558"
              data-conversion-location="terms_contact"
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
