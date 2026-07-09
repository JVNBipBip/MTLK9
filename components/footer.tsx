"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Mail, MapPin, Phone, Instagram, Facebook } from "lucide-react"
import { FreeCallLink } from "@/components/booking-form-provider"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useAppLocale } from "@/components/locale-provider"
import { addLocaleToPathname } from "@/lib/i18n/config"

const footerLinks = {
  training: [
    { label: { en: "Consultation", fr: "Consultation" }, href: "/services/consultation" },
    { label: { en: "Reactivity Training", fr: "Réactivité" }, href: "/services/reactivity" },
    { label: { en: "Aggressive Dog Training", fr: "Chien agressif" }, href: "/services/aggression" },
    { label: { en: "Separation Anxiety", fr: "Anxiété de séparation" }, href: "/services/separation-anxiety" },
    { label: { en: "Private Classes", fr: "Cours privés" }, href: "/services/private-classes" },
    { label: { en: "Obedience Training", fr: "Obéissance" }, href: "/services/obedience" },
    { label: { en: "Puppy Training", fr: "Chiots" }, href: "/services/puppy-training" },
    { label: { en: "In-Home Training", fr: "À domicile" }, href: "/services/in-home" },
    { label: { en: "West Island Dog Training", fr: "Dressage Ouest-de-l'Île" }, href: "/dog-training-west-island" },
  ],
  company: [
    { label: { en: "About Us", fr: "À propos" }, href: "/about" },
    { label: { en: "Results", fr: "Résultats" }, href: "/results" },
    { label: { en: "FAQ", fr: "FAQ" }, href: "/faq" },
    { label: { en: "Blog", fr: "Blogue" }, href: "/blog" },
    { label: { en: "Contact", fr: "Contact" }, href: "/booking" },
  ],
  resources: [
    { label: { en: "Contact Us for a Free Call", fr: "Appel découverte gratuit" }, href: "/booking" },
    { label: { en: "Book an Evaluation", fr: "Réserver une évaluation" }, href: "/booking" },
    { label: { en: "Google Reviews", fr: "Avis Google" }, href: "https://maps.app.goo.gl/GoTny9wRbvZ1Y81fA" },
  ],
}

export function Footer() {
  const t = useTranslations("common")
  const locale = useAppLocale()
  const hrefFor = (href: string) => (href.startsWith("/") ? addLocaleToPathname(href, locale) : href)

  return (
    <footer className="bg-foreground text-background py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          <div className="lg:col-span-2">
            <Link href={hrefFor("/")} className="flex items-center gap-2 mb-6">
              <span className="font-display text-xl font-semibold text-background tracking-tight">
                Montreal Canine Training
              </span>
            </Link>
            <p className="text-background/70 leading-relaxed mb-6 max-w-sm">
              {t("footer.description")}
            </p>
            <div className="space-y-3 text-sm text-background/70">
              <FreeCallLink className="flex items-center gap-3 hover:text-background transition-colors text-left w-full sm:w-auto cursor-pointer">
                <span className="flex items-center gap-3">
                  <Phone className="w-4 h-4" />
                  <span>514 826 9558</span>
                </span>
              </FreeCallLink>
              <Link href="mailto:mtlcaninetraining@gmail.com" className="flex items-center gap-3 hover:text-background transition-colors">
                <Mail className="w-4 h-4" />
                <span>mtlcaninetraining@gmail.com</span>
              </Link>
              <Link
                href="https://maps.app.goo.gl/GoTny9wRbvZ1Y81fA"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 hover:text-background transition-colors"
              >
                <MapPin className="w-4 h-4 shrink-0" />
                <span>7770 Boulevard Henri-Bourassa E, Montreal, Quebec H1E 1P2</span>
              </Link>
            </div>
            <div className="flex gap-4 mt-6">
              <Link
                href="https://www.instagram.com/mtlcaninetraining/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 text-background" />
              </Link>
              <Link
                href="https://www.facebook.com/profile.php?id=100051498044652"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5 text-background" />
              </Link>
            </div>
            <LanguageSwitcher className="mt-6 border-background/20 bg-background/10 [&_a]:text-background/70 [&_a:hover]:text-background [&_a[aria-current=true]]:bg-background [&_a[aria-current=true]]:text-foreground" />
          </div>

          <div>
            <h4 className="font-medium text-background mb-4">{t("footer.trainingPrograms")}</h4>
            <ul className="space-y-3">
              {footerLinks.training.map((link) => (
                <li key={`${link.href}-${link.label.en}`}>
                  <Link href={hrefFor(link.href)} className="text-sm text-background/70 hover:text-background transition-colors">
                    {link.label[locale]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-background mb-4">{t("footer.company")}</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={`${link.href}-${link.label.en}`}>
                  <Link href={hrefFor(link.href)} className="text-sm text-background/70 hover:text-background transition-colors">
                    {link.label[locale]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-background mb-4">{t("footer.getStarted")}</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={`${link.href}-${link.label.en}`}>
                  <Link href={hrefFor(link.href)} className="text-sm text-background/70 hover:text-background transition-colors">
                    {link.label[locale]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/50">
            © {new Date().getFullYear()} Montreal Canine Training. {t("footer.allRightsReserved")}
          </p>
          <div className="flex gap-6 text-sm text-background/50">
            <Link href={hrefFor("/privacy")} className="hover:text-background transition-colors">
              {t("footer.privacyPolicy")}
            </Link>
            <Link href={hrefFor("/terms")} className="hover:text-background transition-colors">
              {t("footer.termsOfService")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
