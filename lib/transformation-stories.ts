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
  wistiaId?: string
  href: string
}

export const transformationStories: TransformationStory[] = [
  {
    slug: "sasha",
    dogName: "Sasha",
    breed: "[Breed]",
    path: "Reactivity Training",
    before:
      "I had no control over Sasha. She was so reactive that I couldn't be around other dogs without her going crazy, which made our walks together a nightmare.",
    after:
      "I can finally enjoy being around other dogs. Sasha is much more manageable, and I've learned the exact techniques to correct her behavior and keep her focused.",
    testimonial:
      "Nick is so experienced and patient. He teaches you exactly how to deal with your dog, and now I actually enjoy our walks again. I recommend him to everybody.",
    mediaAlt: "Sasha's video testimonial about controlling reactivity",
    mediaPlaceholder: "",
    mediaType: "video",
    wistiaId: "ww92aq0dn9",
    href: "/results/sasha",
  },
  {
    slug: "mason",
    dogName: "Mason",
    breed: "German Shepherd",
    path: "Reactivity Training",
    before:
      "Walking Mason was a constant challenge. His reactivity toward other dogs meant we couldn't even walk down the street or through the woods without an incident.",
    after:
      "Mason has come so far that we've transitioned from private lessons to group classes. He genuinely enjoys the training, and our daily life is completely different.",
    testimonial:
      "We drive an hour each way just to come here because it's so worth it. Working with Nick at Montreal Canine Training has truly changed our lives.",
    mediaAlt: "Sabrina's video testimonial about overcoming Mason's severe reactivity",
    mediaPlaceholder: "",
    mediaType: "video",
    wistiaId: "3a2efylwfy",
    href: "/results/mason",
  },
  {
    slug: "multi-dog",
    dogName: "[Dog Name]",
    breed: "[Breed]",
    path: "Puppy Training",
    before:
      "Life with my first reactive dog was a nightmare. Even a simple walk felt impossible, and the constant stress was overwhelming.",
    after:
      "The training made such a difference that I didn't hesitate to return with my new puppy. Now, our walks are enjoyable, and I feel confident about my dogs' future.",
    testimonial:
      "My life was a nightmare before we started. Now, it's a pleasure to be out with my dogs. I knew exactly where to go when I got my second puppy to make sure everything stayed on the right track.",
    mediaAlt: "Multi-dog success story video testimonial",
    mediaPlaceholder: "",
    mediaType: "video",
    wistiaId: "2cytzfcub2",
    href: "/results/multi-dog",
  },
  {
    slug: "theo",
    dogName: "Theo",
    breed: "Doberman",
    path: "Puppy Training",
    before:
      "Searching for a trainer who truly understood the intensity of a working-line Doberman. I was meticulous and hesitant until I found Nick.",
    after:
      "Every session leaves me more confident. We have a clear path forward, and the support is always flexible and open—no question is ever too small.",
    testimonial:
      "I feel so much more confident every time I have a session. They are incredibly flexible and always there to support you, no matter what you need help with.",
    mediaAlt: "Rebecca's video testimonial about training Theo, her Doberman puppy",
    mediaPlaceholder: "",
    mediaType: "video",
    wistiaId: "i0ipeqgj8k",
    href: "/results/theo",
  },
  {
    slug: "shiba",
    dogName: "[Dog Name]",
    breed: "Shiba Inu",
    path: "Puppy Training",
    before:
      "Shiba Inus are notorious for their independent and sometimes difficult attitudes. We wanted to ensure our puppy started on the right foot and developed into a well-rounded dog.",
    after:
      "He is now incredibly social and great with other dogs. The training has been so successful that people often joke he's the \"anti-Shiba\" because of how friendly and calm he is.",
    testimonial:
      "The classes and private training have helped shape him into the dog he is now. There's always room to grow, which is why we keep coming back to Montreal Canine Training.",
    mediaAlt: "Video testimonial about raising a social Shiba Inu puppy",
    mediaPlaceholder: "",
    mediaType: "video",
    wistiaId: "ek2ojttv3i",
    href: "/results/shiba",
  },
  {
    slug: "story-6",
    dogName: "[Dog Name]",
    breed: "[Breed]",
    path: "Reactivity Training",
    before:
      "My dog had been reactive for years. We tried everything, but nothing seemed to stick. Our walks were stressful, and he just couldn't be around other dogs comfortably.",
    after:
      "The change has been drastic. He can now be around other dogs without feeling pressured or reactive. We've found a place where he truly feels safe and comfortable.",
    testimonial:
      "Nick is such an understanding trainer. My dog has had such a drastic change in such a short amount of time—I'm just amazed at the progress we've had.",
    mediaAlt: "Video testimonial about finding comfort and control with a long-reactive dog",
    mediaPlaceholder: "",
    mediaType: "video",
    wistiaId: "qtdpt5lv7o",
    href: "/results/story-6",
  },
]

export function getTransformationStory(slug: string) {
  return transformationStories.find((story) => story.slug === slug)
}
