"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FaqAccordion } from "@/components/faq-accordion"
import { useLocalizedText } from "@/lib/i18n/use-localized-text"

export function FaqSection() {
  const t = useLocalizedText()

  return (
    <section className="pt-24 lg:pt-32 pb-8 lg:pb-12 bg-background">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16 lg:mb-20">
          <motion.p
            className="text-sm uppercase tracking-[0.2em] text-secondary font-medium mb-4"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8% 0px" }}
            transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            {t("Common Questions")}
          </motion.p>
          <motion.h2
            className="font-display text-3xl md:text-5xl lg:text-7xl text-foreground text-balance mb-6 font-semibold tracking-tight"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8% 0px" }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            FAQ
          </motion.h2>
          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8% 0px" }}
            transition={{ duration: 0.45, delay: 0.16, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            {t("Everything you need to know before getting started.")}
          </motion.p>
        </div>

        <FaqAccordion />

        <div className="text-center mt-12">
          <Link href="/faq">
            <Button variant="outline" className="rounded-full px-8 group">
              {t("View All FAQs")}
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
