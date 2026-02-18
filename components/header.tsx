"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"

const navLinks = [
  { label: "Training Programs", href: "/services" },
  { label: "About Us", href: "/about" },
  { label: "Results", href: "/results" },
  { label: "FAQ", href: "/faq" },
  { label: "Blog", href: "/blog" },
]

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6">
      <nav
        className={`max-w-7xl mx-auto bg-background/80 backdrop-blur-md border border-border/50 rounded-3xl shadow-lg transition-all duration-300 ${scrolled ? "shadow-xl" : ""}`}
      >
        <div className="flex items-center justify-between h-16 md:h-20 px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display text-foreground text-xl md:text-2xl font-semibold tracking-tight">
              Montreal Canine Training
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  pathname === link.href
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Link href="tel:+15145551234" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              (514) 555-1234
            </Link>
            <Link href="/booking">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6">
                Book a Free Call
              </Button>
            </Link>
          </div>

          <button className="lg:hidden p-2" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="lg:hidden py-6 px-5 border-t border-border/50">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-lg transition-colors ${
                    pathname === link.href
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 mt-2 border-t border-border/50 space-y-3">
                <Link
                  href="tel:+15145551234"
                  className="text-muted-foreground flex items-center gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  <Phone className="w-4 h-4" />
                  (514) 555-1234
                </Link>
                <Link href="/booking" onClick={() => setIsOpen(false)}>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full w-full">
                    Book a Free Call
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
