import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Smartphone } from "lucide-react";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Crumbs, SearchBox } from "@/components/sell/SellParts";
import { SELL_BRANDS, normalizeSearch } from "@/data/sellPhoneCatalog";
import { canonicalUrl } from "@/lib/site";

const TITLE = "Sell Your Old Phone | USED MOBILES Hyderabad";
const DESC =
  "Sell your used smartphone to USED MOBILES. Choose your brand and model | Apple, Samsung, OnePlus, Xiaomi, Vivo, Oppo and more.";

export const Route = createFileRoute("/sell-phone/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: canonicalUrl("/sell-phone") }],
  }),
  component: SellHome,
});

function SellHome() {
  const [q, setQ] = useState("");
  const brands = useMemo(() => {
    const n = normalizeSearch(q);
    return n ? SELL_BRANDS.filter((b) => normalizeSearch(b.name).includes(n)) : SELL_BRANDS;
  }, [q]);
  return (
    <PublicLayout>
      <section className="catalog-page">
        <Crumbs items={[{ label: "Sell Phone" }, { label: "Brand" }]} />
        <p className="eyebrow mt-8">Phone catalog · {SELL_BRANDS.length} supported brands</p>
        <h1 className="section-title mt-2 max-w-2xl text-3xl md:text-4xl">
          Find your phone to get an estimate
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">
          Start with a brand, then choose the exact model and variant listed for your device.
        </p>
        <div className="mt-7">
          <SearchBox value={q} onChange={setQ} label="Search for brand" />
        </div>
        <div className="mt-9 flex items-center justify-between gap-3 border-b border-border pb-3">
          <h2 className="font-display text-lg font-bold">All brands</h2>
          <span className="text-sm text-muted-foreground">{brands.length} results</span>
        </div>
        {brands.length === 0 ? (
          <div className="empty-state mt-5">
            <Smartphone className="mx-auto size-7" aria-hidden="true" />
            <p className="mt-3 font-semibold text-foreground">No brand matches “{q}”</p>
            <p className="mt-1 text-sm">Try another brand name or clear your search.</p>
          </div>
        ) : (
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {brands.map((b) => (
              <li key={b.slug}>
                <Link
                  to="/sell-phone/$brand"
                  params={{ brand: b.slug }}
                  className="group flex min-h-28 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 transition hover:border-amber-dark hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-32 sm:px-5"
                >
                  {b.logo ? (
                    <img
                      src={b.logo}
                      alt={`${b.name} logo`}
                      className="h-14 w-auto max-w-[78%] object-contain sm:h-16"
                      decoding="async"
                      loading="lazy"
                    />
                  ) : (
                    <span className="font-display text-base font-bold leading-snug sm:text-lg">
                      {b.name}
                    </span>
                  )}
                  <ArrowRight
                    className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PublicLayout>
  );
}
