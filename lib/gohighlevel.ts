import type { BookingFormData } from "@/app/booking/types"

const GHL_API_KEY = process.env.GHL_API_KEY || ""
const GHL_BASE_URL = "https://services.leadconnectorhq.com"

interface GHLContact {
  id: string
  [key: string]: unknown
}

interface GHLPipeline {
  id: string
  name: string
  stages: { id: string; name: string }[]
}

async function ghlFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${GHL_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${GHL_API_KEY}`,
      "Content-Type": "application/json",
      Version: "2021-07-28",
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    console.error(`[GHL] ${options.method || "GET"} ${path} failed (${res.status}):`, body)
    throw new Error(`GHL API error: ${res.status}`)
  }

  return res.json()
}

function buildIntakeNotes(formData: BookingFormData): string {
  const followUps = Object.entries(formData.followUps || {})
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ")
  const lines = [
    `Issue: ${formData.issueOther?.trim() || formData.issue || "Not provided"}`,
    `Follow-ups: ${followUps || "Not provided"}`,
    `Goals: ${formData.goals.join(", ") || "Not provided"}`,
    `Dog: ${formData.dogName} (${formData.dogBreed || "Unknown breed"}, ${formData.dogAge || "Unknown age"})`,
    `Connect method: ${formData.connectMethod}`,
    `Best time to contact: ${formData.contactBestTime || "Not provided"}`,
  ]
  if (formData.contactNotes?.trim()) {
    lines.push(`Notes: ${formData.contactNotes}`)
  }
  if (formData.consultationDateTime) {
    lines.push(`Consultation: ${formData.consultationDateTime}`)
    lines.push(`Location: ${formData.consultationLocation || "N/A"}`)
  }
  return lines.join("\n")
}

export async function createGHLContact(formData: BookingFormData): Promise<string | null> {
  if (!GHL_API_KEY) {
    console.warn("[GHL] No API key configured, skipping contact creation")
    return null
  }

  try {
    const nameParts = formData.contactName.trim().split(/\s+/)
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""
    const followUps = Object.entries(formData.followUps || {})
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ")

    const contactPayload: Record<string, unknown> = {
      firstName,
      lastName,
      email: formData.contactEmail,
      phone: formData.contactPhone,
      source: "Website Booking Form",
      tags: [
        "website-lead",
        formData.connectMethod === "in-person-evaluation" ? "in-person-evaluation" : "free-call",
        formData.fbclid ? "facebook-lead" : "organic-lead",
      ],
      customFields: [
        { key: "fb_click_id", field_value: formData.fbclid || "" },
        { key: "dog_name", field_value: formData.dogName || "" },
        { key: "dog_breed", field_value: formData.dogBreed || "" },
        { key: "dog_age", field_value: formData.dogAge || "" },
        { key: "issue", field_value: formData.issueOther?.trim() || formData.issue || "" },
        { key: "issue_duration", field_value: formData.duration || "" },
        { key: "impact", field_value: formData.impact.join(", ") || "" },
        { key: "follow_ups", field_value: followUps || "" },
        { key: "goals", field_value: formData.goals.join(", ") || "" },
        { key: "connect_method", field_value: formData.connectMethod || "" },
        { key: "best_time_to_contact", field_value: formData.contactBestTime || "" },
        { key: "client_notes", field_value: formData.contactNotes || "" },
      ],
    }

    const data = (await ghlFetch("/contacts/", {
      method: "POST",
      body: JSON.stringify(contactPayload),
    })) as { contact?: GHLContact }

    const contactId = data.contact?.id
    if (!contactId) {
      console.error("[GHL] No contact ID returned:", data)
      return null
    }

    console.log("[GHL] Contact created:", contactId)
    return contactId
  } catch (error) {
    console.error("[GHL] Failed to create contact:", error)
    return null
  }
}

async function findNewLeadPipeline(): Promise<{ pipelineId: string; stageId: string } | null> {
  try {
    const data = (await ghlFetch("/opportunities/pipelines")) as {
      pipelines?: GHLPipeline[]
    }

    if (!data.pipelines?.length) {
      console.error("[GHL] No pipelines found")
      return null
    }

    // Look for a pipeline that has a "New Lead" stage
    for (const pipeline of data.pipelines) {
      const stage = pipeline.stages.find(
        (s) => s.name.toLowerCase() === "new lead"
      )
      if (stage) {
        return { pipelineId: pipeline.id, stageId: stage.id }
      }
    }

    // Fallback: use the first pipeline's first stage
    const firstPipeline = data.pipelines[0]
    if (firstPipeline.stages.length > 0) {
      console.warn("[GHL] 'New Lead' stage not found, using first stage of first pipeline")
      return {
        pipelineId: firstPipeline.id,
        stageId: firstPipeline.stages[0].id,
      }
    }

    return null
  } catch (error) {
    console.error("[GHL] Failed to fetch pipelines:", error)
    return null
  }
}

export async function createGHLOpportunity(
  contactId: string,
  formData: BookingFormData
): Promise<string | null> {
  if (!GHL_API_KEY) return null

  try {
    const pipelineInfo = await findNewLeadPipeline()
    if (!pipelineInfo) {
      console.error("[GHL] Could not find pipeline/stage for opportunity")
      return null
    }

    const opportunityName = `${formData.contactName} - ${formData.dogName} (${formData.connectMethod === "in-person-evaluation" ? "In-Person Evaluation" : "Free Call"})`

    const data = (await ghlFetch("/opportunities/", {
      method: "POST",
      body: JSON.stringify({
        pipelineId: pipelineInfo.pipelineId,
        stageId: pipelineInfo.stageId,
        name: opportunityName,
        contactId,
        status: "open",
        source: "Website Booking Form",
        notes: [buildIntakeNotes(formData)],
      }),
    })) as { opportunity?: { id: string } }

    const oppId = data.opportunity?.id
    console.log("[GHL] Opportunity created:", oppId)
    return oppId || null
  } catch (error) {
    console.error("[GHL] Failed to create opportunity:", error)
    return null
  }
}

export async function pushLeadToGHL(formData: BookingFormData) {
  const contactId = await createGHLContact(formData)
  if (!contactId) return

  await createGHLOpportunity(contactId, formData)
}
