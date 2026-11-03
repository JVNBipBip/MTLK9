/** @jest-environment jsdom */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { DaycareHouseholdReservationForm } from "./daycare-household-reservation-form";
import type { DaycarePortal } from "@/lib/daycare-portal-types";
import {addDays,operatingDay} from "@/lib/daycare-booking";
let root: Root, container: HTMLDivElement;
const onBook=jest.fn();
const dogs:DaycarePortal["dogs"]=["Milo","Luna"].map((dogName,i)=>({id:String(i+1).repeat(64),dogName,secondDog:i===1,bookings:[],passes:[{id:`qa-pass-000${i}`,stay:i===0?"half":"full",addOns:[],visits:5,status:"paid",remaining:5,expiresOn:null,totalCents:100}]}));
const availability=[{date:"2026-11-02",remaining:15},{date:"2026-11-03",remaining:1}];
async function render(overrides:Partial<Parameters<typeof DaycareHouseholdReservationForm>[0]>={}) {
  await act(async()=>root.render(<DaycareHouseholdReservationForm dogs={dogs} availability={availability} locale="en" busy={false} onBook={onBook} {...overrides}/>));
}
async function pickDate(value="2026-11-02") {
  const select=container.querySelector('select')!;
  await act(async()=>{select.value=value;select.dispatchEvent(new Event("change",{bubbles:true}));});
}
async function submit() { await act(async()=>{container.querySelector('form')!.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));}); }
beforeEach(()=>{
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
  jest.spyOn(Date,"now").mockReturnValue(Date.parse("2026-10-29T14:00:00Z"));
  Object.defineProperty(crypto,"randomUUID",{configurable:true,value:jest.fn().mockReturnValueOnce("55555555-1111-4444-9999-111111111111").mockReturnValue("55555555-1111-4444-9999-222222222222")});
  container=document.createElement("div");document.body.append(container);root=createRoot(container);
  onBook.mockReset().mockResolvedValue(true);
});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();jest.restoreAllMocks();});
it.each(["en","fr"] as const)("shows both named dogs, separate balances and a combined confirmation in %s",async locale=>{
  await render({locale});
  expect(container.textContent).toContain("Milo");expect(container.textContent).toContain("Luna");
  expect(container.textContent).toContain(locale==="en"?"Each dog uses its own paid visits":"Chaque chien utilise ses propres visites payées");
  expect(container.querySelectorAll('input[type="checkbox"]:checked')).toHaveLength(2);
  expect(container.querySelector('button')?.textContent).toBe(locale==="en"?"Confirm both dogs’ visits":"Confirmer les visites des deux chiens");
  await pickDate();await submit();
  expect(onBook).toHaveBeenCalledWith(expect.any(String),[
    {applicationId:dogs[0].id,passId:dogs[0].passes[0].id,slot:{date:"2026-11-02",arrival:"07:30",departure:"13:30"}},
    {applicationId:dogs[1].id,passId:dogs[1].passes[0].id,slot:{date:"2026-11-02",arrival:"07:30",departure:"18:30"}},
  ]);
  expect(container.querySelector('select')!.value).toBe("");
});
it("disables dates with only one spot when booking both, but enables them for one dog",async()=>{
  await render();
  expect((container.querySelector('option[value="2026-11-03"]') as HTMLOptionElement).disabled).toBe(true);
  await act(async()=>{(container.querySelectorAll('input[type="checkbox"]')[1] as HTMLInputElement).click();});
  expect((container.querySelector('option[value="2026-11-03"]') as HTMLOptionElement).disabled).toBe(false);
  await pickDate("2026-11-03");await submit();
  expect(onBook.mock.calls[0][1]).toHaveLength(1);
  expect(onBook.mock.calls[0][1][0].applicationId).toBe(dogs[0].id);
});
it("does not allow an expired or unpaid second balance to silently use the first dog's visits",async()=>{
  const inactive={...dogs[1],passes:[{...dogs[1].passes[0],status:"pending"},{...dogs[1].passes[0],id:"expired-pass",expiresOn:"2026-10-20"}]};
  await render({dogs:[dogs[0],inactive]});
  expect(container.textContent).toContain("This dog needs paid visits before booking.");
  expect(container.querySelector('button')!.disabled).toBe(true);
  await pickDate();await submit();expect(onBook).not.toHaveBeenCalled();
});
it("retains the same request ID on an uncertain retry and creates a new one for a changed selection",async()=>{
  onBook.mockResolvedValue(false);await render();await pickDate();await submit();await submit();
  expect(onBook.mock.calls[0][0]).toBe(onBook.mock.calls[1][0]);
  await act(async()=>{(container.querySelectorAll('input[type="checkbox"]')[1] as HTMLInputElement).click();});
  await submit();expect(onBook.mock.calls[2][0]).not.toBe(onBook.mock.calls[0][0]);
});
it("renders a one-dog household without a misleading second-dog selector",async()=>{
  await render({dogs:[dogs[0]]});
  expect(container.querySelector('input[type="checkbox"]')).toBeNull();
  expect(container.querySelector('button')!.textContent).toBe("Confirm my dog’s visit");
});
it.each([5,10,20] as const)("one click can select a whole %i-visit bundle, never dates outside the validity window",async count=>{
  const days=Array.from({length:110},(_,i)=>addDays("2026-11-02",i)).filter(operatingDay).map(date=>({date,remaining:15}));
  await render({dogs:[{...dogs[0],passes:[{...dogs[0].passes[0],visits:count,remaining:count}]}],availability:days});
  await pickDate();const quick=[...container.querySelectorAll("button")].find(b=>b.textContent==="Select next available dates")!;
  await act(async()=>quick.click());
  expect(container.querySelector('button[type=submit]')!.textContent).toBe("Confirm "+count+" dates");
  expect(container.querySelectorAll("input[type=checkbox]")).toHaveLength(({5:4,10:7,20:12})[count]*2);
  await submit();expect(onBook.mock.calls[0][1]).toHaveLength(count);expect(new Set(onBook.mock.calls[0][1].map((r:any)=>r.slot.date)).size).toBe(count);
});
it("restores tentative dates from a paid pass but does not confirm any until the owner submits",async()=>{
  await render({dogs:[{...dogs[0],passes:[{...dogs[0].passes[0],plannedDates:["2026-11-02","2026-11-03"]}]}]});
  expect((container.querySelector("select") as HTMLSelectElement).value).toBe("2026-11-02");
  expect(onBook).not.toHaveBeenCalled();await submit();expect(onBook.mock.calls[0][1]).toHaveLength(2);
});
it("prevents empty selections, concurrent edits and already-reserved dates",async()=>{
  await render({dogs:[{...dogs[0],bookings:[{id:"old",passId:"old",status:"booked",date:"2026-11-02",arrival:"07:30",departure:"13:30"}]},dogs[1]]});
  expect((container.querySelector('option[value="2026-11-02"]') as HTMLOptionElement).disabled).toBe(true);
  await render({busy:true});expect(container.querySelector('button')!.disabled).toBe(true);
  await render();
  await act(async()=>{container.querySelectorAll('input[type="checkbox"]').forEach(input=>(input as HTMLInputElement).click());});
  expect(container.querySelector('button')!.disabled).toBe(true);
  await submit();expect(onBook).not.toHaveBeenCalled();
});
