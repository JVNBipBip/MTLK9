import type { DaycareAddOn, DaycareStay, DaycareVisits } from "./daycare-pricing";
import type { DaycareSlot } from "./daycare-booking";

export type DaycarePortalPass = {
  id: string; stay: DaycareStay; addOns: DaycareAddOn[]; visits: DaycareVisits;
  status: string; remaining: number; expiresOn: string | null; checkoutUrl?: string; totalCents: number;
};
export type DaycarePortalBooking = DaycareSlot & { id: string; passId: string; status: string };
export type DaycarePortalDog = {
  id: string; dogName: string; secondDog: boolean; passes: DaycarePortalPass[]; bookings: DaycarePortalBooking[];
};
export type DaycarePortal = {
  dogs: DaycarePortalDog[]; defaultDogId: string; availability: { date: string; remaining: number }[];
};
export function bookableDaycarePasses(dog: DaycarePortalDog, today: string) {
  return dog.passes.filter(p => p.status === "paid" && p.remaining > 0 && (!p.expiresOn || p.expiresOn >= today));
}
