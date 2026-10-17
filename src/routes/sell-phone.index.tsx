import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { HandCoins } from "lucide-react";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Crumbs, SearchBox } from "@/components/sell/SellParts";
import { SELL_BRANDS, normalizeSearch } from "@/data/sellPhoneCatalog";

const TITLE = "Sell Your Old Phone — USED MOBILES Hyderabad";
const DESC = "Sell your used smartphone to USED MOBILES. Choose your brand and model — Apple, Samsung, OnePlus, Xiaomi, Vivo, Oppo and more.";

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
      <section className="mx-auto max-w-6xl px-4 pt-6 pb-16 md:pt-10">
        <Crumbs items={[{ label: "Sell Phone" }, { label: "Brand" }]} />
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <HandCoins className="h-3.5 w-3.5" /> Sell your phone
        </div>
        <h1 className="mt-3 font-display text-3xl md:text-5xl font-extrabold tracking-tight">Sell your old mobile phone</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Pick your phone's brand and model to start. We buy used phones across {SELL_BRANDS.length} brands.
        </p>
        <div className="mt-6">
          <SearchBox value={q} onChange={setQ} label="Search for brand" />
        </div>
        <h2 className="mt-10 font-display text-xl md:text-2xl font-bold">Choose brand</h2>
        {brands.length === 0 ? (
          <p className="mt-6 text-muted-foreground">No brand matches "{q}".</p>
        ) : (
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {brands.map((b) => (
              <li key={b.slug}>
                <Link
                  to="/sell-phone/$brand"
                  params={{ brand: b.slug }}
                  className="group flex h-24 md:h-28 flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-card px-4 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {b.logo ? (
                    <img src={b.logo} alt={`${b.name} logo`} className="h-16 md:h-18 w-auto max-w-[75%] object-contain" decoding="async" />
                  ) : (
                    <span className="font-display text-lg font-bold">{b.name}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PublicLayout>
  );
}
