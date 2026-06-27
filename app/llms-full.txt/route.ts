import { getFaqData } from "@/lib/faq-data"
import { detectLocaleFromAcceptLanguage } from "@/lib/i18n/config"

export function GET(request: Request) {
  const locale = detectLocaleFromAcceptLanguage(request.headers.get("accept-language"))
  const faqSection = getFaqData(locale)
    .flatMap((cat) =>
      cat.items.map((item) =>
        locale === "fr"
          ? `Q: ${item.question}\nR: ${item.answer}`
          : `Q: ${item.question}\nA: ${item.answer}`,
      )
    )
    .join("\n\n")

  const content =
    locale === "fr"
      ? `# Entraînement Canin Montréal — Contenu complet

> Entraînement canin concret à Montréal. Promenades calmes. Chiens confiants. Plans clairs.

Entraînement Canin Montréal offre des services professionnels à Montréal, dans l'Ouest-de-l'Île et à Laval. Nous sommes spécialisés en réactivité, cours privés, obéissance, entraînement des chiots et entraînement à domicile. Notre philosophie met l'accent sur la relation humain-chien, l'engagement actif, la motivation, la communication, la confiance et la connexion.

## Méthodes d'entraînement

Nous adaptons la méthode au chien devant nous, aux objectifs du client et au niveau de confort de chacun. Notre objectif est d'utiliser l'approche la plus sécuritaire et efficace selon les besoins du chien, en tenant compte de son état émotionnel.

---

## Services

### Consultation en entraînement
Premier pas recommandé : rencontrez un entraîneur pour faire le point sur les objectifs, le comportement et la meilleure orientation (privé, groupe ou les deux).

- Format: consultation / évaluation en personne via le calendrier de réservation
- URL: https://www.mtlcaninetraining.com/fr/services/consultation

### Entraînement pour la réactivité
Pour les chiens qui se lancent, jappent ou figent face aux déclencheurs.
- Format: cours privés et cours de groupe
- Travail: distance, durée, distractions, attention, engagement, laisse, stabilité, confiance, scénarios réalistes et socialisation structurée
- URL: https://www.mtlcaninetraining.com/fr/services/reactivity

### Chien agressif
Pour les chiens qui grognent, pincent, mordent, protègent des ressources ou deviennent difficiles à gérer avec les gens, les chiens, les invités ou la manipulation.
- Format: entraînement privé
- Travail: évaluation des déclencheurs, règles de sécurité, gestion de l'environnement, modification du comportement, seuils, exposition contrôlée et application dans la vraie vie
- URL: https://www.mtlcaninetraining.com/fr/services/aggression

### Anxiété de séparation
Pour les chiens qui paniquent, jappent, détruisent ou n'arrivent pas à se calmer lorsqu'ils restent seuls.
- Format: entraînement privé et soutien à domicile lorsque nécessaire
- Travail: seuils de solitude, routines de départ, confinement, enrichissement, progrès mesurables et devoirs entre les séances
- URL: https://www.mtlcaninetraining.com/fr/services/separation-anxiety

### Cours privés
Pour les chiens qui ont besoin d'un accompagnement individuel.
- Format: forfaits de 3, 5 ou 7 séances
- Travail: modification du comportement, réactivité en laisse, agressivité, confiance, habiletés du maître, anxiété de séparation et protection des ressources
- URL: https://www.mtlcaninetraining.com/fr/services/private-classes

### Obéissance
Pour les chiens de 9 mois et plus qui ont besoin de compétences fiables dans la vraie vie.
- Format: cours privés et de groupe, niveau 1 et niveau 2
- Travail: engagement, rappel, contrôle des impulsions, marches en groupe et commandes en contexte stimulant
- URL: https://www.mtlcaninetraining.com/fr/services/obedience

### Entraînement des chiots
Pour les chiots de 10 à 20 semaines et les adolescents de 5 à 9 mois.
- Format: cours privés et de groupe
- Travail: confiance, socialisation contrôlée, engagement, commandes de base, marqueur, inhibition de la morsure et contrôle des impulsions
- URL: https://www.mtlcaninetraining.com/fr/services/puppy-training

### Entraînement à domicile
Entraînement dans votre propre environnement.
- Format: consultation et forfaits de 3, 5 ou 7 séances
- Travail: comportement à la maison, bonnes manières à la porte, anxiété de séparation, propreté, laisse dans le quartier et coaching du maître
- URL: https://www.mtlcaninetraining.com/fr/services/in-home

---

## Comment ça fonctionne

1. **Contactez-nous pour un appel gratuit** — Dites-nous ce qui se passe. Nous vous aidons à choisir le bon parcours.
2. **Évaluation** — Nous rencontrons votre chien dans un contexte réel et évaluons le comportement là où il se produit.
3. **Plan personnalisé** — Vous recevez une feuille de route claire: objectifs, nombre de séances, exercices et critères de réussite.
4. **Entraînement et soutien** — Nous travaillons dans de vrais environnements avec devoirs, suivis vidéo et soutien entre les séances.

---

## FAQ

${faqSection}

---

## Coordonnées

- Nom: Entraînement Canin Montréal (MTL K9)
- Adresse: 7770 Boul Henri-Bourassa E, Anjou, Montréal, QC H1E 1P2
- Téléphone: 514 826 9558
- Site Web: https://www.mtlcaninetraining.com/fr
- Secteurs servis: Montréal, Ouest-de-l'Île, Laval

## Pages

- Accueil: https://www.mtlcaninetraining.com/fr
- Tous les services: https://www.mtlcaninetraining.com/fr/services
- Consultation: https://www.mtlcaninetraining.com/fr/services/consultation
- Réactivité: https://www.mtlcaninetraining.com/fr/services/reactivity
- Chien agressif: https://www.mtlcaninetraining.com/fr/services/aggression
- Anxiété de séparation: https://www.mtlcaninetraining.com/fr/services/separation-anxiety
- Cours privés: https://www.mtlcaninetraining.com/fr/services/private-classes
- Obéissance: https://www.mtlcaninetraining.com/fr/services/obedience
- Chiots: https://www.mtlcaninetraining.com/fr/services/puppy-training
- À domicile: https://www.mtlcaninetraining.com/fr/services/in-home
- Résultats et témoignages: https://www.mtlcaninetraining.com/fr/results
- FAQ: https://www.mtlcaninetraining.com/fr/faq
- Contactez-nous pour un appel découverte gratuit: https://www.mtlcaninetraining.com/fr/booking
`
      : `# Montreal Canine Training — Full Content

> Real-world dog training in Montreal. Calm walks. Confident dogs. Clear plans.

Montreal Canine Training provides professional dog training services in Montreal, West Island, and Laval. We specialize in reactivity training, private classes, obedience, puppy training, and in-home training. Our training philosophy focuses on developing a solid relationship between human and dog, building active engagement before doing any type of obedience training. Engagement, motivation, communication, connection, confidence and relationship is our top priority.

## Training Methods

We offer a variety of different methods. It all depends on the dog in front of us, what is best suited for the dog as well as what is comfortable for the client. Our goal is to use the safest and most effective method tailored to the dog's needs emphasizing the importance of the dog's emotional state. Strong relationship building is priority for us.

---

## Services

### Training Consultation
Recommended first step: meet a trainer to review goals and behaviour and get a personalised recommendation toward private lessons, group classes, or both.

- Format: in-person consultation / evaluation through the booking calendar
- URL: https://www.mtlcaninetraining.com/services/consultation

### Reactivity Training
For dogs who lunge, bark, or shut down around triggers.
- Format: Private & group classes
- What we work on: The Three D's (Duration, Distance, Distraction), attention cues (Name, Touch, Leash), active and static engagement, leash work and reward placement, stability work and confidence building, realistic scenario training, structured socialization
- This is for you if: You cross the street every time you see another dog, you've rearranged your schedule to avoid triggers, your dog lunges/barks/shuts down on walks, other trainers told you your dog is "too much"
- URL: https://www.mtlcaninetraining.com/services/reactivity

### Aggressive Dog Training
For dogs who growl, snap, bite, guard resources, or become unsafe around people, dogs, guests, or handling.
- Format: private behaviour training
- What we work on: trigger assessment, safety rules, environment management, behaviour modification, thresholds, controlled exposure, and real-world follow-through
- This is for you if: You need a safety-first plan, your dog has repeated conflict, or group classes are not appropriate yet
- URL: https://www.mtlcaninetraining.com/services/aggression

### Separation Anxiety Training
For dogs who panic, bark, destroy, pace, drool, or cannot settle when left alone.
- Format: private training and in-home support when needed
- What we work on: alone-time thresholds, departure routines, confinement decisions, enrichment, measurable progress, and repeatable homework
- This is for you if: Barking, panic, or destruction when alone is affecting daily life
- URL: https://www.mtlcaninetraining.com/services/separation-anxiety

### Private Classes
For dogs who need focused, one-on-one attention.
- Format: 3, 5, or 7 session packages
- What we work on: Behaviour modification, leash reactivity, aggression management, confidence building, handler skill development, separation anxiety protocol, resource guarding
- This is for you if: Your dog's issues don't fit a group class, you want a trainer's full attention, you're dealing with reactivity/anxiety/aggression/guarding
- URL: https://www.mtlcaninetraining.com/services/private-classes

### Obedience Training
For dogs 9 months+ who need reliable real-world skills.
- Format: Private & group classes — Level 1 & Level 2
- What we work on: The Three D's, engagement and relationship building, reliable recall, impulse control, pack walks, advanced commands in high-distraction settings
- This is for you if: Your dog knows "sit" at home but ignores you everywhere else, you want a dog you can take anywhere in Montreal
- URL: https://www.mtlcaninetraining.com/services/obedience

### Puppy Training
For puppies 10–20 weeks & teen dogs 5–9 months.
- Format: Private & group classes
- What we work on: Confidence building through guided play, controlled socialisation, engagement and focus, obstacle courses, six basic commands, marker training, bite inhibition and impulse control
- This is for you if: Your puppy is biting everything, you're unsure how to socialise safely, your teen pup has "selective hearing"
- URL: https://www.mtlcaninetraining.com/services/puppy-training

### In-Home Training
Training in your own environment.
- Format: Consultation + 3, 5, or 7 session packages
- What we work on: In-home assessment, customised behaviour modification, door manners, separation anxiety, house training, leash skills in your neighbourhood, handler coaching
- This is for you if: Your dog's biggest issues happen at home, you've tried facility-based training and skills didn't transfer
- URL: https://www.mtlcaninetraining.com/services/in-home

---

## How It Works

1. **Contact Us for a Free Call** — Tell us what's going on. We'll figure out the right path together. 15 minutes, no commitment.
2. **Evaluation Session** — We meet you and your dog in the real world — a park, your neighborhood — and assess behavior where it actually happens.
3. **Your Custom Training Plan** — You get a clear roadmap: what we'll work on, how many sessions, what you'll practice between sessions, and what success looks like.
4. **Training + Ongoing Support** — We train together in real environments. You get homework, video check-ins, and support between sessions. We're with you until it clicks.

---

## FAQ

${faqSection}

---

## Contact Information

- Business Name: Montreal Canine Training (MTL K9)
- Address: 7770 Boul Henri-Bourassa E, Anjou, Montreal, QC H1E 1P2
- Phone: 514 826 9558
- Website: https://www.mtlcaninetraining.com
- Areas served: Montreal, West Island, Laval

## Pages

- Home: https://www.mtlcaninetraining.com
- All Services: https://www.mtlcaninetraining.com/services
- Consultation: https://www.mtlcaninetraining.com/services/consultation
- Reactivity Training: https://www.mtlcaninetraining.com/services/reactivity
- Aggressive Dog Training: https://www.mtlcaninetraining.com/services/aggression
- Separation Anxiety Training: https://www.mtlcaninetraining.com/services/separation-anxiety
- Private Classes: https://www.mtlcaninetraining.com/services/private-classes
- Obedience Training: https://www.mtlcaninetraining.com/services/obedience
- Puppy Training: https://www.mtlcaninetraining.com/services/puppy-training
- In-Home Training: https://www.mtlcaninetraining.com/services/in-home
- Results & Testimonials: https://www.mtlcaninetraining.com/results
- FAQ: https://www.mtlcaninetraining.com/faq
- Contact Us for a Free Discovery Call: https://www.mtlcaninetraining.com/booking
`

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  })
}
