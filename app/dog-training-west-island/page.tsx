import { LocationPage } from "@/components/location-page"
import { locationPages } from "@/lib/location-pages"
import { getRequestLocale } from "@/lib/seo"

export default async function WestIslandPage() {
  const locale = await getRequestLocale()

  return <LocationPage page={locationPages["west-island"]} locale={locale} />
}
