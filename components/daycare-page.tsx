import Link from "next/link"
import { ArrowDown, ArrowRight, CalendarDays, Check, Clock3, Phone } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DaycareCalculator } from "@/components/daycare-calculator"
import { DaycarePolicy } from "@/components/daycare-policy"
import { DaycareHouseholdOffer } from "@/components/daycare-household-offer"
import { EditableImage } from "@/components/editable-image"
import { EditableText } from "@/components/editable-text"
import { DAYCARE_ADD_ON_CENTS, DAYCARE_BASE_CENTS, DAYCARE_PROMO, daycareDiscountPercent, daycareMoney, daycarePromoActive, quoteDaycare } from "@/lib/daycare-pricing"
import { DaycarePromoBanner } from "@/components/daycare-promo-banner"
import type { TextFieldId } from "@/lib/site-editing/fields"
import { getRequestLocale, localizedPath } from "@/lib/seo"
import { getBusinessDetails } from "@/lib/business-details"
import { EditableCopy } from "@/components/editable-copy"

// Owner-editable copy lives in content/editable-fields.json. Prices, product
// names, opening hours and the phone number stay here on purpose: they must
// match Square and the booking rules, so they are not editable from the admin.

export async function DaycarePage({ focus = "daycare" }: { focus?: "daycare" | "day-training" | "regular-daycare" }) {
  const locale = await getRequestLocale()
  const fr = locale === "fr"
  const t = (en: string, french: string) => fr ? french : en
  const training = focus === "day-training"
  const money = (cents: number) => daycareMoney(cents, locale)
  const now = Date.now()
  const promoOn = daycarePromoActive(now)
  const pct = (visits: 5 | 10 | 20) => daycareDiscountPercent(visits, now)
  const fullExperience = (stay: "half" | "full") => money(quoteDaycare(stay, ["training", "treadmill", "individual"], 1).totalCents)
  const text = (id: TextFieldId) => <EditableText id={id} locale={locale} />
  const included: TextFieldId[] = [
    "daycare.included.item1",
    "daycare.included.item2",
    "daycare.included.item3",
    "daycare.included.item4",
    "daycare.included.item5",
    "daycare.included.item6",
  ]
  // Titles are product names shared with the calculator and Square, so they stay in code.
  const addOns = [
    { title: t("Complete Training", "Entraînement complet"), price: DAYCARE_ADD_ON_CENTS.training, kicker: text("daycare.addOns.training.kicker"), copy: text("daycare.addOns.training.description"), detail: text("daycare.addOns.training.sessions") },
    { title: t("Treadmill Exercise", "Exercice sur tapis roulant"), price: DAYCARE_ADD_ON_CENTS.treadmill, kicker: text("daycare.addOns.treadmill.kicker"), copy: text("daycare.addOns.treadmill.description"), detail: text("daycare.addOns.treadmill.sessions") },
    { title: t("One-on-One Play", "Jeux individuels"), price: DAYCARE_ADD_ON_CENTS.individual, kicker: text("daycare.addOns.individual.kicker"), copy: text("daycare.addOns.individual.description"), detail: text("daycare.addOns.individual.detail") },
  ]

  return <main className="min-h-screen bg-background">
    <Header />
    <section className="px-5 pt-32 pb-12 md:px-8 md:pt-40 lg:pb-20">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div>
          <Link href={localizedPath(locale, "/")} className="mb-7 inline-block py-2 text-sm text-muted-foreground">← {t("Home", "Accueil")}</Link>
          <DaycarePromoBanner locale={locale} now={now} className="mb-8" />
          <p className="mb-4 text-sm font-semibold text-primary">{text("daycare.hero.eyebrow")}</p>
          <h1 className="max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">{text(training ? "daycare.hero.headingDayTraining" : "daycare.hero.heading")}</h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">{text(training ? "daycare.hero.introDayTraining" : "daycare.hero.intro")}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#daycare-pricing" className="inline-flex min-h-14 items-center gap-3 rounded-full bg-primary px-7 py-4 font-semibold text-primary-foreground">{text("daycare.hero.primaryButton")}<ArrowDown className="size-4" aria-hidden /></a>
            <a href="#getting-started" className="inline-flex min-h-14 items-center rounded-full border border-border px-7 py-4 font-semibold">{text("daycare.hero.secondaryButton")}</a>
          </div>
          <div className="mt-7 flex items-start gap-3 text-sm text-muted-foreground"><Clock3 className="mt-0.5 size-5 shrink-0" aria-hidden /><p><span className="block font-semibold text-foreground">{t("Mondays & Tuesdays", "Les lundis et mardis")}</span>{t("7:30 AM–6:30 PM · From November 1, 2026", "7 h 30 à 18 h 30 · Dès le 1er novembre 2026")}</p></div>
        </div>
        <div className="relative w-full max-w-[520px] justify-self-center lg:justify-self-end">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
            <EditableImage id="daycare.hero.photo" locale={locale} fill priority sizes="(max-width: 1023px) 100vw, 50vw" className="object-cover" />
          </div>
          <div className="absolute bottom-5 right-5 left-5 rounded-2xl bg-background/95 p-5 shadow-sm backdrop-blur-sm">
            <p className="text-sm font-medium">{text("daycare.hero.photoCaption")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("Half day", "Demi-journée")} {money(DAYCARE_BASE_CENTS.half)} · {t("Full day", "Journée")} {money(DAYCARE_BASE_CENTS.full)} · {t("Plus tax","Taxes en sus")}</p>
          </div>
        </div>
      </div>
    </section>

    <section className="border-y border-border bg-secondary/40 px-5 py-14 md:px-8 lg:py-20">
      <div className="mx-auto grid max-w-6xl gap-9 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
        <div><p className="mb-3 text-sm font-semibold text-primary">{text("daycare.included.eyebrow")}</p><h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{text("daycare.included.heading")}</h2><p className="mt-5 leading-relaxed text-muted-foreground">{text("daycare.included.body")}</p></div>
        <ul className="grid content-center gap-5 sm:grid-cols-2">{included.map((id) => <li key={id} className="flex gap-3 leading-relaxed"><span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10"><Check className="size-4 text-primary" aria-hidden /></span>{text(id)}</li>)}</ul>
      </div>
    </section>

    <section id="programs" className="scroll-mt-28 px-5 py-14 md:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <p className="mb-3 text-sm font-semibold text-primary">{text("daycare.addOns.eyebrow")}</p>
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">{text("daycare.addOns.heading")}</h2>
        <div className="mt-9 grid gap-5 lg:grid-cols-3">{addOns.map((option, i) => <article key={option.title} className="flex flex-col rounded-3xl border border-border p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">0{i+1} · {option.kicker}</p>
          <h3 className="mt-5 text-2xl font-semibold">{option.title}</h3>
          <p className="mt-4 text-4xl font-semibold tracking-tight text-primary">+{money(option.price)}<span className="ml-2 text-sm font-normal text-muted-foreground">{t("/ visit + tax", "/ visite + taxes")}</span></p>
          <p className="mt-5 flex-1 leading-relaxed text-muted-foreground">{option.copy}</p>
          <p className="mt-6 border-t border-border pt-5 text-sm font-medium">{option.detail}</p>
        </article>)}</div>
        <div className="mt-5 flex flex-col justify-between gap-5 rounded-3xl bg-secondary/15 px-7 py-6 sm:flex-row sm:items-center">
          <div><h3 className="text-xl font-semibold">{text("daycare.addOns.fullExperience.title")}</h3><p className="mt-1 text-sm text-muted-foreground">{text("daycare.addOns.fullExperience.subtitle")}</p></div>
          <p className="text-lg font-semibold">{t(`Half day ${fullExperience("half")} · Full day ${fullExperience("full")}`, `Demi-journée ${fullExperience("half")} · Journée ${fullExperience("full")}`)}<span className="mt-1 block text-sm font-normal text-muted-foreground">{t("CAD, plus applicable taxes", "Dollars canadiens, taxes en sus")}</span></p>
        </div>
      </div>
    </section>

    <section id="daycare-pricing" className="scroll-mt-28 border-y border-border bg-white/50 px-5 py-14 md:px-8 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-sm font-semibold text-primary">{text("daycare.pricing.eyebrow")}</p>
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{text("daycare.pricing.heading")}</h2>
        <p className="mt-4 mb-10 max-w-2xl leading-relaxed text-muted-foreground">{t(`Bundle 5 visits and save ${pct(5)}%, 10 visits and save ${pct(10)}%, or 20 visits and save ${pct(20)}%. Your selected add-ons receive the same discount.`, `Économisez ${pct(5)} % sur 5 visites, ${pct(10)} % sur 10 visites ou ${pct(20)} % sur 20 visites. Le même rabais s’applique aux options choisies.`)}{promoOn && <strong className="text-foreground"> {t(`${DAYCARE_PROMO.en} pricing until Sunday at midnight, applied automatically.`, `Prix du ${DAYCARE_PROMO.fr} jusqu’à dimanche minuit, appliqués automatiquement.`)}</strong>}</p>
        <DaycareCalculator locale={locale} initialNow={now} />
      </div>
    </section>

    <DaycarePolicy locale={locale} />

    <section id="getting-started" className="scroll-mt-28 px-5 py-14 md:px-8 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{text("daycare.steps.heading")}</h2>
        <div className="mt-9 grid gap-8 md:grid-cols-3">{([
          ["daycare.steps.step1.title", "daycare.steps.step1.body"],
          ["daycare.steps.step2.title", "daycare.steps.step2.body"],
          ["daycare.steps.step3.title", "daycare.steps.step3.body"],
        ] satisfies [TextFieldId, TextFieldId][]).map(([title, copy], i) => <div key={title}><span className="mb-4 flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">0{i+1}</span><h3 className="text-xl font-semibold">{text(title)}</h3><p className="mt-3 leading-relaxed text-muted-foreground">{text(copy)}</p></div>)}</div>
        <div id="daycare-next-step" className="mt-10 grid scroll-mt-28 gap-5 md:grid-cols-2">
          <article aria-labelledby="daycare-approved-heading" className="flex flex-col rounded-3xl bg-primary p-6 text-primary-foreground sm:p-8">
            <h3 id="daycare-approved-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">{text("daycare.approved.heading")}</h3>
            <p className="mt-3 mb-7 leading-relaxed text-primary-foreground/90">{text("daycare.approved.body")}</p>
            <a href={localizedPath(locale, "/daycare/book")} className="mt-auto inline-flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-background px-5 py-4 text-center text-lg font-semibold leading-snug text-primary transition-colors hover:bg-background/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-foreground sm:px-7">
              <CalendarDays className="size-6 shrink-0" aria-hidden />
              <span>{text("daycare.approved.button")}</span>
              <ArrowRight className="size-5 shrink-0" aria-hidden />
            </a>
          </article>
          <article aria-labelledby="daycare-new-heading" className="flex flex-col rounded-3xl border border-border bg-secondary/10 p-6 sm:p-8">
            <h3 id="daycare-new-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">{text("daycare.new.heading")}</h3>
            <p className="mt-3 mb-7 leading-relaxed text-muted-foreground">{text("daycare.new.body")}</p>
            {/* Full navigation starts a clean intake document without advertising scripts. */}
            <a href={localizedPath(locale, "/daycare/apply")} className="mt-auto inline-flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl border border-primary/40 bg-background px-5 py-4 text-center text-lg font-semibold leading-snug text-primary transition-colors hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:px-7">
              <span>{text("daycare.new.button")}</span>
              <ArrowRight className="size-5 shrink-0" aria-hidden />
            </a>
          </article>
        </div>
        <a href={getBusinessDetails().phoneHref} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary underline underline-offset-4"><Phone className="size-4" aria-hidden />{t("Questions? Call", "Une question? Appelez le")} <EditableCopy id="business.phone" copy={{ en: getBusinessDetails().phone, fr: getBusinessDetails().phone }} locale={locale} /></a>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-5 pb-16 md:px-8">
      <h2 className="mb-6 text-2xl font-semibold">{text("daycare.gallery.heading")}</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl"><EditableImage id="daycare.gallery.photo" locale={locale} fill sizes="(max-width: 639px) 100vw, 50vw" className="object-cover" /></div>
        <video controls playsInline preload="none" poster="/images/october-2026/daycare-video-poster.webp" className="aspect-[4/5] h-full w-full rounded-3xl bg-foreground object-contain" aria-label={t("Dogs at Montreal Canine Training daycare", "Les chiens à la garderie de MTL Canine Training")}>
          <source src="/videos/october-2026/daycare.mp4" type="video/mp4" />
          {t("Your browser does not support this video.", "Votre navigateur ne prend pas en charge cette vidéo.")}
        </video>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-5 pb-16 md:px-8">
      <DaycareHouseholdOffer locale={locale} />
    </section>
    <Footer />
  </main>
}
