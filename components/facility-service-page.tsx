import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, Check, Instagram } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ServiceInquiryButton } from "@/components/service-inquiry-button"
import { facilityServices, serviceCopy, type FacilityService, type FacilityServiceId } from "@/lib/facility-services"
import { buildLocalizedMetadata, getRequestLocale, localizedPath } from "@/lib/seo"

export function facilityServiceMetadata(id: FacilityServiceId) {
  const { path, title, description } = facilityServices[id]
  return buildLocalizedMetadata({ path, title, description })
}

export async function FacilityServicePage({ id }: { id: FacilityServiceId }) {
  const locale = await getRequestLocale()
  const service: FacilityService = facilityServices[id]
  const t = (copy: { en: string; fr: string }) => serviceCopy(copy, locale)
  const linkClass = "inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-primary px-7 py-4 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
  const action = service.interest ? (
    <ServiceInquiryButton interest={service.interest}>{t(service.cta)}</ServiceInquiryButton>
  ) : id === "grooming" ? (
    <a href="https://mtlcaninespa.com" target="_blank" rel="noopener noreferrer" data-conversion-location="grooming_page" className={linkClass}>
      {t(service.cta)}<ArrowUpRight className="size-5 shrink-0" aria-hidden />
    </a>
  ) : id === "apprenticeships" ? (
    <a href={`mailto:mtlcaninetraining@gmail.com?subject=${encodeURIComponent(locale === "fr" ? "Programmes d’apprentissage en entraînement canin" : "Dog Trainer Apprenticeship Programs")}`} className={linkClass}>
      {t(service.cta)}<ArrowUpRight className="size-5 shrink-0" aria-hidden />
    </a>
  ) : (
    <a href="#programs" className={linkClass}>{t(service.cta)}<ArrowRight className="size-5 shrink-0" aria-hidden /></a>
  )

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="px-5 pt-32 pb-14 md:px-8 md:pt-40 lg:pb-20">
        <div className="mx-auto max-w-7xl">
          <Link href={localizedPath(locale, id === "day-training" || id === "regular-daycare" ? "/daycare" : "/")} className="mb-8 inline-flex min-h-10 items-center text-sm font-medium text-muted-foreground hover:text-primary">
            ← {id === "day-training" || id === "regular-daycare" ? (locale === "fr" ? "Comparer les programmes" : "Compare programs") : (locale === "fr" ? "Accueil" : "Home")}
          </Link>
          <div className="grid items-center gap-9 lg:grid-cols-2 lg:gap-14">
            <div>
              <p className="mb-5 text-sm font-semibold tracking-wide text-primary">{t(service.eyebrow)}</p>
              <h1 className="max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">{t(service.heading)}</h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{t(service.intro)}</p>
              <div className="mt-8">{action}</div>
              {(id === "day-training" || id === "regular-daycare" || id === "daycare") && (
                <p className="mt-5 text-sm text-muted-foreground">{locale === "fr" ? "Journées et demi-journées · Évaluation préalable" : "Full days & half days · Assessment required"}</p>
              )}
            </div>
            <div className={`relative overflow-hidden rounded-[2rem] bg-muted ${id === "grooming" ? "aspect-[4/3]" : "aspect-[5/4]"}`}>
              <Image src={service.image} alt={t(service.imageAlt)} fill priority sizes="(max-width: 1023px) 100vw, 50vw" className={`object-cover ${id === "day-training" ? "object-[50%_25%]" : ""}`} />
            </div>
          </div>
        </div>
      </section>

      {id === "daycare" && (
        <section id="programs" className="scroll-mt-28 border-t border-border bg-secondary/40 px-5 py-14 md:px-8 lg:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-8 text-3xl font-semibold tracking-tight md:text-4xl">{locale === "fr" ? "Quel programme aimeriez-vous pour votre chien?" : "What program would you like for your dog?"}</h2>
            <div className="grid gap-5 md:grid-cols-2">
              {(["day-training", "regular-daycare"] as const).map((program, index) => (
                <Link key={program} href={localizedPath(locale, facilityServices[program].path)} className="group flex flex-col rounded-3xl border border-border bg-background p-7 transition-all hover:border-primary/40 hover:shadow-lg md:p-9">
                  <span className="mb-5 text-sm font-semibold text-primary">0{index + 1}</span>
                  <h3 className="text-2xl font-semibold">{program === "day-training" ? (locale === "fr" ? "Entraînement de jour" : "Day Training Program") : (locale === "fr" ? "Garderie canine" : "Regular Daycare Program")}</h3>
                  <p className="mt-4 flex-1 leading-relaxed text-muted-foreground">{program === "day-training" ? (locale === "fr" ? "Un programme structuré avec un entraîneur, selon vos objectifs : obéissance, marche en laisse, engagement et comportement. Votre chien doit être habitué à la cage pour les pauses." : "A structured training day with a professional, based on your goals: obedience, leash walking, engagement, and behaviour. Your dog must be crate trained for rest between sessions.") : (locale === "fr" ? "Une journée active de jeux, de socialisation, d’enrichissement et de repos, avec une supervision professionnelle pendant vos occupations." : "An active day of play, socialization, enrichment, and rest, with professional supervision while you’re busy.")}</p>
                  <span className="mt-7 inline-flex items-center gap-3 font-semibold text-primary">{locale === "fr" ? "Découvrir le programme" : "Explore the program"}<ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {service.sections.length > 0 && (
        <div className="mx-auto max-w-6xl px-5 pb-16 md:px-8 lg:pb-24">
          {service.sections.map((section, index) => (
            <section key={section.title.en} className="grid gap-5 border-t border-border py-9 md:grid-cols-[1fr_1.7fr] md:gap-12 md:py-12">
              <div><p className="mb-3 text-xs font-semibold tracking-widest text-primary">0{index + 1}</p><h2 className="text-2xl font-semibold leading-tight tracking-tight md:text-3xl">{t(section.title)}</h2></div>
              <div>
                {section.paragraphs?.map((paragraph) => <p key={paragraph.en} className="mb-5 text-base leading-relaxed text-muted-foreground last:mb-0 md:text-lg">{t(paragraph)}</p>)}
                {section.items && <ul className="mt-6 grid gap-4">{section.items.map((item) => <li key={item.en} className="flex items-start gap-3 leading-relaxed"><span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10"><Check className="size-3.5 text-primary" aria-hidden /></span><span>{t(item)}</span></li>)}</ul>}
              </div>
            </section>
          ))}
          <div className="rounded-3xl bg-secondary p-7 md:p-10">
            <h2 className="mb-5 text-2xl font-semibold">{locale === "fr" ? "Parlons de la prochaine étape." : "Let’s talk about the next step."}</h2>
            {action}
            <a href="tel:+15148269558" className="mt-5 block w-fit text-sm font-medium text-primary underline underline-offset-4">{locale === "fr" ? "Une question? Appelez le" : "Questions? Call"} 514 826 9558</a>
          </div>
        </div>
      )}

      {id === "grooming" && <section className="mx-auto max-w-7xl px-5 pb-16 md:px-8"><a href="https://www.instagram.com/mtlcaninespa/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-3 font-medium text-primary hover:underline"><Instagram className="size-5" aria-hidden />{locale === "fr" ? "Suivre @mtlcaninespa" : "Follow @mtlcaninespa"}<ArrowUpRight className="size-4" aria-hidden /></a></section>}
      <Footer />
    </main>
  )
}
