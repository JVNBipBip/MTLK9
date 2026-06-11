"use client"

import { useId, useState } from "react"
import { ChevronDown } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

export type TrainerBioReadMorePreset = "booking" | "about" | "booking-trainer-page"

export type TrainerBioReadMoreTexts = {
  origin: string
  aboutSpecializes?: string
  hostsPills: string[]
  whatTheyOfferLabel: string
  personal: string
}

type TrainerBioReadMoreProps = {
  preset: TrainerBioReadMorePreset
  texts: TrainerBioReadMoreTexts
  readMoreLabel: string
  readLessLabel: string
  className?: string
}

function OriginParagraphs({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
    </>
  )
}

/** Horizontal strip of compact pills. */
function PillsScroller({
  labels,
  ultraCompact,
}: {
  labels: string[]
  ultraCompact?: boolean
}) {
  return (
    <div
      className={cn(
        "flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      )}
      role="list"
    >
      {labels.map((label, index) => (
        <span
          key={index}
          role="listitem"
          className={cn(
            "shrink-0 rounded-full border border-border/70 bg-background/95 px-2 py-0.5 font-medium text-foreground shadow-sm",
            ultraCompact
              ? "text-[9px] leading-tight"
              : "text-[10px] leading-snug sm:text-[11px]",
          )}
        >
          {label}
        </span>
      ))}
    </div>
  )
}

function FullOffersBox({
  texts,
}: {
  texts: Pick<TrainerBioReadMoreTexts, "hostsPills" | "whatTheyOfferLabel">
}) {
  const { hostsPills, whatTheyOfferLabel } = texts
  return (
    <div className="rounded-xl border border-border/60 bg-muted/35 px-2.5 py-2 md:rounded-2xl md:px-3 md:py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground md:text-[11px] mb-1.5 md:mb-2">
        {whatTheyOfferLabel}
      </p>
      <div className="flex flex-wrap gap-1 md:gap-1.5">
        {hostsPills.map((label, index) => (
          <span
            key={index}
            className="inline-flex max-w-full rounded-full border border-border/70 bg-background/90 px-2 py-0.5 md:px-2.5 md:py-1 text-left text-[10px] leading-snug font-medium text-foreground shadow-sm md:text-xs"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

function FullBioBlock({ texts }: { texts: TrainerBioReadMoreTexts }) {
  const {
    origin,
    aboutSpecializes,
    hostsPills,
    personal,
    whatTheyOfferLabel,
  } = texts

  return (
    <div className="space-y-3 text-muted-foreground text-sm leading-relaxed">
      <div className="space-y-3">
        <OriginParagraphs text={origin} />
      </div>
      {aboutSpecializes ? <p className="font-medium text-foreground/95">{aboutSpecializes}</p> : null}
      <FullOffersBox texts={{ hostsPills, whatTheyOfferLabel }} />
      <p className="text-muted-foreground text-sm leading-relaxed">{personal}</p>
    </div>
  )
}

function CompactTeaser({ texts }: { texts: TrainerBioReadMoreTexts }) {
  const { aboutSpecializes, hostsPills } = texts

  return (
    <div className="rounded-xl border border-border/50 bg-muted/25 px-2.5 py-2 md:px-3 md:py-2.5">
      {aboutSpecializes ? (
        <p className="text-muted-foreground text-[11px] leading-snug sm:text-xs mb-2 line-clamp-4 sm:line-clamp-3 md:line-clamp-2 md:text-sm">
          {aboutSpecializes}
        </p>
      ) : null}
      <PillsScroller labels={hostsPills} ultraCompact />
    </div>
  )
}

/** Trainer /booking/[slug]: specialization line only, no pills or expand. */
function BookingTrainerSpecializesOnly({ texts }: { texts: TrainerBioReadMoreTexts }) {
  const line = texts.aboutSpecializes?.trim()
  if (!line) return null

  return (
    <div className="rounded-xl border border-border/50 bg-muted/25 px-2.5 py-2 md:px-3 md:py-2.5">
      <p className="text-muted-foreground text-[11px] leading-snug sm:text-xs md:text-sm">{line}</p>
    </div>
  )
}

function BioExpandableCompact({
  texts,
  readMoreLabel,
  readLessLabel,
  triggerClassName,
  wrapperClassName,
}: {
  texts: TrainerBioReadMoreTexts
  readMoreLabel: string
  readLessLabel: string
  triggerClassName?: string
  wrapperClassName?: string
}) {
  const idControls = useId()
  const [open, setOpen] = useState(false)

  return (
    <div className={cn("space-y-2", wrapperClassName)}>
      <CompactTeaser texts={texts} />
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger
          id={`${idControls}-toggle`}
          className={cn(
            "flex w-full items-center justify-center gap-1 rounded-full border border-border/70 bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground",
            "hover:bg-muted/70 transition-colors",
            triggerClassName,
          )}
          aria-expanded={open}
          aria-controls={`${idControls}-expanded`}
          type="button"
        >
          <span>{open ? readLessLabel : readMoreLabel}</span>
          <ChevronDown
            className={cn("w-4 h-4 shrink-0 transition-transform", open ? "rotate-180" : "rotate-0")}
            aria-hidden
          />
        </CollapsibleTrigger>
        <CollapsibleContent id={`${idControls}-expanded`} className="overflow-hidden">
          <div className="pt-4">
            <FullBioBlock texts={texts} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

/**
 * Booking hub: teaser + read more at every breakpoint.
 * About: teaser + read more below md; full bio static from md upward.
 * booking-trainer-page: specialization sentence only (/booking/[trainerSlug]).
 */
export function TrainerBioReadMoreSection({
  preset,
  texts,
  readMoreLabel,
  readLessLabel,
  className,
}: TrainerBioReadMoreProps) {
  if (preset === "booking-trainer-page") {
    const line = texts.aboutSpecializes?.trim()
    if (!line) return null

    return (
      <div className={cn("pt-2 border-t border-border/45", className)}>
        <BookingTrainerSpecializesOnly texts={texts} />
      </div>
    )
  }

  if (preset === "about") {
    return (
      <div className={className}>
        <div className="hidden md:block space-y-3 pt-4 border-t border-border/40">
          <FullBioBlock texts={texts} />
        </div>
        <div className="md:hidden pt-3 border-t border-border/40 space-y-2">
          <BioExpandableCompact
            texts={texts}
            readMoreLabel={readMoreLabel}
            readLessLabel={readLessLabel}
            triggerClassName="min-h-10 border-primary bg-primary px-4 py-2.5 text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 hover:text-primary-foreground"
          />
        </div>
      </div>
    )
  }

  /* booking hub */
  return (
    <div className={cn("pt-2 border-t border-border/45", className)}>
      <BioExpandableCompact
        texts={texts}
        readMoreLabel={readMoreLabel}
        readLessLabel={readLessLabel}
      />
    </div>
  )
}
