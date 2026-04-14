export function GET() {
  const content = `# Montreal Canine Training

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
