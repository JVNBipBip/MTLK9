import type React from "react"
import type { Metadata } from "next"
import { headers } from "next/headers"
import { Inter } from "next/font/google"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { NextIntlClientProvider } from "next-intl"
import { BookingFormProvider } from "@/components/booking-form-provider"
import { ClientLocaleEffects } from "@/components/client-locale-effects"
import { FacebookPixel } from "@/components/facebook-pixel"
import { JsonLd, localBusinessJsonLd } from "@/components/json-ld"
import { LocaleProvider } from "@/components/locale-provider"
import { defaultLocale, isAppLocale, localeConfig, localeHeaderName, type AppLocale } from "@/lib/i18n/config"
import { getMessages } from "@/lib/i18n/messages"
import "./globals.css"

const BASE_URL = "https://mtlcaninetraining.com"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

async function getRequestLocale(): Promise<AppLocale> {
  const headerStore = await headers()
  const locale = headerStore.get(localeHeaderName)
  return isAppLocale(locale) ? locale : defaultLocale
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const localeMessages = getMessages(locale)
  const base = new URL(BASE_URL)

  return {
    metadataBase: base,
    title: {
      default: localeMessages.metadata.title,
      template: localeMessages.metadata.template,
    },
    description: localeMessages.metadata.description,
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
      "entrainement canin Montreal",
      "dressage chien Montreal",
      "cours chiot Montreal",
    ],
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        fr: "/fr",
      },
    },
    openGraph: {
      title: localeMessages.metadata.ogTitle,
      description: localeMessages.metadata.ogDescription,
      url: `${BASE_URL}/${locale}`,
      siteName: locale === "fr" ? "Entraînement Canin Montréal" : "Montreal Canine Training",
      locale: localeConfig[locale].openGraphLocale,
      type: "website",
      // Replace with a real OG image before launch (1200x630 recommended)
      images: [
        {
          url: "/images/hero-fallback.png",
          width: 1200,
          height: 630,
          alt: localeMessages.metadata.imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: localeMessages.metadata.ogTitle,
      description: localeMessages.metadata.ogDescription,
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
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getRequestLocale()
  const localeMessages = getMessages(locale)

  return (
    <html lang={localeConfig[locale].htmlLang} suppressHydrationWarning>
      <body className={`${inter.variable} ${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <NextIntlClientProvider locale={locale} messages={localeMessages}>
          <LocaleProvider locale={locale}>
            <ClientLocaleEffects locale={locale} />
            <FacebookPixel />
            <JsonLd
              data={{
                ...localBusinessJsonLd,
                name: locale === "fr" ? "Entraînement Canin Montréal" : localBusinessJsonLd.name,
                description:
                  locale === "fr"
                    ? "Entraînement canin concret à Montréal. Des promenades calmes, des chiens confiants et des plans clairs grâce à des méthodes humaines et fondées sur les données."
                    : localBusinessJsonLd.description,
                url: `${BASE_URL}/${locale}`,
                inLanguage: locale,
              }}
            />
            <BookingFormProvider>
              {children}
            </BookingFormProvider>
          </LocaleProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
