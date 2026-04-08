import Link from "next/link"
import { Mail, MapPin, Phone, Instagram, Facebook } from "lucide-react"

const footerLinks = {
  training: [
    { label: "Reactivity Training", href: "/services/reactivity" },
    { label: "Private Classes", href: "/services/private-classes" },
    { label: "Obedience Training", href: "/services/obedience" },
    { label: "Puppy Training", href: "/services/puppy-training" },
    { label: "In-Home Training", href: "/services/in-home" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Results", href: "/results" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/booking" },
  ],
  resources: [
    { label: "Book a Free Call", href: "/booking" },
    { label: "Book an Evaluation", href: "/booking" },
    { label: "Google Reviews", href: "https://www.google.com/search?sca_esv=1a51245140343e35&sxsrf=ANbL-n4nQ46KR0EQfRE-u1As-F01VkoYUw:1775574475054&si=AL3DRZEsmMGCryMMFSHJ3StBhOdZ2-6yYkXd_doETEE1OR-qOZXcx_tuXme6UQ3vKDNMy0AG9EXyiX1efheageUu9Z4EdlGsRiMepkUE-rmCGlXbqZRLPZBHXVGMoIWBOw8SkWIPKgGjIKJd2NyDLmZjnI_fD6LrgZCLBk_o-Mfe_EZ-GvPMr7O2rupdmQ0mdMfdmPSHw6tQ0t1QJbx4WCN64IQFgOHGag%3D%3D&q=Montreal+Canine+Training+Inc.+/+Entra%C3%AEnement+Canin+Montr%C3%A9al+Inc.+Reviews&sa=X&ved=2ahUKEwi4lO6ugtyTAxUrETQIHUpNHjkQ0bkNegQIMhAH&biw=2400&bih=1161&dpr=0.8" },
  ],
}

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <span className="font-display text-xl font-semibold text-background tracking-tight">
                Montreal Canine Training
              </span>
            </Link>
            <p className="text-background/70 leading-relaxed mb-6 max-w-sm">
              Real-world training for real Montreal life. Calm walks, confident dogs, and clear
              plans — through humane methods and a team of specialists who have seen it all before.
            </p>
            <div className="space-y-3 text-sm text-background/70">
              <Link href="tel:+15148269558" className="flex items-center gap-3 hover:text-background transition-colors">
                <Phone className="w-4 h-4" />
                <span>514 826 9558</span>
              </Link>
              <Link href="mailto:mtlcaninetraining@gmail.com" className="flex items-center gap-3 hover:text-background transition-colors">
                <Mail className="w-4 h-4" />
                <span>mtlcaninetraining@gmail.com</span>
              </Link>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>7770 Boul Henri-Bourassa E, Anjou, Montreal</span>
              </div>
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
          </div>

          <div>
            <h4 className="font-medium text-background mb-4">Training Programs</h4>
            <ul className="space-y-3">
              {footerLinks.training.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-background/70 hover:text-background transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-background mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-background/70 hover:text-background transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-background mb-4">Get Started</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-background/70 hover:text-background transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/50">
            © {new Date().getFullYear()} Montreal Canine Training. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-background/50">
            {/* TODO: Add real privacy policy and terms pages before launch */}
            <Link href="/privacy" className="hover:text-background transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-background transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
