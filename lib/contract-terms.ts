import type { ContractKind } from "@/lib/domain"

/** Bump when the owner replaces legal text; stored on each acceptance. */
export const CONTRACT_VERSION = "v0-placeholder-2026-03-24"

const PLACEHOLDER_BODY =
  "Placeholder agreement text. The owner will supply final terms for daycare, group classes, private training, and assessments. By accepting, you confirm you have read the agreement version shown below."

export const CONTRACT_LABEL: Record<ContractKind, string> = {
  daycare: "Daycare agreement",
  private_classes: "Private training agreement",
  group_classes: "Group class agreement",
  assessment_booking: "Assessment / intake agreement",
}

export function contractBody(_kind: ContractKind): string {
  return PLACEHOLDER_BODY
}
