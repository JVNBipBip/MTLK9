import { renderToStaticMarkup } from "react-dom/server"
import { FacebookPixel } from "./facebook-pixel"
import { usePathname } from "next/navigation"
jest.mock("next/navigation", () => ({ usePathname: jest.fn(() => "/en") }))
jest.mock("next/script", () => ({ __esModule: true, default: () => <script data-testid="pixel" /> }))
const originalMode = process.env.NODE_ENV
afterEach(() => { Object.defineProperty(process.env, "NODE_ENV", { value: originalMode, writable: true }) })
it.each(["/en/daycare/apply", "/fr/daycare/apply", "/daycare/apply", "/en/daycare/book", "/fr/daycare/book"])("does not load an advertising pixel on %s", path => {
  Object.defineProperty(process.env, "NODE_ENV", { value: "production", writable: true })
  jest.mocked(usePathname).mockReturnValue(path)
  expect(renderToStaticMarkup(<FacebookPixel />)).toBe("")
})
it("keeps the production homepage pixel and excludes local development", () => {
  jest.mocked(usePathname).mockReturnValue("/en")
  Object.defineProperty(process.env, "NODE_ENV", { value: "production", writable: true })
  expect(renderToStaticMarkup(<FacebookPixel />)).toContain('data-testid="pixel"')
  Object.defineProperty(process.env, "NODE_ENV", { value: "development", writable: true })
  expect(renderToStaticMarkup(<FacebookPixel />)).toBe("")
})
