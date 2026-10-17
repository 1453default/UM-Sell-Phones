import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Crumbs, PhoneImg, SearchBox } from "@/components/sell/SellParts";
import { getSellBrand, normalizeSearch } from "@/data/sellPhoneCatalog";

export const Route = createFileRoute("/sell-phone/$brand/")({
  validateSearch: (s: Record<string, unknown>): { series?: string } =>
    typeof s.series === "string" && s.series ? { series: s.series } : {},
  loader: ({ params }) => {
    const brand = getSellBrand(params.brand);
    if (!brand) throw notFound();
    return { name: brand.name, slug: brand.slug };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Brand not found" }, { name: "robots", content: "noindex" }] };
    const t = `Sell Old ${loaderData.name} Phone — USED MOBILES`;
    const d = `Choose your ${loaderData.name} model to sell your used phone to USED MOBILES, Hyderabad.`;
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Brand not found</h1>
        <Link to="/sell-phone" className="mt-4 inline-block text-primary underline">Back to all brands</Link>
      </div>
    </PublicLayout>
  ),
  component: BrandPage,
});

function BrandPage() {
  const { brand: slug } = Route.useParams();
  const { series } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const brand = getSellBrand(slug)!;
  const [q, setQ] = useState("");
  const active = series && brand.series.includes(series) ? series : "";

  const models = useMemo(() => {
    const n = normalizeSearch(q);
    return brand.models.filter(
      (m) => (!active || m.series === active) && (!n || normalizeSearch(m.name).includes(n)),
    );
  }, [brand, active, q]);

  const showSeries = brand.series.length > 1;
  const chip = (label: string, value: string) => (
    <button
      key={label}
      type="button"
      aria-pressed={active === value}
      onClick={() => navigate({ search: value ? { series: value } : {}, replace: true, resetScroll: false })}
      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"
      }`}
    >
      {label}
    </button>
  );

  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-4 pt-6 pb-16 md:pt-10">
        <Crumbs items={[{ label: "Sell Phone", to: "/sell-phone" }, { label: brand.name }]} />
        <div className="mt-4 flex items-center gap-4">
          {brand.logo && (
            <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl border border-border bg-card p-2">
              <img src={brand.logo} alt={`${brand.name} logo`} className="max-h-full max-w-full object-contain" />
            </div>
          )}
          <h1 className="min-w-0 font-display text-2xl md:text-4xl font-extrabold tracking-tight">
            Sell your old {brand.name} phone
          </h1>
        </div>
        <div className="mt-6">
          <SearchBox value={q} onChange={setQ} label="Search for model" />
        </div>

        {showSeries && (
          <>
            <h2 className="mt-8 font-display text-lg font-bold">Choose by series</h2>
            <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-wrap md:px-0">
              {chip("All", "")}
              {brand.series.map((s) => chip(s, s))}
            </div>
          </>
        )}

        <h2 className="mt-8 font-display text-lg font-bold">
          Choose model <span className="text-sm font-normal text-muted-foreground">({models.length})</span>
        </h2>
        {models.length === 0 ? (
          <p className="mt-6 text-muted-foreground">No models match your search.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {models.map((m, i) => (
              <li key={m.slug} className="min-w-0">
                <Link
                  to="/sell-phone/$brand/$model"
                  params={{ brand: brand.slug, model: m.slug }}
                  className="group flex h-full flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 text-center transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <PhoneImg src={m.images[0]} alt={m.name} eager={i < 10} className="h-28 w-28 md:h-32 md:w-32 transition group-hover:scale-105" />
                  <span className="text-sm font-semibold leading-snug">{m.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PublicLayout>
  );
}
