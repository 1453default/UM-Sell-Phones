import { cn } from "@/lib/utils";

type Tone = "default" | "print";

/**
 * Tagline for Sell Phone: SELL — BEST VALUE — INSTANT CASH
 * Editorial styling: uppercase display, wide tracking, hairline amber rules
 * as separators. Uses existing theme tokens only (primary/amber + foreground).
 */
export function BrandTagline({
  className,
  tone = "default",
}: {
  className?: string;
  tone?: Tone;
}) {
  const textCls = tone === "print" ? "text-neutral-700" : "text-foreground/75";
  const ruleCls = tone === "print" ? "bg-amber-500/80" : "bg-primary/70";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-display text-[10px] font-semibold uppercase leading-none tracking-[0.32em]",
        textCls,
        className,
      )}
      aria-label="Sell Phone · Best Value · Instant Cash"
    >
      <span>Sell</span>
      <span aria-hidden="true" className={cn("h-px w-2.5 shrink-0", ruleCls)} />
      <span>Best Value</span>
      <span aria-hidden="true" className={cn("h-px w-2.5 shrink-0", ruleCls)} />
      <span>Instant Cash</span>
    </span>
  );
}
