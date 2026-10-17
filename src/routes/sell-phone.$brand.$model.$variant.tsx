import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Crumbs, PhoneImg } from "@/components/sell/SellParts";
import { getSellBrand, getSellModel } from "@/data/sellPhoneCatalog";
import { formatINR, getVariant } from "@/data/sellPhonePricing";
import { whatsappLink } from "@/lib/shop";

export const Route = createFileRoute("/sell-phone/$brand/$model/$variant")({
  loader: ({ params }) => {
    const brand = getSellBrand(params.brand);
    const model = getSellModel(params.brand, params.model);
    if (!brand || !model) throw notFound();
    const v = getVariant(brand.name, model.name, params.variant);
    if (!v) throw notFound();
    return { name: model.name, label: v.label };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Variant not found" }, { name: "robots", content: "noindex" }] };
    const t = `Sell ${loaderData.name} (${loaderData.label}) — USED MOBILES`;
    const d = `See the maximum value you can get for your ${loaderData.name} ${loaderData.label} at USED MOBILES, Hyderabad.`;
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Price unavailable</h1>
        <p className="mt-2 text-muted-foreground">We couldn't find a price for this variant.</p>
        <Link to="/sell-phone" className="mt-4 inline-block text-primary underline">Back to all brands</Link>
      </div>
    </PublicLayout>
  ),
  component: PricePage,
});

function PricePage() {
  const { brand: bslug, model: mslug, variant: vid } = Route.useParams();
  const brand = getSellBrand(bslug)!;
  const model = getSellModel(bslug, mslug)!;
  const v = getVariant(brand.name, model.name, vid)!;
  // "Check Exact Value": hands brand, model, variant and the up-to price to the shop for a condition-based quote.
  const exactLink = whatsappLink(
    `Hi, I want to sell my ${model.name} (${v.label}). Shown value up to ${formatINR(v.uptoPrice)}. Please check the exact value.`,
  );

  return (
    <PublicLayout>
      <section className="mx-auto max-w-5xl px-4 pt-6 pb-16 md:pt-10">
        <Crumbs
          items={[
            { label: "Sell Phone", to: "/sell-phone" },
            { label: brand.name, to: "/sell-phone/$brand", params: { brand: brand.slug } },
            { label: model.name, to: "/sell-phone/$brand/$model", params: { brand: brand.slug, model: model.slug } },
            { label: v.label },
            { label: "Price" },
          ]}
        />
        <h1 className="mt-4 font-display text-2xl md:text-3xl font-extrabold tracking-tight">Sell &amp; get value up to</h1>
        <div className="mt-6 grid overflow-hidden rounded-3xl border border-border bg-card md:grid-cols-[minmax(0,1fr)_300px]">
          <div className="grid gap-6 p-5 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center md:p-10">
            <div className="flex h-44 items-center justify-center">
              <PhoneImg src={model.images[0]} alt={model.name} eager className="h-full w-full" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold">
                {model.name} ({v.label})
              </h2>
              <div className="mt-4 text-sm font-medium text-muted-foreground">Get up to</div>
              <div className="font-num text-4xl font-extrabold tracking-tight">{formatINR(v.uptoPrice)}</div>
              <a
                href={exactLink}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-8 font-semibold text-primary-foreground hover:opacity-90 sm:w-auto"
              >
                Check Exact Value
              </a>
              <Link
                to="/sell-phone/$brand/$model"
                params={{ brand: brand.slug, model: model.slug }}
                className="mt-4 block text-sm text-primary underline"
              >
                Change variant
              </Link>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-3 border-t border-border p-6 text-center text-sm text-muted-foreground md:border-l md:border-t-0">
            <p>
              This price is not final. It is the approximate maximum value you can get for this device. The final price
              will be quoted after we check your phone's condition.
            </p>
            <a href={exactLink} target="_blank" rel="noreferrer" className="font-medium text-primary underline">
              Check Exact Value
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
