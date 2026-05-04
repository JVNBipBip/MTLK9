import type { AppLocale } from "@/lib/i18n/config"

export interface FaqItem {
  question: string
  answer: string
}

export interface FaqCategory {
  title: string
  items: FaqItem[]
}

export const faqData: FaqCategory[] = [
  {
    title: "Training Methods & Approach",
    items: [
      {
        question: "What type of training methods are used?",
        answer:
          "We offer a variety of different methods. It all depends on the dog in front of us, what is best suited for the dog as well as what is comfortable for the client. Our goal is to use the safest and most effective method tailored to the dog's needs emphasizing the importance of the dog's emotional state. Strong relationship building is priority for us.",
      },
      {
        question: "What is the main focus of your training?",
        answer:
          "Our training philosophy is quite different from the traditional training methods. We focus primarily on developing a solid relationship between human and dog. We first work on building active engagement before doing any type of obedience training. Engagement, motivation, communication, connection, confidence and relationship is our top priority.",
      },
    ],
  },
  {
    title: "Services & Classes",
    items: [
      {
        question: "What can we expect in private classes?",
        answer:
          "Private classes are our top choice & something we highly recommend for all clients. During these classes, we take the time to educate owners and help them improve their handling skills. We make sure to challenge both the handler and dog every class while controlling the environment for them. We have demo dogs and other distractions that can be introduced during these sessions. Once you and your dog start having the necessary tools to move forward, we will make the effort to continue the training sessions in different environments. This is a way for us to show you how to manage and work with your dog in public environments. We strongly believe this is a realistic and effective way to help dogs owners.",
      },
      {
        question: "What type of services do you offer?",
        answer:
          "We offer consultations, pet obedience, behaviour modification, intro to dog sports and apprenticeship courses. Our services are mostly private classes and group classes. The obedience group classes consists of different levels that are accustomed to the dog's age, level of training and handler skills.",
      },
    ],
  },
  {
    title: "Getting Started",
    items: [
      {
        question: "How can I enroll my dog in a group class?",
        answer:
          "The first step is to schedule an evaluation with one of our trainers. This evaluation will determine which program is best suited for you and your dog. Once you have completed the evaluation session, a trainer will provide you details on how to prepare for your first group class/private class and what to bring.",
      },
      {
        question: "How can I reach out to a trainer and learn more about the services?",
        answer:
          "The best way to reach us is by submitting a request form through our website. You can also call/text our trainers for information and bookings.",
      },
    ],
  },
]

export const faqDataFr: FaqCategory[] = [
  {
    title: "Méthodes et approche d'entraînement",
    items: [
      {
        question: "Quels types de méthodes d'entraînement utilisez-vous?",
        answer:
          "Nous offrons différentes méthodes. Tout dépend du chien devant nous, de ce qui lui convient le mieux et de ce qui met le client à l'aise. Notre objectif est d'utiliser la méthode la plus sécuritaire et efficace selon les besoins du chien, en accordant une grande importance à son état émotionnel. Le développement d'une relation solide est une priorité pour nous.",
      },
      {
        question: "Quel est l'objectif principal de votre entraînement?",
        answer:
          "Notre philosophie d'entraînement diffère des méthodes traditionnelles. Nous nous concentrons d'abord sur le développement d'une relation solide entre l'humain et le chien. Nous travaillons l'engagement actif avant tout entraînement d'obéissance. L'engagement, la motivation, la communication, la connexion, la confiance et la relation sont nos priorités.",
      },
    ],
  },
  {
    title: "Services et cours",
    items: [
      {
        question: "À quoi peut-on s'attendre dans les cours privés?",
        answer:
          "Les cours privés sont notre option de choix et nous les recommandons fortement à tous les clients. Pendant ces cours, nous prenons le temps d'éduquer les propriétaires et de les aider à améliorer leurs habiletés de manipulation. Nous nous assurons de stimuler le maître et le chien à chaque cours tout en contrôlant l'environnement pour eux. Des chiens de démonstration et d'autres distractions peuvent être introduits pendant ces séances. Lorsque vous et votre chien aurez les outils nécessaires pour progresser, nous poursuivrons les séances dans différents environnements afin de vous montrer comment gérer et travailler avec votre chien en public. Nous croyons fortement que c'est une façon réaliste et efficace d'aider les propriétaires de chiens.",
      },
      {
        question: "Quels types de services offrez-vous?",
        answer:
          "Nous offrons des consultations, de l'obéissance pour animaux de compagnie, de la modification du comportement, une introduction aux sports canins et des cours d'apprentissage. Nos services sont principalement des cours privés et des cours de groupe. Les cours d'obéissance en groupe comprennent différents niveaux adaptés à l'âge du chien, à son niveau d'entraînement et aux habiletés du maître.",
      },
    ],
  },
  {
    title: "Pour commencer",
    items: [
      {
        question: "Comment inscrire mon chien à un cours de groupe?",
        answer:
          "La première étape consiste à planifier une évaluation avec l'un de nos entraîneurs. Cette évaluation déterminera quel programme convient le mieux à vous et à votre chien. Une fois l'évaluation terminée, un entraîneur vous expliquera comment vous préparer à votre premier cours de groupe ou cours privé et quoi apporter.",
      },
      {
        question: "Comment puis-je joindre un entraîneur et en savoir plus sur les services?",
        answer:
          "La meilleure façon de nous joindre est de soumettre un formulaire de demande sur notre site Web. Vous pouvez aussi appeler ou texter nos entraîneurs pour obtenir de l'information ou réserver.",
      },
    ],
  },
]

export function getFaqData(locale: AppLocale = "en") {
  return locale === "fr" ? faqDataFr : faqData
}
