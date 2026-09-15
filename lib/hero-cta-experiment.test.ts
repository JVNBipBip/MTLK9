import {
  assignHeroCtaVariant, getOrCreateHeroCtaVariant, heroCtaExperimentProperties,
  heroCtaLabel, parseHeroCtaCookieHeader, HERO_CTA_COOKIE_NAME,
} from "@/lib/hero-cta-experiment"

describe("homepage CTA experiment", () => {
  it("splits evenly at 0.5", () => {
    expect(assignHeroCtaVariant(0)).toBe("a")
    expect(assignHeroCtaVariant(0.49999)).toBe("a")
    expect(assignHeroCtaVariant(0.5)).toBe("b")
    expect(assignHeroCtaVariant(0.99999)).toBe("b")
    const variants = Array.from({length:1000},(_,i)=>assignHeroCtaVariant(i/1000))
    expect(variants.filter(v=>v === "a")).toHaveLength(500)
  })

  it("parses only versioned assignments, ignoring unrelated cookies", () => {
    expect(parseHeroCtaCookieHeader(`other=b; ${HERO_CTA_COOKIE_NAME}=v1:a; session=x`)).toBe("a")
    expect(parseHeroCtaCookieHeader(`${HERO_CTA_COOKIE_NAME}=v1:b`)).toBe("b")
    expect(parseHeroCtaCookieHeader(`${HERO_CTA_COOKIE_NAME}=v2:b`)).toBeNull()
    expect(parseHeroCtaCookieHeader(`${HERO_CTA_COOKIE_NAME}=garbage`)).toBeNull()
    expect(parseHeroCtaCookieHeader(null)).toBeNull()
  })

  it("returns only bounded, non-PII properties and avoids attribution for unassigned visitors", () => {
    expect(heroCtaExperimentProperties("b")).toEqual({hero_cta_experiment:"homepage-cta-v1",hero_cta_variant:"b"})
    expect(heroCtaExperimentProperties(null)).toEqual({})
    expect(heroCtaExperimentProperties()).toEqual({})
    expect(heroCtaLabel("a")).toBe("Send an Inquiry")
    expect(heroCtaLabel("b")).toBe("Get a training plan")
  })

  it("reuses a returning visitor's assignment without rerandomizing", () => {
    const priorDocument = Object.getOwnPropertyDescriptor(globalThis, "document")
    Object.defineProperty(globalThis,"document",{configurable:true,value:{cookie:`${HERO_CTA_COOKIE_NAME}=v1:b`}})
    const random = jest.spyOn(Math,"random")
    try {
      expect(getOrCreateHeroCtaVariant()).toBe("b")
      expect(random).not.toHaveBeenCalled()
      expect(heroCtaExperimentProperties()).toHaveProperty("hero_cta_variant","b")
    } finally {
      random.mockRestore()
      if(priorDocument) Object.defineProperty(globalThis,"document",priorDocument)
      else Reflect.deleteProperty(globalThis,"document")
    }
  })

  it("persists a new assignment for 90 days, with secure same-site cookies in production", () => {
    const priorDocument = Object.getOwnPropertyDescriptor(globalThis,"document")
    const priorWindow = Object.getOwnPropertyDescriptor(globalThis,"window")
    const documentStub={cookie:""}
    Object.defineProperty(globalThis,"document",{configurable:true,value:documentStub})
    Object.defineProperty(globalThis,"window",{configurable:true,value:{location:{protocol:"https:"}}})
    const random=jest.spyOn(Math,"random").mockReturnValue(0.8)
    try {
      expect(getOrCreateHeroCtaVariant()).toBe("b")
      expect(documentStub.cookie).toBe(`${HERO_CTA_COOKIE_NAME}=v1:b; Path=/; Max-Age=7776000; SameSite=Lax; Secure`)
    } finally {
      random.mockRestore()
      if(priorDocument) Object.defineProperty(globalThis,"document",priorDocument)
      else Reflect.deleteProperty(globalThis,"document")
      if(priorWindow) Object.defineProperty(globalThis,"window",priorWindow)
      else Reflect.deleteProperty(globalThis,"window")
    }
  })
})
