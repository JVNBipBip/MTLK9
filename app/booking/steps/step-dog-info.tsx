"use client"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DOG_AGE_OPTIONS, DOG_DURATION_OPTIONS, DOG_SOURCE_OPTIONS } from "../constants"
import type { StepProps } from "../types"

export function StepDogInfo({ formData, updateFormData }: StepProps) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground mb-1">
          Tell us about your dog
        </h2>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="dogName" className="text-sm font-medium">Dog&apos;s name</Label>
          <Input
            id="dogName"
            placeholder="e.g. Max"
            value={formData.dogName}
            onChange={(e) => updateFormData({ dogName: e.target.value })}
            className="rounded-xl h-11 text-base"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dogBreed" className="text-sm font-medium">Breed or mix</Label>
          <Input
            id="dogBreed"
            placeholder="e.g. German Shepherd mix"
            value={formData.dogBreed}
            onChange={(e) => updateFormData({ dogBreed: e.target.value })}
            className="rounded-xl h-11 text-base"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Age</Label>
          <Select
            value={formData.dogAge}
            onValueChange={(value) => updateFormData({ dogAge: value })}
          >
            <SelectTrigger className={cn("rounded-xl h-11 text-base w-full")}>
              <SelectValue placeholder="Select age range" />
            </SelectTrigger>
            <SelectContent>
              {DOG_AGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">How long have you had them?</Label>
          <Select
            value={formData.dogDuration}
            onValueChange={(value) => updateFormData({ dogDuration: value })}
          >
            <SelectTrigger className={cn("rounded-xl h-11 text-base w-full")}>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {DOG_DURATION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Where did your dog come from?</Label>
          <div className="grid grid-cols-2 gap-2">
            {DOG_SOURCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateFormData({ dogSource: option.value })}
                className={cn(
                  "text-center rounded-xl border p-3 transition-all duration-200",
                  "hover:border-primary/40 hover:bg-primary/5",
                  formData.dogSource === option.value
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-card"
                )}
              >
                <span className="font-medium text-foreground text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
