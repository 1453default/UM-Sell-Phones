import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Phone, Instagram, CheckCircle2 } from "lucide-react";
import {
  SHOP_PHONE,
  SHOP_INSTAGRAM,
  SHOP_INSTAGRAM_HANDLE,
  SHOP_MAPS_URL,
  whatsappLink,
} from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Dock } from "@/components/public/Dock";
import { BrandTagline } from "@/components/public/BrandTagline";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 site-main">{children}</main>
      <PublicFooter />
      <Dock />
    </div>
  );
}

const NAV_CLS =
  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition";
const NAV: { to?: "/" | "/sell-phone" | "/how-it-works"; href?: string; label: string }[] = [
  { to: "/", label: "Home" },
  { to: "/sell-phone", label: "Sell Phone" },
  { to: "/how-it-works", label: "How It Works" },

  { href: whatsappLink("Hi! I have a question about selling my phone."), label: "Support" },
];

function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-border bg-background">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <img
            src="/USED_MOBILE_LOGO.png"
            alt=""
            width="56"
            height="56"
            className="h-10 w-10 md:h-14 md:w-14 shrink-0 object-contain"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <div className="min-w-0">
            <div className="font-display text-base font-extrabold leading-none  text-foreground">
              USED MOBILES
            </div>
            <div className="mt-1.5 hidden sm:block">
              <BrandTagline />
            </div>
          </div>
        </Link>

        <nav className="hidden gap-1 md:flex">
          {NAV.map((n) =>
            n.href ? (
              <a key={n.label} href={n.href} className={NAV_CLS}>
                {n.label}
              </a>
            ) : (
              <Link
                key={n.label}
                to={n.to ?? "/"}
                activeOptions={{ exact: n.to === "/" }}
                activeProps={{ className: "bg-accent text-foreground" }}
                className={NAV_CLS}
              >
                {n.label}
              </Link>
            ),
          )}
        </nav>

        <a
          href={`tel:${SHOP_PHONE.replace(/\s/g, "")}`}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground hover:border-primary transition"
          aria-label="Call shop"
        >
          <Phone className="h-4 w-4 text-primary" />
          <span className="hidden sm:inline font-num">{SHOP_PHONE}</span>
        </a>
      </div>
    </header>
  );
}

function PublicFooter() {
  const explore: { to?: "/" | "/sell-phone" | "/how-it-works"; href?: string; label: string }[] = [
    { to: "/", label: "Home" },
    { to: "/sell-phone", label: "Sell Your Phone" },
    { to: "/how-it-works", label: "How It Works" },

    { href: SHOP_MAPS_URL, label: "Store Location" },
  ];

  return (
    <footer className="site-footer mt-12 border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <img src="/USED_MOBILE_LOGO.png" alt="" className="h-9 w-9 object-contain" />
            <div className="min-w-0">
              <div className="font-display font-extrabold text-foreground">USED MOBILES</div>
              <div className="mt-1.5">
                <BrandTagline />
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sell your used smartphone at our Toli Chowki store. Get an estimated offer online, then
            confirm the price after inspection.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <a
              href={SHOP_INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary transition"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href={`tel:${SHOP_PHONE.replace(/\s/g, "")}`}
              aria-label="Call"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary transition"
            >
              <Phone className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest mb-3 text-foreground">
            Explore
          </h4>
          <ul className="space-y-2">
            {explore.map((l) => (
              <li key={l.label}>
                {l.href ? (
                  <a
                    href={l.href}
                    className="text-sm text-muted-foreground hover:text-primary transition"
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link
                    to={l.to ?? "/"}
                    className="text-sm text-muted-foreground hover:text-primary transition"
                  >
                    {l.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest mb-3 text-foreground">
            Our Promise
          </h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald shrink-0 mt-0.5" />
              <span>Condition-based valuation</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald shrink-0 mt-0.5" />
              <span>In-store device inspection</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald shrink-0 mt-0.5" />
              <span>Instant UPI or Cash payout</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald shrink-0 mt-0.5" />
              <span>Personal assistance at our store</span>
            </li>
            <li className="pt-1 text-xs text-muted-foreground/75">
              * Valid Govt ID required at the time of sale.
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest mb-3 text-foreground">
            Visit Store
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Hyder Manzil, 7 Tombs Rd, beside Al Ameen Meat Mart,
            <br />
            Samata Colony, Toli Chowki, Hyderabad 500008
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Open all days · 10:00 AM – 11:00 PM</p>
          <a
            href={`tel:${SHOP_PHONE.replace(/\s/g, "")}`}
            className="mt-3 block text-sm font-semibold text-foreground hover:text-primary font-num"
          >
            {SHOP_PHONE}
          </a>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-foreground hover:text-primary font-num"
          >
            WhatsApp · {SHOP_PHONE}
          </a>
          <span className="sr-only">{SHOP_INSTAGRAM_HANDLE}</span>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground px-4">
        © {new Date().getFullYear()} USED MOBILES · Hyderabad · All rights reserved.
      </div>
    </footer>
  );
}
