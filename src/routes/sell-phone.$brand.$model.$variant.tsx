import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Crumbs } from "@/components/sell/SellParts";
import { getSellBrand, getSellModel } from "@/data/sellPhoneCatalog";
import { getVariant } from "@/data/sellPhonePricing";
import { DeviceAssessment } from "@/components/sell/DeviceAssessment";
import { canonicalUrl } from "@/lib/site";

export const Route = createFileRoute("/sell-phone/$brand/$model/$variant")({
  loader: ({ params }) => {
    const brand = getSellBrand(params.brand);
    const model = getSellModel(params.brand, params.model);
    if (!brand || !model) throw notFound();
    const v = getVariant(brand.name, model.name, params.variant);
    if (!v) throw notFound();
    return { name: model.name, label: v.label };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData)
      return { meta: [{ title: "Variant not found" }, { name: "robots", content: "noindex" }] };
    const t = `Sell ${loaderData.name} (${loaderData.label}) | USED MOBILES`;
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
      links: [{ rel: "canonical", href: canonicalUrl(`/sell-phone/${params.brand}/${params.model}/${params.variant}`) }],
    };
  },
  notFoundComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Price unavailable</h1>
        <p className="mt-2 text-muted-foreground">We couldn't find a price for this variant.</p>
        <Link to="/sell-phone" className="mt-4 inline-block text-primary underline">
          Back to all brands
        </Link>
      </div>
    </PublicLayout>
  ),
  component: PricePage,
});

function PricePage() {
  const { brand: bslug, model: mslug, variant: vid } = Route.useParams();
  const brand = getSellBrand(bslug);
  const model = getSellModel(bslug, mslug);
  if (!brand || !model) return null;
  const v = getVariant(brand.name, model.name, vid);
  if (!v) return null;
  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <Crumbs
          items={[
            { label: "Sell Phone", to: "/sell-phone" },
            { label: brand.name, to: "/sell-phone/$brand", params: { brand: brand.slug } },
            {
              label: model.name,
              to: "/sell-phone/$brand/$model",
              params: { brand: brand.slug, model: model.slug },
            },
            { label: v.label },
          ]}
        />
        <DeviceAssessment
          key={`${brand.slug}/${model.slug}/${v.id}`}
          brand={brand}
          model={model}
          variant={v}
        />
        <Link
          to="/sell-phone/$brand/$model"
          params={{ brand: brand.slug, model: model.slug }}
          className="mt-8 inline-block text-sm font-semibold underline"
        >
          Change variant
        </Link>
      </section>
    </PublicLayout>
  );
}
