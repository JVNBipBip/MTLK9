export const PROGRAM_OPTIONS = [
  { id: "puppy-foundations", label: "Puppy Foundations" },
  { id: "city-manners", label: "City Manners" },
  { id: "reactivity-anxiety", label: "Reactivity & Anxiety" },
  { id: "high-risk", label: "High-Risk Behaviors" },
  { id: "day-training", label: "Day Training" },
] as const

export const PROGRAM_LABEL_BY_ID = Object.fromEntries(PROGRAM_OPTIONS.map((item) => [item.id, item.label]))

export type ProgramId = (typeof PROGRAM_OPTIONS)[number]["id"]

const PROGRAM_SQUARE_VARIATION_ENV_BY_ID: Record<ProgramId, string> = {
  "puppy-foundations": "SQUARE_PROGRAM_PUPPY_FOUNDATIONS_SERVICE_VARIATION_ID",
  "city-manners": "SQUARE_PROGRAM_CITY_MANNERS_SERVICE_VARIATION_ID",
  "reactivity-anxiety": "SQUARE_PROGRAM_REACTIVITY_ANXIETY_SERVICE_VARIATION_ID",
  "high-risk": "SQUARE_PROGRAM_HIGH_RISK_SERVICE_VARIATION_ID",
  "day-training": "SQUARE_PROGRAM_DAY_TRAINING_SERVICE_VARIATION_ID",
}

export function resolveProgramSquareServiceVariationId(programId: string) {
  const key = PROGRAM_SQUARE_VARIATION_ENV_BY_ID[programId as ProgramId]
  if (!key) return null
  const value = process.env[key]
  return value?.trim() || null
}

export function resolveOneOnOneSquareServiceVariationId() {
  return process.env.SQUARE_ONE_ON_ONE_SERVICE_VARIATION_ID?.trim() || null
}

type PrivateServiceType = "in_facility" | "in_home"
type PrivatePlanType = "pack_3" | "pack_5" | "pack_7" | "unit"

const PRIVATE_PLAN_ENV_MAP: Record<PrivateServiceType, Record<PrivatePlanType, string>> = {
  in_facility: {
    pack_3: "SQUARE_PRIVATE_IN_FACILITY_PACK_3_SERVICE_VARIATION_ID",
    pack_5: "SQUARE_PRIVATE_IN_FACILITY_PACK_5_SERVICE_VARIATION_ID",
    pack_7: "SQUARE_PRIVATE_IN_FACILITY_PACK_7_SERVICE_VARIATION_ID",
    unit: "SQUARE_PRIVATE_IN_FACILITY_UNIT_SERVICE_VARIATION_ID",
  },
  in_home: {
    pack_3: "SQUARE_PRIVATE_IN_HOME_PACK_3_SERVICE_VARIATION_ID",
    pack_5: "SQUARE_PRIVATE_IN_HOME_PACK_5_SERVICE_VARIATION_ID",
    pack_7: "SQUARE_PRIVATE_IN_HOME_PACK_7_SERVICE_VARIATION_ID",
    unit: "SQUARE_PRIVATE_IN_HOME_UNIT_SERVICE_VARIATION_ID",
  },
}

export function resolvePrivateInFacilitySquareServiceVariationId() {
  return process.env.SQUARE_PRIVATE_IN_FACILITY_SERVICE_VARIATION_ID?.trim() || resolveOneOnOneSquareServiceVariationId()
}

export function resolvePrivateInHomeSquareServiceVariationId() {
  return process.env.SQUARE_PRIVATE_IN_HOME_SERVICE_VARIATION_ID?.trim() || null
}

export function resolvePrivateSquareServiceVariationId(input: {
  serviceType: PrivateServiceType
  planType: PrivatePlanType
}) {
  const keyedEnv = PRIVATE_PLAN_ENV_MAP[input.serviceType][input.planType]
  const keyedValue = process.env[keyedEnv]?.trim() || null
  if (keyedValue) return keyedValue

  if (input.serviceType === "in_facility") {
    return resolvePrivateInFacilitySquareServiceVariationId()
  }
  return resolvePrivateInHomeSquareServiceVariationId()
}

export function resolvePrivateSquareServiceVariationIds() {
  const values = new Set<string>()
  ;(["in_facility", "in_home"] as const).forEach((serviceType) => {
    ;(["pack_3", "pack_5", "pack_7", "unit"] as const).forEach((planType) => {
      const id = resolvePrivateSquareServiceVariationId({ serviceType, planType })
      if (id) values.add(id)
    })
  })
  return Array.from(values)
}
