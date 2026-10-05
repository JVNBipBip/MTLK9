import { FacilityServicePage, facilityServiceMetadata } from "@/components/facility-service-page"

export function generateMetadata() { return facilityServiceMetadata("apprenticeships") }

export default function Page() { return <FacilityServicePage id="apprenticeships" /> }
