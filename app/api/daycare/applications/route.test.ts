import { POST } from "./route"
import { getAdminDb } from "@/lib/firebase-admin"
import { DAYCARE_FIELDS, type DaycareAnswers } from "@/lib/daycare-intake"
import { DaycareSubmissionConflict, DaycareSubmissionLimited, storeDaycareApplication } from "@/lib/daycare-application-store"
import { notifyDaycareApplication } from "@/lib/daycare-notifications"

jest.mock("@/lib/firebase-admin", () => ({ getAdminDb: jest.fn() }))
jest.mock("@/lib/daycare-application-store", () => ({
  storeDaycareApplication: jest.fn(),
  DaycareSubmissionConflict: class extends Error {},
  DaycareSubmissionLimited: class extends Error {},
}))
jest.mock("@/lib/daycare-notifications", () => ({ notifyDaycareApplication: jest.fn() }))

const update = jest.fn()
const id = "b".repeat(64)
const db = {} as ReturnType<typeof getAdminDb>
const secretBefore = process.env.DAYCARE_RATE_LIMIT_SECRET
function payload() {
  const answers: DaycareAnswers = {}
  for (const field of DAYCARE_FIELDS.filter(item => item.required)) {
    answers[field.id] = field.kind === "checkbox" ? true : field.options?.[0].value ||
      (field.kind === "email" ? "test@example.com" : field.kind === "tel" ? "+15145550123" : "QA fixture")
  }
  return { requestId: "a3360a31-b4be-40b0-96c4-2470187167ea", locale: "en", answers }
}
function request(body: unknown = payload(), origin = "https://website.example", contentType = "application/json") {
  return new Request("https://website.example/api/daycare/applications", {
    method: "POST", headers: { origin, "content-type": contentType, "x-vercel-forwarded-for": "192.0.2.10" }, body: JSON.stringify(body),
  })
}
beforeEach(() => {
  jest.clearAllMocks()
  process.env.DAYCARE_RATE_LIMIT_SECRET = "test-only-rate-limit-secret-never-production"
  jest.mocked(getAdminDb).mockReturnValue(db)
  jest.mocked(storeDaycareApplication).mockResolvedValue({ id, created: true, ref: { update } } as never)
  jest.mocked(notifyDaycareApplication).mockResolvedValue(true)
  update.mockResolvedValue(undefined)
})
afterAll(() => {
  if (secretBefore === undefined) delete process.env.DAYCARE_RATE_LIMIT_SECRET
  else process.env.DAYCARE_RATE_LIMIT_SECRET = secretBefore
})

it("saves sanitized answers before sending the staff alert, without returning private details", async () => {
  const body = payload()
  body.answers.ownerEmail = "TEST@EXAMPLE.COM"
  body.answers.status = "approved"
  const res = await POST(request(body))
  expect(res.status).toBe(200)
  expect(res.headers.get("cache-control")).toBe("no-store")
  expect(await res.json()).toEqual({ ok: true })
  expect(storeDaycareApplication).toHaveBeenCalledWith(db, expect.objectContaining({
    answers: expect.objectContaining({ ownerEmail: "test@example.com" }), rateIdentity: expect.stringMatching(/^[a-f0-9]{64}$/),
  }))
  const saved = jest.mocked(storeDaycareApplication).mock.calls[0][1]
  expect(saved.answers).not.toHaveProperty("status")
  expect(JSON.stringify(saved)).not.toContain("192.0.2.10")
  expect(jest.mocked(storeDaycareApplication).mock.invocationCallOrder[0]).toBeLessThan(jest.mocked(notifyDaycareApplication).mock.invocationCallOrder[0])
  expect(notifyDaycareApplication).toHaveBeenCalledWith(id)
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ notificationStatus: "sent" }))
})
it("returns success without resending the alert for a duplicate request", async () => {
  jest.mocked(storeDaycareApplication).mockResolvedValue({ id, created: false, ref: { update } } as never)
  expect((await POST(request())).status).toBe(200)
  expect(notifyDaycareApplication).not.toHaveBeenCalled()
  expect(update).not.toHaveBeenCalled()
})
it.each([false, "throws"])("keeps an application saved when its alert fails: %s", async failure => {
  if (failure === "throws") jest.mocked(notifyDaycareApplication).mockRejectedValue(new Error("SMTP unavailable"))
  else jest.mocked(notifyDaycareApplication).mockResolvedValue(false)
  expect((await POST(request())).status).toBe(200)
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ notificationStatus: "failed" }))
})
it("rejects cross-origin requests and lookalike JSON content types before accessing data", async () => {
  expect((await POST(request(payload(), "https://attacker.example"))).status).toBe(403)
  expect((await POST(request(payload(), "https://website.example", "application/json-malicious"))).status).toBe(415)
  expect(getAdminDb).not.toHaveBeenCalled()
})
it.each([
  { ...payload(), requestId: "predictable-id" },
  { ...payload(), locale: "es" },
  { ...payload(), answers: { ownerEmail: "test@example.com" } },
  [],
  null,
])("rejects malformed application data without writes", async body => {
  expect((await POST(request(body))).status).toBe(400)
  expect(storeDaycareApplication).not.toHaveBeenCalled()
})
it("limits streamed body size even without a Content-Length header", async () => {
  expect((await POST(request({ extra: "x".repeat(24001) }))).status).toBe(413)
  expect(storeDaycareApplication).not.toHaveBeenCalled()
})
it("does not save honeypot submissions", async () => {
  expect((await POST(request({ ...payload(), website: "spam" }))).status).toBe(200)
  expect(getAdminDb).not.toHaveBeenCalled()
})
it.each([undefined, "short"])("requires the dedicated rate-limit secret", async value => {
  if (value === undefined) delete process.env.DAYCARE_RATE_LIMIT_SECRET
  else process.env.DAYCARE_RATE_LIMIT_SECRET = value
  expect((await POST(request())).status).toBe(503)
  expect(getAdminDb).not.toHaveBeenCalled()
})
it.each([[new DaycareSubmissionConflict(), 409], [new DaycareSubmissionLimited(), 429]] as const)("returns a controlled response for store constraints", async (error, status) => {
  jest.mocked(storeDaycareApplication).mockRejectedValue(error)
  expect((await POST(request())).status).toBe(status)
  expect(notifyDaycareApplication).not.toHaveBeenCalled()
})
it("does not imply success when storage is unavailable", async () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {})
  jest.mocked(storeDaycareApplication).mockRejectedValue(new Error("unavailable"))
  expect((await POST(request())).status).toBe(503)
  expect(notifyDaycareApplication).not.toHaveBeenCalled()
  log.mockRestore()
})
