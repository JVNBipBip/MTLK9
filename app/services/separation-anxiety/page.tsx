import { MoneyServicePage } from "@/app/services/_components/money-service-page"
import { moneyServicePages } from "@/lib/money-service-pages"
import { getRequestLocale } from "@/lib/seo"

export default async function SeparationAnxietyPage() {
  const locale = await getRequestLocale()

  return <MoneyServicePage page={moneyServicePages["separation-anxiety"]} locale={locale} />
}
