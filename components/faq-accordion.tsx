"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

interface FaqItem {
  question: string
  answer: string
}

interface FaqCategory {
  title: string
  items: FaqItem[]
}

const faqData: FaqCategory[] = [
  {
    title: "Methods & Approach",
    items: [
      {
        question: "What training methods and tools do you use?",
        answer:
          "We use force-free, science-based methods rooted in modern learning theory. That means positive reinforcement, clear communication, and management — never fear, pain, or intimidation. We do not use prong collars, choke chains, or e-collars. We use treats, engagement, and real-world practice to build lasting behavior change.",
      },
      {
        question: "Will training hurt my dog or break their spirit?",
        answer:
          "Absolutely not. A dog who feels safe learns faster and bonds deeper. We never push a dog past their emotional threshold. Every technique we use is designed to build confidence, not suppress personality. Your dog will still be your dog — just calmer, more focused, and easier to live with.",
      },
      {
        question: "What credentials and qualifications does your team have?",
        answer:
          "Our team has 15+ combined years of hands-on experience with hundreds of dogs. We invest heavily in continuing education in animal behavior science, attend industry conferences, and stay current with the latest research. Dog training is unregulated in Canada — we hold ourselves to a higher standard than the industry requires.",
      },
      {
        question: "How is your approach different from other trainers?",
        answer:
          "We train in the real world — parks, sidewalks, your neighborhood — not in a training room. That means the skills your dog learns actually work where they matter. We also coach you, the owner, so results last a lifetime. You won't be dependent on us forever.",
      },
      {
        question: "Why do you train in parks instead of a training room?",
        answer:
          "Because your dog doesn't misbehave in a training room. The problem happens on the street, at the park, in your apartment hallway. Training in the real world means your dog learns to behave where it actually counts. It's harder, but it's honest — and the results stick.",
      },
    ],
  },
  {
    title: "Cost & Logistics",
    items: [
      {
        question: "How much does training cost, and what's included?",
        answer:
          "Our programs start at $349 for puppy foundations and go up to $1,499 for intensive day training packages. Every package includes private sessions, homework, and between-session support. We publish our pricing transparently because we believe you deserve to know what you're investing in before you commit.",
      },
      {
        question: "How many sessions will my dog need?",
        answer:
          "It depends on the behavior, its history, and your goals. Most manners issues see real progress in 4–6 sessions. Reactivity and anxiety cases often need 8–16. We'll give you an honest estimate after your evaluation — we'd rather under-promise and over-deliver.",
      },
      {
        question: "What's a realistic timeline for seeing results?",
        answer:
          "Most owners notice improvement within the first 2–3 sessions. Significant behavior change typically takes 4–8 weeks of consistent work. We set realistic milestones at your evaluation so you always know what to expect and can measure progress.",
      },
      {
        question: "Do you offer payment plans or package deals?",
        answer:
          "Yes. Our packages are designed to give you the best value, and we offer flexible payment options for larger programs. Ask about payment plans during your discovery call — we want training to be accessible, not a financial barrier.",
      },
      {
        question: "What is your cancellation/rescheduling policy?",
        answer:
          "Life happens — we get it. We ask for 24 hours notice for reschedules. Late cancellations may incur a fee, and no-shows are charged in full. If something unexpected comes up, just reach out and we'll work with you.",
      },
      {
        question: "Do you train at my home? What areas do you serve?",
        answer:
          "We train wherever your dog's behavior happens — your neighborhood, local parks, busy streets, and yes, your home when relevant. We serve Montreal, the West Island, and Laval areas. Our facility is at 7770 Boul Henri-Bourassa E in Anjou.",
      },
    ],
  },
  {
    title: "My Dog's Specific Issues",
    items: [
      {
        question: "Can you help with leash reactivity?",
        answer:
          "This is one of our most common cases. Leash reactivity — lunging, barking, pulling toward other dogs or people — responds well to structured desensitization and counter-conditioning. We work at your dog's pace in real environments, and most dogs show measurable improvement within 3–4 sessions.",
      },
      {
        question: "My puppy is biting and jumping — what should I do?",
        answer:
          "This is normal puppy behavior, but it needs to be addressed early before it becomes a habit. Bite inhibition training teaches your puppy to use a soft mouth. Most puppies improve dramatically within 2 weeks of consistent work. Our Puppy Foundations program is designed exactly for this.",
      },
      {
        question: "How do I socialize my puppy safely?",
        answer:
          "Socialization isn't about flooding your puppy with experiences — it's about controlled, positive exposure during the critical window (8–16 weeks). We use a structured protocol that balances safety with the experiences your puppy needs. We'll work within your vet's recommendations.",
      },
      {
        question: "Can you help with separation anxiety?",
        answer:
          "Yes. Separation anxiety is one of the most emotionally exhausting issues for owners. We use a gradual desensitization protocol that builds your dog's ability to be alone, step by step. It takes patience, but the results are life-changing — for both of you.",
      },
      {
        question: "My dog guards food or toys — can training fix this?",
        answer:
          "Resource guarding can be modified with the right approach. We use counter-conditioning to change how your dog feels about people approaching their stuff — not punishment, which makes guarding worse. The severity determines the timeline, and we'll assess everything during your evaluation.",
      },
      {
        question: "What if my dog is aggressive — can you take the case safely?",
        answer:
          "We specialize in high-risk cases that other trainers have turned away. Safety is our first priority — for you, your dog, and our team. Every aggressive case starts with a thorough safety evaluation. We'll be honest about what's achievable and build a management plan from day one.",
      },
    ],
  },
  {
    title: "How Training Works",
    items: [
      {
        question: "Will training work if I'm busy and can't practice for hours?",
        answer:
          "Our plans are designed for real life, not an ideal world. We give you structured, sustainable practice — usually 10–15 minutes a day. Consistency matters more than duration. If you can brush your teeth, you can practice your dog's training plan.",
      },
      {
        question: "What happens between sessions? Do I get homework and support?",
        answer:
          "Yes — between-session support is a core part of what we do. After every session, you get clear homework with video demonstrations. You can text or email us with questions, and we'll check in on your progress. You're never on your own between sessions.",
      },
      {
        question: "Do you offer group classes, and are they safe for reactive dogs?",
        answer:
          "We offer group classes for puppies and dogs with solid foundational manners. Reactive dogs are not appropriate for group settings — they need private, structured work first. Once your dog reaches certain milestones, we may recommend group classes to proof their skills.",
      },
      {
        question: "Is board-and-train worth it?",
        answer:
          "We don't offer traditional board-and-train because lasting behavior change requires owner involvement. Our Day Training program is the alternative: your dog trains with us during the day, and we transfer skills to you in handoff sessions. The results stick because you're part of the process.",
      },
      {
        question: "Can you guarantee results?",
        answer:
          "No ethical trainer guarantees results — every dog is different, and behavior change depends on many factors including owner consistency. What we guarantee is a clear plan, honest assessment, professional support, and a team that won't give up on you. We set realistic milestones and celebrate every win.",
      },
    ],
  },
  {
    title: "Choosing a Trainer",
    items: [
      {
        question: "How do I know if reviews are trustworthy?",
        answer:
          "Look for specificity. Generic 5-star reviews that say 'great trainer!' tell you nothing. Real reviews describe specific behaviors, timelines, and outcomes. Check Google Reviews, look for before/after stories, and ask the trainer for references. Our results page shows real dogs with real stories.",
      },
      {
        question: "What red flags should I watch for when choosing a trainer?",
        answer:
          "Run from anyone who guarantees results, uses pain-based tools (prong collars, e-collars, choke chains) as a first resort, won't explain their methods, or blames you for your dog's behavior. A good trainer educates, supports, and meets you where you are — without judgment or shortcuts.",
      },
      {
        question: "Why is dog training unregulated, and what does that mean for me?",
        answer:
          "In Canada, anyone can call themselves a dog trainer with zero education or oversight. That means it's on you to vet credentials, methods, and reviews. We publish our methods, show our results, and welcome questions — because transparency is how we earn your trust when the industry won't do it for us.",
      },
    ],
  },
]

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-border/50">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-foreground group-hover:text-primary transition-colors pr-4">
          {item.question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
      </div>
    </div>
  )
}

export function FaqAccordion() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggle = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <div className="space-y-12">
      {faqData.map((category) => (
        <div key={category.title}>
          <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-6">
            {category.title}
          </h2>
          <div>
            {category.items.map((item) => {
              const key = `${category.title}-${item.question}`
              return (
                <AccordionItem
                  key={key}
                  item={item}
                  isOpen={openItems.has(key)}
                  onToggle={() => toggle(key)}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
