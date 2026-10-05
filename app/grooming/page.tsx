import { FacilityServicePage, facilityServiceMetadata } from "@/components/facility-service-page"

export function generateMetadata() { return facilityServiceMetadata("grooming") }

export default function Page() { return <FacilityServicePage id="grooming" /> }
