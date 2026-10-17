import { Link } from "@tanstack/react-router";
import { Home, HandCoins, MapPin, Phone, MessageCircle } from "lucide-react";
import { SHOP_PHONE, SHOP_MAPS_URL, whatsappLink } from "@/lib/shop";
import { Button } from "@/components/ui/button";
export function Dock() {
  const cls = "h-14 flex-1 flex-col gap-1 rounded-none text-xs";
  return <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
    <Button asChild variant="ghost" className={cls}><Link to="/"><Home />Home</Link></Button>
    <Button asChild variant="ghost" className={cls}><Link to="/sell-phone"><HandCoins />Sell</Link></Button>
    <Button asChild variant="ghost" className={cls}><a href={SHOP_MAPS_URL} target="_blank" rel="noopener noreferrer"><MapPin />Store</a></Button>
    <Button asChild variant="ghost" className={cls}><a href={`tel:${SHOP_PHONE.replace(/\s/g, "")}`}><Phone />Call</a></Button>
    <Button asChild variant="ghost" className={cls}><a href={whatsappLink()} target="_blank" rel="noopener noreferrer"><MessageCircle />WhatsApp</a></Button>
  </nav>;
}
