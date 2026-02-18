import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reactivity & Anxiety — Montreal Canine Training",
  description:
    "Stop planning your life around your dog's triggers. Structured protocols for leash reactivity, fear, anxiety, and separation anxiety — humane, evidence-guided methods.",
}

export default function ReactivityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
