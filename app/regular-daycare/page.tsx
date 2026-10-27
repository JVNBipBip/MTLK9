import { facilityServiceMetadata } from "@/components/facility-service-page"
import { DaycarePage } from "@/components/daycare-page"

export function generateMetadata() { return facilityServiceMetadata("regular-daycare") }

export default function Page() { return <DaycarePage focus="regular-daycare" /> }
