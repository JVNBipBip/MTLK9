"use client"

import { motion } from "framer-motion"

interface AnimatedTextProps {
  text: string
  delay?: number
}

export function AnimatedText({ text, delay = 0 }: AnimatedTextProps) {
  return (
    <span>
      {text.split(" ").map((word, wordIndex, wordsArray) => (
        <span key={wordIndex} className="inline-block whitespace-nowrap">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: delay + wordIndex * 0.1, // Staggering by word instead of character
              ease: [0.21, 0.47, 0.32, 0.98],
            }}
            className="inline-block will-change-transform"
            style={{ backfaceVisibility: "hidden", WebkitFontSmoothing: "antialiased" }}
          >
            {word}
          </motion.span>
          {wordIndex < wordsArray.length - 1 && (
            <span className="inline-block">&nbsp;</span>
          )}
        </span>
      ))}
    </span>
  )
}
