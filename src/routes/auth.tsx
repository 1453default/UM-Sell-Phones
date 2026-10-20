import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/public/BrandLogo";

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
  const [recovery, setRecovery] = useState(false);
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
      if (recovery) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        setMsg(
          error
            ? "Could not send the reset email. Please try again later."
            : "If this email has an account, a password reset link has been sent.",
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error)
          setMsg("Unable to sign in. Check your email and password, or request a password reset.");
        else await navigate({ to: "/admin" });
      }
    } catch {
      setMsg("Sign-in is temporarily unavailable. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-sm px-5 py-12">
      <Link to="/" className="inline-flex">
        <BrandLogo />
      </Link>
      <h1 className="mt-6 font-display text-3xl font-bold">
        {recovery ? "Reset your password" : "Staff sign in"}
      </h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
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
        {!recovery && (
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
        )}
        {msg && (
          <p role="status" className="text-sm">
            {msg}
          </p>
        )}
        <Button type="submit" className="h-12 w-full" disabled={busy}>
          {busy ? "Please wait…" : recovery ? "Send reset link" : "Sign in"}
        </Button>
      </form>
      <Button
        variant="link"
        className="mt-4 px-0"
        onClick={() => {
          setRecovery(!recovery);
          setMsg("");
        }}
      >
        {recovery ? "Back to sign in" : "Forgot password?"}
      </Button>
    </main>
  );
}
