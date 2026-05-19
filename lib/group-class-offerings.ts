import type { InFacilityPriceRow, InFacilityPriceSection } from "@/lib/in-facility-training-pricing"
import { IN_FACILITY_PRICING_SECTIONS } from "@/lib/in-facility-training-pricing"

export type GroupClassOffering = {
  id: string
  label: string
  forText: string
  summary: string
  bullets: string[]
  image: string
  imageAvif?: string
  imageClassName?: string
  packagePrice?: string
  unitPrice?: string
  packageDetail?: string
  note?: string
  heroEyebrow: string
  heroTitle: string
  heroDescription: string
  goals: string[]
  forYouIf: string[]
  goalCarouselBody: string
  ctaHeadline: string
  ctaBody: string
  /** When true, hide availability CTA and show coming-soon messaging. */
  comingSoon?: boolean
  pricingRows: InFacilityPriceRow[]
  /** Optional section title for goals (defaults to "What we'll work on"). */
  overviewTitle?: string
  /** Age, cost, booking, and eligibility bullets shown above goals when set. */
  classInfo?: string[]
}

function rowsFromSections(...labels: string[]): InFacilityPriceRow[] {
  const wanted = new Set(labels)
  const out: InFacilityPriceRow[] = []
  for (const section of IN_FACILITY_PRICING_SECTIONS) {
    for (const row of section.rows) {
      if (wanted.has(row.label)) out.push(row)
    }
  }
  return out
}

export const GROUP_CLASS_OFFERINGS: GroupClassOffering[] = [
  {
    id: "puppy-socialization-class",
    label: "Puppy Socialization Class",
    forText: "Puppies",
    summary:
      "Fun and positive way for young puppies to start their training journey! Focused on proper play, confidence building, and creating successful interactions in a safe environment.",
    bullets: ["Drop-in class", "10–20 weeks", "Must show proof of vaccination"],
    image: "/images/Classes images/puppy_social.jpg",
    note: "Cost per class: $50 + tax per class",
    heroEyebrow: "Drop-in · puppies 10–20 weeks",
    heroTitle: "Puppy Socialization Class in Montreal",
    heroDescription:
      "Trainer-guided group classes for puppies 10–20 weeks — interactive play, proper greetings, body handling, and confidence-building in a safe, supervised setting.",
    overviewTitle: "What to expect",
    classInfo: [
      "Drop-in class",
      "Age group: 10 weeks to 20 weeks old",
      "Cost: $50 + tax per class",
      "Booking: classes available upon demand",
      "Must show proof of vaccination",
      "Puppy must be free of fleas, ticks, and parasites.",
    ],
    goals: [
      "Interactive play with other puppies and humans",
      "Meet & greet and proper greetings",
      "Body handling for vet and grooming purposes",
      "Discussions and Q&A with your trainer",
      "Socialization opportunities with other pups",
      "Confidence-building exercises",
      "Environmental exposure — different surfaces, objects, and obstacle courses",
    ],
    forYouIf: [
      "Your puppy is between 10 and 20 weeks and ready for structured group social time.",
      "You want safe, supervised play — not a free-for-all at the dog park.",
      "You need help with greetings, handling, and early confidence around new things.",
      "You want trainer guidance and time to ask questions during class.",
      "You're building positive habits now so the teen months are easier.",
    ],
    goalCarouselBody:
      "This structured approach helps new puppy owners understand what is needed to raise a puppy. We make sure every owner has the right tools and knowledge to help their puppy grow and thrive — a great way to start your puppy's journey.",
    ctaHeadline: "Ready to book puppy socialization?",
    ctaBody:
      "Browse upcoming classes on the group classes page. Send vaccination records to mtlcaninetraining@gmail.com before your first visit.",
    pricingRows: rowsFromSections("Puppy socialization (10–20 weeks)"),
  },
  {
    id: "teen-puppy-class",
    label: "Teen Puppy Class",
    forText: "Teen puppies",
    summary:
      "A structured class for adolescent dogs building focus, manners, and engagement around distractions.",
    bullets: ["Consultation required first", "5 months – 9 months", "Handler coaching"],
    image: "/images/Classes images/teen_puppy.webp",
    imageAvif: "/images/Classes images/teen_puppy.avif",
    packagePrice: "$350 + tax",
    packageDetail: "for 4 classes",
    heroEyebrow: "4-class series · dogs 5–9 months",
    heroTitle: "Teen Puppy Class in Montreal",
    heroDescription:
      "Engagement building, confidence building, socialization, leash manners, and intro to new environments and distractions — for dogs entering their teenage phase.",
    overviewTitle: "What to expect",
    classInfo: [
      "Consultation required first",
      "Age: 5 months to 9 months old",
      "Package: 4 classes · $350 + tax",
      "Engagement building, confidence building, socialization, leash manners, and intro to new environments/distractions",
      "Complete all classes within 2 months of your start date",
      "Minimum 3 dogs required for the class to run · classes hosted biweekly",
      "Payment due in full before the first session",
      "Bring food/treats, leash, collar, water, toy, and potty bags to every session",
    ],
    goals: [
      "Reinforcing engagement and relationship tools",
      "The Three D's — Duration, Distance, Distraction",
      "Three attention cues — Name, Touch, Leash",
      "Application of markers",
      "Increasing motivation",
      "Socialization",
      "Leash handling",
    ],
    forYouIf: [
      "Your adolescent dog has selective hearing and big feelings.",
      "Walks feel harder than they did a month ago.",
      "You want structure without the intensity of a behaviour-modification program.",
      "Your puppy graduated socialization and needs the next step.",
      "You want clear homework and trainer feedback each week.",
    ],
    goalCarouselBody:
      "This class is designed for dogs entering their teenage phase — a time when reactivity, stubbornness, and other issues can arise. It helps owners use the right motivators to address and prevent unwanted behaviors. An excellent follow-up to private classes and preparation for Level 1 Obedience.",
    ctaHeadline: "Find the right teen class series",
    ctaBody:
      "Book an assessment first. Your trainer will approve teen puppy group when your dog is ready, then you can request an upcoming full series.",
    pricingRows: rowsFromSections("Teen puppy group — 4 classes", "Teen puppy group — 1 class"),
  },
  {
    id: "reactivity-group-class",
    label: "Reactivity Group Class",
    forText: "For dogs who struggle around triggers",
    summary:
      "Designed for reactive dogs that need gradual exposure to a group setting while working through distractions and overcoming reactivity.",
    bullets: [
      "Consultation required first",
      "Available for all ages",
      "Threshold distance work",
      "Handler coaching",
    ],
    image: "/images/Classes images/reactivity_group_class.webp",
    packagePrice: "$360 + tax",
    packageDetail: "for 4 classes",
    heroEyebrow: "4-class series · reactivity & triggers",
    heroTitle: "Reactivity Group Class in Montreal",
    heroDescription:
      "Structured group reactivity training focused on slowly introducing your dog to a group setting — with trainer oversight in a controlled environment.",
    overviewTitle: "What to expect",
    classInfo: [
      "Consultation required first",
      "Available for all ages",
      "Package: 4 classes · $360 + tax",
      "Focus: gradual exposure to a group setting while working through distractions and overcoming reactivity",
      "Dogs must have completed private classes or be approved during a consultation",
      "Complete all classes within 6 weeks of your start date",
      "Minimum 3 dogs required for the class to run · classes hosted biweekly",
      "Payment due in full before the first session",
      "Bring food/treats, leash, collar, water, toy, and potty bags to every session",
    ],
    goals: [
      "The Three D's — Duration, Distance, and Distraction",
      "Three attention cues — Name, Touch, and Leash",
      "Active engagement",
      "Stability work",
      "Building tools",
      "Realistic scenarios",
      "Socialization",
      "Getting the dog ready for next-level training",
    ],
    forYouIf: [
      "Your dog lunges, barks, or shuts down around dogs, people, or urban triggers.",
      "You avoid certain routes, parks, or times of day.",
      "You want a group format with controlled spacing and trainer oversight.",
      "You've started private work and your trainer recommends group reps.",
      "You need a plan that respects your dog's threshold — not flooding.",
    ],
    goalCarouselBody:
      "Our reactivity course focuses on slowly introducing dogs to a group setting. The focus is not basic commands — trainers monitor every session to ensure quality training in a controlled environment.",
    ctaHeadline: "See if reactivity group is the right fit",
    ctaBody:
      "Reactivity group placement requires an assessment and trainer approval. We'll confirm your dog is ready for this format before you request a series.",
    pricingRows: rowsFromSections("Reactivity group class — 4 classes", "Reactivity group class — 1 class"),
  },
  {
    id: "level-1-obedience-class",
    label: "Level 1 Obedience",
    forText: "Basic Obedience",
    summary:
      "Group setting focused on the 6 basic commands while emphasizing engagement, obedience, and neutral behavior around distractions.",
    bullets: [
      "Consultation required first",
      "As of 9 months old",
      "Sit, down, stay, heel, come and place",
      "Neutrality and impulse control around distractions",
    ],
    image: "/images/Classes images/obedience_group_class_1.webp",
    imageAvif: "/images/Classes images/obedience_group_class_1.avif",
    imageClassName: "object-[center_30%]",
    packagePrice: "$360 + tax",
    packageDetail: "for 4 classes",
    heroEyebrow: "4-class series · basic obedience",
    heroTitle: "Level 1 Obedience Class in Montreal",
    heroDescription:
      "Intro to obedience training, engagement work, and relationship building — the ideal preparation for Level 2 Basic Obedience.",
    overviewTitle: "What to expect",
    classInfo: [
      "Consultation required first",
      "As of 9 months old",
      "Package: 4 classes · $360 + tax",
      "Six basic commands: sit, down, stay, heel, come, and place — with engagement and neutral behavior around distractions",
      "Complete all classes within 2 months of your start date",
      "Minimum 3 dogs required for the class to run · classes hosted biweekly",
      "Payment due in full before the first session",
      "Bring food/treats, leash, collar, water, toy, and potty bags to every session",
    ],
    goals: [
      "Reinforcing engagement and relationship tools",
      "The Three D's — Duration, Distance, Distraction",
      "Application of markers",
      "Application of basic commands (sit, down, stay, heel, come, place)",
      "Exposure to different environments & distractions",
      "Socialization",
      "Getting ready for our level 2 basic obedience",
    ],
    forYouIf: [
      "You want a structured manners class with clear weekly goals.",
      "Your dog needs basics that work outside the living room.",
      "You're ready for group proofing with trainer guidance.",
      "You prefer a series format over one-off drop-ins.",
      "Your trainer approved Level 1 after your assessment.",
    ],
    goalCarouselBody:
      "Now is the perfect time to start obedience training with your dog. This class enhances your handling skills, strengthens your bond, and focuses on basic commands — ideal preparation for Level 2 Basic Obedience.",
    ctaHeadline: "Request a Level 1 series",
    ctaBody:
      "After your assessment, your trainer enables the programs your dog is ready for. Then browse upcoming Level 1 series and request your spot.",
    pricingRows: rowsFromSections("Level 1 Obedience — 4 classes", "Level 1 Obedience — 1 class"),
  },
  {
    id: "level-2-obedience-class",
    label: "Level 2 Obedience",
    forText: "Pack Walk Structure",
    summary:
      "Join the pack! Group walks across Montreal designed to build confidence, improve obedience, and practice real-world training.",
    bullets: [
      "Consultation required first",
      "As of 12 months",
      "Real-world training and proofing",
      "$25/class for the lifetime of the dog after package completion!",
    ],
    image: "/images/mt_royal_image.jpg",
    packagePrice: "$450 + tax",
    packageDetail: "for 5 classes",
    heroEyebrow: "5-class series · pack walks",
    heroTitle: "Level 2 Obedience Class in Montreal",
    heroDescription:
      "Pack walk structure at popular public parks in Montreal — high distractions, new environments, and realistic scenarios for teams ready to put their training to the test.",
    overviewTitle: "What to expect",
    classInfo: [
      "Consultation required first",
      "As of 12 months",
      "Package: 5 classes · $450 + tax",
      "Group walks across Montreal — real-world training and proofing",
      "After graduation, rejoin this class for the lifetime of your dog for $25 per class",
      "Complete all classes within 2 months of your start date",
      "Minimum 6 dogs required for the class to run · classes hosted biweekly",
      "Payment due in full before the first session",
      "Bring food/treats, leash, collar, water, toy, and potty bags to every session",
    ],
    goals: [
      "Reinforcing topics covered in Level 1",
      "Working on basic commands on-leash",
      "Pack walk structure",
      "High distractions",
      "New environments",
      "Realistic scenarios",
      "Active and static engagement",
    ],
    forYouIf: [
      "Your dog has completed Level 1 (or equivalent skills) with your trainer's OK.",
      "Basics are there at home but fall apart around distractions.",
      "You want more challenge without jumping to advanced sport work.",
      "You're ready for longer reps and stricter criteria.",
      "You want a fixed series with weekly coaching.",
    ],
    goalCarouselBody:
      "This is the level that puts dogs to the test. Owners incorporate topics from private classes or Level 1 training at popular public parks across Montreal, where dogs are exposed to different environments and distractions.",
    ctaHeadline: "Level up with a Level 2 series",
    ctaBody:
      "Trainer approval is required before booking. We'll confirm Level 2 is appropriate after your assessment or progress check.",
    pricingRows: rowsFromSections("Level 2 Obedience — 5 classes", "Level 2 Obedience — 1 class"),
  },
  {
    id: "level-3-obedience-class",
    label: "Level 3 Obedience",
    forText: "Advanced Obedience",
    summary: "Taking training to the next Level!",
    bullets: ["Consultation required first", "As of 12 months", "Off-Leash Reliability"],
    image: "/images/Classes images/obedience.webp",
    packagePrice: "$450 + tax",
    packageDetail: "for 5 classes",
    note: "Coming soon",
    comingSoon: true,
    heroEyebrow: "5-class series · advanced obedience · coming soon",
    heroTitle: "Level 3 Obedience Class in Montreal",
    heroDescription:
      "Off-leash obedience for teams ready to take training to the next level — basic commands and engagement performed off-leash with safety-first coaching.",
    overviewTitle: "What to expect",
    classInfo: [
      "Consultation required first",
      "As of 12 months",
      "Package: 5 classes · $450 + tax · Coming soon",
      "Off-leash reliability — basic commands and engagement performed off-leash",
      "Some classes may begin with a 15-minute safety seminar before off-leash activities",
      "Complete all classes within 2 months of your start date",
      "Minimum 3 dogs required for the class to run · classes hosted weekly",
      "Payment due in full before the first session",
      "Bring food/treats, leash, collar, water, toy, and potty bags to every session",
    ],
    goals: [
      "Reinforcing topics covered in Level 1 and Level 2",
      "Working on basic commands off-leash",
    ],
    forYouIf: [
      "You and your dog have strong Level 2 skills and want the next challenge.",
      "You want advanced group proofing with professional oversight.",
      "You're committed to precision and consistent homework.",
      "You want to keep training in a structured group format.",
      "You're on our waitlist for advanced obedience offerings.",
    ],
    goalCarouselBody:
      "This course is a step up from Level 2 for owners ready to take training to the next level. Your dog will perform basic commands and engage off-leash, with safety seminars at the start of select classes.",
    ctaHeadline: "Level 3 is coming soon",
    ctaBody:
      "Book an assessment today and your trainer can recommend Level 1 or Level 2 in the meantime. We'll notify approved clients when Level 3 opens.",
    pricingRows: rowsFromSections("Level 3 Obedience — 5 classes"),
  },
]

const offeringById = new Map(GROUP_CLASS_OFFERINGS.map((o) => [o.id, o]))

export function getGroupClassOffering(id: string): GroupClassOffering | undefined {
  return offeringById.get(id.trim())
}

export function groupClassOfferingIds(): string[] {
  return GROUP_CLASS_OFFERINGS.map((o) => o.id)
}

export function pricingSectionForOffering(offering: GroupClassOffering): InFacilityPriceSection | null {
  if (offering.pricingRows.length === 0) return null
  return {
    title: offering.comingSoon ? "Group Classes — Package Rates" : `${offering.label} — Rates`,
    rows: offering.pricingRows,
  }
}
