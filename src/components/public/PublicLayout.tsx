import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Instagram, MapPin, Phone } from "lucide-react";
import { SHOP_ADDRESS, SHOP_HOURS, SHOP_INSTAGRAM, SHOP_PHONE, SHOP_MAPS_URL } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Dock } from "@/components/public/Dock";
import { BrandLogo } from "@/components/public/BrandLogo";
import { BrandTagline } from "@/components/public/BrandTagline";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <PublicHeader />
      <main id="main-content" className="site-main flex-1">
        {children}
      </main>
      <PublicFooter />
      <Dock />
    </div>
  );
}

const NAV_CLS =
  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground";

function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-border bg-background">
      <div className="mx-auto flex h-[4.5rem] max-w-[80rem] items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="USED MOBILES home">
          <BrandLogo className="size-11 shrink-0 rounded-full object-contain" />
          <div className="min-w-0">
            <div className="font-display text-sm font-extrabold leading-none tracking-tight text-foreground sm:text-base">
              USED MOBILES
            </div>
            <div className="mt-1.5 hidden sm:block">
              <BrandTagline />
            </div>
          </div>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 sm:flex">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-accent text-foreground" }}
            className={NAV_CLS}
          >
            Home
          </Link>
          <Link
            to="/sell-phone"
            activeOptions={{ includeSearch: false }}
            activeProps={{ className: "bg-accent text-foreground" }}
            className={NAV_CLS}
          >
            Phone catalog
          </Link>
        </nav>

        <Button asChild className="h-10 shrink-0 px-3 text-xs font-bold sm:px-4 sm:text-sm">
          <Link to="/sell-phone">
            <span className="hidden sm:inline">Get an estimate</span>
            <span className="sm:hidden">Estimate</span>
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="site-footer mt-10 border-t border-border bg-card">
      <div className="mx-auto grid max-w-[80rem] gap-9 px-5 py-11 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.25fr_0.75fr_1fr] lg:gap-14 lg:py-14">
        <div>
          <Link to="/" className="inline-flex items-center gap-3">
            <BrandLogo className="size-12 shrink-0 rounded-full object-contain" />
            <span className="min-w-0">
              <span className="block font-display font-extrabold tracking-tight text-foreground">
                USED MOBILES
              </span>
              <span className="mt-1 block">
                <BrandTagline />
              </span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Choose your exact phone, share its condition and review an estimate before arranging a
            pickup request or visiting the store.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <a
              href={SHOP_INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="USED MOBILES on Instagram"
              className="inline-flex size-10 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:border-primary hover:text-foreground"
            >
              <Instagram className="size-4" />
            </a>
            <a
              href={`tel:${SHOP_PHONE.replace(/\s/g, "")}`}
              aria-label={`Call USED MOBILES at ${SHOP_PHONE}`}
              className="inline-flex size-10 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:border-primary hover:text-foreground"
            >
              <Phone className="size-4" />
            </a>
          </div>
        </div>

        <div>
          <h2 className="eyebrow">Explore</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link to="/sell-phone" className="text-muted-foreground hover:text-foreground">
                Browse supported phones
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="text-muted-foreground hover:text-foreground">
                Terms and conditions
              </Link>
            </li>
            <li>
              <a
                href={SHOP_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                Store location <ArrowUpRight className="size-3.5" />
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="eyebrow">At the store</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>Online values are estimates; the final offer follows device inspection.</li>
            <li>Payment is arranged after the final offer is agreed.</li>
          </ul>
          <a
            href={SHOP_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-start gap-2 text-sm leading-relaxed text-foreground hover:text-amber-dark"
          >
            <MapPin className="mt-0.5 size-4 shrink-0 text-amber-dark" />
            <span>{SHOP_ADDRESS}</span>
          </a>
          <p className="mt-3 text-sm text-muted-foreground">{SHOP_HOURS}</p>
          <a
            href={`tel:${SHOP_PHONE.replace(/\s/g, "")}`}
            className="mt-2 inline-block font-num text-sm font-semibold text-foreground hover:text-amber-dark"
          >
            {SHOP_PHONE}
          </a>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} USED MOBILES · Hyderabad
      </div>
    </footer>
  );
}
