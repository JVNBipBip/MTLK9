import type { AppLocale } from "@/lib/i18n/config"

type TransformationStoryCopy = {
  breed: string
  path: string
  before: string
  after: string
  testimonial: string
  mediaAlt: string
}

export type TransformationStory = {
  slug: string
  dogName: string
  breed: string
  path: string
  before: string
  after: string
  testimonial: string
  mediaAlt: string
  mediaPlaceholder: string
  mediaType: "image" | "video"
  mediaSrc?: string
  wistiaId?: string
  posterSrc: string
  href: string
  fr: TransformationStoryCopy
}

export const transformationStories: TransformationStory[] = [
  {
    slug: "sasha",
    dogName: "Sasha",
    breed: "German Shepherd",
    path: "Reactivity Training",
    before:
      "I had no control over Sasha. She was so reactive that I couldn't be around other dogs without her going crazy, which made our walks together a nightmare.",
    after:
      "I can finally enjoy being around other dogs. Sasha is much more manageable, and I've learned the exact techniques to correct her behavior and keep her focused.",
    testimonial:
      "Nick is so experienced and patient. He teaches you exactly how to deal with your dog, and now I actually enjoy our walks again. I recommend him to everybody.",
    mediaAlt: "Sasha's video testimonial about controlling reactivity",
    mediaPlaceholder: "",
    mediaType: "video",
    wistiaId: "ww92aq0dn9",
    posterSrc: "/images/results/sasha.jpg",
    href: "/results/sasha",
    fr: {
      breed: "Berger allemand",
      path: "Entraînement pour la réactivité",
      before:
        "Je n'avais aucun contrôle sur Sasha. Elle était si réactive que je ne pouvais pas croiser d'autres chiens sans qu'elle perde complètement le contrôle, ce qui transformait nos promenades en cauchemar.",
      after:
        "Je peux enfin profiter des sorties près d'autres chiens. Sasha est beaucoup plus facile à gérer, et j'ai appris les techniques précises pour corriger son comportement et garder son attention.",
      testimonial:
        "Nick est très expérimenté et patient. Il vous montre exactement comment intervenir avec votre chien, et maintenant j'apprécie vraiment nos promenades. Je le recommande à tout le monde.",
      mediaAlt: "Témoignage vidéo sur les progrès de Sasha face à la réactivité",
    },
  },
  {
    slug: "mason",
    dogName: "Mason",
    breed: "German Shepherd",
    path: "Reactivity Training",
    before:
      "Walking Mason was a constant challenge. His reactivity toward other dogs meant we couldn't even walk down the street or through the woods without an incident.",
    after:
      "Mason has come so far that we've transitioned from private lessons to group classes. He genuinely enjoys the training, and our daily life is completely different.",
    testimonial:
      "We drive an hour each way just to come here because it's so worth it. Working with Nick at Montreal Canine Training has truly changed our lives.",
    mediaAlt: "Sabrina's video testimonial about overcoming Mason's severe reactivity",
    mediaPlaceholder: "",
    mediaType: "video",
    wistiaId: "3a2efylwfy",
    posterSrc: "/images/results/mason.jpg",
    href: "/results/mason",
    fr: {
      breed: "Berger allemand",
      path: "Entraînement pour la réactivité",
      before:
        "Promener Mason était un défi constant. Sa réactivité envers les autres chiens faisait que nous ne pouvions même pas marcher dans la rue ou en forêt sans incident.",
      after:
        "Mason a tellement progressé que nous sommes passés des leçons privées aux cours de groupe. Il aime réellement l'entraînement, et notre quotidien est complètement différent.",
      testimonial:
        "Nous faisons une heure de route dans chaque direction pour venir ici parce que cela en vaut vraiment la peine. Travailler avec Nick chez Entraînement Canin Montréal a changé notre vie.",
      mediaAlt: "Témoignage vidéo de Sabrina sur les progrès de Mason face à une forte réactivité",
    },
  },
  {
    slug: "multi-dog",
    dogName: "Lilou",
    breed: "GSD Mix",
    path: "Puppy Training",
    before:
      "Life with my first reactive dog was a nightmare. Even a simple walk felt impossible, and the constant stress was overwhelming.",
    after:
      "The training made such a difference that I didn't hesitate to return with my new puppy. Now, our walks are enjoyable, and I feel confident about my dogs' future.",
    testimonial:
      "My life was a nightmare before we started. Now, it's a pleasure to be out with my dogs. I knew exactly where to go when I got my second puppy to make sure everything stayed on the right track.",
    mediaAlt: "Multi-dog success story video testimonial",
    mediaPlaceholder: "",
    mediaType: "video",
    wistiaId: "2cytzfcub2",
    posterSrc: "/images/results/lilou.jpg",
    href: "/results/multi-dog",
    fr: {
      breed: "Croisée berger allemand",
      path: "Entraînement des chiots",
      before:
        "La vie avec mon premier chien réactif était un cauchemar. Même une simple promenade semblait impossible, et le stress constant était accablant.",
      after:
        "L'entraînement a fait une telle différence que je n'ai pas hésité à revenir avec mon nouveau chiot. Maintenant, nos promenades sont agréables et j'ai confiance en l'avenir de mes chiens.",
      testimonial:
        "Ma vie était un cauchemar avant de commencer. Maintenant, sortir avec mes chiens est un plaisir. Quand j'ai eu mon deuxième chiot, je savais exactement où aller pour partir du bon pied.",
      mediaAlt: "Témoignage vidéo sur la réussite d'une famille avec plusieurs chiens",
    },
  },
  {
    slug: "theo",
    dogName: "Theo",
    breed: "Doberman",
    path: "Puppy Training",
    before:
      "Searching for a trainer who truly understood the intensity of a working-line Doberman. I was meticulous and hesitant until I found Nick.",
    after:
      "Every session leaves me more confident. We have a clear path forward, and the support is always flexible and open—no question is ever too small.",
    testimonial:
      "I feel so much more confident every time I have a session. They are incredibly flexible and always there to support you, no matter what you need help with.",
    mediaAlt: "Rebecca's video testimonial about training Theo, her Doberman puppy",
    mediaPlaceholder: "",
    mediaType: "video",
    wistiaId: "i0ipeqgj8k",
    posterSrc: "/images/results/theo.jpg",
    href: "/results/theo",
    fr: {
      breed: "Doberman",
      path: "Entraînement des chiots",
      before:
        "Je cherchais un entraîneur qui comprenait vraiment l'intensité d'un doberman de lignée de travail. J'étais très exigeante et hésitante avant de trouver Nick.",
      after:
        "Chaque séance me donne plus de confiance. Nous avons une voie claire à suivre, et le soutien demeure toujours souple et accessible : aucune question n'est trop petite.",
      testimonial:
        "Je me sens beaucoup plus en confiance après chaque séance. L'équipe est extrêmement flexible et toujours présente pour nous soutenir, peu importe ce dont nous avons besoin.",
      mediaAlt: "Témoignage vidéo de Rebecca sur l'entraînement de son chiot doberman Theo",
    },
  },
  {
    slug: "shiba",
    dogName: "Hunter",
    breed: "Shiba Inu",
    path: "Puppy Training",
    before:
      "Shiba Inus are notorious for their independent and sometimes difficult attitudes. We wanted to ensure our puppy started on the right foot and developed into a well-rounded dog.",
    after:
      "He is now incredibly social and great with other dogs. The training has been so successful that people often joke he's the \"anti-Shiba\" because of how friendly and calm he is.",
    testimonial:
      "The classes and private training have helped shape him into the dog he is now. There's always room to grow, which is why we keep coming back to Montreal Canine Training.",
    mediaAlt: "Video testimonial about raising a social Shiba Inu puppy",
    mediaPlaceholder: "",
    mediaType: "video",
    wistiaId: "ek2ojttv3i",
    posterSrc: "/images/results/hunter.jpg",
    href: "/results/shiba",
    fr: {
      breed: "Shiba Inu",
      path: "Entraînement des chiots",
      before:
        "Les Shiba Inu sont connus pour leur indépendance et leur tempérament parfois difficile. Nous voulions que notre chiot parte du bon pied et devienne un chien équilibré.",
      after:
        "Il est maintenant très sociable et excellent avec les autres chiens. L'entraînement a si bien fonctionné que les gens plaisantent souvent en disant qu'il est l'« anti-Shiba », tellement il est amical et calme.",
      testimonial:
        "Les cours et l'entraînement privé ont contribué à faire de lui le chien qu'il est aujourd'hui. Il y a toujours place à l'amélioration, et c'est pourquoi nous continuons de revenir chez Entraînement Canin Montréal.",
      mediaAlt: "Témoignage vidéo sur l'éducation d'un chiot Shiba Inu sociable",
    },
  },
  // {
  //   slug: "story-6",
  //   dogName: "Shilo",
  //   breed: "[Breed]",
  //   path: "Reactivity Training",
  //   before:
  //     "My dog had been reactive for years. We tried everything, but nothing seemed to stick. Our walks were stressful, and he just couldn't be around other dogs comfortably.",
  //   after:
  //     "The change has been drastic. He can now be around other dogs without feeling pressured or reactive. We've found a place where he truly feels safe and comfortable.",
  //   testimonial:
  //     "Nick is such an understanding trainer. My dog has had such a drastic change in such a short amount of time—I'm just amazed at the progress we've had.",
  //   mediaAlt: "Video testimonial about finding comfort and control with a long-reactive dog",
  //   mediaPlaceholder: "",
  //   mediaType: "video",
  //   wistiaId: "qtdpt5lv7o",
  //   href: "/results/story-6",
  // },
]

export function getTransformationStory(slug: string) {
  return transformationStories.find((story) => story.slug === slug)
}

export function localizeTransformationStory(story: TransformationStory, locale: AppLocale) {
  if (locale === "en") return story
  return { ...story, ...story.fr }
}

export function isPublishableTransformationStory(story: TransformationStory) {
  return !story.dogName.includes("[") && !story.breed.includes("[")
}
