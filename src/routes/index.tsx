import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowUpRight, MapPin, MessageCircle } from "lucide-react";
import { PublicLayout } from "@/components/public/PublicLayout";
import { SELL_BRANDS } from "@/data/sellPhoneCatalog";
import { SHOP_MAPS_URL, whatsappLink } from "@/lib/shop";
import heroMain from "@/assets/um-counter.jpg";

const TITLE = "Sell Your Phone — Estimated Offers — USED MOBILES Hyderabad";
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

function Home() {
  const featured = SELL_BRANDS.filter(b => b.logo).slice(0, 8);
  return <PublicLayout>
    <section className="store-hero relative overflow-hidden">
      <img src={heroMain} alt="USED MOBILES store in Toli Chowki, Hyderabad" className="store-hero-photo" fetchPriority="high" />
      <div className="store-hero-shade" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-20">
        <p className="store-hero-muted text-xs font-semibold uppercase">Toli Chowki · Hyderabad</p>
        <h1 className="store-hero-copy mt-4 max-w-xl text-4xl md:text-5xl font-bold leading-tight">Sell your phone.<br />At USED MOBILES.</h1>
        <p className="store-hero-muted mt-5 max-w-md leading-relaxed">Choose your device, tell us its condition and get an estimated offer. Visit our store to confirm the value.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="h-12"><Link to="/sell-phone">Check your phone’s value <ArrowRight /></Link></Button>
          <Button asChild size="lg" variant="outline" className="h-12"><a href={whatsappLink("Hi! I'd like to sell my phone.")} target="_blank" rel="noopener noreferrer"><MessageCircle /> WhatsApp us</a></Button>
        </div>
        <a href={SHOP_MAPS_URL} target="_blank" rel="noopener noreferrer" className="store-hero-muted mt-7 inline-flex items-center gap-2 text-sm"><MapPin className="h-4 w-4" /> Visit our store <ArrowUpRight className="h-3 w-3" /></a>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-4 py-10 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase text-muted-foreground">Start with your device</p><h2 className="mt-2 text-2xl font-bold">Which brand is your phone?</h2></div><Link to="/sell-phone" className="inline-flex items-center gap-2 text-sm font-semibold">All {SELL_BRANDS.length} brands <ArrowRight className="h-4 w-4" /></Link></div>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">{featured.map(b => <li key={b.slug}><Link to="/sell-phone/$brand" params={{ brand: b.slug }} className="flex h-24 items-center justify-center rounded-md border border-border bg-card p-4 hover:border-foreground">{b.logo && <img src={b.logo} alt={b.name} width="100" height="50" loading="lazy" className="max-h-12 w-full object-contain" />}</Link></li>)}</ul>
    </section>
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-12"><div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-2xl font-bold">From phone to offer</h2><Link to="/how-it-works" className="text-sm font-semibold underline">How it works</Link></div>
        <div className="mt-8 grid gap-8 md:grid-cols-3">{[
          ["01", "Choose your phone", "Select your exact model and storage/RAM variant."],
          ["02", "Check its condition", "Answer a few questions to see your estimated offer."],
          ["03", "Connect with the store", "Share your details on WhatsApp and arrange an in-store inspection."],
        ].map(([num,title,text]) => <div key={num} className="border-l-2 border-primary pl-5"><span className="font-num text-sm text-muted-foreground">{num}</span><h3 className="mt-2 font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p></div>)}</div>
      </div>
    </section>
    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-2"><div><h2 className="text-2xl font-bold">Before you sell</h2><p className="mt-3 text-muted-foreground">A clear estimate. A real conversation. A final inspection.</p></div><div className="divide-y divide-border">{[
      ["Is the online offer final?", "No. Your estimated offer depends on the condition answers. The store confirms the final price after inspecting the device."],
      ["What if my phone has no listed price?", "You can still contact USED MOBILES on WhatsApp for an offer. We do not substitute another model’s price."],
      ["Where can I sell my phone?", "Visit our store in Toli Chowki, Hyderabad. Bring a valid government ID when selling your device."],
    ].map(([q,a]) => <details key={q} className="py-4"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p></details>)}</div></section>
  </PublicLayout>;
}
