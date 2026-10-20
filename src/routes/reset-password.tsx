import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/public/BrandLogo";
export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set staff password | USED MOBILES" },
      { name: "description", content: "Securely set your USED MOBILES staff password." },
      { property: "og:title", content: "Set staff password | USED MOBILES" },
      { property: "og:description", content: "Secure staff password recovery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});
function ResetPassword() {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("Checking your secure link…");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const kind = hash.get("type");
    if (kind !== "recovery" && kind !== "invite") {
      queueMicrotask(() => {
        if (active) setMessage("Open the secure link from your setup or password reset email.");
      });
      return () => {
        active = false;
      };
    }
    // The auth client consumes the link and validates the resulting session.
    supabase.auth.getUser().then(({ data, error }) => {
      if (active) {
        setAllowed(!!data.user && !error);
        setMessage(
          data.user && !error ? "" : "This link has expired. Request a new password reset.",
        );
      }
    });
    return () => {
      active = false;
    };
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || !allowed) return;
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(
        "Could not set password. Use at least 8 characters and avoid a compromised password.",
      );
      setBusy(false);
      return;
    }
    await navigate({ to: "/admin", replace: true });
  }
  return (
    <main className="mx-auto max-w-sm px-5 py-12">
      <Link to="/">
        <BrandLogo />
      </Link>
      <h1 className="mt-6 text-3xl font-bold">Set your password</h1>
      {message && (
        <p role="status" className="mt-4 text-sm">
          {message}
        </p>
      )}
      {allowed && (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            New password
            <input
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              className="field mt-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className="block">
            Confirm password
            <input
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              className="field mt-2"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
          <Button disabled={busy} type="submit" className="h-12 w-full">
            Save password
          </Button>
        </form>
      )}
      <Button asChild variant="link" className="mt-4 px-0">
        <Link to="/auth">Back to sign in</Link>
      </Button>
    </main>
  );
}
