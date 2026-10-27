import { buildDaycareNotification } from "./daycare-notification-email"
const id = "a".repeat(64)
it("links to the protected admin review, with no applicant data or booking promise", () => {
  const email = buildDaycareNotification(id, "https://mltk-9-admin.vercel.app")
  expect(email.to).toBe("mtlcaninetraining@gmail.com")
  expect(email.html).toContain(`https://mltk-9-admin.vercel.app/daycare-applications/${id}`)
  expect(email.html).toContain("has not created a booking or a payment")
  expect(email.html).toContain("margin:0 0 20px")
})
it.each(["http://admin.example", "javascript:alert(1)", "ftp://localhost", "https://user:password@admin.example"])("rejects an unsafe admin destination: %s", origin => {
  expect(() => buildDaycareNotification(id, origin)).toThrow()
})
it.each(["../clients", '<script>alert(1)</script>', "", "b".repeat(65)])("rejects an invalid application ID", invalid => {
  expect(() => buildDaycareNotification(invalid, "https://admin.example")).toThrow()
})
it("permits local HTTP for development and strips an irrelevant base path", () => {
  expect(buildDaycareNotification(id, "http://localhost:3101/ignored").html).toContain(`http://localhost:3101/daycare-applications/${id}`)
})
