import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { DaycareBookingPortal } from "@/components/daycare-booking-portal";
import { getRequestLocale } from "@/lib/seo";
export const metadata = {
  title: "Daycare booking portal | MTL Canine Training",
  robots: { index: false, follow: false },
};
export default async function DaycareBookingPage() {
  const locale = await getRequestLocale();
  return (
    <main className="min-h-screen bg-secondary/20">
      <Header />
      <section className="mx-auto max-w-6xl px-5 pt-32 pb-16 md:pt-40">
        <p className="mb-3 text-sm font-semibold text-primary">
          MTL Canine Training
        </p>
        <h1 className="mb-8 text-4xl font-semibold tracking-tight">
          {locale === "fr"
            ? "Votre portail garderie"
            : "Your daycare booking portal"}
        </h1>
        <DaycareBookingPortal locale={locale} />
      </section>
      <Footer />
    </main>
  );
}
