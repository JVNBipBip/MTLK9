/** Puppy socialization “drop-in” — no assessment; deposit + intake required. */

export const PUPPY_SOCIALIZATION_CLASS_TYPE_ID = "puppy-socialization-class"

/** CAD — $30.00 */
export const PUPPY_SOCIAL_DROP_IN_DEPOSIT_CENTS = 3000

export type PuppySocialDropInIntakePayload = {
  clientName: string
  dogName: string
  dogAge: string
  vaccinationsUpToDate: boolean
  agreeProofOfVaccination: boolean
  agreeNoIllness: boolean
  agreeNoAggression: boolean
  /** Same policy as assessment booking: 48h notice or deposit is non-refundable. */
  agreeFortyEightHourDepositRefundPolicy: boolean
  /** Short participation / liability acknowledgement. */
  agreeParticipationLiability: boolean
}

export function parsePuppySocialDropInIntake(raw: unknown): PuppySocialDropInIntakePayload {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  const clientName = String(o.clientName || "").trim()
  const dogName = String(o.dogName || "").trim()
  const dogAge = String(o.dogAge || "").trim()
  const vaccinationsUpToDate = Boolean(o.vaccinationsUpToDate)
  const agreeProofOfVaccination = Boolean(o.agreeProofOfVaccination)
  const agreeNoIllness = Boolean(o.agreeNoIllness)
  const agreeNoAggression = Boolean(o.agreeNoAggression)
  const agreeFortyEightHourDepositRefundPolicy = Boolean(o.agreeFortyEightHourDepositRefundPolicy)
  const agreeParticipationLiability = Boolean(o.agreeParticipationLiability)

  if (!clientName) throw new Error("Please enter your name.")
  if (!dogName) throw new Error("Please enter your dog's name.")
  if (!dogAge) throw new Error("Please enter your dog's age.")
  if (!vaccinationsUpToDate) {
    throw new Error("Puppy socialization requires your dog to be up to date on vaccinations.")
  }
  if (
    !agreeProofOfVaccination ||
    !agreeNoIllness ||
    !agreeNoAggression ||
    !agreeFortyEightHourDepositRefundPolicy ||
    !agreeParticipationLiability
  ) {
    throw new Error("Please confirm all agreements before continuing.")
  }

  return {
    clientName,
    dogName,
    dogAge,
    vaccinationsUpToDate,
    agreeProofOfVaccination,
    agreeNoIllness,
    agreeNoAggression,
    agreeFortyEightHourDepositRefundPolicy,
    agreeParticipationLiability,
  }
}
