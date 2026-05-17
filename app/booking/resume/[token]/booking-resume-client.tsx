"use client"

import { useRouter } from "next/navigation"
import { BookingContent } from "../../booking-content"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { SITE_FIXED_HEADER_MAIN_PT_CLASS } from "@/lib/site-header-layout"
import type { BookingFormData } from "@/app/booking/types"
import { useAppLocale } from "@/components/locale-provider"
import { addLocaleToPathname } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

export function BookingResumeClient({
  initialFormData,
  pinnedTeamMemberId,
  trainerPageSlug,
  allowTeamMemberIds = null,
}: {
  initialFormData: Partial<BookingFormData>
  pinnedTeamMemberId: string | null
  trainerPageSlug: string | null
  allowTeamMemberIds?: string[] | null
}) {
  const locale = useAppLocale()
  const router = useRouter()

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background overflow-x-hidden">
      <Header />
      <main
        className={cn(
          "flex flex-1 flex-col min-h-0 mx-auto w-full max-w-3xl px-4 pb-8 sm:pb-12",
          SITE_FIXED_HEADER_MAIN_PT_CLASS,
        )}
      >
        <BookingContent
          layout="page"
          pinnedTeamMemberId={pinnedTeamMemberId}
          trainerPageSlug={trainerPageSlug}
          depositResume={{
            openSchedulingDeposit: true,
            initialFormData,
            allowTeamMemberIds,
          }}
          onClose={() => router.push(addLocaleToPathname("/", locale))}
        />
      </main>
      <Footer />
    </div>
  )
}
