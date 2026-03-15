import { getAdminDb } from "@/lib/firebase-admin"
import { SQUARE_SERVICE_CONFIG_COLLECTION } from "@/lib/domain"

export type SquareServiceConfig = {
  locationId?: string | null
  consultationServiceVariationId?: string | null
  privateInFacility?: Record<string, string | undefined>
  privateInHome?: Record<string, string | undefined>
  programs?: Record<string, string | undefined>
  updatedAt?: string
}

const CONFIG_DOC_ID = "default"

/** Read service config from Firestore. Falls back to env vars if doc missing or empty. */
export async function getSquareServiceConfig(): Promise<SquareServiceConfig> {
  try {
    const db = getAdminDb()
    const doc = await db.collection(SQUARE_SERVICE_CONFIG_COLLECTION).doc(CONFIG_DOC_ID).get()
    const data = doc.exists ? (doc.data() as SquareServiceConfig) : null
    if (data && (data.locationId || data.consultationServiceVariationId || Object.keys(data.programs || {}).length > 0 || Object.keys(data.privateInFacility || {}).length > 0 || Object.keys(data.privateInHome || {}).length > 0)) {
      return data
    }
  } catch {
    /* fall through to env */
  }

  // Env fallback
  const programs: Record<string, string> = {}
  const programIds = ["puppy-foundations", "city-manners", "reactivity-anxiety", "high-risk", "day-training"] as const
  const programEnvKeys: Record<string, string> = {
    "puppy-foundations": "SQUARE_PROGRAM_PUPPY_FOUNDATIONS_SERVICE_VARIATION_ID",
    "city-manners": "SQUARE_PROGRAM_CITY_MANNERS_SERVICE_VARIATION_ID",
    "reactivity-anxiety": "SQUARE_PROGRAM_REACTIVITY_ANXIETY_SERVICE_VARIATION_ID",
    "high-risk": "SQUARE_PROGRAM_HIGH_RISK_SERVICE_VARIATION_ID",
    "day-training": "SQUARE_PROGRAM_DAY_TRAINING_SERVICE_VARIATION_ID",
  }
  for (const id of programIds) {
    const val = process.env[programEnvKeys[id]]?.trim()
    if (val) programs[id] = val
  }

  return {
    locationId: process.env.SQUARE_LOCATION_ID?.trim() || null,
    consultationServiceVariationId: process.env.SQUARE_CONSULTATION_SERVICE_VARIATION_ID?.trim() || null,
    privateInFacility: {
      default: process.env.SQUARE_PRIVATE_IN_FACILITY_SERVICE_VARIATION_ID?.trim() || process.env.SQUARE_ONE_ON_ONE_SERVICE_VARIATION_ID?.trim() || undefined,
      pack_3: process.env.SQUARE_PRIVATE_IN_FACILITY_PACK_3_SERVICE_VARIATION_ID?.trim() || undefined,
      pack_5: process.env.SQUARE_PRIVATE_IN_FACILITY_PACK_5_SERVICE_VARIATION_ID?.trim() || undefined,
      pack_7: process.env.SQUARE_PRIVATE_IN_FACILITY_PACK_7_SERVICE_VARIATION_ID?.trim() || undefined,
      unit: process.env.SQUARE_PRIVATE_IN_FACILITY_UNIT_SERVICE_VARIATION_ID?.trim() || undefined,
    },
    privateInHome: {
      default: process.env.SQUARE_PRIVATE_IN_HOME_SERVICE_VARIATION_ID?.trim() || undefined,
      pack_3: process.env.SQUARE_PRIVATE_IN_HOME_PACK_3_SERVICE_VARIATION_ID?.trim() || undefined,
      pack_5: process.env.SQUARE_PRIVATE_IN_HOME_PACK_5_SERVICE_VARIATION_ID?.trim() || undefined,
      pack_7: process.env.SQUARE_PRIVATE_IN_HOME_PACK_7_SERVICE_VARIATION_ID?.trim() || undefined,
      unit: process.env.SQUARE_PRIVATE_IN_HOME_UNIT_SERVICE_VARIATION_ID?.trim() || undefined,
    },
    programs: Object.keys(programs).length > 0 ? programs : undefined,
  }
}

export async function getConsultationServiceVariationId(): Promise<string | null> {
  const config = await getSquareServiceConfig()
  return config.consultationServiceVariationId?.trim() || null
}

export async function getProgramServiceVariationId(programId: string): Promise<string | null> {
  const config = await getSquareServiceConfig()
  return config.programs?.[programId]?.trim() || null
}

export type PrivateServiceType = "in_facility" | "in_home"
export type PrivatePlanType = "pack_3" | "pack_5" | "pack_7" | "unit"

export async function getPrivateServiceVariationId(input: {
  serviceType: PrivateServiceType
  planType: PrivatePlanType
}): Promise<string | null> {
  const config = await getSquareServiceConfig()
  const map = input.serviceType === "in_facility" ? config.privateInFacility : config.privateInHome
  const planVal = map?.[input.planType]?.trim()
  if (planVal) return planVal
  if (input.serviceType === "in_facility" && map?.default) return map.default
  return map?.default?.trim() || null
}

export async function getPrivateInFacilityServiceVariationId(): Promise<string | null> {
  const config = await getSquareServiceConfig()
  return config.privateInFacility?.default?.trim() || null
}

export async function getPrivateInHomeServiceVariationId(): Promise<string | null> {
  const config = await getSquareServiceConfig()
  return config.privateInHome?.default?.trim() || null
}

export async function getSquareLocationId(): Promise<string | null> {
  const config = await getSquareServiceConfig()
  const fromConfig = config.locationId?.trim()
  if (fromConfig) return fromConfig
  return process.env.SQUARE_LOCATION_ID?.trim() || null
}

export async function getPrivateServiceVariationIds(): Promise<string[]> {
  const values = new Set<string>()
  for (const serviceType of ["in_facility", "in_home"] as const) {
    for (const planType of ["pack_3", "pack_5", "pack_7", "unit"] as const) {
      const id = await getPrivateServiceVariationId({ serviceType, planType })
      if (id) values.add(id)
    }
  }
  return Array.from(values)
}
