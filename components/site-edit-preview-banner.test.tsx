import { SiteEditPreviewBanner } from "@/components/site-edit-preview-banner"

describe("SiteEditPreviewBanner", () => {
  const original = { env: process.env.VERCEL_ENV, ref: process.env.VERCEL_GIT_COMMIT_REF }

  afterEach(() => {
    process.env.VERCEL_ENV = original.env
    process.env.VERCEL_GIT_COMMIT_REF = original.ref
  })

  function renderWith(env: string | undefined, branch: string | undefined) {
    if (env === undefined) delete process.env.VERCEL_ENV
    else process.env.VERCEL_ENV = env
    if (branch === undefined) delete process.env.VERCEL_GIT_COMMIT_REF
    else process.env.VERCEL_GIT_COMMIT_REF = branch
    return SiteEditPreviewBanner({ locale: "en" })
  }

  it.each([
    ["the live site (production, main)", "production", "main"],
    ["a production deploy of anything", "production", "site-edits/123"],
    ["a preview of main", "preview", "main"],
    ["a preview of another branch", "preview", "site-editing"],
    ["the test sandbox", "preview", "site-edits-sandbox"],
    ["local development", undefined, undefined],
  ])("never shows on %s", (_name, env, branch) => {
    expect(renderWith(env, branch)).toBeNull()
  })

  it("shows only on a Preview first build", () => {
    expect(renderWith("preview", "site-edits/1795110426691")).not.toBeNull()
  })
})
