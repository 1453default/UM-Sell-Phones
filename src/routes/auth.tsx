import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Staff sign in — USED MOBILES" },
      { name: "description", content: "Staff sign-in for the USED MOBILES pickup admin panel." },
      { property: "og:title", content: "Staff sign in — USED MOBILES" },
      { property: "og:description", content: "Staff sign-in for the pickup admin panel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setMsg(error.message);
      navigate({ to: "/admin" });
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth` },
      });
      setBusy(false);
      setMsg(error ? error.message : "Check your email to confirm your account, then sign in.");
    }
  }

  return (
    <main className="mx-auto max-w-sm px-5 py-16">
      <h1 className="font-display text-3xl font-bold">
        {mode === "in" ? "Staff sign in" : "Create staff account"}
      </h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium">Email</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
        </div>
        <div>
          <label htmlFor="pw" className="mb-2 block text-sm font-medium">Password</label>
          <input id="pw" type="password" required minLength={8} autoComplete={mode === "in" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
        </div>
        {msg && <p role="status" className="text-sm">{msg}</p>}
        <Button type="submit" className="h-12 w-full" disabled={busy}>
          {mode === "in" ? "Sign in" : "Create account"}
        </Button>
      </form>
      <button type="button" className="mt-5 text-sm underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "Need an account? Create one" : "Have an account? Sign in"}
      </button>
    </main>
  );
}
