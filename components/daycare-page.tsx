import Image from "next/image"
import Link from "next/link"
import { ArrowDown, Check, Clock3, Phone } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DaycareCalculator } from "@/components/daycare-calculator"
import { DaycarePolicy } from "@/components/daycare-policy"
import { DaycareHouseholdOffer } from "@/components/daycare-household-offer"
import { getRequestLocale, localizedPath } from "@/lib/seo"

export async function DaycarePage({ focus = "daycare" }: { focus?: "daycare" | "day-training" | "regular-daycare" }) {
  const locale = await getRequestLocale()
  const fr = locale === "fr"
  const t = (en: string, french: string) => fr ? french : en
  const training = focus === "day-training"
  const heading = training
    ? t("Their day. Your training goals.", "Sa journée. Vos objectifs.")
    : t("A great day for your dog. Peace of mind for you.", "Une belle journée pour votre chien. L’esprit tranquille pour vous.")
  const included = [
    ["Supervised socialization, when appropriate", "Socialisation supervisée, lorsque cela convient"],
    ["Potty breaks throughout the day", "Sorties pour les besoins durant la journée"],
    ["Feeding as instructed", "Repas selon vos consignes"],
    ["Human interaction and attention", "Interactions et attention de notre équipe"],
    ["Mental and physical enrichment", "Stimulation mentale et physique"],
    ["Structured rest and downtime", "Périodes de repos structurées"],
  ]
  const addOns = [
    { title: t("Complete Training", "Entraînement complet"), price: "+$35", frPrice: "+35 $", kicker: t("Purposeful progress", "Des progrès concrets"), copy: t("Obedience, leash walking, engagement, impulse control, behaviour work and your personal goals. We give you guidance to continue at home.", "Obéissance, marche en laisse, engagement, contrôle des impulsions, comportement et objectifs personnels. Nous vous guidons pour poursuivre à la maison."), detail: t("Half day: 2–3 sessions · Full day: 4–6 sessions", "Demi-journée : 2–3 séances · Journée : 4–6 séances") },
    { title: t("Treadmill Exercise", "Exercice sur tapis roulant"), price: "+$15", frPrice: "+15 $", kicker: t("An outlet for their energy", "Une façon de dépenser son énergie"), copy: t("Supervised exercise adjusted to your dog’s fitness and comfort. Each session lasts up to 15 minutes.", "Exercice supervisé adapté à la condition physique et au confort de votre chien. Chaque séance dure jusqu’à 15 minutes."), detail: t("Half day: 2–3 sessions · Full day: 4–6 sessions", "Demi-journée : 2–3 séances · Journée : 4–6 séances") },
    { title: t("One-on-One Play", "Jeux individuels"), price: "+$20", frPrice: "+20 $", kicker: t("All the attention, just for them", "Toute notre attention, juste pour lui"), copy: t("Fetch, tug, individual walks, enrichment and confidence-building. A personalized option for dogs who aren’t comfortable in group play.", "Rapport d’objet, jeux de traction, promenades individuelles, enrichissement et confiance. Une option personnalisée pour les chiens moins à l’aise en groupe."), detail: t("Interactive play tailored to your dog", "Des activités choisies pour votre chien") },
  ]

  return <main className="min-h-screen bg-background">
    <Header />
    <section className="px-5 pt-32 pb-12 md:px-8 md:pt-40 lg:pb-20">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div>
          <Link href={localizedPath(locale, "/")} className="mb-7 inline-block py-2 text-sm text-muted-foreground">← {t("Home", "Accueil")}</Link>
          <p className="mb-4 text-sm font-semibold text-primary">{t("Daycare & Day Training · Montreal", "Garderie et entraînement de jour · Montréal")}</p>
          <h1 className="max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">{heading}</h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">{training
            ? t("Let our team work on the skills that matter to you while you take care of your day. Add professional training to a half or full day of supervised care.", "Confiez à notre équipe les habiletés qui comptent pour vous pendant que vous vaquez à vos occupations. Ajoutez un entraînement professionnel à une journée ou une demi-journée de garderie.")
            : t("Care, play, learning and time to rest. Start with a half or full day, then add the activities your dog will benefit from most.", "Soins, jeux, apprentissage et repos. Choisissez une journée ou une demi-journée, puis ajoutez les activités qui feront du bien à votre chien.")}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#daycare-pricing" className="inline-flex min-h-14 items-center gap-3 rounded-full bg-primary px-7 py-4 font-semibold text-primary-foreground">{t("Build your dog’s day", "Composer sa journée")}<ArrowDown className="size-4" aria-hidden /></a>
            <a href="#getting-started" className="inline-flex min-h-14 items-center rounded-full border border-border px-7 py-4 font-semibold">{t("How to join", "Comment s’inscrire")}</a>
          </div>
          <div className="mt-7 flex items-start gap-3 text-sm text-muted-foreground"><Clock3 className="mt-0.5 size-5 shrink-0" aria-hidden /><p><span className="block font-semibold text-foreground">{t("Mondays & Tuesdays", "Les lundis et mardis")}</span>{t("7:30 AM–6:30 PM · From November 1, 2026", "7 h 30 à 18 h 30 · Dès le 1er novembre 2026")}</p></div>
        </div>
        <div className="relative w-full max-w-[520px] justify-self-center lg:justify-self-end">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
            <Image src="/images/october-2026/daycare-dogs.webp" alt={t("Two dogs resting on raised beds at Montreal Canine Training", "Deux chiens sur leurs lits surélevés chez MTL Canine Training")} fill priority sizes="(max-width: 1023px) 100vw, 50vw" className="object-cover" />
          </div>
          <div className="absolute bottom-5 right-5 left-5 rounded-2xl bg-background/95 p-5 shadow-sm backdrop-blur-sm">
            <p className="text-sm font-medium">{t("A balanced day, supervised by our team.", "Une journée équilibrée, supervisée par notre équipe.")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("Half day $40 · Full day $55 · Plus tax", "Demi-journée 40 $ · Journée 55 $ · Taxes en sus")}</p>
          </div>
        </div>
      </div>
    </section>

    <section className="border-y border-border bg-secondary/40 px-5 py-14 md:px-8 lg:py-20">
      <div className="mx-auto grid max-w-6xl gap-9 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
        <div><p className="mb-3 text-sm font-semibold text-primary">{t("Included in every visit", "Inclus à chaque visite")}</p><h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("More than just a place to stay.", "Bien plus qu’un endroit où passer la journée.")}</h2><p className="mt-5 leading-relaxed text-muted-foreground">{t("We balance activity and rest, with socialization based on each dog’s comfort and compatibility. Dogs don’t have to join a playgroup to have a fulfilling day.", "Nous équilibrons activité et repos. La socialisation dépend du confort et de la compatibilité des chiens. Votre chien n’a pas besoin de jouer en groupe pour profiter pleinement de sa journée.")}</p></div>
        <ul className="grid content-center gap-5 sm:grid-cols-2">{included.map(([en, french]) => <li key={en} className="flex gap-3 leading-relaxed"><span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10"><Check className="size-4 text-primary" aria-hidden /></span>{t(en, french)}</li>)}</ul>
      </div>
    </section>

    <section id="programs" className="scroll-mt-28 px-5 py-14 md:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <p className="mb-3 text-sm font-semibold text-primary">{t("À la carte add-ons", "Options à la carte")}</p>
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">{t("A little more of what they need.", "Un peu plus de ce dont il a besoin.")}</h2>
        <div className="mt-9 grid gap-5 lg:grid-cols-3">{addOns.map((option, i) => <article key={option.title} className="flex flex-col rounded-3xl border border-border p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">0{i+1} · {option.kicker}</p>
          <h3 className="mt-5 text-2xl font-semibold">{option.title}</h3>
          <p className="mt-4 text-4xl font-semibold tracking-tight text-primary">{fr ? option.frPrice : option.price}<span className="ml-2 text-sm font-normal text-muted-foreground">{t("/ visit + tax", "/ visite + taxes")}</span></p>
          <p className="mt-5 flex-1 leading-relaxed text-muted-foreground">{option.copy}</p>
          <p className="mt-6 border-t border-border pt-5 text-sm font-medium">{option.detail}</p>
        </article>)}</div>
        <div className="mt-5 flex flex-col justify-between gap-5 rounded-3xl bg-secondary/15 px-7 py-6 sm:flex-row sm:items-center">
          <div><h3 className="text-xl font-semibold">{t("The full experience", "L’expérience complète")}</h3><p className="mt-1 text-sm text-muted-foreground">{t("Daycare + all three add-ons", "Garderie + les trois options")}</p></div>
          <p className="text-lg font-semibold">{t("Half day $110 · Full day $125", "Demi-journée 110 $ · Journée 125 $")}<span className="mt-1 block text-sm font-normal text-muted-foreground">{t("CAD, plus applicable taxes", "Dollars canadiens, taxes en sus")}</span></p>
        </div>
      </div>
    </section>

    <section id="daycare-pricing" className="scroll-mt-28 border-y border-border bg-white/50 px-5 py-14 md:px-8 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-sm font-semibold text-primary">{t("Simple, flexible pricing", "Des tarifs simples et flexibles")}</p>
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("Build their day. See your price.", "Composez sa journée. Voyez votre prix.")}</h2>
        <p className="mt-4 mb-10 max-w-2xl leading-relaxed text-muted-foreground">{t("Bundle 5 visits and save 5%, 10 visits and save 7%, or 20 visits and save 12%. Your selected add-ons receive the same discount.", "Économisez 5 % sur 5 visites, 7 % sur 10 visites ou 12 % sur 20 visites. Le même rabais s’applique aux options choisies.")}</p>
        <DaycareHouseholdOffer locale={locale} />
        <DaycareCalculator locale={locale} />
      </div>
    </section>

    <DaycarePolicy locale={locale} />

    <section id="getting-started" className="scroll-mt-28 px-5 py-14 md:px-8 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("Let’s make sure it’s the right fit.", "Assurons-nous que le programme lui convient.")}</h2>
        <div className="mt-9 grid gap-8 md:grid-cols-3">{[
          [t("Tell us about your dog", "Parlez-nous de votre chien"), t("Start with our intake questionnaire: your dog’s routine, behaviour, health and what you’re looking for.", "Notre questionnaire porte sur la routine, le comportement, la santé de votre chien et vos attentes.")],
          [t("A complimentary phone evaluation", "Une évaluation téléphonique gratuite"), t("Our team reviews your answers and speaks with you for up to 15 minutes. An in-person assessment may also be needed.", "Notre équipe examine vos réponses et vous appelle pendant un maximum de 15 minutes. Une évaluation en personne peut aussi être nécessaire.")],
          [t("Approval, then booking access", "Approbation, puis accès aux réservations"), t("Once approved, our team sends your personal reusable code. Purchase visits securely online, then reserve available dates in your portal. Submitting a request does not guarantee acceptance.", "Après approbation, notre équipe vous envoie votre code personnel réutilisable. Achetez vos visites en ligne, puis réservez les dates disponibles dans votre portail. Une demande ne garantit pas l’admission.")],
        ].map(([title, copy], i) => <div key={title}><span className="mb-4 flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">0{i+1}</span><h3 className="text-xl font-semibold">{title}</h3><p className="mt-3 leading-relaxed text-muted-foreground">{copy}</p></div>)}</div>
        <div className="mt-10 flex flex-col items-start gap-4 rounded-3xl bg-secondary/15 p-7 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="text-xl font-semibold">{t("Interested in joining?", "Envie de vous inscrire?")}</h3><p className="mt-2 text-sm text-muted-foreground">{t("Apply for admission first. No payment is required to apply. Already approved?", "Faites d’abord une demande d’admission, sans paiement. Déjà approuvé?")} <a href={localizedPath(locale, "/daycare/book")} className="underline underline-offset-4">{t("Open your booking portal", "Ouvrir votre portail")}</a></p></div>
          {/* Full navigation starts a clean intake document without advertising scripts. */}
          <a href={localizedPath(locale, "/daycare/apply")} className="inline-flex min-h-14 items-center justify-center rounded-full bg-primary px-7 py-4 text-center font-semibold text-primary-foreground">{t("Apply for daycare", "Demande d’admission")}</a>
        </div>
        <a href="tel:+15148269558" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary underline underline-offset-4"><Phone className="size-4" aria-hidden />{t("Questions? Call", "Une question? Appelez le")} 514 826 9558</a>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-5 pb-16 md:px-8">
      <h2 className="mb-6 text-2xl font-semibold">{t("A look inside our daycare", "Un aperçu de notre garderie")}</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl"><Image src="/images/october-2026/daycare-shepherd.webp" alt={t("A shepherd relaxing during structured rest at our facility", "Un berger se repose durant une pause structurée au centre")} fill sizes="(max-width: 639px) 100vw, 50vw" className="object-cover" /></div>
        <video controls playsInline preload="none" poster="/images/october-2026/daycare-video-poster.webp" className="aspect-[4/5] h-full w-full rounded-3xl bg-foreground object-contain" aria-label={t("Dogs at Montreal Canine Training daycare", "Les chiens à la garderie de MTL Canine Training")}>
          <source src="/videos/october-2026/daycare.mp4" type="video/mp4" />
          {t("Your browser does not support this video.", "Votre navigateur ne prend pas en charge cette vidéo.")}
        </video>
      </div>
    </section>
    <Footer />
  </main>
}
