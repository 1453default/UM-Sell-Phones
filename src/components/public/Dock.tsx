import { useRef, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import { Home, HandCoins, MapPin, Phone, MessageCircle } from "lucide-react";
import { SHOP_PHONE, SHOP_MAPS_URL, whatsappLink } from "@/lib/shop";

type DockItem = {
  to?: string;
  href?: string;
  external?: boolean;
  label: string;
  icon: ReactNode;
  exact?: boolean;
};

const ITEMS: DockItem[] = [
  { to: "/", label: "Home", icon: <Home className="h-5 w-5" />, exact: true },
  { to: "/sell-phone", label: "Sell Phone", icon: <HandCoins className="h-5 w-5" /> },
  { href: SHOP_MAPS_URL, external: true, label: "Store", icon: <MapPin className="h-5 w-5" /> },
  {
    href: `tel:${SHOP_PHONE.replace(/\s/g, "")}`,
    external: true,
    label: "Call",
    icon: <Phone className="h-5 w-5" />,
  },
  {
    href: whatsappLink("Hi! I'd like to sell my phone."),
    external: true,
    label: "WhatsApp",
    icon: <MessageCircle className="h-5 w-5" />,
  },
];

export function Dock() {
  const mouseX = useMotionValue(Infinity);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div
      className="fixed inset-x-0 z-40 flex justify-center px-3 pointer-events-none"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
    >
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="pointer-events-auto flex items-end gap-2 rounded-2xl border border-border bg-card/90 px-3 py-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/70"
      >
        {ITEMS.map((it) => {
          const active = it.to ? (it.exact ? pathname === it.to : pathname.startsWith(it.to)) : false;
          return <DockIcon key={it.label} mouseX={mouseX} active={active} item={it} />;
        })}
      </motion.div>
    </div>
  );
}

function DockIcon({ mouseX, item, active }: { mouseX: MotionValue<number>; item: DockItem; active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });
  const widthSync = useTransform(distance, [-120, 0, 120], [44, 64, 44]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 180, damping: 14 });

  const content = (
    <motion.div
      ref={ref}
      style={{ width, height: width }}
      className={`flex aspect-square items-center justify-center rounded-xl transition-colors ${
        active ? "bg-primary text-primary-foreground" : "bg-muted/60 text-foreground hover:bg-muted"
      }`}
      aria-label={item.label}
    >
      {item.icon}
    </motion.div>
  );

  if (item.external && item.href) {
    return (
      <a href={item.href} target="_blank" rel="noopener" aria-label={item.label}>
        {content}
      </a>
    );
  }
  return (
    <Link to={item.to!} aria-label={item.label}>
      {content}
    </Link>
  );
}
