"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { faqData } from "@/lib/faq-data"
import type { FaqItem } from "@/lib/faq-data"

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-border/50">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-foreground group-hover:text-primary transition-colors pr-4">
          {item.question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
      </div>
    </div>
  )
}

export function FaqAccordion() {
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
      {faqData.map((category) => (
        <div key={category.title}>
          <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-6">
            {category.title}
          </h2>
          <div>
            {category.items.map((item) => {
              const key = `${category.title}-${item.question}`
              return (
                <AccordionItem
                  key={key}
                  item={item}
                  isOpen={openItems.has(key)}
                  onToggle={() => toggle(key)}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
