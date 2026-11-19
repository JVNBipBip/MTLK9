import { getBusinessDetails } from "@/lib/business-details"

const none = { text: {} }

describe("getBusinessDetails", () => {
  it("reproduces today's exact details, links and structured values", () => {
    expect(getBusinessDetails(none)).toEqual({
      phone: "514 826 9558",
      phoneHref: "tel:+15148269558",
      phoneInternational: "+1-514-826-9558",
      email: "mtlcaninetraining@gmail.com",
      emailHref: "mailto:mtlcaninetraining@gmail.com",
      street: "7770 Boulevard Henri-Bourassa E",
      city: "Montreal",
      province: "Quebec",
      provinceCode: "QC",
      postalCode: "H1E 1P2",
      addressLine: "7770 Boulevard Henri-Bourassa E, Montreal, Quebec H1E 1P2",
      mapsUrl: "https://maps.app.goo.gl/GoTny9wRbvZ1Y81fA",
      addressChanged: false,
    })
  })

  it("builds every link from his edits", () => {
    const details = getBusinessDetails({
      text: { "business.phone": { en: "(438) 555-0199" }, "business.email": { en: "hello@example.com" } },
    })
    expect(details).toMatchObject({
      phone: "(438) 555-0199",
      phoneHref: "tel:+14385550199",
      phoneInternational: "+1-438-555-0199",
      emailHref: "mailto:hello@example.com",
      addressChanged: false,
    })
  })

  it("accepts a leading 1 in the phone number", () => {
    expect(getBusinessDetails({ text: { "business.phone": { en: "1-514-826-9558" } } }).phoneHref).toBe("tel:+15148269558")
  })

  it("flags a changed address and points the map at it", () => {
    const details = getBusinessDetails({ text: { "business.street": { en: "100 Rue Saint-Paul O" }, "business.postalCode": { en: "H2Y 1Z3" } } })
    expect(details.addressChanged).toBe(true)
    expect(details.addressLine).toBe("100 Rue Saint-Paul O, Montreal, Quebec H2Y 1Z3")
    expect(details.mapsUrl).toBe("https://www.google.com/maps/search/?api=1&query=100%20Rue%20Saint-Paul%20O%2C%20Montreal%2C%20Quebec%20H2Y%201Z3")
  })
})
