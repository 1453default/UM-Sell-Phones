import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/public/PublicLayout";
import { SELL_BRANDS } from "@/data/sellPhoneCatalog";
import { SHOP_MAPS_URL } from "@/lib/shop";
import { canonicalUrl } from "@/lib/site";
import heroMain from "@/assets/um-counter.jpg";

const TITLE = "Sell Your Phone | USED MOBILES Hyderabad";
const DESC =
  "Choose your exact phone, answer a few condition questions and review an estimated offer from USED MOBILES in Toli Chowki, Hyderabad.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: canonicalUrl("/") }],
  }),
  component: Home,
});

function Home() {
  const featured = SELL_BRANDS.filter((brand) => brand.logo).slice(0, 8);

  return (
    <PublicLayout>
      <div className="home-page">
        <section className="home-hero">
          <div className="home-hero-copy">
            <p className="eyebrow inline-flex items-center gap-2">
              <MapPin aria-hidden="true" className="size-4 text-amber-dark" />
              Toli Chowki · Hyderabad
            </p>
            <h1 className="home-hero-title">
              Sell your phone with a <em>clear estimate.</em>
            </h1>
            <p className="home-hero-description">
              Choose your exact model and variant, tell us about its condition, then review an
              estimate before arranging a pickup request or visiting our store.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-12 px-5 font-bold">
                <Link to="/sell-phone">
                  Choose your phone <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <a
                href={SHOP_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-foreground transition hover:bg-accent"
              >
                Visit the store <ArrowUpRight aria-hidden="true" className="size-4" />
              </a>
            </div>
            <p className="mt-5 max-w-md text-xs leading-relaxed text-muted-foreground">
              The online amount is an estimate. We confirm the final offer after inspecting the
              phone.
            </p>
          </div>

          <figure className="home-hero-figure">
            <img
              src={heroMain}
              alt="Phone display counter inside the USED MOBILES store in Toli Chowki"
              fetchPriority="high"
            />
            <figcaption className="home-photo-caption">
              <span className="font-display text-sm font-bold">USED MOBILES</span>
              <span>7 Tombs Road, Toli Chowki</span>
            </figcaption>
          </figure>
        </section>

        <section className="home-brand-section" aria-labelledby="brand-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Start with your device</p>
              <h2 id="brand-heading" className="section-title mt-2">
                Choose your phone brand
              </h2>
            </div>
            <Link
              to="/sell-phone"
              className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-amber-dark"
            >
              Browse all {SELL_BRANDS.length} supported brands <ArrowRight className="size-4" />
            </Link>
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((brand) => (
              <li key={brand.slug}>
                <Link
                  to="/sell-phone/$brand"
                  params={{ brand: brand.slug }}
                  aria-label={`Browse ${brand.name} phones`}
                  className="home-brand-tile"
                >
                  {brand.logo && (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      width="100"
                      height="50"
                      loading="lazy"
                      className="h-14 w-auto max-w-[78%] object-contain sm:h-16"
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="home-note-section" aria-labelledby="estimate-heading">
          <div>
            <p className="eyebrow">Before you sell</p>
            <h2 id="estimate-heading" className="section-title mt-2 max-w-sm">
              A useful estimate starts with the right details.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              We use the selected catalog variant and your answers. The store checks the device
              before confirming a purchase price.
            </p>
          </div>
          <div className="home-faq">
            {[
              [
                "Is the online offer final?",
                "No. It is an estimate based on your selected variant and condition answers. The store confirms the final offer after inspecting the phone.",
              ],
              [
                "What if my phone has no listed price?",
                "Call USED MOBILES for an offer. We do not substitute another model’s price.",
              ],
              [
                "Can I request a pickup?",
                "You can submit a pickup request for a supported Hyderabad pincode and choose from the dates and time slots shown in the form.",
              ],
            ].map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
