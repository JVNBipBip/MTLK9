"use client"

import { motion } from "framer-motion"

interface AnimatedTextProps {
  text: string
  delay?: number
}

export function AnimatedText({ text, delay = 0 }: AnimatedTextProps) {
  return (
    <span>
      {text.split(" ").map((word, wordIndex, wordsArray) => {
        // We calculate a starting index for the delay so it's consistent across words
        const previousCharsCount = wordsArray
          .slice(0, wordIndex)
          .reduce((acc, w) => acc + w.length + 1, 0) // +1 for the space

        return (
          <span key={wordIndex} className="inline-block whitespace-nowrap">
            {word.split("").map((char, charIndex) => {
              const globalIndex = previousCharsCount + charIndex
              return (
                <motion.span
                  key={charIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: delay + globalIndex * 0.02,
                    ease: [0.21, 0.47, 0.32, 0.98],
                  }}
                  className="inline-block will-change-transform"
                  style={{ backfaceVisibility: "hidden", WebkitFontSmoothing: "antialiased" }}
                >
                  {char}
                </motion.span>
              )
            })}
            {wordIndex < wordsArray.length - 1 && (
              <span className="inline-block">&nbsp;</span>
            )}
          </span>
        )
      })}
    </span>
  )
}
