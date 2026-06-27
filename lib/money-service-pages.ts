import type { AppLocale } from "@/lib/i18n/config"

export type MoneyServiceSlug = "aggression" | "separation-anxiety"

type LocalizedText = Record<AppLocale, string>

export type MoneyServicePageData = {
  slug: MoneyServiceSlug
  path: string
  image: string
  price: string
  metadata: {
    title: LocalizedText
    description: LocalizedText
  }
  serviceSchema: {
    name: LocalizedText
    description: LocalizedText
  }
  content: Record<
    AppLocale,
    {
      eyebrow: string
      h1: string
      intro: string
      primaryCta: string
      secondaryCta: string
      planTitle: string
      planIntro: string
      process: { title: string; body: string }[]
      signsTitle: string
      signs: string[]
      helpTitle: string
      help: string[]
      bestForTitle: string
      bestFor: string[]
      faqTitle: string
      faqs: { question: string; answer: string }[]
      relatedTitle: string
      related: { path: string; label: string; description: string }[]
      ctaTitle: string
      ctaBody: string
    }
  >
}

export const moneyServicePages: Record<MoneyServiceSlug, MoneyServicePageData> = {
  aggression: {
    slug: "aggression",
    path: "/services/aggression",
    image: "/images/Classes images/private.webp",
    price: "349",
    metadata: {
      title: {
        en: "Aggressive Dog Training Montreal | Behaviour Help",
        fr: "Chien agressif Montréal | Entraînement canin",
      },
      description: {
        en: "Aggressive dog training in Montreal for growling, snapping, biting, guarding, leash conflict, and safer behaviour plans.",
        fr: "Entraînement pour chien agressif à Montréal : grognements, morsures, protection des ressources et plans de sécurité.",
      },
    },
    serviceSchema: {
      name: {
        en: "Aggressive Dog Training — Montreal",
        fr: "Entraînement pour chien agressif — Montréal",
      },
      description: {
        en: "Private dog aggression training in Montreal for growling, snapping, biting, resource guarding, leash conflict, and safer handling.",
        fr: "Entraînement privé à Montréal pour chiens agressifs, protection des ressources, conflits en laisse, morsures et gestion sécuritaire.",
      },
    },
    content: {
      en: {
        eyebrow: "Private behaviour training",
        h1: "Aggressive dog training in Montreal",
        intro:
          "A structured private training path for dogs who growl, snap, bite, guard resources, or become unsafe around people, dogs, guests, or handling.",
        primaryCta: "Start Program Sign-Up",
        secondaryCta: "View private training",
        planTitle: "A safety-first behaviour plan",
        planIntro:
          "Aggression work starts with understanding the pattern: what triggers the behaviour, what the dog is trying to create distance from or protect, and what the owner needs to do before more freedom is added.",
        process: [
          {
            title: "Assessment and trigger map",
            body: "We identify the people, dogs, handling moments, spaces, or resources that create risk and decide what needs private work first.",
          },
          {
            title: "Management that protects everyone",
            body: "You get practical rules for space, leash handling, guests, equipment, and routines so training can happen without avoidable incidents.",
          },
          {
            title: "Behaviour modification",
            body: "We build engagement, handler timing, calm alternatives, threshold awareness, and controlled exposure at the dog's pace.",
          },
          {
            title: "Real-world follow-through",
            body: "As the dog improves, we apply the plan in the environments where problems actually happen: home, entrances, walks, parks, or public spaces.",
          },
        ],
        signsTitle: "Common aggression issues",
        signs: [
          "Growling, snapping, or biting when approached",
          "Resource guarding around food, toys, furniture, people, or spaces",
          "Explosive reactions to dogs or strangers on leash",
          "Guest, doorway, handling, or vet-visit conflict",
          "A bite history or safety concern that needs a clear plan",
        ],
        helpTitle: "How training helps",
        help: [
          "Clarifies what is causing the behaviour instead of guessing",
          "Gives owners safety rules they can use immediately",
          "Builds reliable handler skills before adding harder triggers",
          "Improves decision-making around thresholds, distance, and exposure",
          "Creates a practical path for calmer behaviour in daily life",
        ],
        bestForTitle: "Best fit for",
        bestFor: [
          "Owners who need private one-on-one coaching, not a group class",
          "Dogs with repeated conflict around people, dogs, resources, or handling",
          "Families who need better safety at home, on walks, or around guests",
        ],
        faqTitle: "Aggressive dog training FAQ",
        faqs: [
          {
            question: "Can aggression be fixed completely?",
            answer:
              "No ethical trainer should promise a complete cure. The goal is to understand the pattern, reduce risk, improve owner handling, and build safer behaviour with a realistic plan.",
          },
          {
            question: "Is this a group class?",
            answer:
              "Aggression cases usually start privately. Group exposure is only considered when the dog and owner have the skills and safety plan to make that step appropriate.",
          },
          {
            question: "What if my dog has already bitten?",
            answer:
              "A bite history makes a structured assessment more important. We will look at triggers, severity, management, and what level of training or veterinary support may be appropriate.",
          },
        ],
        relatedTitle: "Related programs",
        related: [
          {
            path: "/services/private-classes",
            label: "Private dog training",
            description: "One-on-one coaching for complex behaviour cases.",
          },
          {
            path: "/services/reactivity",
            label: "Reactive dog training",
            description: "For dogs who bark, lunge, or shut down around triggers.",
          },
          {
            path: "/services/in-home",
            label: "In-home dog training",
            description: "Training in the environment where problems happen.",
          },
        ],
        ctaTitle: "Start with a clear plan.",
        ctaBody:
          "Tell us what is happening, where it happens, and what your safety concerns are. We will help you choose the right private training path.",
      },
      fr: {
        eyebrow: "Entraînement comportemental privé",
        h1: "Entraînement pour chien agressif à Montréal",
        intro:
          "Un parcours privé structuré pour les chiens qui grognent, pincent, mordent, protègent des ressources ou deviennent difficiles à gérer avec les gens, les chiens, les invités ou la manipulation.",
        primaryCta: "Commencer l'inscription",
        secondaryCta: "Voir les cours privés",
        planTitle: "Un plan comportemental axé sur la sécurité",
        planIntro:
          "Le travail sur l'agressivité commence par comprendre le schéma : ce qui déclenche le comportement, ce que le chien cherche à éloigner ou protéger, et ce que le propriétaire doit maîtriser avant d'ajouter plus de liberté.",
        process: [
          {
            title: "Évaluation et carte des déclencheurs",
            body: "Nous identifions les personnes, chiens, manipulations, espaces ou ressources qui créent un risque et décidons ce qui doit être travaillé en privé d'abord.",
          },
          {
            title: "Gestion pour protéger tout le monde",
            body: "Vous recevez des règles pratiques pour l'espace, la laisse, les invités, l'équipement et les routines afin que l'entraînement se fasse sans incidents évitables.",
          },
          {
            title: "Modification du comportement",
            body: "Nous travaillons l'engagement, le timing du maître, les alternatives calmes, les seuils et l'exposition contrôlée au rythme du chien.",
          },
          {
            title: "Application dans la vraie vie",
            body: "Quand le chien progresse, nous appliquons le plan là où les problèmes arrivent vraiment : maison, entrées, promenades, parcs ou lieux publics.",
          },
        ],
        signsTitle: "Problèmes fréquents d'agressivité",
        signs: [
          "Grognements, pincements ou morsures lorsqu'on approche",
          "Protection de nourriture, jouets, meubles, personnes ou espaces",
          "Réactions explosives aux chiens ou aux inconnus en laisse",
          "Conflits avec les invités, les portes, la manipulation ou le vétérinaire",
          "Historique de morsure ou enjeu de sécurité qui demande un plan clair",
        ],
        helpTitle: "Comment l'entraînement aide",
        help: [
          "Clarifie la cause du comportement au lieu de deviner",
          "Donne des règles de sécurité utilisables immédiatement",
          "Bâtit les habiletés du maître avant d'ajouter des déclencheurs difficiles",
          "Améliore les décisions autour des seuils, distances et expositions",
          "Crée un parcours pratique vers un comportement plus calme au quotidien",
        ],
        bestForTitle: "Idéal pour",
        bestFor: [
          "Propriétaires qui ont besoin de coaching privé, pas d'un cours de groupe",
          "Chiens avec conflits répétés autour des gens, chiens, ressources ou manipulations",
          "Familles qui veulent plus de sécurité à la maison, en promenade ou avec les invités",
        ],
        faqTitle: "FAQ entraînement chien agressif",
        faqs: [
          {
            question: "Peut-on régler complètement l'agressivité?",
            answer:
              "Aucun entraîneur sérieux ne devrait promettre une guérison complète. L'objectif est de comprendre le schéma, réduire le risque, améliorer la gestion du maître et bâtir un comportement plus sécuritaire.",
          },
          {
            question: "Est-ce un cours de groupe?",
            answer:
              "Les cas d'agressivité commencent généralement en privé. L'exposition en groupe n'est envisagée que lorsque le chien et le maître ont les habiletés et le plan de sécurité nécessaires.",
          },
          {
            question: "Et si mon chien a déjà mordu?",
            answer:
              "Un historique de morsure rend l'évaluation structurée encore plus importante. Nous examinons les déclencheurs, la gravité, la gestion et le type de soutien approprié.",
          },
        ],
        relatedTitle: "Programmes liés",
        related: [
          {
            path: "/services/private-classes",
            label: "Cours privés pour chiens",
            description: "Coaching individuel pour les cas comportementaux complexes.",
          },
          {
            path: "/services/reactivity",
            label: "Entraînement pour chiens réactifs",
            description: "Pour les chiens qui jappent, se lancent ou figent face aux déclencheurs.",
          },
          {
            path: "/services/in-home",
            label: "Entraînement à domicile",
            description: "Travail dans l'environnement où les problèmes se produisent.",
          },
        ],
        ctaTitle: "Commencez avec un plan clair.",
        ctaBody:
          "Expliquez-nous ce qui se passe, où ça arrive et quels sont vos enjeux de sécurité. Nous vous aiderons à choisir le bon parcours privé.",
      },
    },
  },
  "separation-anxiety": {
    slug: "separation-anxiety",
    path: "/services/separation-anxiety",
    image: "/images/Classes images/in-home.webp",
    price: "349",
    metadata: {
      title: {
        en: "Separation Anxiety Dog Training Montreal",
        fr: "Anxiété de séparation chien Montréal",
      },
      description: {
        en: "Separation anxiety dog training in Montreal for barking, panic, destruction, crate stress, and calmer alone-time routines.",
        fr: "Entraînement pour l'anxiété de séparation du chien à Montréal : jappements, panique, destruction et routines seul.",
      },
    },
    serviceSchema: {
      name: {
        en: "Separation Anxiety Dog Training — Montreal",
        fr: "Entraînement anxiété de séparation — Montréal",
      },
      description: {
        en: "Private separation anxiety training in Montreal for dogs who bark, panic, destroy, or struggle when left alone.",
        fr: "Entraînement privé à Montréal pour les chiens qui jappent, paniquent, détruisent ou ont de la difficulté à rester seuls.",
      },
    },
    content: {
      en: {
        eyebrow: "Private anxiety support",
        h1: "Separation anxiety dog training in Montreal",
        intro:
          "A practical training plan for dogs who panic, bark, destroy, pace, drool, or cannot settle when left alone at home.",
        primaryCta: "Start Program Sign-Up",
        secondaryCta: "View in-home training",
        planTitle: "Build alone-time skills gradually",
        planIntro:
          "Separation anxiety work is not about forcing a dog to cry it out. It is about finding the current threshold, changing the routine, and building alone-time tolerance in small, measurable steps.",
        process: [
          {
            title: "Pattern review",
            body: "We look at what happens before you leave, how quickly stress appears, and which routines or spaces make the problem worse.",
          },
          {
            title: "Threshold-based plan",
            body: "The plan starts where your dog can still think and recover, then gradually adds duration and realistic departure cues.",
          },
          {
            title: "Home routine changes",
            body: "We adjust confinement, enrichment, exits, greetings, household structure, and owner habits that affect the dog's stress.",
          },
          {
            title: "Progress tracking",
            body: "You get clear homework and markers so we can tell when the dog is ready for the next step instead of guessing.",
          },
        ],
        signsTitle: "Signs your dog may need help",
        signs: [
          "Barking, whining, howling, or pacing when left alone",
          "Destructive behaviour around doors, crates, windows, or furniture",
          "Drooling, panting, shaking, or frantic greetings after absence",
          "Refusing food or enrichment once the owner leaves",
          "Stress that starts before departure cues like keys, shoes, or coats",
        ],
        helpTitle: "How training helps",
        help: [
          "Finds the dog's current alone-time threshold",
          "Creates a predictable plan instead of random trial and error",
          "Builds calmer departures and returns",
          "Improves home routines, confinement decisions, and owner timing",
          "Connects private coaching with in-home support when needed",
        ],
        bestForTitle: "Best fit for",
        bestFor: [
          "Dogs who cannot relax when left alone",
          "Owners who need a step-by-step plan they can repeat between sessions",
          "Households where barking, panic, or destruction is affecting daily life",
        ],
        faqTitle: "Separation anxiety training FAQ",
        faqs: [
          {
            question: "Is separation anxiety solved by crate training?",
            answer:
              "Not always. Some dogs do better with crate structure, while others panic more in confinement. We choose the setup based on the dog's behaviour, not a one-size-fits-all rule.",
          },
          {
            question: "Can I just let my dog cry it out?",
            answer:
              "For many anxious dogs, that can make the pattern worse. A better plan starts below threshold and gradually builds tolerance for being alone.",
          },
          {
            question: "Do you come to the home?",
            answer:
              "In-home support may be recommended when the problem depends heavily on the home setup, door routine, confinement area, or neighbourhood triggers.",
          },
        ],
        relatedTitle: "Related programs",
        related: [
          {
            path: "/services/in-home",
            label: "In-home dog training",
            description: "Support for routines and behaviour inside the home.",
          },
          {
            path: "/services/private-classes",
            label: "Private dog training",
            description: "One-on-one coaching for behaviour and anxiety cases.",
          },
          {
            path: "/services/puppy-training",
            label: "Puppy training",
            description: "Build confidence and routines before problems grow.",
          },
        ],
        ctaTitle: "Build a calmer alone-time routine.",
        ctaBody:
          "Tell us what happens when your dog is left alone and how long the problem has been going on. We will help you choose the right private path.",
      },
      fr: {
        eyebrow: "Soutien privé pour l'anxiété",
        h1: "Entraînement pour l'anxiété de séparation du chien à Montréal",
        intro:
          "Un plan pratique pour les chiens qui paniquent, jappent, détruisent, tournent en rond, bavent ou n'arrivent pas à se calmer lorsqu'ils restent seuls à la maison.",
        primaryCta: "Commencer l'inscription",
        secondaryCta: "Voir l'entraînement à domicile",
        planTitle: "Bâtir graduellement la tolérance à rester seul",
        planIntro:
          "Le travail sur l'anxiété de séparation ne consiste pas à laisser le chien pleurer. Il faut trouver son seuil actuel, modifier la routine et bâtir la tolérance à la solitude par petites étapes mesurables.",
        process: [
          {
            title: "Analyse du schéma",
            body: "Nous regardons ce qui se passe avant votre départ, à quelle vitesse le stress apparaît et quelles routines ou pièces aggravent le problème.",
          },
          {
            title: "Plan basé sur les seuils",
            body: "Le plan commence là où votre chien peut encore réfléchir et récupérer, puis ajoute graduellement de la durée et des signaux de départ réalistes.",
          },
          {
            title: "Ajustements à la maison",
            body: "Nous ajustons la confinement, l'enrichissement, les départs, les retours, la structure familiale et les habitudes qui influencent le stress.",
          },
          {
            title: "Suivi des progrès",
            body: "Vous recevez des devoirs clairs et des repères pour savoir quand le chien est prêt à passer à l'étape suivante.",
          },
        ],
        signsTitle: "Signes que votre chien pourrait avoir besoin d'aide",
        signs: [
          "Jappements, pleurs, hurlements ou déplacements constants lorsqu'il est seul",
          "Destruction près des portes, cages, fenêtres ou meubles",
          "Bave, halètement, tremblements ou salutations frénétiques après une absence",
          "Refus de nourriture ou d'enrichissement dès que le propriétaire part",
          "Stress avant même les signaux de départ comme clés, souliers ou manteau",
        ],
        helpTitle: "Comment l'entraînement aide",
        help: [
          "Trouve le seuil actuel de solitude du chien",
          "Crée un plan prévisible au lieu d'essais au hasard",
          "Bâtit des départs et retours plus calmes",
          "Améliore les routines, le confinement et le timing du propriétaire",
          "Relie le coaching privé au soutien à domicile lorsque nécessaire",
        ],
        bestForTitle: "Idéal pour",
        bestFor: [
          "Chiens incapables de relaxer lorsqu'ils sont seuls",
          "Propriétaires qui veulent un plan étape par étape à répéter entre les séances",
          "Foyers où les jappements, la panique ou la destruction affectent le quotidien",
        ],
        faqTitle: "FAQ anxiété de séparation",
        faqs: [
          {
            question: "La cage règle-t-elle l'anxiété de séparation?",
            answer:
              "Pas toujours. Certains chiens profitent d'une structure avec cage, alors que d'autres paniquent davantage en confinement. Le choix dépend du comportement du chien.",
          },
          {
            question: "Puis-je simplement laisser mon chien pleurer?",
            answer:
              "Pour plusieurs chiens anxieux, cela peut aggraver le schéma. Un meilleur plan commence sous le seuil de stress et bâtit graduellement la tolérance à rester seul.",
          },
          {
            question: "Est-ce que vous venez à domicile?",
            answer:
              "Le soutien à domicile peut être recommandé lorsque le problème dépend fortement de la maison, de la routine de porte, de la zone de confinement ou des déclencheurs du quartier.",
          },
        ],
        relatedTitle: "Programmes liés",
        related: [
          {
            path: "/services/in-home",
            label: "Entraînement à domicile",
            description: "Soutien pour les routines et comportements dans la maison.",
          },
          {
            path: "/services/private-classes",
            label: "Cours privés pour chiens",
            description: "Coaching individuel pour les cas de comportement et d'anxiété.",
          },
          {
            path: "/services/puppy-training",
            label: "Entraînement pour chiots",
            description: "Bâtir la confiance et les routines avant que les problèmes grandissent.",
          },
        ],
        ctaTitle: "Bâtissez une routine plus calme lorsque votre chien est seul.",
        ctaBody:
          "Dites-nous ce qui se passe quand votre chien reste seul et depuis combien de temps le problème existe. Nous vous aiderons à choisir le bon parcours privé.",
      },
    },
  },
}
