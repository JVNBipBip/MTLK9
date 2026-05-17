import Image from "next/image"
import { cn } from "@/lib/utils"

type CardCoverImageProps = {
  /** Primary URL (WebP); used as `<img>` fallback and for `next/image` when no AVIF. */
  src: string
  /** Optional AVIF source (smaller for many photos); when set, `<picture>` is used. */
  srcAvif?: string
  alt: string
  fill: true
  className?: string
  sizes: string
}

/**
 * Card hero image with optional AVIF + WebP `<picture>` stack (bypasses huge sources).
 * Falls back to next/image when `srcAvif` is omitted.
 */
export function CardCoverImage({ src, srcAvif, alt, className, sizes }: CardCoverImageProps) {
  if (srcAvif) {
    return (
      <picture className="absolute inset-0">
        <source srcSet={srcAvif} type="image/avif" />
        <source srcSet={src} type="image/webp" />
        {/* eslint-disable-next-line @next/next/no-img-element -- fixed raster set; LCP image with type negotiation */}
        <img src={src} alt={alt} className={cn("h-full w-full", className)} sizes={sizes} />
      </picture>
    )
  }

  return <Image src={src} alt={alt} fill className={className} sizes={sizes} />
}
