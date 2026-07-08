import type { AppLocale } from "@/lib/i18n/config"

export type LocationPageSlug = "west-island"

type LocalizedText = Record<AppLocale, string>

export type LocationPageData = {
  slug: LocationPageSlug
  path: string
  image: string
  /** Where the primary CTA's outline sibling points (localized by the component). */
  secondaryCtaPath: string
  /** Schema.org areaServed nodes for the Service JSON-LD. */
  areaServed: { "@type": "City" | "Place"; name: string }[]
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
      howEyebrow: string
      howTitle: string
      howIntro: string
      how: { title: string; body: string }[]
      helpTitle: string
      helpIntro: string
      help: { path: string; label: string; description: string }[]
      whyTitle: string
      why: string[]
      groupTitle: string
      groupBody: string[]
      groupLinkLabel: string
      faqTitle: string
      faqs: { question: string; answer: string }[]
      relatedTitle: string
      related: { path: string; label: string; description: string }[]
      ctaTitle: string
      ctaBody: string
    }
  >
}

export const locationPages: Record<LocationPageSlug, LocationPageData> = {
  "west-island": {
    slug: "west-island",
    path: "/dog-training-west-island",
    image: "/images/Classes images/in-home.webp",
    secondaryCtaPath: "/services/in-home",
    areaServed: [
      { "@type": "City", name: "Pointe-Claire" },
      { "@type": "City", name: "Kirkland" },
      { "@type": "City", name: "Dollard-des-Ormeaux" },
      { "@type": "City", name: "Beaconsfield" },
      { "@type": "City", name: "Baie-D'Urfé" },
      { "@type": "City", name: "Sainte-Anne-de-Bellevue" },
      { "@type": "City", name: "Dorval" },
      { "@type": "Place", name: "Lachine" },
      { "@type": "Place", name: "Pierrefonds-Roxboro" },
      { "@type": "Place", name: "L'Île-Bizard" },
      { "@type": "Place", name: "West Island" },
    ],
    metadata: {
      title: {
        en: "Dog Training West Island | In-Home & Private | MTL Canine",
        fr: "Dressage de chien Ouest-de-l'Île | Domicile | MTL Canine",
      },
      description: {
        en: "In-home dog training across the West Island — Pointe-Claire, Kirkland, DDO & more. Trainers come to you; group classes at our Anjou facility.",
        fr: "Dressage à domicile dans l'Ouest-de-l'Île — Pointe-Claire, Kirkland, DDO. L'entraîneur se déplace chez vous; cours de groupe à Anjou.",
      },
    },
    serviceSchema: {
      name: {
        en: "In-Home Dog Training — West Island (Montreal)",
        fr: "Entraînement canin à domicile — Ouest-de-l'Île (Montréal)",
      },
      description: {
        en: "Private in-home dog training for West Island families, from Pointe-Claire to Pierrefonds. Trainers travel to your home; group classes available at our Anjou facility.",
        fr: "Entraînement canin privé à domicile pour les familles de l'Ouest-de-l'Île, de Pointe-Claire à Pierrefonds. L'entraîneur se déplace chez vous; cours de groupe offerts à notre installation d'Anjou.",
      },
    },
    content: {
      en: {
        eyebrow: "In-home & private training",
        h1: "Dog training in the West Island",
        intro:
          "Private dog training that comes to you. Our trainers work with West Island families in their own homes and neighbourhoods — from Pointe-Claire to Pierrefonds — with group classes available at our Anjou facility for owners who want them.",
        primaryCta: "Start Program Sign-Up",
        secondaryCta: "View in-home training",
        howEyebrow: "In-home first",
        howTitle: "How training works for West Island clients",
        howIntro:
          "Let's be upfront: we do not have a West Island facility. Our training centre is in Anjou, and we serve West Island clients two ways — private in-home training, where the trainer travels to you, and group classes in Anjou for owners who are comfortable with the drive. For most West Island families, everything happens at home.",
        how: [
          {
            title: "Free discovery call",
            body: "Start with a free 15-minute call. Tell us what your dog is doing, where in the West Island you live, and what you want to change.",
          },
          {
            title: "Consultation at your home",
            body: "Your program begins with an in-home consultation and assessment. The trainer sees your dog's behaviour where it actually happens — your entrance, your street, your routine.",
          },
          {
            title: "A plan built as session packages",
            body: "In-home training is structured as a consultation plus a package of 3, 5, or 7 sessions. Your trainer builds the plan around your dog, your goals, and your household.",
          },
          {
            title: "Training in your real environment",
            body: "Sessions happen at your home and on your own streets, so the skills hold up in the places you actually live and walk your dog.",
          },
        ],
        helpTitle: "What we help with in the West Island",
        helpIntro:
          "The problems West Island owners call us about are the same ones we work on across Montreal — and each one has a dedicated program.",
        help: [
          {
            path: "/services/obedience",
            label: "Pulling on leash & obedience",
            description: "Loose-leash walking, recall, and manners that hold up on a real walk.",
          },
          {
            path: "/services/reactivity",
            label: "Leash reactivity",
            description: "Barking and lunging at dogs, bikes, or strangers on walks.",
          },
          {
            path: "/services/puppy-training",
            label: "Puppy training",
            description: "Foundations, socialization, and routines for new puppies.",
          },
          {
            path: "/services/aggression",
            label: "Aggression",
            description: "Growling, snapping, guarding, or a bite history that needs a safety-first plan.",
          },
          {
            path: "/services/separation-anxiety",
            label: "Separation anxiety",
            description: "Dogs who panic, bark, or destroy when left alone at home.",
          },
        ],
        whyTitle: "Why in-home training works well in the West Island",
        why: [
          "Most of the behaviour problems we see don't happen in a training hall. They happen at your front door in Dollard-des-Ormeaux, on a quiet crescent in Kirkland, or at the park down the street in Pointe-Claire. In-home training lets the trainer see the actual trigger points: the window your dog barks from, the entrance that sets him off when guests arrive, the exact stretch of sidewalk where the pulling starts.",
          "The West Island is also a genuinely good place to train. Quieter residential streets in Beaconsfield and Baie-D'Urfé give us room to build leash skills without the constant pressure of downtown traffic. Waterfront walks and off-leash parks offer real-world distractions that stay manageable while your dog is learning. And family neighbourhoods in Pierrefonds-Roxboro and Dollard-des-Ormeaux are full of young dogs, which makes early puppy work and adolescent training a natural fit for in-home sessions.",
          "Travel is our job, not yours. Our trainers cover the whole territory — Pointe-Claire, Kirkland, Dorval, Lachine, Sainte-Anne-de-Bellevue, Île-Bizard, and everywhere in between. If you can walk your dog there, we can train there.",
        ],
        groupTitle: "Group classes at our Anjou facility",
        groupBody: [
          "Our group classes — obedience levels, puppy socialization, reactivity groups — run at our facility at 7770 Boul Henri-Bourassa E in Anjou. We won't pretend that's around the corner: from most of the West Island it's a drive across the island along Highway 40 or Highway 20.",
          "If you're up for the trip, group classes add what a living room can't: controlled distractions, other dogs, and handler practice in a structured setting. If the drive doesn't fit your schedule, in-home and private training cover the full program without it — the group option is simply there when you want it.",
        ],
        groupLinkLabel: "See group classes",
        faqTitle: "West Island dog training FAQ",
        faqs: [
          {
            question: "Do you come to Pointe-Claire, Kirkland, and Dollard-des-Ormeaux?",
            answer:
              "Yes. Our in-home training covers the whole West Island, including Pointe-Claire, Kirkland, Dollard-des-Ormeaux, Beaconsfield, Baie-D'Urfé, Sainte-Anne-de-Bellevue, Dorval, Lachine, Pierrefonds-Roxboro, and Île-Bizard. The trainer travels to you.",
          },
          {
            question: "How much does dog training in the West Island cost?",
            answer:
              "In-home training is structured as a consultation followed by a package of 3, 5, or 7 sessions. The right package depends on your dog and your goals, which is why we start with a free 15-minute call — you get clear pricing for your situation before committing to anything.",
          },
          {
            question: "Can we do the training in French?",
            answer:
              "Yes. Montreal Canine Training serves clients in both English and French — start the conversation in whichever language you prefer.",
          },
          {
            question: "At what age should my puppy start training?",
            answer:
              "Early. Our puppy socialization classes take puppies from 10 to 20 weeks old, and in-home puppy foundations can begin as soon as your puppy has settled in at home. The sooner good routines are in place, the fewer habits you have to un-train later.",
          },
          {
            question: "How do we get started?",
            answer:
              "Book a free 15-minute discovery call or submit a request form through the site. We'll talk about your dog, where you are in the West Island, and what you want to change — then recommend the right starting point, whether that's an in-home consultation or an evaluation for group classes.",
          },
        ],
        relatedTitle: "Related programs",
        related: [
          {
            path: "/services/in-home",
            label: "In-home dog training",
            description: "The core service for West Island clients — training where the behaviour happens.",
          },
          {
            path: "/services/private-classes",
            label: "Private dog training",
            description: "One-on-one coaching for behaviour cases and obedience goals.",
          },
          {
            path: "/group-classes",
            label: "Group classes",
            description: "Obedience, puppy, and reactivity groups at our Anjou facility.",
          },
        ],
        ctaTitle: "Your trainer comes to you.",
        ctaBody:
          "Tell us where you are in the West Island and what your dog is doing. We'll start with a free 15-minute call and recommend the right program — no facility visit required.",
      },
      fr: {
        eyebrow: "Entraînement privé et à domicile",
        h1: "Dressage de chiens dans l'Ouest-de-l'Île",
        intro:
          "Un entraînement canin privé qui se déplace chez vous. Nos entraîneurs travaillent avec les familles de l'Ouest-de-l'Île directement à la maison et dans leur quartier — de Pointe-Claire à Pierrefonds — avec des cours de groupe offerts à notre installation d'Anjou pour ceux qui le souhaitent.",
        primaryCta: "Commencer l'inscription",
        secondaryCta: "Voir l'entraînement à domicile",
        howEyebrow: "À domicile d'abord",
        howTitle: "Comment fonctionne l'entraînement dans l'Ouest-de-l'Île",
        howIntro:
          "Soyons transparents : nous n'avons pas d'installation dans l'Ouest-de-l'Île. Notre centre d'entraînement est situé à Anjou, et nous servons les clients de l'Ouest-de-l'Île de deux façons — l'entraînement privé à domicile, où l'entraîneur se déplace chez vous, et les cours de groupe à Anjou pour ceux qui sont à l'aise avec la route. Pour la plupart des familles de l'Ouest-de-l'Île, tout se passe à la maison.",
        how: [
          {
            title: "Appel découverte gratuit",
            body: "Commencez par un appel gratuit de 15 minutes. Expliquez-nous ce que fait votre chien, où vous habitez dans l'Ouest-de-l'Île et ce que vous voulez changer.",
          },
          {
            title: "Consultation à votre domicile",
            body: "Votre programme commence par une consultation et une évaluation à la maison. L'entraîneur observe le comportement de votre chien là où il se produit vraiment : votre entrée, votre rue, votre routine.",
          },
          {
            title: "Un plan bâti en forfaits de séances",
            body: "L'entraînement à domicile est structuré en une consultation suivie d'un forfait de 3, 5 ou 7 séances. Votre entraîneur bâtit le plan autour de votre chien, de vos objectifs et de votre famille.",
          },
          {
            title: "Un entraînement dans votre vrai environnement",
            body: "Les séances se déroulent chez vous et dans vos propres rues, pour que les acquis tiennent là où vous vivez et promenez réellement votre chien.",
          },
        ],
        helpTitle: "Ce que nous travaillons dans l'Ouest-de-l'Île",
        helpIntro:
          "Les problèmes pour lesquels les propriétaires de l'Ouest-de-l'Île nous appellent sont les mêmes que partout à Montréal — et chacun a son programme dédié.",
        help: [
          {
            path: "/services/obedience",
            label: "Tire en laisse et obéissance",
            description: "Marche en laisse détendue, rappel et manières qui tiennent lors d'une vraie promenade.",
          },
          {
            path: "/services/reactivity",
            label: "Réactivité en laisse",
            description: "Jappements et élans vers les chiens, les vélos ou les inconnus en promenade.",
          },
          {
            path: "/services/puppy-training",
            label: "Entraînement pour chiots",
            description: "Bases, socialisation et routines pour les nouveaux chiots.",
          },
          {
            path: "/services/aggression",
            label: "Agressivité",
            description: "Grognements, pincements, protection de ressources ou historique de morsure qui demande un plan axé sur la sécurité.",
          },
          {
            path: "/services/separation-anxiety",
            label: "Anxiété de séparation",
            description: "Chiens qui paniquent, jappent ou détruisent lorsqu'ils restent seuls à la maison.",
          },
        ],
        whyTitle: "Pourquoi l'entraînement à domicile fonctionne bien dans l'Ouest-de-l'Île",
        why: [
          "La plupart des problèmes de comportement que nous voyons ne se produisent pas dans une salle d'entraînement. Ils arrivent à votre porte d'entrée à Dollard-des-Ormeaux, sur un croissant tranquille de Kirkland ou au parc au bout de votre rue à Pointe-Claire. L'entraînement à domicile permet à l'entraîneur de voir les vrais déclencheurs : la fenêtre d'où votre chien jappe, l'entrée qui l'énerve quand des invités arrivent, le segment précis de trottoir où il commence à tirer.",
          "L'Ouest-de-l'Île est aussi un excellent terrain d'entraînement. Les rues résidentielles plus calmes de Beaconsfield et de Baie-D'Urfé donnent l'espace nécessaire pour bâtir la marche en laisse sans la pression constante du centre-ville. Les promenades au bord de l'eau et les parcs sans laisse offrent des distractions réelles, mais gérables pendant que votre chien apprend. Et les quartiers familiaux de Pierrefonds-Roxboro et de Dollard-des-Ormeaux comptent beaucoup de jeunes chiens — un contexte idéal pour travailler les bases avec un chiot ou encadrer un chien adolescent à domicile.",
          "Le déplacement, c'est notre travail, pas le vôtre. Nos entraîneurs couvrent tout le territoire — Pointe-Claire, Kirkland, Dorval, Lachine, Sainte-Anne-de-Bellevue, L'Île-Bizard et tout ce qui se trouve entre les deux. Si vous pouvez y promener votre chien, nous pouvons y travailler.",
        ],
        groupTitle: "Les cours de groupe à notre installation d'Anjou",
        groupBody: [
          "Nos cours de groupe — niveaux d'obéissance, socialisation pour chiots, groupes de réactivité — se donnent à notre installation du 7770, boul. Henri-Bourassa Est, à Anjou. Soyons francs : ce n'est pas à côté. Depuis la majeure partie de l'Ouest-de-l'Île, il faut compter un trajet par l'autoroute 40 ou la 20.",
          "Si la route ne vous fait pas peur, les cours de groupe ajoutent ce qu'un salon ne peut pas offrir : des distractions contrôlées, d'autres chiens et de la pratique pour le maître dans un cadre structuré. Si le déplacement ne convient pas à votre horaire, l'entraînement à domicile et les cours privés couvrent le programme au complet — l'option de groupe reste là si l'envie vous prend.",
        ],
        groupLinkLabel: "Voir les cours de groupe",
        faqTitle: "FAQ dressage dans l'Ouest-de-l'Île",
        faqs: [
          {
            question: "Vous déplacez-vous à Pointe-Claire, Kirkland ou Dollard-des-Ormeaux?",
            answer:
              "Oui. Notre entraînement à domicile couvre tout l'Ouest-de-l'Île : Pointe-Claire, Kirkland, Dollard-des-Ormeaux, Beaconsfield, Baie-D'Urfé, Sainte-Anne-de-Bellevue, Dorval, Lachine, Pierrefonds-Roxboro et L'Île-Bizard. C'est l'entraîneur qui se déplace chez vous.",
          },
          {
            question: "Combien coûte le dressage de chien dans l'Ouest-de-l'Île?",
            answer:
              "L'entraînement à domicile est structuré en une consultation suivie d'un forfait de 3, 5 ou 7 séances. Le bon forfait dépend de votre chien et de vos objectifs. C'est pourquoi nous commençons par un appel gratuit de 15 minutes : vous obtenez un prix clair pour votre situation avant de vous engager.",
          },
          {
            question: "Le service est-il offert en français?",
            answer:
              "Oui. Entraînement Canin Montréal sert ses clients en français et en anglais — commencez la conversation dans la langue de votre choix.",
          },
          {
            question: "À quel âge mon chiot devrait-il commencer?",
            answer:
              "Tôt. Nos cours de socialisation accueillent les chiots de 10 à 20 semaines, et les bases à domicile peuvent commencer dès que votre chiot est installé à la maison. Plus les bonnes routines s'installent tôt, moins il y aura de mauvais plis à défaire ensuite.",
          },
          {
            question: "Comment commencer?",
            answer:
              "Réservez un appel découverte gratuit de 15 minutes ou remplissez le formulaire de demande sur le site. Nous parlerons de votre chien, de votre coin de l'Ouest-de-l'Île et de ce que vous voulez changer, puis nous vous recommanderons le bon point de départ : une consultation à domicile ou une évaluation pour les cours de groupe.",
          },
        ],
        relatedTitle: "Programmes liés",
        related: [
          {
            path: "/services/in-home",
            label: "Entraînement à domicile",
            description: "Le service de base pour les clients de l'Ouest-de-l'Île : un entraînement là où le comportement se produit.",
          },
          {
            path: "/services/private-classes",
            label: "Cours privés pour chiens",
            description: "Coaching individuel pour les cas de comportement et les objectifs d'obéissance.",
          },
          {
            path: "/group-classes",
            label: "Cours de groupe",
            description: "Groupes d'obéissance, de chiots et de réactivité à notre installation d'Anjou.",
          },
        ],
        ctaTitle: "Votre entraîneur se déplace chez vous.",
        ctaBody:
          "Dites-nous où vous êtes dans l'Ouest-de-l'Île et ce que fait votre chien. Nous commencerons par un appel gratuit de 15 minutes et vous recommanderons le bon programme — sans que vous ayez à vous déplacer.",
      },
    },
  },
}
