import { detectLocaleFromAcceptLanguage } from "@/lib/i18n/config"

export function GET(request: Request) {
  const locale = detectLocaleFromAcceptLanguage(request.headers.get("accept-language"))
  const content =
    locale === "fr"
      ? `# Entraînement Canin Montréal

> Entraînement canin concret à Montréal. Promenades calmes. Chiens confiants. Plans clairs.

Entraînement Canin Montréal offre des services professionnels d'entraînement canin à Montréal, dans l'Ouest-de-l'Île et à Laval. Nous sommes spécialisés en réactivité, cours privés, obéissance, entraînement des chiots et entraînement à domicile avec des méthodes humaines axées sur la relation.

## Services

- [Entraînement pour la réactivité](https://mtlcaninetraining.com/fr/services/reactivity): Pour les chiens qui se lancent, jappent ou figent face aux déclencheurs. Protocoles structurés pour l'attention, l'engagement, le travail en laisse et la confiance.
- [Cours privés](https://mtlcaninetraining.com/fr/services/private-classes): Modification du comportement, réactivité en laisse, agressivité, anxiété de séparation et protection des ressources en formule individuelle. Forfaits de 3, 5 ou 7 séances.
- [Obéissance](https://mtlcaninetraining.com/fr/services/obedience): Pour les chiens de 9 mois et plus qui ont besoin de compétences fiables dans la vraie vie. Cours de groupe et privés niveau 1 et niveau 2.
- [Entraînement des chiots](https://mtlcaninetraining.com/fr/services/puppy-training): Pour les chiots de 10 à 20 semaines et les adolescents de 5 à 9 mois. Socialisation, confiance, inhibition de la morsure et introduction à l'obéissance.
- [Entraînement à domicile](https://mtlcaninetraining.com/fr/services/in-home): Entraînement dans votre environnement: comportement, bonnes manières à la porte, anxiété de séparation et propreté.

## Informations clés

- Adresse: 7770 Boul Henri-Bourassa E, Anjou, Montréal, QC
- Téléphone: 514 826 9558
- Secteurs servis: Montréal, Ouest-de-l'Île, Laval
- Site Web: https://mtlcaninetraining.com/fr

## Liens

- [Tous les services](https://mtlcaninetraining.com/fr/services)
- [Résultats et témoignages](https://mtlcaninetraining.com/fr/results)
- [FAQ](https://mtlcaninetraining.com/fr/faq)
- [Réserver un appel découverte gratuit](https://mtlcaninetraining.com/fr/booking)
- [Contenu complet](https://mtlcaninetraining.com/llms-full.txt)
`
      : `# Montreal Canine Training

> Real-world dog training in Montreal. Calm walks. Confident dogs. Clear plans.

Montreal Canine Training provides professional dog training services in Montreal, West Island, and Laval. We specialize in reactivity training, private classes, obedience, puppy training, and in-home training using humane, relationship-first methods.

## Services

- [Reactivity Training](https://mtlcaninetraining.com/services/reactivity): For dogs who lunge, bark, or shut down around triggers. Structured protocols covering attention cues, engagement, leash work, and confidence building.
- [Private Classes](https://mtlcaninetraining.com/services/private-classes): One-on-one behaviour modification, leash reactivity, aggression, separation anxiety, and resource guarding. 3, 5, or 7 session packages.
- [Obedience Training](https://mtlcaninetraining.com/services/obedience): For dogs 9 months+ who need reliable real-world skills. Level 1 & Level 2 group and private classes.
- [Puppy Training](https://mtlcaninetraining.com/services/puppy-training): For puppies 10–20 weeks & teen dogs 5–9 months. Socialisation, confidence building, bite inhibition, and intro to obedience.
- [In-Home Training](https://mtlcaninetraining.com/services/in-home): Training in your own environment — behaviour modification, door manners, separation anxiety, and house training.

## Key Information

- Location: 7770 Boul Henri-Bourassa E, Anjou, Montreal, QC
- Phone: 514 826 9558
- Areas served: Montreal, West Island, Laval
- Website: https://mtlcaninetraining.com

## Links

- [All Services](https://mtlcaninetraining.com/services)
- [Results & Testimonials](https://mtlcaninetraining.com/results)
- [FAQ](https://mtlcaninetraining.com/faq)
- [Book a Free Discovery Call](https://mtlcaninetraining.com/booking)
- [Full Content](https://mtlcaninetraining.com/llms-full.txt)
`

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  })
}
