import { facilityServiceMetadata } from "@/components/facility-service-page"
import { DaycarePage } from "@/components/daycare-page"

export function generateMetadata() { return facilityServiceMetadata("day-training") }

export default function Page() { return <DaycarePage focus="day-training" /> }
