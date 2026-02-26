"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { BookingLink } from "@/components/booking-form-provider"

const navLinks = [
  { label: "Training Programs", href: "/services" },
  { label: "Results", href: "/results" },
  { label: "About Us", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Blogs", href: "/blog" },
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
        className={`relative overflow-hidden max-w-7xl mx-auto rounded-3xl border border-white/35 bg-background/45 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_30px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.45)] transition-all duration-300 ${scrolled ? "bg-background/55 shadow-[0_10px_40px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.55)]" : ""}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-white/10 to-transparent" />
        <div className="pointer-events-none absolute -top-16 left-10 h-28 w-56 rounded-full bg-white/20 blur-2xl" />
        <div className="flex items-center justify-between h-16 md:h-20 px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display text-black text-xl md:text-2xl font-bold tracking-tight">
              Montreal Canine Training
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-base font-medium transition-colors ${
                  pathname === link.href
                    ? "text-black font-semibold"
                    : "text-black/80 hover:text-black"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Link href="tel:+15145551234" className="text-base font-medium text-black/80 hover:text-black flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              (514) 555-1234
            </Link>
            <BookingLink>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6">
                Book a Free Call
              </Button>
            </BookingLink>
          </div>

          <div className="lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button className="p-2 text-black" aria-label="Open menu">
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[86vw] sm:max-w-sm border-l border-white/35 bg-background/45 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_30px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.45)]"
              >
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/35 via-white/10 to-transparent" />
                <div className="absolute -top-20 -left-10 h-44 w-56 rounded-full bg-white/20 blur-3xl pointer-events-none" />
                <div className="absolute top-1/3 -right-12 h-40 w-40 rounded-full bg-white/12 blur-3xl pointer-events-none" />

                <div className="relative pt-10 px-1">
                  <div className="flex flex-col gap-2">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`rounded-xl px-3 py-3 text-lg font-medium transition-colors ${
                          pathname === link.href
                            ? "bg-black/5 text-black font-semibold"
                            : "text-black/80 hover:bg-black/5 hover:text-black"
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                  <div className="pt-5 mt-5 border-t border-black/10 space-y-3">
                    <Link
                      href="tel:+15145551234"
                      className="text-black/85 flex items-center gap-2 px-3 py-2 text-base font-medium"
                      onClick={() => setIsOpen(false)}
                    >
                      <Phone className="w-4 h-4" />
                      (514) 555-1234
                    </Link>
                    <BookingLink onClick={() => setIsOpen(false)}>
                      <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full w-full h-11">
                        Book a Free Call
                      </Button>
                    </BookingLink>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  )
}
