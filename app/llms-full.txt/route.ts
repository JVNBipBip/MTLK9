import { faqData } from "@/lib/faq-data"

export function GET() {
  const faqSection = faqData
    .flatMap((cat) =>
      cat.items.map((item) => `Q: ${item.question}\nA: ${item.answer}`)
    )
    .join("\n\n")

  const content = `# Montreal Canine Training — Full Content

> Real-world dog training in Montreal. Calm walks. Confident dogs. Clear plans.

Montreal Canine Training provides professional dog training services in Montreal, West Island, and Laval. We specialize in reactivity training, private classes, obedience, puppy training, and in-home training. Our training philosophy focuses on developing a solid relationship between human and dog, building active engagement before doing any type of obedience training. Engagement, motivation, communication, connection, confidence and relationship is our top priority.

## Training Methods

We offer a variety of different methods. It all depends on the dog in front of us, what is best suited for the dog as well as what is comfortable for the client. Our goal is to use the safest and most effective method tailored to the dog's needs emphasizing the importance of the dog's emotional state. Strong relationship building is priority for us.

---

## Services

### Reactivity Training
For dogs who lunge, bark, or shut down around triggers.
- Format: Private & group classes
- What we work on: The Three D's (Duration, Distance, Distraction), attention cues (Name, Touch, Leash), active and static engagement, leash work and reward placement, stability work and confidence building, realistic scenario training, structured socialization
- This is for you if: You cross the street every time you see another dog, you've rearranged your schedule to avoid triggers, your dog lunges/barks/shuts down on walks, other trainers told you your dog is "too much"
- URL: https://mtlcaninetraining.com/services/reactivity

### Private Classes
For dogs who need focused, one-on-one attention.
- Format: 3, 5, or 7 session packages
- What we work on: Behaviour modification, leash reactivity, aggression management, confidence building, handler skill development, separation anxiety protocol, resource guarding
- This is for you if: Your dog's issues don't fit a group class, you want a trainer's full attention, you're dealing with reactivity/anxiety/aggression/guarding
- URL: https://mtlcaninetraining.com/services/private-classes

### Obedience Training
For dogs 9 months+ who need reliable real-world skills.
- Format: Private & group classes — Level 1 & Level 2
- What we work on: The Three D's, engagement and relationship building, reliable recall, impulse control, pack walks, advanced commands in high-distraction settings
- This is for you if: Your dog knows "sit" at home but ignores you everywhere else, you want a dog you can take anywhere in Montreal
- URL: https://mtlcaninetraining.com/services/obedience

### Puppy Training
For puppies 10–20 weeks & teen dogs 5–9 months.
- Format: Private & group classes
- What we work on: Confidence building through guided play, controlled socialisation, engagement and focus, obstacle courses, six basic commands, marker training, bite inhibition and impulse control
- This is for you if: Your puppy is biting everything, you're unsure how to socialise safely, your teen pup has "selective hearing"
- URL: https://mtlcaninetraining.com/services/puppy-training

### In-Home Training
Training in your own environment.
- Format: Consultation + 3, 5, or 7 session packages
- What we work on: In-home assessment, customised behaviour modification, door manners, separation anxiety, house training, leash skills in your neighbourhood, handler coaching
- This is for you if: Your dog's biggest issues happen at home, you've tried facility-based training and skills didn't transfer
- URL: https://mtlcaninetraining.com/services/in-home

---

## How It Works

1. **Book a Free Call** — Tell us what's going on. We'll figure out the right path together. 15 minutes, no commitment.
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
- Website: https://mtlcaninetraining.com
- Areas served: Montreal, West Island, Laval

## Pages

- Home: https://mtlcaninetraining.com
- All Services: https://mtlcaninetraining.com/services
- Reactivity Training: https://mtlcaninetraining.com/services/reactivity
- Private Classes: https://mtlcaninetraining.com/services/private-classes
- Obedience Training: https://mtlcaninetraining.com/services/obedience
- Puppy Training: https://mtlcaninetraining.com/services/puppy-training
- In-Home Training: https://mtlcaninetraining.com/services/in-home
- Results & Testimonials: https://mtlcaninetraining.com/results
- FAQ: https://mtlcaninetraining.com/faq
- Book a Free Discovery Call: https://mtlcaninetraining.com/booking
`

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  })
}
