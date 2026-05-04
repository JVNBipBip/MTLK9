"use client"

import { cn } from "@/lib/utils"
import { useAppLocale } from "@/components/locale-provider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DOG_AGE_OPTIONS } from "../constants"
import { bookingOptionLabel, bookingStepCopy } from "../translations"
import type { StepProps } from "../types"

export function StepDogInfo({ formData, updateFormData }: StepProps) {
  const locale = useAppLocale()
  const copy = bookingStepCopy[locale]

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground mb-1">
          {copy.dogInfoTitle}
        </h2>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="dogName" className="text-sm font-medium">{copy.dogName}</Label>
          <Input
            id="dogName"
            placeholder={copy.dogNamePlaceholder}
            value={formData.dogName}
            onChange={(e) => updateFormData({ dogName: e.target.value })}
            className="rounded-xl h-11 text-base"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dogBreed" className="text-sm font-medium">{copy.dogBreed}</Label>
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
          <Select
            value={formData.dogAge}
            onValueChange={(value) => updateFormData({ dogAge: value })}
          >
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

      </div>
    </div>
  )
}
