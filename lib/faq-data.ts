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
