"use client"

import type { ContractKind } from "@/lib/domain"
import type { AppLocale } from "@/lib/i18n/config"
import {
  CONTRACT_ACCEPTANCE_LABEL,
  CONTRACT_ACCEPTED_LABEL,
  CONTRACT_LINK_LABEL,
  contractBody,
  contractLabel,
  contractUrl,
} from "@/lib/contract-terms"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

type ContractAcceptanceAccordionProps = {
  contractKind: ContractKind
  locale: AppLocale
  accepted: boolean
  onAcceptedChange: (accepted: boolean) => void
  alreadyAccepted?: boolean
  hint?: string
  className?: string
}

const openFullAgreementLabel: Record<AppLocale, string> = {
  en: "Open full agreement in a new tab",
  fr: "Ouvrir l'entente complète dans un nouvel onglet",
}

export function ContractAcceptanceAccordion({
  contractKind,
  locale,
  accepted,
  onAcceptedChange,
  alreadyAccepted = false,
  hint,
  className,
}: ContractAcceptanceAccordionProps) {
  const acceptedLabel = CONTRACT_ACCEPTED_LABEL[locale][contractKind]

  if (alreadyAccepted && acceptedLabel) {
    return (
      <p className={cn("rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800", className)}>
        {acceptedLabel}
      </p>
    )
  }

  const triggerLabel =
    CONTRACT_LINK_LABEL[locale][contractKind] ?? contractLabel(contractKind, locale)
  const acceptanceLabel = CONTRACT_ACCEPTANCE_LABEL[locale][contractKind]
  const body = contractBody(contractKind, locale)

  if (!acceptanceLabel) return null

  return (
    <div className={cn("space-y-3", className)}>
      <Accordion
        type="single"
        collapsible
        className="rounded-xl border border-border bg-muted/20 px-4"
      >
        <AccordionItem value="contract" className="border-b-0">
          <AccordionTrigger className="py-3 text-sm font-medium text-foreground hover:no-underline">
            {triggerLabel}
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {body}
            </div>
            <a
              href={contractUrl(contractKind, locale)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
            >
              {openFullAgreementLabel[locale]}
            </a>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <label className="flex items-start gap-2 text-sm text-left">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => onAcceptedChange(e.target.checked)}
          className="mt-1"
        />
        <span>{acceptanceLabel}</span>
      </label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

