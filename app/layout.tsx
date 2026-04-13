import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { BookingFormProvider } from "@/components/booking-form-provider"
import { FacebookPixel } from "@/components/facebook-pixel"
import { JsonLd, localBusinessJsonLd } from "@/components/json-ld"
import "./globals.css"

const BASE_URL = "https://mtlcaninetraining.com"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Montreal Canine Training — Real-World Dog Training in Montreal",
    template: "%s — Montreal Canine Training",
  },
  description:
    "Calm walks. Confident dogs. Clear plans. Montreal Canine Training delivers real-world behavioral coaching for leash reactivity, anxiety, puppy training, and more — using humane, evidence-guided methods.",
  keywords: [
    "dog training Montreal",
    "reactive dog training Montreal",
    "puppy classes Montreal",
    "dog behaviorist Montreal",
    "leash training Montreal",
    "separation anxiety dog training Montreal",
    "dog trainer near me",
    "force-free dog training Montreal",
    "dog aggression training Montreal",
    "day training dogs Montreal",
  ],
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: "Montreal Canine Training — Real-World Dog Training",
    description:
      "Real-world behavioral coaching for Montreal dog owners. Calm walks, confident dogs, and clear plans.",
    url: BASE_URL,
    siteName: "Montreal Canine Training",
    locale: "en_CA",
    type: "website",
    // Replace with a real OG image before launch (1200x630 recommended)
    images: [
      {
        url: "/images/hero-fallback.png",
        width: 1200,
        height: 630,
        alt: "Montreal Canine Training — Real-World Dog Training",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Montreal Canine Training — Real-World Dog Training",
    description:
      "Real-world behavioral coaching for Montreal dog owners. Calm walks, confident dogs, and clear plans.",
    images: ["/images/hero-fallback.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <FacebookPixel />
        <JsonLd data={localBusinessJsonLd} />
        <BookingFormProvider>
          {children}
        </BookingFormProvider>
      </body>
    </html>
  )
}
