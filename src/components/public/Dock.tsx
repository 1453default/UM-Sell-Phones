import { Link } from "@tanstack/react-router";
import { Home, HandCoins, MapPin, Phone } from "lucide-react";
import { SHOP_PHONE, SHOP_MAPS_URL } from "@/lib/shop";
import { Button } from "@/components/ui/button";
export function Dock() {
  const cls = "h-[3.75rem] flex-1 flex-col gap-1 rounded-none text-[0.68rem]";
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/98 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(29,37,54,0.06)] md:hidden"
    >
      <Button asChild variant="ghost" className={cls}>
        <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground" }}>
          <Home className="size-[1.15rem]" />
          Home
        </Link>
      </Button>
      <Button asChild variant="ghost" className={cls}>
        <Link to="/sell-phone" activeProps={{ className: "text-foreground" }}>
          <HandCoins className="size-[1.15rem]" />
          Sell
        </Link>
      </Button>
      <Button asChild variant="ghost" className={cls}>
        <a href={SHOP_MAPS_URL} target="_blank" rel="noopener noreferrer">
          <MapPin className="size-[1.15rem]" />
          Store
        </a>
      </Button>
      <Button asChild variant="ghost" className={cls}>
        <a href={`tel:${SHOP_PHONE.replace(/\s/g, "")}`}>
          <Phone className="size-[1.15rem]" />
          Call
        </a>
      </Button>
    </nav>
  );
}
