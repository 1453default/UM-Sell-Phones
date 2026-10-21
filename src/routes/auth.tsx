import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/public/BrandLogo";
import { checkAdmin } from "@/lib/pickup.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Staff sign in | USED MOBILES" },
      { name: "description", content: "Secure staff sign-in for USED MOBILES pickup requests." },
      { property: "og:title", content: "Staff sign in | USED MOBILES" },
      { property: "og:description", content: "Secure staff sign-in for pickup requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});
function AuthPage() {
  const navigate = useNavigate();
  const checkAdminFn = useServerFn(checkAdmin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMsg("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setMsg("Unable to sign in with those credentials.");
        return;
      }

      const { isAdmin } = await checkAdminFn();
      if (!isAdmin) {
        await supabase.auth.signOut({ scope: "local" });
        setMsg("Unable to sign in with those credentials.");
        return;
      }

      await navigate({ to: "/admin" });
    } catch {
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
      setMsg("Sign-in is temporarily unavailable. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link to="/" className="inline-flex items-center gap-3">
          <BrandLogo className="size-12 rounded-full object-contain" />
          <span className="font-display font-extrabold tracking-tight">USED MOBILES</span>
        </Link>
        <p className="eyebrow mt-7">Private staff access</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
          Sign in to manage requests
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Pickup requests are available to the configured USED MOBILES administrator.
        </p>
        <form onSubmit={submit} className="mt-7 space-y-4" aria-busy={busy}>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="pw" className="mb-2 block text-sm font-medium">
              Password
            </label>
            <input
              id="pw"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
            />
          </div>
          {msg && (
            <p role="status" className="auth-message text-sm">
              {msg}
            </p>
          )}
          <Button type="submit" className="h-12 w-full font-bold" disabled={busy}>
            {busy ? "Please wait…" : "Sign in"}
          </Button>
        </form>
      </section>
    </main>
  );
}
