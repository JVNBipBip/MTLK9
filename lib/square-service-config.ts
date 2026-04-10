import { getAdminDb } from "@/lib/firebase-admin"
import { SQUARE_SERVICE_CONFIG_COLLECTION } from "@/lib/domain"

export type CustomMapping = {
  id: string
  label: string
  squareServiceVariationId: string
}

export type SquareServiceConfig = {
  locationId?: string | null
  consultationServiceVariationId?: string | null
  /** Square team member ID for high-risk consultation routing (e.g. Nick). Set in Admin → Service Mapping. */
  highRiskConsultationTeamMemberId?: string | null
  /** Additional evaluation service variants (e.g. Puppy Evaluation, Daycare Evaluation). Slots from all are merged. */
  evaluationServiceVariationIds?: string[]
  privateInFacility?: Record<string, string | undefined>
  privateInHome?: Record<string, string | undefined>
  /** Base public classes URL used to build Square classDetails links for imported public sessions. */
  publicClassesBaseUrl?: string | null
  groupProgramSlotOrder?: string[]
  /** Client-facing labels for group programs when using Square handoff links. */
  groupProgramLabels?: Record<string, string | undefined>
  /** Square booking/checkout URLs shown to approved clients for group programs. */
  groupProgramSquareUrls?: Record<string, string | undefined>
  programs?: Record<string, string | undefined>
  /** Square catalog variation priced for the entire group series (checkout always uses quantity 1 — indivisible). */
  groupClassSeriesVariations?: Record<string, string | undefined>
  customMappings?: CustomMapping[]
  updatedAt?: string
}

type LocationServiceConfig = Omit<SquareServiceConfig, "locationId">
type ConfigDoc = {
  locations?: Record<string, LocationServiceConfig>
  defaultLocationId?: string | null
  updatedAt?: string
  locationId?: string | null
  consultationServiceVariationId?: string | null
  highRiskConsultationTeamMemberId?: string | null
  evaluationServiceVariationIds?: string[]
  privateInFacility?: Record<string, string | undefined>
  privateInHome?: Record<string, string | undefined>
  publicClassesBaseUrl?: string | null
  groupProgramSlotOrder?: string[]
  groupProgramLabels?: Record<string, string | undefined>
  groupProgramSquareUrls?: Record<string, string | undefined>
  programs?: Record<string, string | undefined>
  groupClassSeriesVariations?: Record<string, string | undefined>
  customMappings?: CustomMapping[]
}

const CONFIG_DOC_ID = "default"

/** Read service config from Firestore. Supports per-location format; returns default location's config. */
export async function getSquareServiceConfig(locationId?: string | null): Promise<SquareServiceConfig> {
  try {
    const db = getAdminDb()
    const doc = await db.collection(SQUARE_SERVICE_CONFIG_COLLECTION).doc(CONFIG_DOC_ID).get()
    if (!doc.exists) return getEnvFallbackConfig()

    const data = doc.data() as ConfigDoc
    const locations = data.locations || {}

    if (locationId?.trim() && locations[locationId.trim()]) {
      const loc = locations[locationId.trim()]
      return { ...loc, locationId: locationId.trim() }
    }

    const defaultId = data.defaultLocationId?.trim() || Object.keys(locations)[0]
    if (defaultId && locations[defaultId]) {
      return { ...locations[defaultId], locationId: defaultId }
    }

    const legacyLocId = data.locationId?.trim()
    const hasLegacy =
      legacyLocId ||
      data.consultationServiceVariationId ||
      data.publicClassesBaseUrl ||
      Object.keys(data.groupProgramLabels || {}).length > 0 ||
      Object.keys(data.groupProgramSquareUrls || {}).length > 0 ||
      Object.keys(data.programs || {}).length > 0 ||
      Object.keys(data.groupClassSeriesVariations || {}).length > 0 ||
      Object.keys(data.privateInFacility || {}).length > 0 ||
      Object.keys(data.privateInHome || {}).length > 0 ||
      (data.customMappings && data.customMappings.length > 0)
    if (hasLegacy) {
      return {
        locationId: legacyLocId || null,
        consultationServiceVariationId: data.consultationServiceVariationId,
        highRiskConsultationTeamMemberId: data.highRiskConsultationTeamMemberId,
        evaluationServiceVariationIds: data.evaluationServiceVariationIds,
        privateInFacility: data.privateInFacility,
        privateInHome: data.privateInHome,
        publicClassesBaseUrl: data.publicClassesBaseUrl,
        groupProgramSlotOrder: data.groupProgramSlotOrder,
        groupProgramLabels: data.groupProgramLabels,
        groupProgramSquareUrls: data.groupProgramSquareUrls,
        programs: data.programs,
        groupClassSeriesVariations: data.groupClassSeriesVariations,
        customMappings: data.customMappings,
        updatedAt: data.updatedAt,
      }
    }
  } catch (err) {
    console.error("[square-service-config] Failed to read from Firestore, using env fallback:", err)
  }
  return getEnvFallbackConfig()
}

function getEnvFallbackConfig(): SquareServiceConfig {
  return {
    locationId: process.env.SQUARE_LOCATION_ID?.trim() || null,
    consultationServiceVariationId: process.env.SQUARE_CONSULTATION_SERVICE_VARIATION_ID?.trim() || null,
    highRiskConsultationTeamMemberId: process.env.SQUARE_NICK_TEAM_MEMBER_ID?.trim() || null,
    publicClassesBaseUrl: process.env.SQUARE_PUBLIC_CLASSES_BASE_URL?.trim() || null,
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
  }
}


export async function getConsultationServiceVariationId(): Promise<string | null> {
  const config = await getSquareServiceConfig()
  return config.consultationServiceVariationId?.trim() || null
}

/** Returns all evaluation service variation IDs (primary + additional). Used to fetch slots from multiple evaluation types. */
export async function getConsultationServiceVariationIds(): Promise<string[]> {
  const config = await getSquareServiceConfig()
  const primary = config.consultationServiceVariationId?.trim()
  const additional = (config.evaluationServiceVariationIds || []).map((id) => id?.trim()).filter(Boolean)
  const ids = [...(primary ? [primary] : []), ...additional]
  return [...new Set(ids)]
}

export async function getProgramServiceVariationId(programId: string, locationId?: string | null): Promise<string | null> {
  const config = await getSquareServiceConfig(locationId)
  return config.programs?.[programId]?.trim() || null
}

export async function getGroupProgramSquareUrl(programId: string, locationId?: string | null): Promise<string | null> {
  const config = await getSquareServiceConfig(locationId)
  return config.groupProgramSquareUrls?.[programId]?.trim() || null
}

export async function getGroupProgramLabel(programId: string, locationId?: string | null): Promise<string | null> {
  const config = await getSquareServiceConfig(locationId)
  const label = config.groupProgramLabels?.[programId]?.trim()
  return label || null
}

/** Full-series group checkout: one catalog item, quantity 1 (buyers cannot pay for a subset via quantity). */
export async function getGroupClassSeriesVariationId(programId: string, locationId?: string | null): Promise<string | null> {
  const config = await getSquareServiceConfig(locationId)
  return config.groupClassSeriesVariations?.[programId]?.trim() || null
}

export async function getSquarePublicClassesBaseUrl(locationId?: string | null): Promise<string | null> {
  const config = await getSquareServiceConfig(locationId)
  return config.publicClassesBaseUrl?.trim() || null
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

/** Specialist (e.g. Nick) for high-risk consultation slot filtering. Firestore first, then SQUARE_NICK_TEAM_MEMBER_ID. */
export async function getNickTeamMemberIdForConsultation(): Promise<string | null> {
  const config = await getSquareServiceConfig()
  const fromConfig = config.highRiskConsultationTeamMemberId?.trim()
  if (fromConfig) return fromConfig
  return process.env.SQUARE_NICK_TEAM_MEMBER_ID?.trim() || null
}
