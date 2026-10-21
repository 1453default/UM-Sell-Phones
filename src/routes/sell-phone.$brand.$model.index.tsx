import { useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Crumbs, PhoneImg } from "@/components/sell/SellParts";
import { getSellBrand, getSellModel } from "@/data/sellPhoneCatalog";
import { Button } from "@/components/ui/button";
import { SHOP_PHONE } from "@/lib/shop";
import { formatINR, getModelVariants } from "@/data/sellPhonePricing";
import { canonicalUrl } from "@/lib/site";

export const Route = createFileRoute("/sell-phone/$brand/$model/")({
  loader: ({ params }) => {
    const m = getSellModel(params.brand, params.model);
    if (!m) throw notFound();
    return { name: m.name, model: m, brand: getSellBrand(params.brand) };
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return { meta: [{ title: "Model not found" }, { name: "robots", content: "noindex" }] };
    const t = `Sell ${loaderData.name} | Choose Variant | USED MOBILES`;
    const d = `Choose your ${loaderData.name} storage variant to see how much you can get when you sell it to USED MOBILES.`;
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary" },
      ],
      links: [
        {
          rel: "canonical",
          href: canonicalUrl(`/sell-phone/${loaderData.brand?.slug}/${loaderData.model.slug}`),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Model not found</h1>
        <Link to="/sell-phone" className="mt-4 inline-block text-primary underline">
          Back to all brands
        </Link>
      </div>
    </PublicLayout>
  ),
  component: VariantPage,
});

function VariantPage() {
  const { brand: bslug, model: mslug } = Route.useParams();
  const { brand, model } = Route.useLoaderData();
  if (!brand) return null;
  return <VariantSelector key={`${bslug}/${mslug}`} brand={brand} model={model} />;
}

function VariantSelector({
  brand,
  model,
}: {
  brand: NonNullable<ReturnType<typeof getSellBrand>>;
  model: NonNullable<ReturnType<typeof getSellModel>>;
}) {
  const variants = getModelVariants(brand.name, model.name);
  const [selected, setSelected] = useState<string | null>(
    variants.length === 1 ? (variants[0]?.id ?? null) : null,
  );
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <section className="catalog-page max-w-5xl">
        <Crumbs
          items={[
            { label: "Sell Phone", to: "/sell-phone" },
            { label: brand.name, to: "/sell-phone/$brand", params: { brand: brand.slug } },
            { label: model.name },
            { label: "Variant" },
          ]}
        />
        <p className="eyebrow mt-8">Exact model selected</p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight md:text-3xl">
          Choose your variant
        </h1>
        <div className="variant-panel mt-6 grid gap-5 p-4 sm:p-6 md:grid-cols-[220px_minmax(0,1fr)] md:items-center md:p-8">
          <div className="flex h-44 items-center justify-center rounded-lg bg-muted/45 sm:h-52 md:h-60">
            <PhoneImg src={model.images[0]} alt={model.name} eager className="h-full w-full" />
          </div>
          <div className="min-w-0">
            <p className="eyebrow">{brand.name}</p>
            <h2 className="mt-1 break-words text-xl font-bold tracking-tight">{model.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Select the storage variant printed in your phone settings or on its original box.
            </p>
            {variants.length === 0 ? (
              <p className="mt-5 rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
                A price is not listed for this model yet. We will not substitute another phone’s
                price.
                <a
                  className="mt-3 block font-semibold underline text-foreground"
                  href={`tel:${SHOP_PHONE.replace(/\s/g, "")}`}
                >
                  Call the store for an offer
                </a>
              </p>
            ) : (
              <>
                <div
                  role="group"
                  aria-label="Variant"
                  className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2"
                >
                  {variants.map((v) => {
                    const on = selected === v.id;
                    return (
                      <Button
                        variant="outline"
                        key={v.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setSelected(v.id)}
                        aria-label={`${v.label}, maximum estimate ${formatINR(v.uptoPrice)}`}
                        className={`variant-choice h-auto min-h-16 whitespace-normal rounded-lg border px-3 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          on
                            ? "border-amber-dark bg-accent text-foreground"
                            : "border-border hover:border-amber-dark"
                        }`}
                      >
                        <span>{v.label}</span>
                        <span className="variant-choice-price">Up to {formatINR(v.uptoPrice)}</span>
                      </Button>
                    );
                  })}
                </div>
                <Button
                  type="button"
                  disabled={!selected}
                  onClick={() =>
                    selected &&
                    navigate({
                      to: "/sell-phone/$brand/$model/$variant",
                      params: { brand: brand.slug, model: model.slug, variant: selected },
                    })
                  }
                  className="mt-6 h-12 w-full px-6 font-bold sm:w-auto"
                >
                  Continue to condition questions
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
