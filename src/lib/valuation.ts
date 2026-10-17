export type Category = "screen" | "display" | "body" | "panel";
export type Option = { id: string; label: string; percent: number; image?: string };
export type Question = { id: string; label: string; category: Category; bucket: "screen" | "body"; options: Option[] };
const option = (id: string, label: string, percent: number, image?: string): Option => ({ id, label, percent, image });
export const CATEGORIES: { id: Category; label: string; image: string }[] = [
  { id: "screen", label: "Broken/scratch on device screen", image: "broken-scratched-device-screen.png" },
  { id: "display", label: "Dead Spot/Visible line and Discoloration on screen", image: "dead-spot-visible-line-discoloration-screen.png" },
  { id: "body", label: "Scratch/Dent on device body", image: "scratch-dent-device-body.png" },
  { id: "panel", label: "Device panel missing/broken", image: "device-panel-missing-broken.png" },
];
export const BASIC = [
  { id: "calls", label: "Are you able to make and receive calls?", percent: 25 },
  { id: "touch", label: "Is your device's touch screen working properly?", percent: 25 },
  { id: "original", label: "Is your phone's screen original?", percent: 15 },
] as const;
export const QUESTIONS: Question[] = [
  { id: "screenPhysical", label: "Screen physical condition", category: "screen", bucket: "screen", options: [option("cracked", "Screen cracked / glass broken", 20), option("chipped", "Chipped/cracked outside display area", 12), option("many", "More than two scratches", 7), option("minor", "One or two scratches", 3), option("none", "No scratches or cracks", 0)] },
  { id: "spots", label: "Display spots", category: "display", bucket: "screen", options: [option("large", "Large/heavy visible spots", 18), option("many", "Three or more minor spots", 12), option("minor", "One or two minor spots", 6), option("none", "No spots", 0)] },
  { id: "lines", label: "Display lines", category: "display", bucket: "screen", options: [option("visible", "Visible display lines", 15), option("faded", "Display faded along edges", 10), option("none", "No visible lines", 0)] },
  { id: "discoloration", label: "Display discoloration", category: "display", bucket: "screen", options: [option("major", "Major discoloration", 15), option("minor", "Minor discoloration", 7), option("none", "No discoloration", 0)] },
  { id: "bodyScratches", label: "Scratches on device body", category: "body", bucket: "body", options: [option("many", "More than two scratches", 6, "more-than-2-scratches.jpg"), option("minor", "One or two scratches", 3, "1-2-scratches.jpg"), option("none", "No scratches", 0, "no-scratches.jpg")] },
  { id: "dents", label: "Dents on device body", category: "body", bucket: "body", options: [option("major", "Major dents or more than two dents", 8, "major-dents-or-more-than-2.png"), option("minor", "One or two minor dents", 4, "1-2-minor-dents.png"), option("none", "No dents", 0, "no-dents.png")] },
  { id: "panel", label: "Side or back panel", category: "panel", bucket: "body", options: [option("broken", "Cracked/broken side or back panel", 15), option("missing", "Missing side or back panel", 20), option("none", "No side/back panel defect", 0)] },
  { id: "shape", label: "Panel shape and screen fit", category: "panel", bucket: "body", options: [option("bent", "Bent/curved panel", 20), option("loose", "Loose screen", 15), option("none", "Phone not bent", 0)] },
];
export const FAULTS: Option[] = [
  option("frontCamera", "Front camera not working", 10, "front-camera-not-working.jpg"), option("backCamera", "Back camera not working", 12, "back-camera-not-working.jpg"), option("volume", "Volume button not working", 4, "volume-button-not-working.jpg"), option("fingerTouch", "Finger touch not working", 12, "finger-touch-not-working.jpg"), option("wifi", "Wi-Fi not working", 5, "wifi-not-working.jpg"), option("speaker", "Speaker faulty", 7, "speaker-faulty.jpg"), option("silent", "Silent button not working", 3, "silent-button-not-working.png"), option("face", "Face sensor not working", 5, "face-sensor-not-working.jpg"), option("power", "Power button not working", 5, "power-button-not-working.jpg"), option("charging", "Charging port not working", 12, "charging-port-not-working.jpg"), option("receiver", "Audio receiver not working", 7, "audio-receiver-not-working.png"), option("cameraGlass", "Camera glass broken", 5, "camera-glass-broken.png"), option("microphone", "Microphone not working", 5, "microphone-not-working.png"), option("bluetooth", "Bluetooth not working", 4, "bluetooth-not-working.png"), option("vibrator", "Vibrator not working", 3, "vibrator-not-working.png"), option("proximity", "Proximity sensor not working", 5, "proximity-sensor-not-working.png"), option("batteryLow", "Battery health below 80%", 10, "battery-service-health-below-80.jpg"), option("batteryMid", "Battery health between 80% and 85%", 5, "battery-health-80-85.jpg"),
];
export const CAPS = { basic: 45, screen: 35, body: 30, functional: 40, accessories: 2, total: 70 };
export type Answers = { basic: Partial<Record<(typeof BASIC)[number]["id"], boolean>>; categories: Category[]; physical: Record<string, string>; faults: string[]; box: boolean | null };
export const emptyAnswers = (): Answers => ({ basic: {}, categories: [], physical: {}, faults: [], box: null });
export function activeQuestions(a: Answers) { return QUESTIONS.filter(q => a.categories.includes(q.category)); }
export function assessmentComplete(a: Answers) { return BASIC.every(q => typeof a.basic[q.id] === "boolean") && activeQuestions(a).every(q => q.options.some(o => o.id === a.physical[q.id])) && a.box !== null; }
export function toggleFault(faults: string[], id: string) {
  if (faults.includes(id)) return faults.filter(x => x !== id);
  const other = id === "batteryLow" ? "batteryMid" : id === "batteryMid" ? "batteryLow" : "";
  return [...faults.filter(x => x !== other), id];
}
export function calculateValuation(base: number | null | undefined, a: Answers) {
  if (typeof base !== "number" || !Number.isFinite(base) || base <= 0) return null;
  const buckets = { basic: 0, screen: 0, body: 0, functional: 0, accessories: a.box === false ? 2 : 0 };
  for (const q of BASIC) if (a.basic[q.id] === false) buckets.basic += q.percent;
  for (const q of activeQuestions(a)) buckets[q.bucket] += q.options.find(o => o.id === a.physical[q.id])?.percent ?? 0;
  for (const f of FAULTS) {
    if (!a.faults.includes(f.id)) continue;
    if (f.id === "fingerTouch" && a.basic.touch === false) continue;
    if (f.id === "batteryMid" && a.faults.includes("batteryLow")) continue;
    buckets.functional += f.percent;
  }
  for (const key of Object.keys(buckets) as (keyof typeof buckets)[]) buckets[key] = Math.min(buckets[key], CAPS[key]);
  const percent = Math.min(Object.values(buckets).reduce((s, n) => s + n, 0), CAPS.total);
  const deduction = base * percent / 100;
  const estimate = base - deduction;
  return { base, buckets, percent, deduction, estimate, displayedEstimate: Math.round(estimate / 100) * 100 };
}
export function answerSummary(a: Answers): string[] {
  return [
    ...BASIC.map(q => `${q.label} ${a.basic[q.id] === undefined ? "Not answered" : a.basic[q.id] ? "Yes" : "No"}`),
    ...activeQuestions(a).map(q => `${q.label}: ${q.options.find(o => o.id === a.physical[q.id])?.label ?? "Not answered"}`),
    `Functional problems: ${FAULTS.filter(f => a.faults.includes(f.id)).map(f => f.label).join(", ") || "None"}`,
    `Original box with same IMEI: ${a.box === null ? "Not answered" : a.box ? "Yes" : "No"}`,
  ];
}