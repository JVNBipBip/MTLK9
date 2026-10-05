import { FacilityServicePage, facilityServiceMetadata } from "@/components/facility-service-page"

export function generateMetadata() { return facilityServiceMetadata("day-training") }

export default function Page() { return <FacilityServicePage id="day-training" /> }
