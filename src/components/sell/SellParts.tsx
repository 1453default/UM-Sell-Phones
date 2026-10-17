import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Search, Smartphone } from "lucide-react";

export function Crumbs({ items }: { items: { label: string; to?: string; params?: Record<string, string> }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          {it.to ? (
            <Link to={it.to as never} params={it.params as never} className="hover:text-primary">
              {it.label}
            </Link>
          ) : (
            <span className="font-semibold text-foreground">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function SearchBox(props: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <label className="relative block w-full max-w-xl">
      <span className="sr-only">{props.label}</span>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
      <input
        type="search"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.label}
        className="h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

export function PhoneImg({ src, alt, className, eager }: { src?: string; alt: string; className?: string; eager?: boolean }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken)
    return (
      <div className={`flex items-center justify-center text-muted-foreground ${className ?? ""}`} aria-label={alt}>
        <Smartphone className="h-10 w-10" />
      </div>
    );
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setBroken(true)}
      className={`object-contain ${className ?? ""}`}
    />
  );
}
