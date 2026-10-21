import { Button } from "@/components/ui/button";
import {
  AdminAccessUnavailableError,
  adminAccessErrorMessage,
  readAdminSession,
} from "@/lib/admin-access";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const session = await readAdminSession(() => supabase.auth.getUser());
    if (session.state === "unavailable") {
      throw new AdminAccessUnavailableError(session.reason);
    }
    if (session.state === "unauthenticated") throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
  errorComponent: AdminRouteError,
});

function AdminRouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <main role="alert" className="exception-page">
      <section className="exception-panel">
        <p className="eyebrow">Private staff area</p>
        <h1 className="mt-2 text-2xl font-bold">Admin access unavailable</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {adminAccessErrorMessage(error)}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </Button>
          <Link to="/" className="text-sm font-semibold underline underline-offset-4">
            Back to shop
          </Link>
        </div>
      </section>
    </main>
  );
}
