"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { DAYCARE_FIELDS, DAYCARE_STEPS, daycareAnswerLabel, daycareFieldVisible, validateDaycareAnswers, type DaycareAnswers, type DaycareLocale } from "@/lib/daycare-intake"

export function DaycareApplicationForm({ locale }: { locale: DaycareLocale }) {
  const fr = locale === "fr"
  const t = (en: string, french: string) => fr ? french : en
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<DaycareAnswers>({})
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [complete, setComplete] = useState(false)
  const [trap, setTrap] = useState("")
  const requestId = useRef<string | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const setValue = (id: string, value: DaycareAnswers[string]) => { requestId.current = null; setAnswers(current => ({ ...current, [id]: value })); setErrors(current => current.filter(key => key !== id)); setMessage("") }
  const go = (next: number) => { setStep(next); setErrors([]); setMessage(""); requestAnimationFrame(() => heading.current?.focus()) }
  const fields = DAYCARE_FIELDS.filter(field => field.step === step && daycareFieldVisible(field, answers))
  const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-border bg-background px-4 py-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const checked = validateDaycareAnswers(answers, step === 6 ? undefined : step)
    if (checked.errors.length) {
      setErrors(checked.errors)
      const first = DAYCARE_FIELDS.find(field => field.id === checked.errors[0])
      if (first) setStep(first.step)
      requestAnimationFrame(() => document.getElementById(`daycare-${checked.errors[0]}`)?.focus())
      return
    }
    if (step < 6) { go(step + 1); return }
    setBusy(true)
    setMessage("")
    requestId.current ||= crypto.randomUUID()
    try {
      const response = await fetch("/api/daycare/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: requestId.current, locale, answers: checked.answers, website: trap }) })
      if (!response.ok) throw new Error("submission_failed")
      setComplete(true)
      setAnswers({})
      requestAnimationFrame(() => heading.current?.focus())
    } catch {
      setMessage(t("We couldn’t submit your application. Your answers are still here. Please try again, or call 514 826 9558.", "Votre demande n’a pas pu être envoyée. Vos réponses sont toujours ici. Réessayez ou appelez le 514 826 9558."))
    } finally { setBusy(false) }
  }

  if (complete) return <div className="ph-no-capture rounded-3xl border border-border bg-background p-7 sm:p-10">
    <Check className="mb-5 size-10 text-primary" aria-hidden />
    <h2 ref={heading} tabIndex={-1} className="text-3xl font-semibold">{t("Your application is with our team.", "Votre demande a été transmise à notre équipe.")}</h2>
    <p className="mt-5 leading-relaxed text-muted-foreground">{t("A trainer will review your answers and contact you for a free 10–15 minute phone evaluation. This is an application, not an approval or a booking. No payment has been taken.", "Un entraîneur examinera vos réponses et vous contactera pour une évaluation téléphonique gratuite de 10 à 15 minutes. Il s’agit d’une demande, et non d’une admission ou d’une réservation. Aucun paiement n’a été effectué.")}</p>
    <Link href={`/${locale}/daycare`} className="mt-6 inline-block font-semibold text-primary underline underline-offset-4">{t("Back to daycare", "Retour à la garderie")}</Link>
  </div>

  return <form onSubmit={submit} noValidate className="ph-no-capture rounded-3xl border border-border bg-background p-6 sm:p-10" aria-busy={busy}>
    <div className="mb-7 flex items-center justify-between gap-4 text-sm text-muted-foreground"><p>{t("Step", "Étape")} {step + 1} {t("of", "sur")} 7</p><p>{t("Required fields marked *", "Champs obligatoires : *")}</p></div>
    <div className="mb-8 flex gap-2" aria-hidden>{DAYCARE_STEPS.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-border"}`} />)}</div>
    <h2 ref={heading} tabIndex={-1} className="mb-7 text-2xl font-semibold outline-none sm:text-3xl">{DAYCARE_STEPS[step][locale]}</h2>
    {step === 6 && <div className="mb-8 space-y-4">{DAYCARE_STEPS.slice(0, 6).map((section, index) => <details key={section.en} className="rounded-xl border border-border p-4">
      <summary className="cursor-pointer font-semibold">{section[locale]}</summary>
      <dl className="mt-4 space-y-3">{DAYCARE_FIELDS.filter(field => field.step === index && daycareFieldVisible(field, answers)).map(field => <div key={field.id}><dt className="text-sm text-muted-foreground">{field.label[locale]}</dt><dd className="break-words font-medium">{daycareAnswerLabel(field, answers[field.id], locale) || "—"}</dd></div>)}</dl>
      <button type="button" className="mt-4 min-h-11 font-semibold text-primary underline underline-offset-4" onClick={() => go(index)}>{t("Edit these answers", "Modifier ces réponses")}</button>
    </details>)}</div>}
    <div className="space-y-7">{fields.map(field => {
      const invalid = errors.includes(field.id)
      const id = `daycare-${field.id}`
      const label = `${field.label[locale]}${field.required ? " *" : ""}`
      return <div key={field.id}>
        {field.kind === "radio" || field.kind === "multi" ? <fieldset id={id} tabIndex={-1} aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined}>
          <legend className="mb-3 font-medium leading-relaxed">{label}</legend>
          <div className="grid gap-3 sm:grid-cols-2">{field.options?.map(option => <label key={option.value} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary">
            <input type={field.kind === "multi" ? "checkbox" : "radio"} name={field.id} value={option.value} checked={field.kind === "multi" ? Array.isArray(answers[field.id]) && (answers[field.id] as string[]).includes(option.value) : answers[field.id] === option.value} onChange={event => { if (field.kind === "multi") { const current = Array.isArray(answers[field.id]) ? answers[field.id] as string[] : []; setValue(field.id, event.target.checked ? [...current, option.value] : current.filter(value => value !== option.value)) } else setValue(field.id, option.value) }} className="size-4 shrink-0 accent-primary" />
            <span>{option[locale]}</span>
          </label>)}</div>
        </fieldset> : field.kind === "checkbox" ? <label className="flex cursor-pointer items-start gap-3 leading-relaxed"><input id={id} type="checkbox" required={field.required} checked={answers[field.id] === true} onChange={event => setValue(field.id, event.target.checked)} aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined} className="mt-1 size-5 shrink-0 accent-primary" /><span>{label}</span></label> : <>
          <label htmlFor={id} className="font-medium">{label}</label>
          {field.kind === "select" ? <select id={id} value={String(answers[field.id] || "")} onChange={event => setValue(field.id, event.target.value)} required={field.required} aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined} className={inputClass}><option value="">{t("Select an option", "Choisir une option")}</option>{field.options?.map(option => <option key={option.value} value={option.value}>{option[locale]}</option>)}</select> : <input id={id} type={field.kind} autoComplete={field.autoComplete || "off"} value={String(answers[field.id] || "")} onChange={event => setValue(field.id, event.target.value)} maxLength={field.maxLength || 254} required={field.required} aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined} className={inputClass} />}
        </>}
        {invalid && <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-700">{t("Please enter or select a valid answer.", "Veuillez saisir ou choisir une réponse valide.")}</p>}
      </div>
    })}</div>
    <label className="hidden" aria-hidden>Website<input value={trap} onChange={event => setTrap(event.target.value)} tabIndex={-1} autoComplete="off" /></label>
    {step === 6 && <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{t("We use these details to assess your dog’s needs and contact you about your application. This does not subscribe you to marketing emails.", "Ces renseignements servent à évaluer les besoins de votre chien et à vous contacter au sujet de votre demande. Ce formulaire ne vous inscrit pas aux courriels promotionnels.")} <Link className="underline underline-offset-4" href={`/${locale}/privacy`}>{t("Privacy policy", "Politique de confidentialité")}</Link></p>}
    {message && <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-red-800">{message}</p>}
    <div className="mt-8 flex flex-wrap justify-between gap-4 border-t border-border pt-6">
      <button type="button" disabled={step === 0 || busy} onClick={() => go(step - 1)} className="inline-flex min-h-12 items-center gap-2 rounded-full border px-5 py-3 font-medium disabled:opacity-40"><ArrowLeft className="size-4" aria-hidden />{t("Back", "Retour")}</button>
      <button disabled={busy} type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-60">{busy ? t("Sending…", "Envoi…") : step === 6 ? t("Send application", "Envoyer la demande") : t("Continue", "Continuer")}<ArrowRight className="size-4" aria-hidden /></button>
    </div>
  </form>
}
