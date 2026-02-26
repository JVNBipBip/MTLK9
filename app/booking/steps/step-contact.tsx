"use client"

import { cn } from "@/lib/utils"
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
import { BEST_TIME_OPTIONS } from "../constants"
import type { StepProps } from "../types"

export function StepContact({ formData, updateFormData }: StepProps) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground mb-1">
          Last step — how do we reach you?
        </h2>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="contactName" className="text-sm font-medium">Your name</Label>
          <Input
            id="contactName"
            placeholder="Full name"
            value={formData.contactName}
            onChange={(e) => updateFormData({ contactName: e.target.value })}
            className="rounded-xl h-11 text-base"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contactEmail" className="text-sm font-medium">Email</Label>
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
          <Label htmlFor="contactPhone" className="text-sm font-medium">Phone number</Label>
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
          <Label className="text-sm font-medium">Best time to reach you</Label>
          <Select
            value={formData.contactBestTime}
            onValueChange={(value) => updateFormData({ contactBestTime: value })}
          >
            <SelectTrigger className={cn("rounded-xl h-11 text-base w-full")}>
              <SelectValue placeholder="Select a time" />
            </SelectTrigger>
            <SelectContent>
              {BEST_TIME_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contactNotes" className="text-sm font-medium">
            Anything else you want us to know? <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea
            id="contactNotes"
            placeholder="Feel free to share anything that might help us prepare..."
            value={formData.contactNotes}
            onChange={(e) => updateFormData({ contactNotes: e.target.value })}
            className="rounded-xl min-h-[80px] text-base resize-none"
          />
        </div>
      </div>
    </div>
  )
}
