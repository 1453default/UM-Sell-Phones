import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useRouter,
  useLocation,
} from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useEffect, type ReactNode } from "react";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="exception-page">
      <section className="exception-panel">
        <p className="eyebrow">USED MOBILES</p>
        <h1 className="mt-2 font-num text-6xl font-extrabold tracking-tight text-foreground">
          404
        </h1>
        <h2 className="mt-3 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          This page may have moved or the address may be incorrect.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/sell-phone">Browse phones</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Go home</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function ErrorComponent({ reset }: { error: unknown; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="exception-page">
      <section className="exception-panel">
        <p className="eyebrow">USED MOBILES</p>
        <h1 className="mt-2 text-xl font-semibold text-foreground">This page didn’t load</h1>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          Something went wrong. Try refreshing or head back home.
        </p>
        <Button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6"
        >
          Try again
        </Button>
        <Link to="/" className="ml-3 text-sm font-semibold underline underline-offset-4">
          Go home
        </Link>
      </section>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#faf7ef" },
      { title: "Sell Your Phone | USED MOBILES Hyderabad" },
      { property: "og:site_name", content: "USED MOBILES" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: PageOutlet,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function PageOutlet() {
  const router = useRouter();
  const pathname = useLocation({ select: (location) => location.pathname });
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const type = new URLSearchParams(hash).get("type");
    if (pathname !== "/reset-password" && (type === "invite" || type === "recovery")) {
      void router.navigate({ to: "/reset-password", hash, replace: true });
    }
  }, [pathname, router]);
  return (
    <div key={pathname} className="page-enter">
      <Outlet />
    </div>
  );
}
