import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { BookingFormProvider } from "@/components/booking-form-provider"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Montreal Canine Training — Real-World Dog Training in Montreal",
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
  ],
  openGraph: {
    title: "Montreal Canine Training — Real-World Dog Training",
    description:
      "Real-world behavioral coaching for Montreal dog owners. Calm walks, confident dogs, and clear plans.",
    locale: "en_CA",
    type: "website",
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
        <BookingFormProvider>
          {children}
        </BookingFormProvider>
      </body>
    </html>
  )
}
