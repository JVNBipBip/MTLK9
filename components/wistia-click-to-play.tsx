"use client"

import { useState } from "react"
import Image from "next/image"
import { Play } from "lucide-react"

type WistiaClickToPlayProps = {
  wistiaId: string
  posterSrc: string
  title: string
  className?: string
  sizes?: string
  playLabel?: string
  fitStrategy?: "cover" | "contain"
}

export function WistiaClickToPlay({
  wistiaId,
  posterSrc,
  title,
  className = "aspect-[9/16]",
  sizes = "(min-width: 1024px) 360px, 86vw",
  playLabel = "Play video",
  fitStrategy = "cover",
}: WistiaClickToPlayProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className={`relative overflow-hidden bg-muted ${className}`}>
      {isPlaying ? (
        <iframe
          src={`https://fast.wistia.net/embed/iframe/${wistiaId}?videoFoam=true&fitStrategy=${fitStrategy}&autoPlay=true`}
          title={title}
          allow="autoplay; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsPlaying(true)}
          className="group/video absolute inset-0 h-full w-full cursor-pointer"
          aria-label={`${playLabel}: ${title}`}
        >
          <Image
            src={posterSrc}
            alt=""
            fill
            sizes={sizes}
            className="object-cover transition-transform duration-500 group-hover/video:scale-[1.02]"
          />
          <span className="absolute inset-0 bg-foreground/20 transition-colors group-hover/video:bg-foreground/30" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-background/95 text-primary shadow-xl transition-transform group-hover/video:scale-105">
              <Play className="ml-1 h-7 w-7" fill="currentColor" aria-hidden="true" />
            </span>
          </span>
        </button>
      )}
    </div>
  )
}
