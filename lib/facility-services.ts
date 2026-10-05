import type { AppLocale } from "@/lib/i18n/config"
import type { ServiceInterest } from "@/lib/service-inquiries"

type Copy = { en: string; fr: string }
export type FacilitySection = { title: Copy; paragraphs?: Copy[]; items?: Copy[] }
export type FacilityService = {
  path: string
  title: Copy
  description: Copy
  eyebrow: Copy
  heading: Copy
  intro: Copy
  image: string
  imageAlt: Copy
  interest?: ServiceInterest
  cta: Copy
  sections: FacilitySection[]
}

export const facilityServices = {
  daycare: {
    path: "/daycare",
    title: { en: "Dog Daycare & Day Training in Montreal | MTL Canine Training", fr: "Garderie et entraînement de jour à Montréal | MTL Canine Training" },
    description: { en: "Discover Day Training and Regular Daycare in Montreal. Full-day and half-day options starting November 1, with an assessment before joining.", fr: "Découvrez l’entraînement de jour et la garderie canine à Montréal. Journées et demi-journées dès le 1er novembre, avec une évaluation avant l’inscription." },
    eyebrow: { en: "Starting November 1, 2026", fr: "Dès le 1er novembre 2026" },
    heading: { en: "A better day for your dog. A lighter day for you.", fr: "Une belle journée pour votre chien. L’esprit tranquille pour vous." },
    intro: { en: "Professional training or a supervised day of play? Choose the support your dog needs while you take care of your day. Both programs offer full days and half days, with an initial assessment before joining.", fr: "Un entraînement professionnel ou une journée de jeux supervisés? Choisissez ce qui convient à votre chien pendant que vous vaquez à vos occupations. Les deux programmes offrent des journées et des demi-journées, avec une évaluation préalable." },
    image: "/images/stats/Community Walk.webp",
    imageAlt: { en: "Montreal Canine Training community walk with dogs and their owners", fr: "Promenade communautaire de MTL Canine Training avec les chiens et leurs propriétaires" },
    cta: { en: "Choose a program", fr: "Choisir un programme" },
    sections: [],
  },
  "day-training": {
    path: "/day-training",
    title: { en: "Day Training for Dogs in Montreal | MTL Canine Training", fr: "Entraînement de jour pour chiens à Montréal | MTL Canine Training" },
    description: { en: "Let our trainers work on your dog’s obedience, manners and engagement during your busy day. Full days and half days, with an evaluation before joining.", fr: "Nos entraîneurs travaillent l’obéissance, les bonnes manières et l’engagement de votre chien pendant votre journée. Journées et demi-journées, avec une évaluation préalable." },
    eyebrow: { en: "Day Training · Starting November 1, 2026", fr: "Entraînement de jour · Dès le 1er novembre 2026" },
    heading: { en: "Leave the training to us.", fr: "Confiez-nous l’entraînement." },
    intro: { en: "Between work, school, family, and everything life throws at you, finding the time and energy to train your dog can feel overwhelming. While you’re tackling your busy day, your dog will be learning, exercising, and getting the mental and physical stimulation they need with a professional trainer.", fr: "Entre le travail, les études, la famille et les imprévus, trouver le temps et l’énergie pour entraîner votre chien peut être difficile. Pendant votre journée, votre chien apprend, bouge et reçoit la stimulation mentale et physique dont il a besoin avec un entraîneur professionnel." },
    image: "/images/Classes images/obedience_group_class_1.webp",
    imageAlt: { en: "A trainer working on a dog’s engagement during an outdoor training session", fr: "Un entraîneur travaille l’engagement d’un chien pendant une séance à l’extérieur" },
    interest: "day-training",
    cta: { en: "Request a Day Training evaluation", fr: "Demander une évaluation pour l’entraînement de jour" },
    sections: [
      { title: { en: "A structured day. Your goals at the centre.", fr: "Une journée structurée, selon vos objectifs." }, paragraphs: [{ en: "Tell us what you want to achieve. Our trainers work directly on the behaviours and skills that matter most to you: obedience, leash walking, engagement, manners, reactivity, or other behaviours, based on your dog’s evaluation.", fr: "Dites-nous ce que vous souhaitez améliorer. Nos entraîneurs travaillent les comportements et les habiletés qui comptent pour vous : obéissance, marche en laisse, engagement, bonnes manières, réactivité ou autres comportements, selon l’évaluation de votre chien." }], items: [
        { en: "Obedience and everyday manners", fr: "Obéissance et bonnes manières au quotidien" },
        { en: "Minor behaviour modification", fr: "Modification de comportements mineurs" },
        { en: "Socialization with people and other dogs", fr: "Socialisation avec les gens et les autres chiens" },
        { en: "Engagement building and confidence", fr: "Développement de l’engagement et de la confiance" },
        { en: "Structured exercise, play, and rest", fr: "Exercice, jeux et repos structurés" },
      ] },
      { title: { en: "Why choose Day Training?", fr: "Pourquoi choisir l’entraînement de jour?" }, paragraphs: [{ en: "If your dog needs training but you’re not sure where to start, or you don’t have the time or experience to do it all yourself, Day Training provides more hands-on professional support in a controlled, supervised environment.", fr: "Si votre chien a besoin d’entraînement, mais que vous ne savez pas par où commencer ou manquez de temps ou d’expérience, l’entraînement de jour offre un soutien professionnel plus concret dans un environnement contrôlé et supervisé." }], items: [
        { en: "Improve obedience, focus, and engagement", fr: "Améliorer l’obéissance, la concentration et l’engagement" },
        { en: "Work toward your specific training goals", fr: "Travailler vos objectifs d’entraînement précis" },
        { en: "Receive mental and physical stimulation", fr: "Recevoir de la stimulation mentale et physique" },
        { en: "Reduce boredom and restlessness at home", fr: "Réduire l’ennui et l’agitation à la maison" },
        { en: "Build a more structured, balanced routine", fr: "Développer une routine plus structurée et équilibrée" },
      ] },
      { title: { en: "We do the training. You maintain the results.", fr: "Nous faisons l’entraînement. Vous maintenez les acquis." }, paragraphs: [
        { en: "Our trainers handle the majority of the hands-on training during the day, but consistency at home is still important. We’ll show you what your dog has been working on and what to continue at home.", fr: "Nos entraîneurs font la majorité du travail pratique pendant la journée, mais la constance à la maison demeure importante. Nous vous montrons ce que votre chien a travaillé et comment poursuivre à la maison." },
        { en: "We document your dog’s progress with videos and give you simple, practical exercises and homework so you can maintain and build on their progress.", fr: "Nous documentons les progrès de votre chien en vidéo et vous donnons des exercices simples et pratiques pour maintenir et consolider les acquis à la maison." },
      ] },
      { title: { en: "An evaluation before joining", fr: "Une évaluation avant de commencer" }, paragraphs: [{ en: "Every dog must first complete an evaluation with one of our trainers. We meet you and your dog, discuss your goals, and understand their behaviour, training needs, and current skill level.", fr: "Chaque chien doit d’abord passer une évaluation avec un de nos entraîneurs. Nous vous rencontrons avec votre chien pour discuter de vos objectifs, de son comportement, de ses besoins et de son niveau actuel." }], items: [
        { en: "Discuss your goals and evaluate your dog’s behaviour and skills", fr: "Discuter de vos objectifs et évaluer le comportement et les habiletés de votre chien" },
        { en: "Begin hands-on training and determine whether Day Training is the right fit", fr: "Commencer le travail pratique et déterminer si le programme convient" },
        { en: "Recommend an individual plan and explain what to expect", fr: "Recommander un plan individuel et expliquer à quoi vous attendre" },
      ] },
      { title: { en: "Options, requirements & registration", fr: "Options, exigences et inscription" }, paragraphs: [
        { en: "Full-day and half-day options begin November 1, 2026. Your dog must be crate trained so they can rest mentally and physically between training sessions.", fr: "Des journées et des demi-journées sont offertes dès le 1er novembre 2026. Votre chien doit être habitué à la cage pour pouvoir se reposer mentalement et physiquement entre les séances." },
        { en: "Start by requesting an evaluation. Our team will confirm suitability, recommend a plan, and explain pricing, drop-off and pick-up times, and registration before you commit.", fr: "Commencez par demander une évaluation. Notre équipe confirme si le programme convient, recommande un plan et vous explique les tarifs, les heures d’arrivée et de départ et l’inscription avant tout engagement." },
      ] },
    ],
  },
  "regular-daycare": {
    path: "/regular-daycare",
    title: { en: "Dog Daycare in Montreal | MTL Canine Training", fr: "Garderie canine à Montréal | MTL Canine Training" },
    description: { en: "Supervised play, socialization, enrichment and rest at Montreal Canine Training’s daycare. Full-day and half-day options with a meet and greet before joining.", fr: "Jeux supervisés, socialisation, enrichissement et repos à la garderie de MTL Canine Training. Journées et demi-journées avec une rencontre préalable." },
    eyebrow: { en: "Regular Daycare · Starting November 1, 2026", fr: "Garderie canine · Dès le 1er novembre 2026" },
    heading: { en: "Play. Explore. Rest. Repeat.", fr: "Jouer. Explorer. Se reposer." },
    intro: { en: "Give your dog a fun, active, and enriching day in a safe and professionally supervised environment. Our Regular Daycare offers appropriate social interaction, exercise, and enrichment while you’re at work or need a place for your dog to spend the day.", fr: "Offrez à votre chien une journée active et enrichissante dans un environnement sécuritaire et supervisé par des professionnels. Notre garderie propose des interactions sociales appropriées, de l’exercice et de l’enrichissement pendant que vous travaillez ou avez besoin de faire garder votre chien." },
    image: "/images/stats/Community Walk.webp",
    imageAlt: { en: "Dogs and their owners enjoying a Montreal Canine Training community activity", fr: "Des chiens et leurs propriétaires lors d’une activité communautaire de MTL Canine Training" },
    interest: "daycare",
    cta: { en: "Request a Daycare meet & greet", fr: "Demander une rencontre pour la garderie" },
    sections: [
      { title: { en: "More than burning off energy", fr: "Bien plus que dépenser de l’énergie" }, paragraphs: [{ en: "Dogs need more than physical exercise. Regular activity, social interaction, and mental stimulation contribute to a happier, more balanced lifestyle. Our experienced team creates a positive environment with carefully supervised interactions.", fr: "Les chiens ont besoin de plus que d’exercice physique. L’activité régulière, les interactions sociales et la stimulation mentale contribuent à un quotidien plus équilibré. Notre équipe expérimentée crée un environnement positif avec des interactions soigneusement supervisées." }], items: [
        { en: "Burn off excess energy through play and activity", fr: "Dépenser de l’énergie grâce aux jeux et à l’activité" },
        { en: "Develop healthy social skills around other dogs", fr: "Développer de bonnes habiletés sociales avec les autres chiens" },
        { en: "Stay mentally and physically stimulated", fr: "Rester stimulé mentalement et physiquement" },
        { en: "Reduce boredom and restlessness at home", fr: "Réduire l’ennui et l’agitation à la maison" },
        { en: "Enjoy a structured, supervised, and balanced routine", fr: "Profiter d’une routine structurée, supervisée et équilibrée" },
      ] },
      { title: { en: "What a daycare day looks like", fr: "Une journée à la garderie" }, paragraphs: [{ en: "We balance socialization, play, enrichment, and rest based on the dogs in our care. Dogs aren’t simply playing all day: downtime helps them go home happy, fulfilled, and ready to relax.", fr: "Nous équilibrons socialisation, jeux, enrichissement et repos selon les chiens présents. Ils ne jouent pas sans arrêt : les pauses les aident à rentrer à la maison satisfaits et prêts à relaxer." }], items: [
        { en: "Supervised group play", fr: "Jeux de groupe supervisés" },
        { en: "Positive social interaction with other dogs", fr: "Interactions positives avec les autres chiens" },
        { en: "Mental stimulation and enrichment activities", fr: "Stimulation mentale et activités d’enrichissement" },
        { en: "Time to explore, play, and exercise", fr: "Du temps pour explorer, jouer et bouger" },
        { en: "Scheduled downtime and rest periods", fr: "Pauses et périodes de repos prévues" },
      ] },
      { title: { en: "A meet & greet before joining", fr: "Une première rencontre avant de commencer" }, paragraphs: [{ en: "Every dog must complete an initial assessment with our team before their first daycare day. We get to know their personality and make sure daycare is the right environment for them. Assessments are available by appointment.", fr: "Chaque chien doit passer une évaluation initiale avec notre équipe avant sa première journée de garderie. Nous apprenons à connaître sa personnalité et vérifions si cet environnement lui convient. Les évaluations se font sur rendez-vous." }], items: [
        { en: "Temperament and social behaviour", fr: "Tempérament et comportement social" },
        { en: "How your dog interacts and communicates with other dogs", fr: "Façon d’interagir et de communiquer avec les autres chiens" },
        { en: "Comfort in a group and suitability for daycare", fr: "Aisance en groupe et compatibilité avec la garderie" },
      ] },
      { title: { en: "Options & registration", fr: "Options et inscription" }, paragraphs: [
        { en: "Full-day and half-day options begin November 1, 2026. Start by requesting a meet & greet. Our team will confirm suitability, explain pricing and drop-off/pick-up times, and help you register.", fr: "Des journées et des demi-journées sont offertes dès le 1er novembre 2026. Commencez par demander une rencontre. Notre équipe vérifie si le programme convient, explique les tarifs et les heures d’arrivée et de départ, puis vous aide à vous inscrire." },
        { en: "Looking for targeted obedience or behaviour work? Choose Day Training instead. Regular Daycare focuses on activity, enrichment, and supervision rather than a personalized training plan.", fr: "Vous recherchez un travail ciblé sur l’obéissance ou le comportement? Choisissez plutôt l’entraînement de jour. La garderie vise l’activité, l’enrichissement et la supervision, plutôt qu’un plan d’entraînement personnalisé." },
      ] },
    ],
  },
  grooming: {
    path: "/grooming",
    title: { en: "Dog Grooming at MTL Canine Spa | Montreal Canine Training", fr: "Toilettage chez MTL Canine Spa | MTL Canine Training" },
    description: { en: "Discover the grooming side of our canine family. Visit MTL Canine Spa to explore grooming services and request an appointment.", fr: "Découvrez le côté toilettage de notre famille canine. Visitez MTL Canine Spa pour découvrir les services et prendre rendez-vous." },
    eyebrow: { en: "Meet MTL Canine Spa", fr: "Découvrez MTL Canine Spa" },
    heading: { en: "Training isn’t all we do.", fr: "Il n’y a pas que l’entraînement." },
    intro: { en: "Our canine family also offers professional grooming at MTL Canine Spa. Explore the spa’s services and appointment options on our dedicated grooming website.", fr: "Notre famille canine offre aussi du toilettage professionnel chez MTL Canine Spa. Découvrez les services et les options de rendez-vous sur notre site dédié au toilettage." },
    image: "/images/canine-spa-bath.png",
    imageAlt: { en: "A German Shepherd in the MTL Canine Spa grooming bath", fr: "Un berger allemand dans le bain de toilettage de MTL Canine Spa" },
    cta: { en: "Visit MTL Canine Spa", fr: "Visiter MTL Canine Spa" },
    sections: [],
  },
  "training-offer": {
    path: "/training-offer",
    title: { en: "Save 30% on Your Training | MTL Canine Training", fr: "Économisez 30 % sur votre entraînement | MTL Canine Training" },
    description: { en: "Selected clients can receive 30% off consultations and private training by letting us document their training journey. Apply for the Training Documentation Offer.", fr: "Des clients sélectionnés peuvent recevoir 30 % de rabais sur leur consultation et leurs séances privées en nous permettant de documenter leur parcours. Informez-vous sur l’offre." },
    eyebrow: { en: "The Training Documentation Offer", fr: "L’offre de documentation de votre parcours" },
    heading: { en: "Your real journey. 30% off your training.", fr: "Votre vrai parcours. 30 % de rabais." },
    intro: { en: "Want to save 30% on your consultation session and private training classes? We’re offering select clients 30% off in exchange for allowing Montreal Canine Training to document their training journey for our social media and video content.", fr: "Vous souhaitez économiser 30 % sur votre consultation et vos séances privées? Nous offrons ce rabais à des clients sélectionnés qui permettent à MTL Canine Training de documenter leur parcours pour nos réseaux sociaux et notre contenu vidéo." },
    image: "/images/Classes images/in-home.webp",
    imageAlt: { en: "Dog owners with their German Shepherd at Montreal Canine Training", fr: "Des propriétaires avec leur berger allemand chez MTL Canine Training" },
    interest: "training-documentation-offer",
    cta: { en: "Ask about the 30% offer", fr: "Se renseigner sur l’offre de 30 %" },
    sections: [
      { title: { en: "What does this involve?", fr: "Qu’est-ce que ça implique?" }, paragraphs: [{ en: "Our goal is to show what a real training session looks like: the initial conversation and assessment, hands-on training, and progress throughout your private sessions. You’ll need to be comfortable with the following.", fr: "Notre objectif est de montrer une vraie séance : la conversation et l’évaluation initiales, le travail pratique et les progrès durant vos séances privées. Vous devez être à l’aise avec les éléments suivants." }], items: [
        { en: "Wearing a provided microphone to capture real conversations, questions, concerns, and your trainer’s explanations", fr: "Porter un microphone fourni pour enregistrer les conversations, les questions, les préoccupations et les explications de votre entraîneur" },
        { en: "Being filmed by a videographer during your consultation and private sessions, including conversations, demonstrations, exercises, and your dog’s progress", fr: "Être filmé par un vidéaste pendant la consultation et les séances privées : conversations, démonstrations, exercices et progrès de votre chien" },
        { en: "Showing an authentic training experience rather than staged sessions", fr: "Montrer une expérience authentique, plutôt que des séances mises en scène" },
        { en: "Allowing Montreal Canine Training to edit and publish the content on Instagram, Facebook, YouTube, our website, and other brand social channels", fr: "Permettre à MTL Canine Training de monter et de publier le contenu sur Instagram, Facebook, YouTube, notre site et nos autres réseaux sociaux" },
      ] },
      { title: { en: "How it works", fr: "Comment ça fonctionne" }, paragraphs: [
        { en: "When you arrive for your first session, we may ask you to come inside without your dog first. Our team will explain the filming process, fit your microphone, and answer your questions.", fr: "À votre première séance, nous pourrions vous demander d’entrer d’abord sans votre chien. Notre équipe explique le processus, installe votre microphone et répond à vos questions." },
        { en: "Before any filming takes place, you’ll receive a Media Release / Consent Form to review and sign. It explains your permission for us to record, edit, publish, and use the video, audio, and other content captured during your sessions.", fr: "Avant de filmer, vous recevez un formulaire d’autorisation et de consentement à lire et à signer. Il décrit votre permission d’enregistrer, de monter, de publier et d’utiliser les vidéos, l’audio et les autres contenus captés pendant vos séances." },
        { en: "Once the process is explained and consent is signed, we’ll document the experience as naturally as possible while you focus on training your dog.", fr: "Une fois le processus expliqué et le consentement signé, nous documentons l’expérience le plus naturellement possible pendant que vous vous concentrez sur l’entraînement de votre chien." },
      ] },
      { title: { en: "Interested? Let’s see if it’s a fit.", fr: "Intéressé? Voyons si l’offre vous convient." }, paragraphs: [{ en: "Contact us and mention the 30% Training Documentation Offer. We’ll confirm whether your dog and training goals are a good fit and explain the next steps. The offer is for selected participants and isn’t applied automatically when you submit an inquiry.", fr: "Contactez-nous en mentionnant l’offre de documentation à 30 %. Nous confirmons si votre chien et vos objectifs conviennent, puis expliquons la suite. L’offre vise des participants sélectionnés et n’est pas appliquée automatiquement à l’envoi d’une demande." }] },
    ],
  },
  apprenticeships: {
    path: "/apprenticeships",
    title: { en: "Dog Trainer Apprenticeship Programs | MTL Canine Training", fr: "Programmes d’apprentissage en entraînement canin | MTL Canine Training" },
    description: { en: "Interested in becoming a dog trainer? Contact Montreal Canine Training about our apprenticeship programs and current opportunities.", fr: "Vous souhaitez devenir entraîneur canin? Contactez MTL Canine Training pour connaître nos programmes d’apprentissage et les possibilités actuelles." },
    eyebrow: { en: "Dog Trainer Apprenticeship Programs", fr: "Programmes d’apprentissage en entraînement canin" },
    heading: { en: "Turn your passion into a path.", fr: "Donnez une direction à votre passion." },
    intro: { en: "Interested in pursuing a career working with dogs? Montreal Canine Training offers dog trainer apprenticeship programs. Speak with our team about current opportunities and the right next step for you.", fr: "Vous souhaitez faire carrière avec les chiens? MTL Canine Training offre des programmes d’apprentissage pour futurs entraîneurs canins. Parlez à notre équipe des possibilités actuelles et de la prochaine étape qui vous convient." },
    image: "/images/hero-fallback.webp",
    imageAlt: { en: "Montreal Canine Training trainers working with dogs outdoors", fr: "Des entraîneurs de MTL Canine Training travaillent avec des chiens à l’extérieur" },
    cta: { en: "Ask about apprenticeship programs", fr: "Se renseigner sur les programmes d’apprentissage" },
    sections: [],
  },
} satisfies Record<string, FacilityService>

export type FacilityServiceId = keyof typeof facilityServices
export function serviceCopy(copy: Copy, locale: AppLocale): string { return copy[locale] }
