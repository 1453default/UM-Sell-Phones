import { BrandLogo } from "@/components/public/BrandLogo";
<<<<<<< HEAD
import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
=======
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
>>>>>>> 82b3de4d68f96599d8612343ab3e124a89323dea
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  checkAdmin,
  listPickupRequests,
  retryPickupNotification,
  updatePickupRequest,
} from "@/lib/pickup.functions";
import { PICKUP_SLOTS, REQUEST_STATUSES, formatPickupDate } from "@/lib/pickup";
import { formatINR } from "@/data/sellPhonePricing";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Pickup requests | USED MOBILES admin" },
      { name: "description", content: "Manage doorstep pickup requests." },
      { property: "og:title", content: "Pickup requests | USED MOBILES admin" },
      { property: "og:description", content: "Manage doorstep pickup requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async () => {
<<<<<<< HEAD
    const { isAdmin } = await checkAdmin();
    return {
      isAdmin,
      page: isAdmin ? await listPickupRequests({ data: {} }) : { items: [], nextCursor: null },
    };
=======
    try {
      const { isAdmin } = await checkAdmin();
      if (!isAdmin) return { isAdmin: false, rows: [], loadError: null };
      try {
        return { isAdmin: true, rows: await listPickupRequests(), loadError: null };
      } catch (error) {
        console.error("Admin pickup requests could not be loaded", error);
        return { isAdmin: true, rows: [], loadError: "requests" as const };
      }
    } catch (error) {
      console.error("Admin access could not be verified", error);
      return { isAdmin: false, rows: [], loadError: "access" as const };
    }
>>>>>>> 82b3de4d68f96599d8612343ab3e124a89323dea
  },
  component: AdminPage,
});

type Row = Awaited<ReturnType<typeof listPickupRequests>>["items"][number];
type Notification = Row["notification"];
const label = (s: string) => s.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());

function AdminPage() {
<<<<<<< HEAD
  const { isAdmin, page: initialPage } = Route.useLoaderData();
  const navigate = useNavigate();
  const listFn = useServerFn(listPickupRequests);
  const [rows, setRows] = useState<Row[]>(initialPage.items);
  const [cursor, setCursor] = useState(initialPage.nextCursor);
  const [filter, setFilter] = useState<(typeof REQUEST_STATUSES)[number] | "all">("all");
  const [search, setSearch] = useState("");
  const [appliedFilter, setAppliedFilter] = useState<(typeof REQUEST_STATUSES)[number] | "all">(
    "all",
  );
  const [appliedSearch, setAppliedSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

=======
  const { isAdmin, rows: initial, loadError } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initial);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const shown = useMemo(
    () =>
      rows.filter(
        (r) =>
          (filter === "all" || r.status === filter) &&
          `${r.reference} ${r.customer_name} ${r.mobile} ${r.model}`
            .toLowerCase()
            .includes(q.toLowerCase()),
      ),
    [rows, filter, q],
  );
  useEffect(() => setRows(initial), [initial]);
>>>>>>> 82b3de4d68f96599d8612343ab3e124a89323dea
  async function signOut() {
    await navigate({ to: "/auth", replace: true });
    await supabase.auth.signOut();
    // Clear private loader data before a subsequent account signs in.
    await navigate({ to: "/auth", replace: true, reloadDocument: true });
  }

<<<<<<< HEAD
  async function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await listFn({ data: { status: filter, search, cursor: null } });
      setRows(result.items);
      setCursor(result.nextCursor);
      setAppliedFilter(filter);
      setAppliedSearch(search);
    } catch {
      setMessage("Could not load pickup requests. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function loadOlder() {
    if (!cursor || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await listFn({
        data: { status: appliedFilter, search: appliedSearch, cursor },
      });
      setRows((current) => [...current, ...result.items]);
      setCursor(result.nextCursor);
    } catch {
      setMessage("Could not load older requests. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!isAdmin) {
=======
  if (loadError)
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <BrandLogo />
        <h1 className="mt-6 text-2xl font-bold">Pickup requests couldn't be loaded</h1>
        <p className="mt-3 text-muted-foreground">
          {loadError === "access"
            ? "We couldn't verify this account's admin access. Sign in again or try once more."
            : "The request list is temporarily unavailable. Check the Supabase connection and applied migrations, then try again."}
        </p>
        <div className="mt-6 flex gap-3">
          <Button onClick={() => router.invalidate()}>Try again</Button>
          <Button variant="outline" onClick={signOut}>Sign out</Button>
        </div>
      </main>
    );

  if (!isAdmin)
>>>>>>> 82b3de4d68f96599d8612343ab3e124a89323dea
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <h1 className="text-2xl font-bold">No admin access</h1>
        <p className="mt-3 text-muted-foreground">This account is not an administrator.</p>
        <Button variant="outline" className="mt-6" onClick={signOut}>
          Sign out
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <BrandLogo />
          <h1 className="font-display text-3xl font-bold">Pickup requests</h1>
        </div>
        <Button variant="outline" onClick={signOut}>
          Sign out
        </Button>
      </div>

      <form onSubmit={applyFilters} className="mt-6 flex flex-wrap gap-3">
        <input
          aria-label="Search pickup requests"
          placeholder="Search reference, name, mobile, device"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="field max-w-xs"
        />
        <select
          aria-label="Filter by status"
          value={filter}
          onChange={(event) =>
            setFilter(event.target.value as (typeof REQUEST_STATUSES)[number] | "all")
          }
          className="field max-w-[200px]"
        >
          <option value="all">All statuses</option>
          {REQUEST_STATUSES.map((status) => (
            <option key={status} value={status}>
              {label(status)}
            </option>
          ))}
        </select>
        <Button type="submit" disabled={busy}>
          {busy ? "Loading…" : "Search"}
        </Button>
      </form>

      {message && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {message}
        </p>
      )}
      {rows.length === 0 ? (
        <p className="mt-10 text-muted-foreground">No requests found.</p>
      ) : (
        <ul className="mt-6 divide-y divide-border border-y border-border">
          {rows.map((row) => (
            <RequestItem
              key={row.id}
              row={row}
              onSaved={(saved) =>
                setRows((current) =>
                  current.map((item) => (item.id === saved.id ? { ...item, ...saved } : item)),
                )
              }
              onNotificationSaved={(id, notification) =>
                setRows((current) =>
                  current.map((item) => (item.id === id ? { ...item, notification } : item)),
                )
              }
            />
          ))}
        </ul>
      )}
      {cursor && (
        <div className="mt-6">
          <Button variant="outline" onClick={loadOlder} disabled={busy}>
            {busy ? "Loading…" : "Load older requests"}
          </Button>
        </div>
      )}
    </main>
  );
}

function canRetryNotification(notification: NonNullable<Notification>) {
  if (notification.status === "pending" || notification.status === "failed") return true;
  if (notification.status !== "sending" || !notification.last_attempt_at) return false;
  const age = Date.now() - new Date(notification.last_attempt_at).getTime();
  return age >= 2 * 60_000 && age < 23 * 60 * 60_000;
}

function RequestItem({
  row,
  onSaved,
  onNotificationSaved,
}: {
  row: Row;
  onSaved: (row: Awaited<ReturnType<typeof updatePickupRequest>>) => void;
  onNotificationSaved: (id: string, notification: Notification) => void;
}) {
  const save = useServerFn(updatePickupRequest);
  const retry = useServerFn(retryPickupNotification);
  const [edit, setEdit] = useState({
    status: row.status,
    assignedTo: row.assigned_to ?? "",
    adminNotes: row.admin_notes ?? "",
    slotDate: row.slot_date,
    slotTime: row.slot_time,
  });
  const [state, setState] = useState("");
  const [notificationState, setNotificationState] = useState("");

  async function submit() {
    if (state === "Saving…") return;
    setState("Saving…");
    try {
      const saved = await save({
        data: {
          id: row.id,
          ...edit,
          status: edit.status as (typeof REQUEST_STATUSES)[number],
        },
      });
      onSaved(saved);
      setState("Saved");
    } catch (error) {
      setState(
        error instanceof Error && error.message === "Choose a valid upcoming pickup date and time."
          ? error.message
          : "Could not save. Please try again.",
      );
    }
  }

  async function retryEmail() {
    setNotificationState("Retrying…");
    try {
      const notification = await retry({ data: { requestId: row.id } });
      onNotificationSaved(row.id, notification);
      setNotificationState(
        notification?.status === "sent"
          ? "Accepted by Resend"
          : notification?.status === "unknown"
            ? "Outcome unconfirmed; check Resend before retrying again."
            : "Still failed. Check the email configuration and retry.",
      );
    } catch {
      setNotificationState("Could not retry the notification. Please try again.");
    }
  }

  const notification = row.notification;
  const notificationDescription = !notification
    ? "No notification was queued for this older request."
    : notification.status === "sent"
      ? `Accepted by Resend${notification.delivered_at ? ` on ${new Date(notification.delivered_at).toLocaleString("en-IN")}` : ""}.`
      : notification.status === "unknown"
        ? "Delivery outcome is unconfirmed. Check Resend before retrying."
        : `${label(notification.status)}${notification.last_error_code ? `: ${notification.last_error_code}` : ""}.`;

  return (
    <li className="py-5">
      <details>
        <summary className="flex cursor-pointer flex-wrap items-baseline gap-x-5 gap-y-1">
          <span className="font-num font-bold">{row.reference}</span>
          <span>{row.customer_name}</span>
          <a href={`tel:${row.mobile}`} className="underline">
            {row.mobile}
          </a>
          <span className="text-muted-foreground">
            {row.model} · {row.variant}
          </span>
          <span className="font-num">{formatINR(Number(row.estimate))}</span>
          <span className="text-sm">
            {formatPickupDate(row.slot_date)}, {row.slot_time}
          </span>
          <span className="border border-border px-2 text-xs font-semibold uppercase">
            {label(row.status)}
          </span>
        </summary>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div className="space-y-2 text-sm">
            <p>
              <strong>Address:</strong> {row.address_line}, {row.locality}
              {row.landmark ? ` (near ${row.landmark})` : ""}, Hyderabad {row.pincode}
            </p>
            <p>
              <strong>Phone verification:</strong> {row.phone_verification_status}
            </p>
            <p>
              <strong>Device:</strong> {row.brand} {row.model}, {row.variant}
            </p>
            <p>
              <strong>Base value:</strong> {formatINR(Number(row.base_value))} ·{" "}
              <strong>Estimate:</strong> {formatINR(Number(row.estimate))}
            </p>
            <p>
              <strong>Submitted:</strong> {new Date(row.created_at).toLocaleString("en-IN")}
            </p>
            <ul className="list-disc pl-5 text-muted-foreground">
              {row.answer_summary.map((answer) => (
                <li key={answer}>{answer}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <div className="border border-border p-3 text-sm">
              <p>
                <strong>Admin email:</strong> {notificationDescription}
              </p>
              {notification && canRetryNotification(notification) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={retryEmail}
                  disabled={notificationState === "Retrying…"}
                >
                  Retry admin email
                </Button>
              )}
              {notificationState && (
                <p role="status" className="mt-2 text-muted-foreground">
                  {notificationState}
                </p>
              )}
            </div>
            <select
              aria-label="Status"
              value={edit.status}
              onChange={(event) => setEdit({ ...edit, status: event.target.value })}
              className="field"
            >
              {REQUEST_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {label(status)}
                </option>
              ))}
            </select>
            <input
              aria-label="Assigned to"
              placeholder="Assigned to (staff name)"
              value={edit.assignedTo}
              onChange={(event) => setEdit({ ...edit, assignedTo: event.target.value })}
              className="field"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                aria-label="Pickup date"
                type="date"
                value={edit.slotDate}
                onChange={(event) => setEdit({ ...edit, slotDate: event.target.value })}
                className="field"
              />
              <select
                aria-label="Time slot"
                value={edit.slotTime}
                onChange={(event) => setEdit({ ...edit, slotTime: event.target.value })}
                className="field"
              >
                {PICKUP_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              aria-label="Notes"
              placeholder="Internal notes"
              value={edit.adminNotes}
              onChange={(event) => setEdit({ ...edit, adminNotes: event.target.value })}
              className="field h-24 py-3"
            />
            <div className="flex items-center gap-3">
              <Button type="button" onClick={submit} disabled={state === "Saving…"}>
                Save changes
              </Button>
              <span role="status" className="text-sm text-muted-foreground">
                {state}
              </span>
            </div>
          </div>
        </div>
      </details>
    </li>
  );
}
