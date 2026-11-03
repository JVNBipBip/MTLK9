import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { getAdminDb } from "@/lib/firebase-admin";
import { daycareMemoryDb } from "@/lib/daycare-test-db";
import { daycareAccount, issueDaycareAccess } from "@/lib/daycare-booking-store";
import { createDaycareCheckout, reconcileDaycarePass } from "@/lib/daycare-payments";
import { notifyDaycareBooking } from "@/lib/daycare-booking-notification";
import { notifyDaycareItinerary } from "@/lib/daycare-itinerary-notification";
import { addDays,operatingDay } from "@/lib/daycare-booking";
jest.mock("@/lib/firebase-admin", () => ({ getAdminDb: jest.fn() }));
jest.mock("@/lib/daycare-payments", () => ({ createDaycareCheckout: jest.fn(), reconcileDaycarePass: jest.fn() }));
jest.mock("@/lib/daycare-booking-notification", () => ({ notifyDaycareBooking: jest.fn() }));
jest.mock("@/lib/daycare-itinerary-notification", () => ({notifyDaycareItinerary:jest.fn()}));
let memory: ReturnType<typeof daycareMemoryDb>;
let token: string;
const ids=["a".repeat(64),"b".repeat(64),"c".repeat(64)];
const requestId="55555555-1111-4444-9999-111111111111";
const reservations=ids.slice(0,2).map((applicationId,i)=>({applicationId,passId:`qa-pass-000${i}`,slot:{date:"2026-11-02",arrival:"07:30",departure:"13:30"}}));
function request(body?: unknown, options:{origin?:string;authenticated?:boolean}={}) {
  return new NextRequest("https://website.example/api/daycare/portal",{method:body?"POST":"GET",headers:{...(options.authenticated===false?{}:{cookie:`mtlk9_daycare=${token}`}),origin:options.origin||"https://website.example","content-type":"application/json"},...(body?{body:JSON.stringify(body)}:{})});
}
beforeEach(async()=>{
  jest.clearAllMocks();
  jest.mocked(notifyDaycareBooking).mockResolvedValue(undefined);
  jest.mocked(notifyDaycareItinerary).mockResolvedValue(undefined);
  jest.spyOn(Date,"now").mockReturnValue(Date.parse("2026-10-29T14:00:00Z"));
  memory=daycareMemoryDb();
  const base=memory.db;
  const queryDb={...base,collection:(name:string)=>({...base.collection(name),where:(field:string,_op:string,value:string)=>({get:async()=>({docs:[...memory.data].filter(([path,data])=>path.startsWith(`${name}/`)&&path.split("/").length===2&&data[field]===value).map(([path,data])=>({id:path.split("/").pop(),data:()=>structuredClone(data)}))})})}),getAll:async(...refs:any[])=>Promise.all(refs.map(ref=>ref.get()))};
  jest.mocked(getAdminDb).mockReturnValue(queryDb as any);
  for(const [i,id] of ids.entries()) memory.data.set(`daycare_applications/${id}`,{status:"approved",answers:{dogName:`Dog ${i+1}`,ownerName:"QA Owner",ownerEmail:"qa@example.com"}});
  token=(await issueDaycareAccess(memory.db,ids[0],"Nick")).token;
  await issueDaycareAccess(memory.db,ids[1],"Nick",ids[0]);
  for(const reservation of reservations) memory.data.set(`daycare_passes/${reservation.passId}`,{applicationId:reservation.applicationId,stay:"half",addOns:[],visits:5,status:"paid",allocations:{},totalCents:100,createdAtIso:"2026-10-28T12:00:00Z"});
});
afterEach(()=>jest.restoreAllMocks());
it("returns both verified profiles and separate balances, never credentials or unrelated same-email dogs",async()=>{
  const response=await GET(request());
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  const payload=await response.json();
  expect(payload.dogs.map((dog:any)=>dog.id)).toEqual(ids.slice(0,2));
  expect(payload.dogs[1].secondDog).toBe(true);
  expect(payload.dogs.map((dog:any)=>dog.passes[0].remaining)).toEqual([5,5]);
  expect(JSON.stringify(payload)).not.toMatch(/accessHash|ownerEmail|qa@example|mtlk9_daycare/);
  expect(JSON.stringify(payload)).not.toContain(token);
  expect(payload.dogName).toBe("Dog 1"); // Existing open clients remain compatible.
});
it("saves both bookings before scheduling per-dog notifications",async()=>{
  jest.mocked(notifyDaycareBooking).mockImplementation(async(_db,id)=>{
    expect(memory.data.get(`daycare_bookings/${id}`)?.status).toBe("booked");
    expect(Object.keys(memory.data.get("daycare_days/2026-11-02").occupants)).toHaveLength(2);
  });
  const response=await POST(request({action:"book-household",requestId,reservations}));
  expect(response.status).toBe(200);
  expect((await response.json()).bookings).toHaveLength(2);
  expect(notifyDaycareBooking).toHaveBeenCalledTimes(2);
});
it("accepts a 40-reservation body; reconciles each paid balance once and sends one itinerary",async()=>{
  const dates=Array.from({length:90},(_,i)=>addDays("2026-11-02",i)).filter(operatingDay).slice(0,20);
  for(const r of reservations)memory.data.get("daycare_passes/"+r.passId).visits=20;
  const rows=dates.flatMap(date=>reservations.map(r=>({...r,slot:{...r.slot,date}})));
  const response=await POST(request({action:"book-household",requestId,reservations:rows}));
  expect(response.status).toBe(200);expect((await response.json()).bookings).toHaveLength(40);
  expect(reconcileDaycarePass).toHaveBeenCalledTimes(2);
  expect(notifyDaycareItinerary).toHaveBeenCalledTimes(1);expect(notifyDaycareBooking).not.toHaveBeenCalled();
});
it("returns an atomic capacity failure without notifications or deductions",async()=>{
  memory.data.set("daycare_days/2026-11-02",{occupants:Object.fromEntries(Array.from({length:14},(_,i)=>[`other-${i}`,`b-${i}`]))});
  const response=await POST(request({action:"book-household",requestId,reservations}));
  expect(response.status).toBe(409);
  expect(await response.json()).toEqual({error:"day_full"});
  expect(notifyDaycareBooking).not.toHaveBeenCalled();
  expect(memory.data.get(`daycare_passes/${reservations[0].passId}`).allocations).toEqual({});
});
it("authorizes the selected dog's checkout on the server, not a client-supplied discount flag",async()=>{
  jest.mocked(createDaycareCheckout).mockResolvedValue({id:"test",url:"https://sandbox.square.link/test"});
  const response=await POST(request({action:"checkout",applicationId:ids[1],secondDog:false,requestId,stay:"full",addOns:[],visits:5}));
  expect(response.status).toBe(200);
  expect(createDaycareCheckout).toHaveBeenCalledWith(expect.objectContaining({id:ids[1],secondDog:true,principal:expect.objectContaining({id:ids[0]})}),expect.any(Object));
});
it.each(["checkout","refresh","book","cancel","reschedule"])("rejects selecting an unrelated application for %s",async action=>{
  expect((await POST(request({action,applicationId:ids[2]}))).status).toBe(401);
  expect(createDaycareCheckout).not.toHaveBeenCalled();
  expect(reconcileDaycarePass).not.toHaveBeenCalled();
  expect(notifyDaycareBooking).not.toHaveBeenCalled();
});
it("rejects a foreign dog or pass before reconciling payments",async()=>{
  expect((await POST(request({action:"book-household",requestId,reservations:[reservations[0],{...reservations[1],applicationId:ids[2]}]}))).status).toBe(401);
  expect((await POST(request({action:"book-household",requestId,reservations:[{...reservations[0],passId:reservations[1].passId}]}))).status).toBe(404);
  expect(reconcileDaycarePass).not.toHaveBeenCalled();
});
it("keeps authentication and same-origin protections on the new endpoint",async()=>{
  expect((await GET(request(undefined,{authenticated:false}))).status).toBe(401);
  expect((await POST(request({action:"book-household",requestId,reservations},{authenticated:false}))).status).toBe(401);
  expect((await POST(request({action:"book-household",requestId,reservations},{origin:"https://attacker.example"}))).status).toBe(403);
});
