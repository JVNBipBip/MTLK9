import type { AppLocale } from "@/lib/i18n/config"

/**
 * Shown only on Vercel preview builds of the owner's "Preview first" branches
 * (`site-edits/*`, created by the admin's Website editor), so a preview can
 * never be mistaken for the live site. Renders nothing in production.
 */
export function SiteEditPreviewBanner({ locale }: { locale: AppLocale }) {
  const branch = process.env.VERCEL_GIT_COMMIT_REF ?? ""
  if (process.env.VERCEL_ENV !== "preview" || !branch.startsWith("site-edits/")) return null

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-[100] bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-black shadow-lg"
    >
      {locale === "fr"
        ? "Aperçu : pas encore en ligne. Voici le site avec vos modifications."
        : "Preview: not live yet. This is the website with your changes."}
    </div>
  )
}
