export type TransformationStory = {
  slug: string
  dogName: string
  breed: string
  path: string
  before: string
  after: string
  testimonial: string
  mediaAlt: string
  mediaPlaceholder: string
  mediaType: "image" | "video"
  mediaSrc?: string
  href: string
}

export const transformationStories: TransformationStory[] = [
  {
    slug: "luna",
    dogName: "Luna",
    breed: "German Shepherd Mix",
    path: "Reactivity & Anxiety",
    before:
      "Luna lunged at every dog on the street. Her owner hadn't had a guest over in 8 months.",
    after:
      "Luna now walks calmly through the park. Guests come over every weekend.",
    testimonial:
      "I never thought we'd get here. The team gave us a clear plan and stuck with us until it clicked.",
    mediaAlt: "Luna walking on a loose leash through Parc Maisonneuve with her owner",
    mediaPlaceholder:
      "Add Luna's training video or photo here (walking calmly in a Montreal park).",
    mediaType: "image",
    href: "/results/luna",
  },
  {
    slug: "milo",
    dogName: "Milo",
    breed: "French Bulldog",
    path: "City Manners",
    before:
      "Milo pulled so hard on walks his owner stopped taking him out. He destroyed furniture when left alone.",
    after:
      "Milo heels on a loose leash and settles calmly when his owner leaves for work.",
    testimonial: "From chaos to calm. The difference is night and day.",
    mediaAlt: "Milo heeling beside his owner on a Montreal sidewalk",
    mediaPlaceholder:
      "Add Milo's training video or photo here (city heel and calm home behavior).",
    mediaType: "image",
    href: "/results/milo",
  },
  {
    slug: "bella",
    dogName: "Bella",
    breed: "Rescue Pit Bull",
    path: "High-Risk Behaviors",
    before:
      "Bella resource-guarded food and toys. The family had a new baby on the way and were terrified.",
    after:
      "Bella is now gentle around the baby. The family kept their dog — and their peace of mind.",
    testimonial:
      "They didn't give up on us when everyone else did. We're forever grateful.",
    mediaAlt: "Bella relaxing calmly with family nearby",
    mediaPlaceholder:
      "Add Bella's training video or photo here (calm behavior around family).",
    mediaType: "image",
    href: "/results/bella",
  },
]

export function getTransformationStory(slug: string) {
  return transformationStories.find((story) => story.slug === slug)
}
