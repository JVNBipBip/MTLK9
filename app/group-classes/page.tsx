import { Suspense } from "react"
import Image from "next/image"
import { ArrowRight, CalendarCheck, ClipboardCheck, Sparkles, Users } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BookingLink } from "@/components/booking-form-provider"
import { Button } from "@/components/ui/button"
import { GroupClassesBookingPanel } from "./group-classes-booking-panel"

type GroupOffering = {
  id: string
  label: string
  forText: string
  summary: string
  bullets: string[]
  image: string
  packagePrice?: string
  unitPrice?: string
  packageDetail?: string
  note?: string
}

const OFFERINGS: GroupOffering[] = [
  {
    id: "puppy-socialization-class",
    label: "Puppy Socialization Class",
    forText: "Puppies",
    summary: "Safe early socialization, confidence building, and trainer-guided puppy manners.",
    bullets: ["Confident socialization", "Body handling", "Early manners"],
    image: "/images/Classes images/puppy.webp",
    packagePrice: "$50 + tax",
  },
  {
    id: "teen-puppy-class",
    label: "Teen Puppy Class",
    forText: "Teen puppies",
    summary: "A structured class for adolescent dogs building focus, manners, and engagement around distractions.",
    bullets: ["Focus around distractions", "Leash and impulse control", "Handler coaching"],
    image: "/images/Classes images/puppy.webp",
    unitPrice: "$90 + tax",
  },
  {
    id: "reactivity-group-class",
    label: "Reactivity Group Class",
    forText: "For dogs who struggle around triggers",
    summary: "Structured reactivity work with distance management and controlled reps.",
    bullets: ["Engage-Disengage pattern", "Threshold distance work", "Handler coaching"],
    image: "/images/Classes images/reactivity.webp",
    packagePrice: "$360 + tax",
    unitPrice: "$95 + tax",
  },
  {
    id: "level-1-obedience-class",
    label: "Level 1 Obedience Class",
    forText: "Foundation obedience",
    summary: "Practical manners, reliable basics, and calm work around distractions.",
    bullets: ["Loose-leash walking", "Sit / down / stay / recall", "Impulse control"],
    image: "/images/Classes images/obedience.webp",
    packagePrice: "$360 + tax",
    unitPrice: "$95 + tax",
    packageDetail: "4 classes",
  },
  {
    id: "level-2-obedience-class",
    label: "Level 2 Obedience Class",
    forText: "Intermediate obedience",
    summary: "The next step for dogs ready to build stronger obedience, duration, and distraction work.",
    bullets: ["More reliability", "Distance and duration", "Proofing around distractions"],
    image: "/images/Classes images/obedience.webp",
    packagePrice: "$450 + tax",
  },
  {
    id: "level-3-obedience-class",
    label: "Level 3 Obedience Class",
    forText: "Advanced obedience",
    summary: "Advanced group obedience for teams ready for more challenging skills and proofing.",
    bullets: ["Advanced proofing", "Handler precision", "Higher-distraction reps"],
    image: "/images/Classes images/obedience.webp",
    packagePrice: "$450 + tax",
    note: "Coming soon",
  },
]

export default function GroupClassesPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="relative overflow-hidden pt-32 pb-16 lg:pt-40 lg:pb-24 px-6 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-muted/30 to-secondary/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -top-24 -left-20 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -right-16 -z-10 h-80 w-80 rounded-full bg-secondary/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 backdrop-blur px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-secondary mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Group Classes
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance mb-6">
              Request the group class your dog is approved for
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Small cohorts. Real coaching. Enter your email to see approved classes and request a spot,
              or book an assessment and we&apos;ll place your dog in the right program.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto">
            <HeroStat icon={<Users className="w-4 h-4" />} label="Small cohorts" />
            <HeroStat icon={<CalendarCheck className="w-4 h-4" />} label="Scheduled series" />
            <HeroStat icon={<ClipboardCheck className="w-4 h-4" />} label="Trainer-approved" />
          </div>
        </div>
      </section>

      <section id="group-class-availability" className="px-6 lg:px-8 -mt-4 lg:-mt-8 pb-20 lg:pb-28 scroll-mt-24">
        <div className="max-w-4xl mx-auto">
          <Suspense
            fallback={
              <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-xl shadow-primary/10 animate-pulse text-muted-foreground text-sm">
                Loading group classes…
              </div>
            }
          >
            <GroupClassesBookingPanel />
          </Suspense>
        </div>
      </section>

      <section className="px-6 lg:px-8 pb-20 lg:pb-28">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-secondary font-medium mb-3">
              What we run
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground text-balance">
              Group programs we offer
            </h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Your trainer matches your dog to the right program and level during the assessment.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {OFFERINGS.map((offering) => (
              <article
                key={offering.id}
                className="group flex flex-col rounded-3xl overflow-hidden border border-border/50 bg-card shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/25 transition-all duration-300"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={offering.image}
                    alt={offering.label}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/85">
                      {offering.forText}
                    </p>
                    <h3 className="font-display text-2xl font-semibold tracking-tight text-white mt-1">
                      {offering.label}
                    </h3>
                  </div>
                </div>
                <div className="flex flex-col flex-grow p-6">
                  {(offering.packagePrice || offering.unitPrice || offering.note) ? (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {offering.packagePrice ? (
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          Package: {offering.packagePrice}
                          {offering.packageDetail ? ` · ${offering.packageDetail}` : ""}
                        </span>
                      ) : null}
                      {offering.unitPrice ? (
                        <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
                          Unit: {offering.unitPrice}
                        </span>
                      ) : null}
                      {offering.note ? (
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                          {offering.note}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  <p className="text-muted-foreground leading-relaxed">{offering.summary}</p>
                  <ul className="mt-5 space-y-2">
                    {offering.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2 text-sm text-foreground/85">
                        <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="outline" className="mt-6 rounded-full">
                    <a href="#group-class-availability">See dates &amp; availability</a>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-8 pb-20 lg:pb-28">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-[40px] border border-border/60 bg-card p-8 md:p-12 lg:p-16 shadow-lg shadow-primary/5">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <p className="text-xs uppercase tracking-[0.2em] text-secondary font-medium mb-3">
                How it works
              </p>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground text-balance">
                Three steps to the right class
              </h2>
            </div>
            <ol className="grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Complete an assessment",
                  body: "We meet you and your dog first so we can understand goals, behavior, and the right path.",
                },
                {
                  title: "Your trainer approves a program",
                  body: "After the assessment, your trainer enables the group programs your dog is ready for.",
                },
                {
                  title: "Request your spot",
                  body: "Come back, enter your email, and request an upcoming full-series cohort that fits your schedule.",
                },
              ].map((step, index) => (
                <li
                  key={step.title}
                  className="relative rounded-3xl border border-border/60 bg-background/60 p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-display text-lg font-semibold">
                      {index + 1}
                    </span>
                    <h3 className="font-medium text-foreground">{step.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-8 pb-24 lg:pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-primary via-primary/90 to-secondary shadow-xl shadow-primary/10">
            <div
              className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white/10 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative px-8 py-14 md:px-16 md:py-20 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/80 font-medium mb-3">
                Not sure where to start?
              </p>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-primary-foreground text-balance mb-4 max-w-2xl mx-auto">
                Book an assessment and we&apos;ll point you to the right class.
              </h2>
              <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8 leading-relaxed">
                No pressure, no guessing. We&apos;ll meet you and your dog, understand your goals, and
                recommend the group program that fits.
              </p>
              <BookingLink>
                <Button
                  size="lg"
                  className="rounded-full bg-background text-foreground hover:bg-background/90 px-8 py-6 text-base group"
                >
                  Book an Assessment
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </BookingLink>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

function HeroStat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card/70 backdrop-blur px-3 py-3 text-xs sm:text-sm font-medium text-foreground/85">
      <span className="text-primary">{icon}</span>
      <span>{label}</span>
    </div>
  )
}
