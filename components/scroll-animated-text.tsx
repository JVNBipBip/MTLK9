"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"

interface ScrollAnimatedTextProps {
  text: string
  className?: string
  as?: "h1" | "h2" | "h3" | "p" | "span"
  delay?: number
  charDelay?: number
}

export function ScrollAnimatedText({
  text,
  className = "",
  as: Tag = "h2",
  delay = 0,
  charDelay = 0.02,
}: ScrollAnimatedTextProps) {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" })

  return (
    <Tag ref={ref as React.RefObject<never>} className={className}>
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{
            duration: 0.5,
            delay: delay + index * charDelay,
            ease: [0.21, 0.47, 0.32, 0.98],
          }}
          style={{ display: char === " " ? "inline" : "inline-block" }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </Tag>
  )
}
