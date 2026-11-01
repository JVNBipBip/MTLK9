/** @jest-environment jsdom */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { DaycareBookingPortal } from "./daycare-booking-portal";
let root:Root,container:HTMLDivElement;
const originalFetch=globalThis.fetch;
const fetchMock=jest.fn();
const ids=["a".repeat(64),"b".repeat(64)];
const data={defaultDogId:ids[0],dogs:ids.map((id,i)=>({id,dogName:i?"Luna":"Milo",secondDog:!!i,bookings:[],passes:[{id:`qa-pass-000${i}`,stay:"half",visits:5,addOns:[],status:"paid",remaining:5,totalCents:100,expiresOn:null}]})),availability:[{date:"2026-11-03",remaining:15}]};
beforeEach(async()=>{
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
  Object.defineProperty(HTMLElement.prototype,"scrollIntoView",{configurable:true,value:jest.fn()});
  Object.defineProperty(crypto,"randomUUID",{configurable:true,value:()=>"55555555-1111-4444-9999-111111111111"});
  fetchMock.mockReset().mockImplementation(async(_url,init)=>({status:200,ok:true,json:async()=>init?.method==="POST"?JSON.parse(init.body).action==="book-household"?{bookings:[{status:"booked"},{status:"booked"}]}:{ok:true}:JSON.parse(JSON.stringify(data))}));
  globalThis.fetch=fetchMock;
  container=document.createElement("div");document.body.append(container);root=createRoot(container);
  await act(async()=>root.render(<DaycareBookingPortal locale="en"/>));
});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();globalThis.fetch=originalFetch;});
function posts(){return fetchMock.mock.calls.filter(([,init])=>init?.method==="POST").map(([,init])=>JSON.parse(init.body));}
it("shows both separate balances and the shared-household overview",()=>{
  expect(container.textContent).toContain("Your daycare household");
  expect([...container.querySelectorAll('h4')].map(h=>h.textContent)).toEqual(["Milo","Luna"]);
  expect(container.textContent).toContain("Each dog uses its own paid visits");
});
it("targets a second-dog purchase by profile and shows its 30% price",async()=>{
  const select=container.querySelector('#daycare-purchases select') as HTMLSelectElement;
  await act(async()=>{select.value=ids[1];select.dispatchEvent(new Event("change",{bubbles:true}));});
  expect(container.querySelector('#daycare-purchases')?.textContent).toContain("Add visits for Luna");
  expect(container.querySelector('#daycare-purchases')?.textContent).toContain("$38.50");
  await act(async()=>{container.querySelector('#daycare-purchases form')!.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));});
  expect(posts()).toContainEqual(expect.objectContaining({action:"checkout",applicationId:ids[1]}));
});
it("refreshes payment status for both dog balances after returning from payment",async()=>{
  const button=[...container.querySelectorAll('button')].find(b=>b.textContent==="Refresh payments after checkout")!;
  await act(async()=>button.click());
  expect(posts().filter(p=>p.action==="refresh").map(p=>p.applicationId)).toEqual(ids);
});
it("submits both selected dogs and makes the confirmation visible",async()=>{
  const select=container.querySelector('#reserve-daycare select') as HTMLSelectElement;
  await act(async()=>{select.value="2026-11-03";select.dispatchEvent(new Event("change",{bubbles:true}));});
  await act(async()=>{container.querySelector('#reserve-daycare form')!.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));});
  expect(posts().find(p=>p.action==="book-household").reservations).toHaveLength(2);
  const message=container.querySelector('[role="status"]')!;
  expect(message.textContent).toBe("Both dogs’ visits are confirmed.");
  expect(document.activeElement).toBe(message);
  expect(message.scrollIntoView).toHaveBeenCalled();
});
