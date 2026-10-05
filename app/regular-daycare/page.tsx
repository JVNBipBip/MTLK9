import { FacilityServicePage, facilityServiceMetadata } from "@/components/facility-service-page"

export function generateMetadata() { return facilityServiceMetadata("regular-daycare") }

export default function Page() { return <FacilityServicePage id="regular-daycare" /> }
