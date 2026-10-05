import Link from "next/link"
import { ArrowUpRight, Dog, GraduationCap, Scissors, Sun, Target } from "lucide-react"
import { getRequestLocale, localizedPath } from "@/lib/seo"

const services = [
  { path: "/services", icon: Target, en: "Dog Training", fr: "Entraînement canin", descEn: "A clear plan for your dog’s behaviour and everyday skills.", descFr: "Un plan clair pour le comportement et les habiletés de votre chien." },
  { path: "/day-training", icon: Sun, en: "Day Training", fr: "Entraînement de jour", descEn: "Professional training while you get on with your day.", descFr: "Un entraînement professionnel pendant votre journée." },
  { path: "/regular-daycare", icon: Dog, en: "Daycare", fr: "Garderie", descEn: "Supervised play, enrichment, socialization, and rest.", descFr: "Jeux supervisés, enrichissement, socialisation et repos." },
  { path: "/grooming", icon: Scissors, en: "Grooming", fr: "Toilettage", descEn: "Discover the grooming side of our canine family.", descFr: "Découvrez le côté toilettage de notre famille canine." },
  { path: "/apprenticeships", icon: GraduationCap, en: "Dog Trainer Apprenticeships", fr: "Apprentissage pour entraîneurs canins", descEn: "Explore a professional path working with dogs.", descFr: "Explorez un parcours professionnel avec les chiens." },
] as const

export async function ServicesOverview() {
  const locale = await getRequestLocale()
  return <section className="border-b border-border bg-secondary/35 px-5 py-12 md:px-8 lg:py-16" aria-labelledby="services-overview-heading">
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div><p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary">{locale === "fr" ? "Une école. Toute une équipe." : "One school. A whole team."}</p><h2 id="services-overview-heading" className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">{locale === "fr" ? "Bien plus que l’entraînement canin." : "More than dog training."}</h2><p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{locale === "fr" ? "Entraînement, garderie, toilettage et programmes professionnels : découvrez notre école et notre centre canin à Montréal." : "Training, daycare, grooming, and professional programs. Discover our full-service dog school and canine facility in Montreal."}</p></div>
        <Link href={localizedPath(locale, "/training-offer")} className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-primary/25 px-5 py-3 text-sm font-semibold text-primary hover:bg-primary/5">{locale === "fr" ? "Découvrez l’offre de 30 %" : "Explore the 30% offer"}<ArrowUpRight className="size-4" aria-hidden /></Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {services.map(({ icon: Icon, ...service }) => <Link key={service.path} href={localizedPath(locale, service.path)} className="group flex min-h-48 flex-col rounded-2xl border border-border bg-background p-5 transition-colors hover:border-primary/40 hover:bg-primary/5">
          <div className="mb-5 flex items-center justify-between"><Icon className="size-6 text-primary" aria-hidden /><ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden /></div>
          <h3 className="text-lg font-semibold leading-tight">{service[locale]}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{locale === "fr" ? service.descFr : service.descEn}</p>
          {(service.path === "/day-training" || service.path === "/regular-daycare") && <p className="mt-auto pt-4 text-xs font-semibold text-primary">{locale === "fr" ? "Dès le 1er novembre" : "Starting November 1"}</p>}
        </Link>)}
      </div>
    </div>
  </section>
}
