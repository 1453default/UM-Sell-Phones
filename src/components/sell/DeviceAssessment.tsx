import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, MessageCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BASIC, CATEGORIES, FAULTS, activeQuestions, answerSummary, assessmentComplete, calculateValuation, emptyAnswers, toggleFault, type Answers } from "@/lib/valuation";
import { leadLink, normalizeIndianMobile } from "@/lib/lead";
import { formatINR, type SellVariant } from "@/data/sellPhonePricing";
import { type SellBrand, type SellModel } from "@/data/sellPhoneCatalog";
import { PhoneImg } from "./SellParts";

const STAGES = ["About your device", "Screen & body", "Physical condition", "Functional problems", "Accessories", "Your estimated offer"];
export function DeviceAssessment({ brand, model, variant }: { brand: SellBrand; model: SellModel; variant: SellVariant }) {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [handoff, setHandoff] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const result = calculateValuation(variant.uptoPrice, answers);
  const physical = activeQuestions(answers);
  function go(next: number) {
    setError(""); setStep(next); setHandoff(null);
    requestAnimationFrame(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: "start", behavior: "instant" }); });
  }
  function continueStep() {
    if (step === 0 && BASIC.some(q => answers.basic[q.id] === undefined)) { setError("Please answer all three questions."); return; }
    if (step === 2 && physical.some(q => !q.options.some(o => o.id === answers.physical[q.id]))) { setError("Please select an answer for each condition question."); return; }
    if (step === 4 && answers.box === null) { setError("Please tell us whether you have the original box."); return; }
    go(step === 1 && physical.length === 0 ? 3 : step + 1);
  }
  function previous() { go(step === 3 && physical.length === 0 ? 1 : step - 1); }
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const phone = normalizeIndianMobile(mobile);
    if (!phone) { setError("Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9."); return; }
    if (!result || !assessmentComplete(answers)) { setError("Complete the device assessment before continuing."); return; }
    const url = leadLink({ name, mobile: phone, model: model.name, brand: brand.name, variant: variant.label, base: result.base, estimate: result.displayedEstimate, answers });
    setError(""); setHandoff(url);
    window.open(url, "_blank", "noopener,noreferrer");
  }
  const selectClass = (selected: boolean) => `selection-option ${selected ? "is-selected" : ""}`;
  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-14">
      <div className="min-w-0">
        {step >= 0 && <div className="mb-7">
          <div className="mb-2 flex justify-between text-xs font-semibold text-muted-foreground"><span>DEVICE ASSESSMENT</span><span>Step {step + 1} of 6</span></div>
          <progress aria-label="Assessment progress" max={6} value={step + 1} className="assessment-progress" />
        </div>}
        <h1 ref={heading} tabIndex={-1} className="scroll-mt-28 font-display text-3xl font-bold outline-none">{step < 0 ? "Your phone’s base value" : STAGES[step]}</h1>
        {step < 0 && <div className="py-8">
          <p className="text-sm text-muted-foreground">Get up to</p><p className="mt-2 font-num text-4xl font-bold">{formatINR(variant.uptoPrice)}</p>
          <p className="mt-5 max-w-lg text-muted-foreground leading-relaxed">Tell us about your phone’s condition for an estimated offer. The final price is confirmed after inspection at our Toli Chowki store.</p>
          <Button size="lg" className="mt-8 h-12" onClick={() => go(0)}>About Your Device <ArrowRight /></Button>
        </div>}
        {step === 0 && <div className="divide-y divide-border">
          {BASIC.map(q => <fieldset key={q.id} className="py-6">
            <legend className="float-left w-full font-semibold mb-3">{q.label}</legend>
            {q.id === "original" && <p className="clear-both mb-3 text-sm text-muted-foreground">Yes if unchanged or replaced at an authorized service center. No if replaced at a local shop.</p>}
            <div className="clear-both flex gap-3">{[true, false].map(value => <label key={String(value)} className={`${selectClass(answers.basic[q.id] === value)} min-w-24`}>
              <input type="radio" name={q.id} checked={answers.basic[q.id] === value} onChange={() => setAnswers(a => ({ ...a, basic: { ...a.basic, [q.id]: value } }))} />{value ? "Yes" : "No"}
            </label>)}</div>
          </fieldset>)}
        </div>}
        {step === 1 && <div className="mt-6">
          <div className="grid gap-3 sm:grid-cols-2">{CATEGORIES.map(c => <label key={c.id} className={selectClass(answers.categories.includes(c.id))}>
            <input type="checkbox" checked={answers.categories.includes(c.id)} onChange={() => setAnswers(a => ({ ...a, categories: a.categories.includes(c.id) ? a.categories.filter(x => x !== c.id) : [...a.categories, c.id] }))} />
            <img src={`/about-device-questions/P2/${c.image}`} alt="" className="h-14 w-14 shrink-0 object-contain" /><span>{c.label}</span>
          </label>)}</div>
          <Button variant="outline" className="mt-4" aria-pressed={answers.categories.length === 0} onClick={() => setAnswers(a => ({ ...a, categories: [] }))}><Check /> No screen or body defects</Button>
        </div>}
        {step === 2 && <div className="divide-y divide-border">{physical.map(q => <fieldset key={q.id} className="py-6">
          <legend className="float-left w-full mb-3 font-semibold">{q.label}</legend>
          <div className="clear-both grid gap-3 sm:grid-cols-2">{q.options.map(o => <label key={o.id} className={selectClass(answers.physical[q.id] === o.id)}>
            <input type="radio" name={q.id} checked={answers.physical[q.id] === o.id} onChange={() => setAnswers(a => ({ ...a, physical: { ...a.physical, [q.id]: o.id } }))} />
            {o.image && <img src={`/about-device-questions/P3/${o.image}`} alt="" className="h-14 w-14 shrink-0 object-contain" />}<span>{o.label}</span>
          </label>)}</div>
        </fieldset>)}</div>}
        {step === 3 && <div className="mt-6">
          <div className="grid gap-3 sm:grid-cols-2">{FAULTS.map(f => <label key={f.id} className={selectClass(answers.faults.includes(f.id))}>
            <input type="checkbox" checked={answers.faults.includes(f.id)} onChange={() => setAnswers(a => ({ ...a, faults: toggleFault(a.faults, f.id) }))} />
            <img src={`/about-device-questions/P4/${f.image}`} alt="" loading="lazy" className="h-10 w-10 shrink-0 object-contain" /><span>{f.label}</span>
          </label>)}</div>
          <Button variant="outline" className="mt-4" aria-pressed={answers.faults.length === 0} onClick={() => setAnswers(a => ({ ...a, faults: [] }))}><Check /> No functional problems</Button>
        </div>}
        {step === 4 && <fieldset className="mt-6">
          <legend className="font-semibold">Do you have the following?</legend>
          <div className="my-5 flex items-center gap-4"><img src="/about-device-questions/P5/original-box-same-imei.jpg" alt="Original phone box" className="h-24 w-24 object-contain" /><span>Original Box with same IMEI</span></div>
          <div className="flex gap-3">{[true, false].map(value => <label key={String(value)} className={selectClass(answers.box === value)}>
            <input name="box" type="radio" checked={answers.box === value} onChange={() => setAnswers(a => ({ ...a, box: value }))} />{value ? "Yes" : "No"}
          </label>)}</div>
        </fieldset>}
        {step === 5 && result && <div className="mt-6">
          <div className="border-y border-border py-6">
            <dl className="space-y-3"><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Base value</dt><dd className="font-num">{formatINR(result.base)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Condition adjustment</dt><dd className="font-num">−{formatINR(result.deduction)}</dd></div></dl>
            <div className="mt-6 text-sm text-muted-foreground">Estimated offer</div><div className="mt-1 font-num text-4xl font-bold">{formatINR(result.displayedEstimate)}</div>
            <p className="mt-3 text-sm text-muted-foreground">Rounded to the nearest ₹100. Subject to inspection and confirmation.</p>
          </div>
          <details className="border-b border-border py-5"><summary className="cursor-pointer font-semibold">Review your answers</summary><ul className="mt-4 space-y-3 text-sm text-muted-foreground">{answerSummary(answers).map(s => <li key={s}>{s}</li>)}</ul></details>
          <form onSubmit={submit} noValidate className="mt-7 space-y-5">
            <h2 className="text-xl font-semibold">Continue with USED MOBILES</h2>
            <div><label htmlFor="lead-name" className="mb-2 block text-sm font-medium">Your name <span className="text-muted-foreground">(optional)</span></label><input id="lead-name" value={name} maxLength={80} autoComplete="name" onChange={e => setName(e.target.value)} className="field" /></div>
            <div><label htmlFor="lead-mobile" className="mb-2 block text-sm font-medium">Mobile number</label><input id="lead-mobile" type="tel" inputMode="tel" autoComplete="tel" value={mobile} maxLength={20} required aria-invalid={!!error} aria-describedby={error ? "assessment-error" : undefined} onChange={e => setMobile(e.target.value)} placeholder="10-digit Indian mobile number" className="field" /></div>
            <Button type="submit" size="lg" className="h-12 w-full sm:w-auto"><MessageCircle /> Continue on WhatsApp</Button>
            <p className="text-xs leading-relaxed text-muted-foreground">Your details will be included in a WhatsApp message to the store. Send it there to share your enquiry; nothing is saved on this website.</p>
          </form>
          {handoff && <p role="status" className="mt-5 text-sm">Your WhatsApp message is ready. <a href={handoff} target="_blank" rel="noopener noreferrer" className="underline font-semibold">Open WhatsApp</a> if it did not open, then send the message.</p>}
        </div>}
        {error && <p id="assessment-error" role="alert" className="mt-5 text-sm text-destructive">{error}</p>}
        {step >= 0 && <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
          <Button variant="outline" onClick={previous}><ArrowLeft /> Previous</Button>
          {step < 5 ? <Button onClick={continueStep}>Continue <ArrowRight /></Button> : <Button variant="ghost" onClick={() => { setAnswers(emptyAnswers()); go(0); }}><RotateCcw /> Start again</Button>}
        </div>}
      </div>
      <aside className="order-first border-b border-border pb-6 lg:order-last lg:border-b-0 lg:border-l lg:pl-8">
        <div className="flex items-center gap-4 lg:sticky lg:top-28 lg:flex-col lg:items-start">
          <PhoneImg src={model.images[0]} alt={model.name} eager className="h-20 w-20 shrink-0 lg:h-40 lg:w-full" />
          <div><p className="text-xs font-semibold uppercase text-muted-foreground">Your device</p><h2 className="mt-1 text-lg font-semibold">{model.name}</h2><p className="mt-1 text-sm text-muted-foreground">{variant.label}</p><p className="mt-3 text-sm">Base value <span className="font-num font-semibold">{formatINR(variant.uptoPrice)}</span></p></div>
        </div>
      </aside>
    </div>
  );
}