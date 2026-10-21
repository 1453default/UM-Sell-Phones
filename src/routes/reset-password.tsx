import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redirecting to administrator sign in | USED MOBILES" },
      { name: "description", content: "Redirecting to administrator sign in." },
      { property: "og:title", content: "Redirecting to administrator sign in | USED MOBILES" },
      { property: "og:description", content: "Redirecting to administrator sign in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});
function ResetPassword() {
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    void supabase.auth
      .signOut({ scope: "local" })
      .catch(() => undefined)
      .finally(() => {
        if (active) void navigate({ to: "/auth", replace: true });
      });
    return () => {
      active = false;
    };
  }, [navigate]);
  return null;
}
