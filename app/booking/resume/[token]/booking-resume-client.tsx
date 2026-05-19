"use client"

import { useRouter } from "next/navigation"
import { BookingContent } from "@/app/booking/booking-content"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { useAppLocale } from "@/components/locale-provider"
import { addLocaleToPathname } from "@/lib/i18n/config"
import type { ConsultationDepositResumePageData } from "@/lib/consultation-deposit-resume"
import { SITE_FIXED_HEADER_MAIN_PT_CLASS } from "@/lib/site-header-layout"
import { cn } from "@/lib/utils"

export function BookingResumeClient({ data }: { data: ConsultationDepositResumePageData }) {
  const locale = useAppLocale()
  const router = useRouter()

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background overflow-x-hidden">
      <Header />
      <main
        className={cn(
          "flex flex-1 flex-col min-h-0 mx-auto w-full max-w-lg px-4 pb-8 sm:pb-12",
          SITE_FIXED_HEADER_MAIN_PT_CLASS,
        )}
      >
        <BookingContent
          layout="page"
          inquiryOnly={false}
          depositResume={{
            initialFormData: data.initialFormData,
            openSchedulingDeposit: true,
            allowTeamMemberIds: data.allowTeamMemberIds,
          }}
          pinnedTeamMemberId={data.pinnedTeamMemberId}
          trainerPageSlug={data.trainerPageSlug}
          onClose={() => router.push(addLocaleToPathname("/", locale))}
        />
      </main>
      <Footer />
    </div>
  )
}
