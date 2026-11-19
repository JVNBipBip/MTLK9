import fs from "node:fs"
import path from "node:path"
import {
  imageFields,
  resolveImage,
  resolveText,
  siteEdits,
  textFields,
  type ImageFieldId,
  type SiteEdits,
  type TextFieldId,
} from "@/lib/site-editing/fields"
import { getLocalizedText } from "@/lib/i18n/localized-text"

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
    const unused = [...textIds, ...imageIds].filter((id) => !source.includes(`"${id}"`))
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
    // …and its French is what the translation table renders today.
    expect(field.default.fr).toBe(getLocalizedText("fr", field.default.en))
  })

  it.each(codeImages)("%s: registry default matches the component", (id) => {
    const field = imageFields[id]
    expect(source()).toContain(JSON.stringify(field.default.src))
    expect(field.default.alt.fr).toBe(getLocalizedText("fr", field.default.alt.en))
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
