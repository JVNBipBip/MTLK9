import { bookDaycareHousehold, daycareHouseholdAccounts, parseDaycareReservations } from "./daycare-household";
import { daycareMemoryDb } from "./daycare-test-db";
import { changeDaycareBooking, daycareAccount, daycareHash, issueDaycareAccess } from "./daycare-booking-store";
import { addDays, operatingDay, torontoTime } from "./daycare-booking";

const now = Date.parse("2026-10-29T14:00:00Z");
const slot = { date: "2026-11-02", arrival: "07:30", departure: "13:30" };
const requestId = "55555555-1111-4444-9999-111111111111";
async function fixture() {
  const { db, data } = daycareMemoryDb();
  const ids = ["a".repeat(64), "b".repeat(64)];
  for (const [i, id] of ids.entries()) data.set(`daycare_applications/${id}`, {
    status: "approved", answers: { dogName: `Dog ${i + 1}`, ownerName: "QA Owner", ownerEmail: "qa@example.com" },
  });
  const first = await issueDaycareAccess(db, ids[0], "Nick");
  const second = await issueDaycareAccess(db, ids[1], "Nick", ids[0]);
  const principal = await daycareAccount(db, first.token);
  const reservations = ids.map((applicationId, i) => {
    const passId = `qa-pass-000${i}`;
    data.set(`daycare_passes/${passId}`, { applicationId, stay: "half", visits: 5, addOns: ["training"], status: "paid", allocations: {} });
    return { applicationId, passId, slot };
  });
  return { db, data, ids, first, second, principal, reservations };
}

it("either existing approved code opens the same explicitly verified pair without exposing credentials", async () => {
  const f = await fixture();
  for (const token of [f.first.token, f.second.token]) {
    const accounts = await daycareHouseholdAccounts(f.db, await daycareAccount(f.db, token));
    expect(accounts.map(a => a.id)).toEqual(f.ids);
    expect(accounts.map(a => a.secondDog)).toEqual([false, true]);
    expect(JSON.stringify(accounts)).not.toContain(token);
  }
});
it.each(["unlinked", "wrong-email", "wrong-link", "different-household"])("does not expand access based only on email: %s", async mutation => {
  const f = await fixture();
  if (mutation === "unlinked") f.data.delete(`daycare_households/${daycareHash("qa@example.com")}`);
  if (mutation === "wrong-email") f.data.get(`daycare_applications/${f.ids[1]}`).answers.ownerEmail = "someone-else@example.com";
  if (mutation === "wrong-link") f.data.get(`daycare_applications/${f.ids[1]}`).secondDogOf = "c".repeat(64);
  if (mutation === "different-household") f.data.get(`daycare_households/${daycareHash("qa@example.com")}`).primaryId = "c".repeat(64);
  expect((await daycareHouseholdAccounts(f.db, f.principal)).map(a => a.id)).toEqual([f.ids[0]]);
  await expect(bookDaycareHousehold(f.db, f.principal, requestId, f.reservations, now)).rejects.toThrow("unauthorized");
});
it.each(["revoked", "pending", "test", "no-access"])("does not expose or book an inactive linked dog: %s", async mutation => {
  const f = await fixture();
  const dog = f.data.get(`daycare_applications/${f.ids[1]}`);
  if (mutation === "test") dog.isTest = true;
  else if (mutation === "no-access") dog.accessHash = null;
  else dog.status = mutation;
  expect((await daycareHouseholdAccounts(f.db, f.principal)).map(a => a.id)).toEqual([f.ids[0]]);
  await expect(bookDaycareHousehold(f.db, f.principal, requestId, f.reservations, now)).rejects.toThrow("unauthorized");
});
it("rechecks the login code inside the transaction after revocation or code replacement", async () => {
  for (const mutation of ["revoked", "replaced"]) {
    const f = await fixture();
    if (mutation === "replaced") await issueDaycareAccess(f.db, f.ids[0], "Nick");
    else f.data.get(`daycare_applications/${f.ids[0]}`).status = "revoked";
    await expect(bookDaycareHousehold(f.db, f.principal, requestId, f.reservations, now)).rejects.toThrow("unauthorized");
    expect([...f.data.keys()].filter(k => k.startsWith("daycare_bookings/"))).toHaveLength(0);
  }
});
it("books two dogs atomically, consuming one visit each and two places", async () => {
  const f = await fixture();
  const result = await bookDaycareHousehold(f.db, f.principal, requestId, f.reservations, now);
  expect(result.bookings).toHaveLength(2);
  expect(Object.keys(f.data.get(`daycare_days/${slot.date}`).occupants)).toEqual(f.ids);
  for (const [i, reservation] of f.reservations.entries()) {
    expect(Object.keys(f.data.get(`daycare_passes/${reservation.passId}`).allocations)).toEqual([result.bookings[i].id]);
    expect(f.data.get(`daycare_bookings/${result.bookings[i].id}`)).toMatchObject({ applicationId: f.ids[i], passId: reservation.passId, dogName: `Dog ${i+1}`, status: "booked" });
  }
  const repeat = await bookDaycareHousehold(f.db, f.principal, requestId, [...f.reservations].reverse(), now);
  expect(repeat.bookings.every(b => b.repeated)).toBe(true);
  expect(Object.keys(f.data.get(`daycare_days/${slot.date}`).occupants)).toHaveLength(2);
  await expect(bookDaycareHousehold(f.db, f.principal, requestId, f.reservations.slice(0,1), now)).rejects.toThrow("request_conflict");
});
it.each(["one-spot", "pending-payment", "empty-balance", "foreign-pass", "bad-duration", "late-notice", "already-booked", "expired-bundle"])("saves neither dog when either cannot book: %s", async mutation => {
  const f = await fixture();
  const second = f.data.get(`daycare_passes/${f.reservations[1].passId}`);
  if (mutation === "one-spot") f.data.set(`daycare_days/${slot.date}`, { occupants: Object.fromEntries(Array.from({length:14}, (_,i)=>[`other-${i}`,`booking-${i}`])) });
  if (mutation === "pending-payment") second.status = "pending";
  if (mutation === "empty-balance") second.visits = 0;
  if (mutation === "foreign-pass") second.applicationId = "c".repeat(64);
  if (mutation === "bad-duration") second.stay = "full";
  if (mutation === "late-notice") f.reservations[1] = { ...f.reservations[1], slot: { ...slot, date: "2026-10-27" } }, f.reservations[0] = { ...f.reservations[0], slot: f.reservations[1].slot };
  if (mutation === "already-booked") f.data.set(`daycare_days/${slot.date}`, { occupants: { [f.ids[1]]: "different-booking" } });
  if (mutation === "expired-bundle") second.lockedFirstVisitDate = "2026-09-01";
  const before = structuredClone([...f.data.entries()]);
  await expect(bookDaycareHousehold(f.db, f.principal, requestId, f.reservations, now)).rejects.toThrow();
  expect([...f.data.entries()]).toEqual(before);
});
it("cannot oversell capacity when a two-dog booking races another customer's visit", async () => {
  const f = await fixture();
  f.data.set(`daycare_days/${slot.date}`, { occupants: Object.fromEntries(Array.from({length:13}, (_,i)=>[`other-${i}`,`booking-${i}`])) });
  const id = "c".repeat(64);
  f.data.set(`daycare_applications/${id}`, { status:"approved",accessHash:"other-hash",answers:{dogName:"Other",ownerName:"Other",ownerEmail:"other@example.com"} });
  f.data.set("daycare_passes/other-pass-000", {applicationId:id,stay:"half",visits:1,status:"paid",addOns:[],allocations:{}});
  const results = await Promise.allSettled([
    bookDaycareHousehold(f.db, f.principal, requestId, f.reservations, now),
    changeDaycareBooking(f.db,{applicationId:id,accessHash:"other-hash",passId:"other-pass-000",bookingId:"other-booking-00",action:"book",slot},now),
  ]);
  expect(results.filter(r=>r.status==="fulfilled")).toHaveLength(1);
  const occupants=f.data.get(`daycare_days/${slot.date}`).occupants;
  expect(Object.keys(occupants)).toHaveLength(15);
  expect(f.ids.filter(id=>occupants[id])).toHaveLength(2);
});
it("allows one household code to cancel a sibling's visit without touching the other dog's credit", async () => {
  const f = await fixture();
  const result = await bookDaycareHousehold(f.db, f.principal, requestId, f.reservations, now);
  const accounts = await daycareHouseholdAccounts(f.db, f.principal);
  const input = {applicationId:f.ids[1],accessHash:accounts[1].accessHash,principal:f.principal,passId:f.reservations[1].passId,bookingId:result.bookings[1].id,action:"cancel" as const};
  await changeDaycareBooking(f.db,input,now);
  expect(f.data.get(`daycare_bookings/${result.bookings[0].id}`).status).toBe("booked");
  expect(f.data.get(`daycare_bookings/${result.bookings[1].id}`).status).toBe("cancelled");
  f.data.get(`daycare_applications/${f.ids[0]}`).status="revoked";
  await expect(changeDaycareBooking(f.db,input,now)).rejects.toThrow("unauthorized");
});
it("books one selected dog without changing the other dog's balance", async () => {
  const f=await fixture();
  const result=await bookDaycareHousehold(f.db,f.principal,requestId,f.reservations.slice(1),now);
  expect(result.bookings).toHaveLength(1);
  expect(Object.keys(f.data.get(`daycare_days/${slot.date}`).occupants)).toEqual([f.ids[1]]);
  expect(f.data.get(`daycare_passes/${f.reservations[0].passId}`).allocations).toEqual({});
});
it("keeps the full 24-hour notice rule on combined bookings",async()=>{
  const f=await fixture();
  const tooLate=torontoTime(slot.date,slot.arrival)-23*3600000;
  await expect(bookDaycareHousehold(f.db,f.principal,requestId,f.reservations,tooLate)).rejects.toThrow("notice_24h");
  expect(f.data.get(`daycare_passes/${f.reservations[0].passId}`).allocations).toEqual({});
  expect(f.data.has(`daycare_days/${slot.date}`)).toBe(false);
});
it.each([null, [], [null], [{applicationId:"not-an-id"}], [1,2,3]])("rejects malformed or oversized household selections", value => {
  expect(()=>parseDaycareReservations(value)).toThrow();
});
it("rejects duplicate dogs, shared passes and different dates before writing", async () => {
  const f=await fixture();
  for(const selections of [[f.reservations[0],f.reservations[0]],[f.reservations[0],{...f.reservations[1],passId:f.reservations[0].passId}],[f.reservations[0],{...f.reservations[1],slot:{...slot,date:"2026-11-03"}}]]) expect(()=>parseDaycareReservations(selections)).toThrow();
});

const nextDates = (count: number) => Array.from({length:120},(_,i)=>addDays(slot.date,i)).filter(operatingDay).slice(0,count);
it.each([5,10,20])("books a whole %i-visit bundle for both dogs and can safely retry it",async(count)=>{
  const f=await fixture();
  for(const r of f.reservations) f.data.get("daycare_passes/"+r.passId).visits=count;
  const dates=nextDates(count), series=dates.flatMap(date=>f.reservations.map(r=>({...r,slot:{...slot,date}})));
  const saved=await bookDaycareHousehold(f.db,f.principal,requestId,series,now);
  expect(new Set(saved.bookings.map(b=>b.id)).size).toBe(count*2);
  for(const date of dates) expect(Object.keys(f.data.get("daycare_days/"+date).occupants)).toEqual(f.ids);
  for(const r of f.reservations){
    const pass=f.data.get("daycare_passes/"+r.passId);
    expect(Object.keys(pass.allocations)).toHaveLength(count);
    expect(pass.firstVisitDate).toBe(dates[0]);
  }
  const before=structuredClone([...f.data]);
  const replay=await bookDaycareHousehold(f.db,f.principal,requestId,[...series].reverse(),now);
  expect(replay.bookings.every(b=>b.repeated)).toBe(true);expect([...f.data]).toEqual(before);
  await expect(bookDaycareHousehold(f.db,f.principal,requestId,series.slice(2),now)).rejects.toThrow("request_conflict");
});
it.each(["day_full","bundle_window","no_visits","already_booked"])("rolls back every date and credit on a late failure: %s",async(reason)=>{
  const f=await fixture();
  const dates=nextDates(reason==="no_visits"?6:5);
  if(reason==="bundle_window") dates[4]=addDays(slot.date,28);
  if(reason==="day_full") f.data.set("daycare_days/"+dates[4],{occupants:Object.fromEntries(Array.from({length:14},(_,i)=>["other"+i,"booking"+i]))});
  if(reason==="already_booked") f.data.set("daycare_days/"+dates[4],{occupants:{[f.ids[1]]:"prior"}});
  const before=structuredClone([...f.data]);
  await expect(bookDaycareHousehold(f.db,f.principal,requestId,dates.flatMap(date=>f.reservations.map(r=>({...r,slot:{...slot,date}}))),now)).rejects.toThrow(reason);
  expect([...f.data]).toEqual(before);
});
it("rejects more than 20 dates and more than one balance per dog",async()=>{
  const f=await fixture(),r=f.reservations[0];
  expect(()=>parseDaycareReservations(nextDates(21).map(date=>({...r,slot:{...slot,date}})))).toThrow("invalid_request");
  expect(()=>parseDaycareReservations([r,{...r,passId:"other-pass-123",slot:{...slot,date:"2026-11-03"}}])).toThrow("invalid_request");
});
