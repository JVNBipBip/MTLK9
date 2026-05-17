"use client"

import { cn } from "@/lib/utils"
import { useAppLocale } from "@/components/locale-provider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BEST_TIME_OPTIONS, DOG_AGE_OPTIONS } from "../constants"
import { bookingOptionLabel, bookingStepCopy } from "../translations"
import type { StepProps } from "../types"

export function StepYouAndDog({ formData, updateFormData }: StepProps) {
  const locale = useAppLocale()
  const copy = bookingStepCopy[locale]

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground mb-1">
          {copy.youAndDogTitle}
        </h2>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="contactName" className="text-sm font-medium">
            {copy.contactName}
          </Label>
          <Input
            id="contactName"
            placeholder={copy.contactNamePlaceholder}
            value={formData.contactName}
            onChange={(e) => updateFormData({ contactName: e.target.value })}
            className="rounded-xl h-11 text-base"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contactPhone" className="text-sm font-medium">
            {copy.contactPhone}
          </Label>
          <Input
            id="contactPhone"
            type="tel"
            placeholder="(514) 555-1234"
            value={formData.contactPhone}
            onChange={(e) => updateFormData({ contactPhone: e.target.value })}
            className="rounded-xl h-11 text-base"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contactEmail" className="text-sm font-medium">
            {copy.contactEmail}
          </Label>
          <Input
            id="contactEmail"
            type="email"
            placeholder="you@email.com"
            value={formData.contactEmail}
            onChange={(e) => updateFormData({ contactEmail: e.target.value })}
            className="rounded-xl h-11 text-base"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dogName" className="text-sm font-medium">
            {copy.dogName}
          </Label>
          <Input
            id="dogName"
            placeholder={copy.dogNamePlaceholder}
            value={formData.dogName}
            onChange={(e) => updateFormData({ dogName: e.target.value })}
            className="rounded-xl h-11 text-base"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dogBreed" className="text-sm font-medium">
            {copy.dogBreed}
          </Label>
          <Input
            id="dogBreed"
            placeholder={copy.dogBreedPlaceholder}
            value={formData.dogBreed}
            onChange={(e) => updateFormData({ dogBreed: e.target.value })}
            className="rounded-xl h-11 text-base"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{copy.dogAge}</Label>
          <Select value={formData.dogAge} onValueChange={(value) => updateFormData({ dogAge: value })}>
            <SelectTrigger className={cn("rounded-xl h-11 text-base w-full")}>
              <SelectValue placeholder={copy.dogAgePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {DOG_AGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {bookingOptionLabel(locale, opt.value, opt.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{copy.contactBestTime}</Label>
          <Select
            value={formData.contactBestTime}
            onValueChange={(value) => updateFormData({ contactBestTime: value })}
          >
            <SelectTrigger className={cn("rounded-xl h-11 text-base w-full")}>
              <SelectValue placeholder={copy.contactBestTimePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {BEST_TIME_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {bookingOptionLabel(locale, opt.value, opt.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contactNotes" className="text-sm font-medium">
            {copy.additionalDogContext}{" "}
            <span className="text-muted-foreground font-normal">{copy.optional}</span>
          </Label>
          <Textarea
            id="contactNotes"
            placeholder={copy.contactNotesPlaceholder}
            value={formData.contactNotes}
            onChange={(e) => updateFormData({ contactNotes: e.target.value })}
            className="rounded-xl min-h-[80px] text-base resize-none"
          />
        </div>
      </div>
    </div>
  )
}
