"use client"

import { useState } from "react"
import Image from "next/image"
import { Play, X } from "lucide-react"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"

type WistiaClickToPlayProps = {
  wistiaId: string
  posterSrc: string
  title: string
  className?: string
  sizes?: string
  playLabel?: string
  fitStrategy?: "cover" | "contain"
  playbackMode?: "inline" | "portrait-modal"
  closeLabel?: string
}

export function WistiaClickToPlay({
  wistiaId,
  posterSrc,
  title,
  className = "aspect-[9/16]",
  sizes = "(min-width: 1024px) 360px, 86vw",
  playLabel = "Play video",
  fitStrategy = "cover",
  playbackMode = "inline",
  closeLabel = "Close video",
}: WistiaClickToPlayProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const embedUrl = `https://fast.wistia.net/embed/iframe/${wistiaId}?videoFoam=true&fitStrategy=${fitStrategy}&autoPlay=true`

  return (
    <>
      <div
        data-video-playback={playbackMode}
        className={`relative overflow-hidden bg-muted ${className}`}
      >
        {isPlaying && playbackMode === "inline" ? (
          <iframe
            src={embedUrl}
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

      {playbackMode === "portrait-modal" && (
        <Dialog open={isPlaying} onOpenChange={setIsPlaying}>
          <DialogContent
            data-video-orientation="portrait"
            showCloseButton={false}
            aria-describedby={undefined}
            className="h-auto w-auto max-w-none gap-0 border-0 bg-transparent p-0 shadow-none"
            style={{
              width: "min(calc(86dvh * 9 / 16), calc(100vw - 2rem), 438.75px)",
              aspectRatio: "9 / 16",
            }}
          >
            <DialogTitle className="sr-only">{title}</DialogTitle>
            <div className="relative h-full w-full overflow-hidden rounded-[1.75rem] bg-black shadow-2xl">
              <iframe
                src={embedUrl}
                title={title}
                allow="autoplay; fullscreen"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
              <DialogClose
                aria-label={closeLabel}
                className="absolute right-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
