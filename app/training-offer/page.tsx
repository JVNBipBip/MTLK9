import { FacilityServicePage, facilityServiceMetadata } from "@/components/facility-service-page"

export function generateMetadata() { return facilityServiceMetadata("training-offer") }

export default function Page() { return <FacilityServicePage id="training-offer" /> }
