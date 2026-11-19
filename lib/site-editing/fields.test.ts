import fs from "node:fs"
import path from "node:path"
import {
  imageFields,
  listFields,
  resolveImage,
  resolveList,
  resolveText,
  siteEdits,
  textFields,
  type ImageFieldId,
  type ListFieldId,
  type ListValue,
  type SiteEdits,
  type TextFieldId,
} from "@/lib/site-editing/fields"
import { getLocalizedText } from "@/lib/i18n/localized-text"
import { getFaqData } from "@/lib/faq-data"
import { facilityServices } from "@/lib/facility-services"
import { locationPages } from "@/lib/location-pages"

const ROOT = path.resolve(__dirname, "../..")
const PUBLIC_DIR = path.join(ROOT, "public")

/**
 * Prices must never be owner-editable text: what the page says has to match
 * what Square charges, so prices are kept out of the registry and changed in
 * code (later, a structured pricing form). This catches one slipping in.
 */
const PRICE_LIKE = /\$\s?\d|\d\s?\$|\bCAD\b|\bdollars?\b|\d\s?%/i

const textIds = Object.keys(textFields) as TextFieldId[]
const imageIds = Object.keys(imageFields) as ImageFieldId[]

function routeExists(page: string) {
  const dir = page === "/" ? path.join(ROOT, "app") : path.join(ROOT, "app", page)
  return fs.existsSync(path.join(dir, "page.tsx"))
}

function publicFileExists(src: string) {
  return src.startsWith("/") && fs.existsSync(path.join(PUBLIC_DIR, src))
}

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === "node_modules" ? [] : sourceFiles(full)
    if (!/\.tsx?$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name)) return []
    if (full.startsWith(path.join(ROOT, "lib", "site-editing"))) return []
    return [full]
  })
}

describe("editable field registry", () => {
  it("has at least one field", () => {
    expect(textIds.length + imageIds.length).toBeGreaterThan(0)
  })

  it.each(textIds)("text field %s is complete and fits its limit", (id) => {
    const field = textFields[id]
    expect(field.label.trim()).not.toBe("")
    expect(field.section.trim()).not.toBe("")
    expect(field.pages.length).toBeGreaterThan(0)
    for (const page of field.pages) expect(routeExists(page)).toBe(true)
    for (const locale of ["en", "fr"] as const) {
      expect(field.default[locale].trim()).not.toBe("")
      expect(field.default[locale].length).toBeLessThanOrEqual(field.maxLength)
    }
  })

  it.each(imageIds)("image field %s is complete and its default file exists", (id) => {
    const field = imageFields[id]
    expect(field.label.trim()).not.toBe("")
    expect(field.pages.length).toBeGreaterThan(0)
    for (const page of field.pages) expect(routeExists(page)).toBe(true)
    expect(publicFileExists(field.default.src)).toBe(true)
    expect(field.aspect).toMatch(/^\d+\/\d+$/)
    expect(field.default.alt.en.trim()).not.toBe("")
    expect(field.default.alt.fr.trim()).not.toBe("")
  })

  it("registers no price-like text", () => {
    const priceLike = textIds.filter((id) => PRICE_LIKE.test(textFields[id].default.en) || PRICE_LIKE.test(textFields[id].default.fr))
    expect(priceLike).toEqual([])
  })

  it("every registered field is used by a component", () => {
    const source = [...sourceFiles(path.join(ROOT, "app")), ...sourceFiles(path.join(ROOT, "components")), ...sourceFiles(path.join(ROOT, "lib"))]
      .map((file) => fs.readFileSync(file, "utf8"))
      .join("\n")
    // List items are numbered from a prefix the page passes (idPrefix="services.obedience.forYouIf").
    const listPrefix = (id: string) => (/\.\d+$/.test(id) ? id.replace(/\.\d+$/, "") : null)
    const unused = [...textIds, ...imageIds].filter((id) => {
      // Rendered by position from a data file; checked against it below instead.
      if ((textFields[id as TextFieldId] ?? imageFields[id as ImageFieldId]).source === "data") return false
      if (source.includes(`"${id}"`)) return false
      const prefix = listPrefix(id)
      return !(prefix && source.includes(`idPrefix="${prefix}"`))
    })
    expect(unused).toEqual([])
  })
})

describe("fields whose default lives in a client component", () => {
  const source = () =>
    [...sourceFiles(path.join(ROOT, "app")), ...sourceFiles(path.join(ROOT, "components"))].map((file) => fs.readFileSync(file, "utf8")).join("\n")
  const codeText = textIds.filter((id) => textFields[id].source === "code")
  const codeImages = imageIds.filter((id) => imageFields[id].source === "code")

  it("exist (home page)", () => {
    expect(codeText.length).toBeGreaterThan(0)
  })

  it.each(codeText)("%s: registry default matches the component and the French table", (id) => {
    const field = textFields[id]
    // The English is still written in a component exactly as registered…
    expect(source()).toContain(JSON.stringify(field.default.en))
    // …and its French is what the translation table renders today, or is written alongside it.
    const fromTable = field.default.fr === getLocalizedText("fr", field.default.en)
    expect(fromTable || source().includes(JSON.stringify(field.default.fr))).toBe(true)
  })

  it.each(codeImages)("%s: registry default matches the component", (id) => {
    const field = imageFields[id]
    expect(source()).toContain(JSON.stringify(field.default.src))
    expect(field.default.alt.fr).toBe(getLocalizedText("fr", field.default.alt.en))
  })
})

describe("fields whose default lives in a data file", () => {
  type Copy = { en: string; fr: string }
  const at = (value: unknown, keys: string[]) => keys.reduce<unknown>((current, key) => (current as Record<string, unknown>)?.[key], value)

  /** The data file's current value for a dataPath like "facility/grooming/sections.0.title". */
  function fromData(dataPath: string): Copy | { src: string; alt: Copy } {
    const [kind, owner, rest] = dataPath.split("/")
    const keys = rest.split(".")
    if (kind === "facility") {
      const service = facilityServices[owner as keyof typeof facilityServices]
      if (rest === "photo") return { src: service.image, alt: service.imageAlt }
      return at(service, keys) as Copy
    }
    if (kind === "location") {
      const page = locationPages[owner as keyof typeof locationPages]
      return { en: at(page.content.en, keys) as string, fr: at(page.content.fr, keys) as string }
    }
    throw new Error(`Unknown dataPath ${dataPath}`)
  }

  const dataText = textIds.filter((id) => textFields[id].source === "data")
  const dataImages = imageIds.filter((id) => imageFields[id].source === "data")

  it("exist (service template and location pages)", () => {
    expect(dataText.length).toBeGreaterThan(0)
  })

  it.each(dataText)("%s matches its data file in both languages", (id) => {
    const field = textFields[id] as typeof textFields[TextFieldId] & { dataPath: string }
    expect(fromData(field.dataPath)).toEqual(field.default)
  })

  it.each(dataImages)("%s matches its data file", (id) => {
    const field = imageFields[id] as typeof imageFields[ImageFieldId] & { dataPath: string }
    expect(fromData(field.dataPath)).toEqual(field.default)
  })
})

describe("published site edits", () => {
  it("only edit registered fields", () => {
    const orphaned = [
      ...Object.keys(siteEdits.text).filter((id) => !(id in textFields)),
      ...Object.keys(siteEdits.images).filter((id) => !(id in imageFields)),
    ]
    expect(orphaned).toEqual([])
  })

  it("text edits are plain text, in both languages, within the limit and price-free", () => {
    for (const [id, edit] of Object.entries(siteEdits.text)) {
      const field = textFields[id as TextFieldId]
      if (!edit || !field) continue
      for (const locale of ["en", "fr"] as const) {
        expect(edit[locale].trim()).not.toBe("")
        expect(edit[locale].length).toBeLessThanOrEqual(field.maxLength)
        expect(edit[locale]).not.toMatch(/[<>]/)
        expect(edit[locale]).not.toMatch(PRICE_LIKE)
      }
    }
  })

  it("image edits point at committed files and carry alt text", () => {
    for (const edit of Object.values(siteEdits.images)) {
      if (!edit) continue
      expect(edit.src.startsWith("/images/edits/")).toBe(true)
      expect(publicFileExists(edit.src)).toBe(true)
      expect(edit.alt.en.trim()).not.toBe("")
      expect(edit.alt.fr.trim()).not.toBe("")
    }
  })
})

describe("resolving values", () => {
  const empty: SiteEdits = { text: {}, images: {} }
  const textId = textIds[0]
  const imageId = imageIds[0]

  it("falls back to the registered default", () => {
    expect(resolveText(textId, "en", empty)).toBe(textFields[textId].default.en)
    expect(resolveText(textId, "fr", empty)).toBe(textFields[textId].default.fr)
    expect(resolveImage(imageId, "fr", empty)).toEqual({ src: imageFields[imageId].default.src, alt: imageFields[imageId].default.alt.fr })
  })

  it("uses the published edit for each locale", () => {
    const edits: SiteEdits = {
      text: { [textId]: { en: "New English", fr: "Nouveau français", frSource: "edited" } },
      images: { [imageId]: { src: "/images/edits/x.webp", width: 800, height: 1000, alt: { en: "A dog", fr: "Un chien" } } },
    }
    expect(resolveText(textId, "en", edits)).toBe("New English")
    expect(resolveText(textId, "fr", edits)).toBe("Nouveau français")
    expect(resolveImage(imageId, "en", edits)).toEqual({ src: "/images/edits/x.webp", alt: "A dog", width: 800, height: 1000 })
  })
})

describe("editable lists (FAQ)", () => {
  const listIds = Object.keys(listFields) as ListFieldId[]

  function checkList(id: ListFieldId, list: ListValue) {
    const field = listFields[id]
    const ids = new Set<string>()
    expect(list.categories.length).toBeGreaterThan(0)
    for (const category of list.categories) {
      expect(ids.has(category.id)).toBe(false)
      ids.add(category.id)
      expect(category.items.length).toBeLessThanOrEqual(field.maxItemsPerCategory)
      for (const locale of ["en", "fr"] as const) {
        expect(category.title[locale].trim()).not.toBe("")
        expect(category.title[locale].length).toBeLessThanOrEqual(field.limits.category)
      }
      for (const item of category.items) {
        expect(ids.has(item.id)).toBe(false)
        ids.add(item.id)
        for (const locale of ["en", "fr"] as const) {
          expect(item.question[locale].trim()).not.toBe("")
          expect(item.answer[locale].trim()).not.toBe("")
          expect(item.question[locale].length).toBeLessThanOrEqual(field.limits.question)
          expect(item.answer[locale].length).toBeLessThanOrEqual(field.limits.answer)
          expect(`${item.question[locale]} ${item.answer[locale]}`).not.toMatch(/[<>]/)
        }
      }
    }
  }

  it.each(listIds)("default %s is complete, unique and within limits", (id) => {
    for (const page of listFields[id].pages) expect(routeExists(page)).toBe(true)
    checkList(id, listFields[id].default)
  })

  it.each(listIds)("published %s (if any) is complete, unique, within limits and price-free", (id) => {
    const published = siteEdits.lists?.[id]
    if (!published) return
    checkList(id, published)
    const allText = published.categories.flatMap((c) => [c.title.en, c.title.fr, ...c.items.flatMap((i) => [i.question.en, i.question.fr, i.answer.en, i.answer.fr])])
    expect(allText.filter((value) => PRICE_LIKE.test(value))).toEqual([])
  })

  it("the FAQ shows the default until he publishes his own list", () => {
    const custom: ListValue = {
      categories: [{ id: "c", title: { en: "Basics", fr: "Bases" }, items: [{ id: "q", question: { en: "Q?", fr: "Q ?" }, answer: { en: "A.", fr: "R." } }] }],
    }
    expect(resolveList("faq", { text: {}, images: {} })).toBe(listFields.faq.default)
    expect(resolveList("faq", { text: {}, images: {}, lists: { faq: custom } })).toBe(custom)
  })

  it("getFaqData keeps the shape the FAQ page and structured data use", () => {
    const fr = getFaqData("fr")
    expect(fr.length).toBe(listFields.faq.default.categories.length)
    expect(fr[0]).toMatchObject({ title: listFields.faq.default.categories[0].title.fr })
    expect(fr[0].items[0]).toMatchObject({
      question: listFields.faq.default.categories[0].items[0].question.fr,
      answer: listFields.faq.default.categories[0].items[0].answer.fr,
    })
  })
})
