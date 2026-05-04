"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { getFaqData } from "@/lib/faq-data"
import type { FaqCategory, FaqItem } from "@/lib/faq-data"
import { useAppLocale } from "@/components/locale-provider"

function AccordionItem({
  item,
  itemId,
  index,
  isOpen,
  onToggle,
}: {
  item: FaqItem
  itemId: string
  index: number
  isOpen: boolean
  onToggle: () => void
}) {
  const contentId = `${itemId}-content`

  return (
    <motion.div
      className="border-b border-border/50"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{
        duration: 0.45,
        delay: Math.min(index * 0.08, 0.24),
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left group"
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span className="font-medium text-foreground group-hover:text-primary transition-colors pr-4">
          {item.question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-300 ease-out ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        id={contentId}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <p
            className={`text-muted-foreground leading-relaxed transition-[opacity,transform,padding-bottom] duration-300 ease-out ${
              isOpen ? "pb-5 opacity-100 translate-y-0" : "pb-0 opacity-0 -translate-y-1"
            }`}
          >
            {item.answer}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export function FaqAccordion({
  categories,
}: {
  categories?: FaqCategory[]
}) {
  const locale = useAppLocale()
  const faqCategories = categories ?? getFaqData(locale)
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggle = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <div className="space-y-12">
      {faqCategories.map((category, categoryIndex) => (
        <motion.div
          key={category.title}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{
            duration: 0.5,
            delay: Math.min(categoryIndex * 0.08, 0.2),
            ease: [0.21, 0.47, 0.32, 0.98],
          }}
        >
          <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-6">
            {category.title}
          </h2>
          <div>
            {category.items.map((item, itemIndex) => {
              const key = `${category.title}-${item.question}`
              return (
                <AccordionItem
                  key={key}
                  item={item}
                  itemId={`faq-${categoryIndex}-${itemIndex}`}
                  index={itemIndex}
                  isOpen={openItems.has(key)}
                  onToggle={() => toggle(key)}
                />
              )
            })}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
