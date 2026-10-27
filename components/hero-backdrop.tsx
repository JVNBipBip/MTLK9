"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { Pause, Play } from "lucide-react"
import { useAppLocale } from "@/components/locale-provider"

const photos = ["/images/october-2026/home-training.webp", "/images/october-2026/group-walk.webp"]

/** Real supplied training photos, framed for desktop without cropping portrait video. */
export function HeroBackdrop() {
  const fr = useAppLocale() === "fr"
  const [slide, setSlide] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(true)
  const [secondReady, setSecondReady] = useState(false)
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReducedMotion(preference.matches)
    update(); preference.addEventListener("change", update)
    return () => preference.removeEventListener("change", update)
  }, [])
  useEffect(() => {
    if (paused || reducedMotion || !secondReady) return
    const timer = window.setInterval(() => setSlide(current => (current + 1) % photos.length), 8000)
    return () => window.clearInterval(timer)
  }, [paused, reducedMotion, secondReady])
  return <>
    {photos.map((src, index) => <Image key={src} src={src} alt="" aria-hidden fill priority={index === 0} sizes="100vw" quality={75} onLoad={index === 1 ? () => setSecondReady(true) : undefined} className={`object-cover object-[45%_center] md:object-[65%_center] transition-opacity duration-1000 motion-reduce:transition-none ${slide === index ? "opacity-100" : "opacity-0"}`} />)}
    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/65 to-black/25 md:bg-gradient-to-r md:from-black/80 md:via-black/65 md:to-black/25" />
    {!reducedMotion && <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? (fr ? "Reprendre le diaporama" : "Play slideshow") : (fr ? "Mettre le diaporama en pause" : "Pause slideshow")} className="absolute bottom-3 right-3 z-20 flex size-11 items-center justify-center rounded-full border border-white/40 bg-black/60 text-white hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{paused ? <Play className="size-4" /> : <Pause className="size-4" />}</button>}
  </>
}
