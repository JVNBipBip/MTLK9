import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "City Manners — Montreal Canine Training",
  description:
    "Make every walk the best part of your day. Urban life skills for dogs: loose leash walking, door manners, recall in distracting environments, and impulse control.",
}

export default function CityMannersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
