import { useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Crumbs, PhoneImg } from "@/components/sell/SellParts";
import { getSellBrand, getSellModel } from "@/data/sellPhoneCatalog";
import { Button } from "@/components/ui/button";
import { SHOP_PHONE } from "@/lib/shop";
import { getModelVariants } from "@/data/sellPhonePricing";
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
      links: [{ rel: "canonical", href: canonicalUrl(`/sell-phone/${loaderData.brand?.slug}/${loaderData.model.slug}`) }],
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
      <section className="mx-auto max-w-5xl px-4 pt-6 pb-16 md:pt-10">
        <Crumbs
          items={[
            { label: "Sell Phone", to: "/sell-phone" },
            { label: brand.name, to: "/sell-phone/$brand", params: { brand: brand.slug } },
            { label: model.name },
            { label: "Variant" },
          ]}
        />
        <h1 className="mt-4 font-display text-2xl md:text-3xl font-bold">Choose variant</h1>
        <div className="mt-6 grid gap-6 border-y border-border p-5 md:grid-cols-[220px_minmax(0,1fr)] md:items-center md:p-10">
          <div className="flex h-48 items-center justify-center md:h-56">
            <PhoneImg src={model.images[0]} alt={model.name} eager className="h-full w-full" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">Select your {model.name} variant</h2>
            {variants.length === 0 ? (
              <p className="mt-4 rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                Price information is currently unavailable for this model.
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
                  className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
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
                        className={`h-auto min-h-14 whitespace-normal rounded-md border px-3 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          on
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {v.label}
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
                  className="mt-6 h-12 w-full rounded-md bg-primary px-10 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40 sm:w-auto"
                >
                  Proceed
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
