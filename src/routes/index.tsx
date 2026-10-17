import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, HandCoins, MapPin, MessageCircle, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import { PublicLayout } from "@/components/public/PublicLayout";
import { SELL_BRANDS } from "@/data/sellPhoneCatalog";
import { SHOP_MAPS_URL, whatsappLink } from "@/lib/shop";
import heroMain from "@/assets/um-counter.jpg";
import heroEnt from "@/assets/um-ent.jpg";
import heroLeft from "@/assets/um-left.jpg";

const TITLE = "Sell Your Old Phone for the Best Price — USED MOBILES Hyderabad";
const DESC = "Check how much your used iPhone, Samsung, OnePlus or other phone is worth and sell it to USED MOBILES, Toli Chowki, Hyderabad.";

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
  }),
  component: Home,
});

const STEPS = [
  { icon: <Smartphone className="h-5 w-5" />, title: "Pick your phone", text: "Choose the brand, model and storage variant." },
  { icon: <Wallet className="h-5 w-5" />, title: "See the value", text: "Get the maximum price we can offer instantly." },
  { icon: <BadgeCheck className="h-5 w-5" />, title: "Get paid", text: "Visit our store for a quick check and instant payment." },
];

function Home() {
  const featured = SELL_BRANDS.filter((b) => b.logo).slice(0, 8);
  return (
    <PublicLayout>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-amber/5 via-background to-info/5" />
        <div className="mx-auto max-w-6xl px-4 pt-6 pb-8 md:pt-16 md:pb-16">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald" /> Honest prices · Instant payment
              </div>
              <h1 className="mt-4 font-display text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight text-foreground">
                Sell your old phone <br />
                <span className="text-primary">at the best price.</span>
              </h1>
              <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-xl">
                Find out what your iPhone, Samsung, OnePlus and more are worth in seconds — then sell it at our Toli Chowki store.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/sell-phone" className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 font-bold text-primary-foreground hover:bg-amber-dark transition">
                  <HandCoins className="h-5 w-5" /> Check your phone's value <ArrowRight className="h-4 w-4" />
                </Link>
                <a href={whatsappLink("Hi! I'd like to sell my phone.")} target="_blank" rel="noopener" className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-5 font-semibold text-foreground hover:border-primary transition">
                  <MessageCircle className="h-5 w-5 text-whatsapp" /> WhatsApp us
                </a>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.15 }} className="relative">
              <div className="grid grid-cols-5 grid-rows-2 gap-3 h-[380px] sm:h-[440px] md:h-[500px]">
                <figure className="relative col-span-3 row-span-2 overflow-hidden rounded-2xl border border-border bg-muted shadow-xl">
                  <img src={heroMain} alt="USED MOBILES store counter" className="h-full w-full object-cover" loading="eager" decoding="async" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent p-4">
                    <a href={SHOP_MAPS_URL} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-full bg-card/95 px-3 py-1 text-[11px] font-bold text-foreground">
                      <MapPin className="h-3 w-3 text-primary" /> Toli Chowki · Hyderabad
                    </a>
                  </div>
                </figure>
                <figure className="relative col-span-2 overflow-hidden rounded-2xl border border-border bg-muted shadow-md">
                  <img src={heroEnt} alt="USED MOBILES store interior" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                </figure>
                <figure className="relative col-span-2 overflow-hidden rounded-2xl border border-border bg-muted shadow-md">
                  <img src={heroLeft} alt="USED MOBILES shop side view" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                </figure>
              </div>
              <div className="pointer-events-none absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-amber/10 via-transparent to-info/10 blur-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-12 scroll-mt-24">
        <h2 className="font-display text-2xl md:text-3xl font-bold">How it works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{s.icon}</div>
              <div className="mt-3 text-xs font-semibold text-muted-foreground">Step {i + 1}</div>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="brands" className="mx-auto max-w-6xl px-4 pb-12 scroll-mt-24">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl md:text-3xl font-bold">Choose your brand</h2>
          <Link to="/sell-phone" className="text-sm font-semibold text-primary">All {SELL_BRANDS.length} brands →</Link>
        </div>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {featured.map((b) => (
            <li key={b.slug}>
              <Link to="/sell-phone/$brand" params={{ brand: b.slug }} className="flex h-24 items-center justify-center rounded-2xl border border-border bg-card px-4 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg">
                <img src={b.logo!} alt={`${b.name} logo`} className="h-14 w-auto max-w-[75%] object-contain" decoding="async" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </PublicLayout>
  );
}
