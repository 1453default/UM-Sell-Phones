import { whatsappLink } from "./shop";
import { answerSummary, type Answers } from "./valuation";
import { formatINR } from "../data/sellPhonePricing";
export function normalizeIndianMobile(value: string): string | null {
  let digits = value.replace(/[\s()-]/g, "");
  if (digits.startsWith("+91")) digits = digits.slice(3);
  else if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}
export function leadLink(input: {
  name: string;
  mobile: string;
  model: string;
  brand: string;
  variant: string;
  base: number;
  estimate: number;
  answers: Answers;
}) {
  return whatsappLink(
    [
      "Hi USED MOBILES, I'd like to sell my phone.",
      ...(input.name.trim() ? [`Name: ${input.name.trim()}`] : []),
      `Mobile: ${input.mobile}`,
      `Brand: ${input.brand}`,
      `Model: ${input.model}`,
      `Variant: ${input.variant}`,
      `Base value: ${formatINR(input.base)}`,
      `Estimated offer: ${formatINR(input.estimate)} (subject to inspection)`,
      ...answerSummary(input.answers),
    ].join("\n"),
  );
}
