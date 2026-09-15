type WistiaClickToPlayProps = {
  wistiaId: string
  title: string
  className?: string
  fitStrategy?: "cover" | "contain"
}

export function WistiaClickToPlay({
  wistiaId,
  title,
  className = "aspect-[9/16]",
  fitStrategy = "contain",
}: WistiaClickToPlayProps) {
  const embedUrl = `https://fast.wistia.net/embed/iframe/${wistiaId}?videoFoam=true&fitStrategy=${fitStrategy}&autoPlay=false&muted=false&controlsVisibleOnLoad=true&playbar=true&smallPlayButton=true&volumeControl=true`

  return (
    <div
      data-video-playback="wistia-embed"
      className={`relative overflow-hidden bg-black ${className}`}
    >
      <iframe
        src={embedUrl}
        title={title}
        loading="lazy"
        allow="autoplay; fullscreen"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  )
}
