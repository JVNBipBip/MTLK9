import Link from "next/link"
import { ArrowUpRight, Dog, GraduationCap, Scissors, Sun, Target } from "lucide-react"
import { EditableText } from "@/components/editable-text"
import type { TextFieldId } from "@/lib/site-editing/fields"
import { getRequestLocale, localizedPath } from "@/lib/seo"

const services = [
  { path: "/services", icon: Target, name: "home.services.training.name", description: "home.services.training.description" },
  { path: "/day-training", icon: Sun, name: "home.services.dayTraining.name", description: "home.services.dayTraining.description" },
  { path: "/regular-daycare", icon: Dog, name: "home.services.daycare.name", description: "home.services.daycare.description" },
  { path: "/grooming", icon: Scissors, name: "home.services.grooming.name", description: "home.services.grooming.description" },
  { path: "/apprenticeships", icon: GraduationCap, name: "home.services.apprenticeships.name", description: "home.services.apprenticeships.description" },
] as const satisfies readonly ({ name: TextFieldId; description: TextFieldId } & Record<string, unknown>)[]

// The offer link stays here: it states a discount, and discounts are changed in code.

export async function ServicesOverview() {
  const locale = await getRequestLocale()
  return <section className="border-b border-border bg-secondary/35 px-5 py-12 md:px-8 lg:py-16" aria-labelledby="services-overview-heading">
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div><p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><EditableText id="home.services.eyebrow" locale={locale} /></p><h2 id="services-overview-heading" className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl"><EditableText id="home.services.heading" locale={locale} /></h2><p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground"><EditableText id="home.services.intro" locale={locale} /></p></div>
        <Link href={localizedPath(locale, "/training-offer")} className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-primary/25 px-5 py-3 text-sm font-semibold text-primary hover:bg-primary/5">{locale === "fr" ? "Découvrez l’offre de 30 %" : "Explore the 30% offer"}<ArrowUpRight className="size-4" aria-hidden /></Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {services.map(({ icon: Icon, ...service }) => <Link key={service.path} href={localizedPath(locale, service.path)} className="group flex min-h-48 flex-col rounded-2xl border border-border bg-background p-5 transition-colors hover:border-primary/40 hover:bg-primary/5">
          <div className="mb-5 flex items-center justify-between"><Icon className="size-6 text-primary" aria-hidden /><ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden /></div>
          <h3 className="text-lg font-semibold leading-tight"><EditableText id={service.name} locale={locale} /></h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground"><EditableText id={service.description} locale={locale} /></p>
          {(service.path === "/day-training" || service.path === "/regular-daycare") && <p className="mt-auto pt-4 text-xs font-semibold text-primary"><EditableText id="home.services.daycareSchedule" locale={locale} /></p>}
          {service.path === "/apprenticeships" && <p className="mt-auto pt-4 text-xs font-semibold text-primary"><EditableText id="home.services.apprenticeshipsDate" locale={locale} /></p>}
        </Link>)}
      </div>
    </div>
  </section>
}
