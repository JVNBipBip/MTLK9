"use client"

import { useAppLocale } from "@/components/locale-provider"

export function TrainingMoments() {
  const fr = useAppLocale() === "fr"
  return <section className="bg-secondary/10 px-5 py-16 md:px-8 md:py-24">
    <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">{fr ? "L’entraînement, au quotidien" : "Training in everyday life"}</p>
        <h2 className="text-3xl font-bold leading-tight md:text-4xl">{fr ? "Des chiens, des familles et du progrès." : "Real dogs. Real people. Everyday progress."}</h2>
        <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">{fr ? "Un aperçu de nos séances en groupe et de notre travail à l’extérieur. Appuyez sur une vidéo pour la regarder." : "A look at our group practice and outdoor training sessions. Tap a video to watch."}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        {[
          { id: "outdoor-training", en: "Outdoor group training", fr: "Entraînement en groupe à l’extérieur" },
          { id: "group-practice", en: "Practising around other dogs", fr: "S’exercer près d’autres chiens" },
        ].map(item => <figure key={item.id}>
          <video controls playsInline preload="none" poster={`/images/october-2026/${item.id}-poster.webp`} aria-label={fr ? item.fr : item.en} className="aspect-[9/16] w-full rounded-2xl bg-black object-contain shadow-sm">
            <source src={`/videos/october-2026/${item.id}.mp4`} type="video/mp4" />
          </video>
          <figcaption className="mt-3 text-sm font-medium leading-relaxed">{fr ? item.fr : item.en}</figcaption>
        </figure>)}
      </div>
    </div>
  </section>
}
