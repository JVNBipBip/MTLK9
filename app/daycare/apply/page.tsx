import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DaycareApplicationForm } from "@/components/daycare-application-form"
import { buildLocalizedMetadata, getRequestLocale } from "@/lib/seo"

export function generateMetadata() {
  return buildLocalizedMetadata({ path: "/daycare/apply", title: { en: "Daycare Application | MTL Canine Training", fr: "Demande d’admission en garderie | MTL Canine Training" }, description: { en: "Tell us about your dog before a free phone evaluation. Admission requires trainer approval.", fr: "Parlez-nous de votre chien avant une évaluation téléphonique gratuite. L’admission exige l’approbation d’un entraîneur." } })
}

export default async function DaycareApplyPage() {
  const locale = await getRequestLocale()
  const fr = locale === "fr"
  return <main className="min-h-screen bg-secondary/20"><Header /><section className="mx-auto max-w-3xl px-5 pt-32 pb-16 md:pt-40">
    <Link href={`/${locale}/daycare`} className="mb-5 inline-block min-h-11 text-sm text-muted-foreground">← {fr ? "Retour à la garderie" : "Back to daycare"}</Link>
    <p className="mb-3 text-sm font-semibold text-primary">{fr ? "Garderie et entraînement de jour" : "Daycare & Day Training"}</p>
    <h1 className="text-4xl font-semibold leading-tight tracking-tight">{fr ? "Commençons par connaître votre chien." : "Let’s get to know your dog."}</h1>
    <p className="mt-5 mb-8 leading-relaxed text-muted-foreground">{fr ? "Quelques questions pour préparer votre évaluation téléphonique gratuite. Vous pourrez vérifier vos réponses avant l’envoi. Aucun paiement à cette étape." : "A few questions to prepare for your free phone evaluation. You can review your answers before sending. No payment at this stage."}</p>
    <DaycareApplicationForm locale={locale} />
  </section><Footer /></main>
}
