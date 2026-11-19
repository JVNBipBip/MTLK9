import { serializeJsonLd } from "@/components/json-ld"

describe("serializeJsonLd", () => {
  it("can't be broken out of by edited text", () => {
    const answer = 'Yes</script><script>alert(1)</script> & more'
    const html = serializeJsonLd({ text: answer })
    expect(html).not.toMatch(/[<>&]/)
    expect(JSON.parse(html)).toEqual({ text: answer })
  })
})
