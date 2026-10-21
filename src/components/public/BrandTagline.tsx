import { cn } from "@/lib/utils";

export function BrandTagline({ className }: { className?: string }) {
  const textCls = "text-foreground/75";
  const ruleCls = "bg-primary/70";

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center gap-2 font-display text-[10px] font-semibold uppercase leading-none",
        textCls,
        className,
      )}
      aria-label="Used phone buyback in Hyderabad"
    >
      <span>Used phone buyback</span>
      <span aria-hidden="true" className={cn("h-px w-2.5 shrink-0", ruleCls)} />
      <span>Hyderabad</span>
    </span>
  );
}
