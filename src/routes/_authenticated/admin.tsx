import { BrandLogo } from "@/components/public/BrandLogo";
import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
    const { isAdmin } = await checkAdmin();
    return {
      isAdmin,
      page: isAdmin ? await listPickupRequests({ data: {} }) : { items: [], nextCursor: null },
    };
  },
  pendingComponent: AdminLoading,
  component: AdminPage,
});

type Row = Awaited<ReturnType<typeof listPickupRequests>>["items"][number];
type Notification = Row["notification"];
const label = (s: string) => s.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());

function AdminLoading() {
  return (
    <main className="admin-page" aria-busy="true" aria-label="Loading pickup requests">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">USED MOBILES · OPERATIONS</p>
          <h1 className="mt-1 text-2xl font-bold">Pickup requests</h1>
        </div>
      </div>
      <div className="mt-7 grid gap-3" role="status">
        <span className="sr-only">Loading pickup requests…</span>
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-20 animate-pulse rounded-xl border border-border bg-card" />
        ))}
      </div>
    </main>
  );
}

function AdminPage() {
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

  async function signOut() {
    await navigate({ to: "/auth", replace: true });
    await supabase.auth.signOut();
    // Clear private loader data before a subsequent account signs in.
    await navigate({ to: "/auth", replace: true, reloadDocument: true });
  }

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
    return (
      <main className="exception-page">
        <section className="exception-panel">
          <p className="eyebrow">Restricted area</p>
          <h1 className="mt-2 text-2xl font-bold">No admin access</h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            This signed-in account is not assigned an administrator role.
          </p>
          <Button variant="outline" className="mt-6" onClick={signOut}>
            Sign out
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-heading">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <BrandLogo className="size-12 shrink-0 rounded-full object-contain" />
          <div className="min-w-0">
            <p className="eyebrow">USED MOBILES · OPERATIONS</p>
            <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Pickup requests</h1>
          </div>
        </div>
        <Button
          variant="outline"
          className="shrink-0 border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          onClick={signOut}
        >
          Sign out
        </Button>
      </header>

      <section className="admin-toolbar" aria-label="Request search and filters">
        <div>
          <p className="eyebrow">Request queue</p>
          <h2 className="mt-1 font-display text-xl font-bold">Customer pickups</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} loaded{cursor ? " · more available" : ""}
          </p>
        </div>
        <form onSubmit={applyFilters} className="admin-filter-form">
          <input
            aria-label="Search pickup requests"
            placeholder="Reference, name, mobile or device"
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
          <Button type="submit" disabled={busy} className="h-12 px-5">
            {busy ? "Loading…" : "Apply"}
          </Button>
        </form>
      </section>

      {message && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {message}
        </p>
      )}
      {rows.length === 0 ? (
        <div className="admin-empty mt-6">
          <p className="font-semibold text-foreground">No pickup requests found</p>
          <p className="mt-1 text-sm">Try a different search or status filter.</p>
        </div>
      ) : (
        <ul className="admin-request-list" aria-label="Pickup request results">
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
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={loadOlder} disabled={busy} className="min-h-11 px-5">
            {busy ? "Loading…" : "Load older requests"}
          </Button>
        </div>
      )}
    </main>
  );
}

function canRetryNotification(notification: NonNullable<Notification>) {
  if (notification.channel !== "telegram") return false;
  if (notification.status === "pending" || notification.status === "failed") return true;
  return false;
}

function notificationIsStaleSending(notification: NonNullable<Notification>) {
  if (notification.status !== "sending" || !notification.last_attempt_at) return false;
  return Date.now() - new Date(notification.last_attempt_at).getTime() >= 2 * 60_000;
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

  async function retryTelegramAlert() {
    setNotificationState("Retrying…");
    try {
      const notification = await retry({ data: { requestId: row.id } });
      onNotificationSaved(row.id, notification);
      setNotificationState(
        notification?.status === "sent"
          ? "Telegram confirmed the alert."
          : notification?.status === "unknown" ||
              (notification?.status === "sending" && notificationIsStaleSending(notification))
            ? "Outcome unconfirmed. Check the Telegram group before taking action."
            : "Telegram rejected the alert. You can retry it.",
      );
    } catch {
      setNotificationState("Could not retry the notification. Please try again.");
    }
  }

  const notification = row.notification;
  const notificationDescription = !notification
    ? "No notification was queued for this older request."
    : notification.channel === "email"
      ? `Historical alert status retained: ${label(notification.status)}. New alerts use Telegram.`
      : notification.status === "sent"
        ? `Accepted by Telegram${notification.delivered_at ? ` on ${new Date(notification.delivered_at).toLocaleString("en-IN")}` : ""}.`
        : notification.status === "unknown"
          ? "Delivery outcome is unconfirmed. Check the Telegram group before taking action."
          : notificationIsStaleSending(notification)
            ? "Delivery outcome is unconfirmed. Check the Telegram group before taking action."
            : notification.status === "sending"
              ? "Sending alert to Telegram…"
              : `${label(notification.status)}${notification.last_error_code ? `: ${notification.last_error_code}` : ""}.`;

  return (
    <li className="admin-request">
      <details>
        <summary className="admin-request-summary cursor-pointer">
          <div className="min-w-0">
            <span className="font-num text-xs font-bold text-amber-dark">{row.reference}</span>
            <p className="mt-0.5 truncate font-semibold">{row.customer_name}</p>
          </div>
          <span className="font-num text-sm font-semibold">{row.mobile}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{row.model}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.brand} · {row.variant}
            </p>
          </div>
          <div className="text-right">
            <p className="font-num font-bold">{formatINR(Number(row.estimate))}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatPickupDate(row.slot_date)} · {row.slot_time}
            </p>
          </div>
          <span className={`status-chip status-${row.status}`}>{label(row.status)}</span>
        </summary>
        <div className="admin-request-detail grid gap-6 lg:grid-cols-[1fr_minmax(18rem,0.8fr)]">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="eyebrow">Pickup details</h3>
              <p className="mt-2 leading-relaxed">
                {row.address_line}, {row.locality}
                {row.landmark ? ` (near ${row.landmark})` : ""}, Hyderabad {row.pincode}
              </p>
              <a
                href={`tel:${row.mobile}`}
                className="mt-2 inline-block font-semibold underline underline-offset-4"
              >
                Call {row.customer_name} · {row.mobile}
              </a>
              <p className="mt-2 text-muted-foreground">
                Phone verification: {label(row.phone_verification_status)}
              </p>
              <p className="mt-1 text-muted-foreground">
                Submitted {new Date(row.created_at).toLocaleString("en-IN")}
              </p>
            </section>
            <section className="border-t border-border pt-4">
              <h3 className="eyebrow">Estimate details</h3>
              <p className="mt-2">
                {row.brand} {row.model} · {row.variant}
              </p>
              <p className="mt-1 text-muted-foreground">
                Variant maximum {formatINR(Number(row.base_value))} · Estimated offer{" "}
                {formatINR(Number(row.estimate))}
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
                {row.answer_summary.map((answer) => (
                  <li key={answer}>{answer}</li>
                ))}
              </ul>
            </section>
          </div>
          <div className="admin-request-controls space-y-4">
            <section className="rounded-lg border border-border bg-card p-3 text-sm">
              <h3 className="font-semibold">Telegram lead alert</h3>
              <p className="mt-1 leading-relaxed text-muted-foreground">
                {notificationDescription}
              </p>
              {notification && canRetryNotification(notification) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={retryTelegramAlert}
                  disabled={notificationState === "Retrying…"}
                >
                  Retry Telegram alert
                </Button>
              )}
              {notificationState && (
                <p role="status" className="mt-2 text-xs text-muted-foreground">
                  {notificationState}
                </p>
              )}
            </section>
            <label className="block text-xs font-semibold">
              Request status
              <select
                value={edit.status}
                onChange={(event) => setEdit({ ...edit, status: event.target.value })}
                className="field mt-1.5"
              >
                {REQUEST_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {label(status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold">
              Assigned staff member
              <input
                placeholder="Staff name"
                maxLength={80}
                value={edit.assignedTo}
                onChange={(event) => setEdit({ ...edit, assignedTo: event.target.value })}
                className="field mt-1.5"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold">
                Pickup date
                <input
                  type="date"
                  value={edit.slotDate}
                  onChange={(event) => setEdit({ ...edit, slotDate: event.target.value })}
                  className="field mt-1.5 px-2"
                />
              </label>
              <label className="block text-xs font-semibold">
                Time slot
                <select
                  value={edit.slotTime}
                  onChange={(event) => setEdit({ ...edit, slotTime: event.target.value })}
                  className="field mt-1.5 px-2"
                >
                  {PICKUP_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block text-xs font-semibold">
              Internal notes
              <textarea
                placeholder="Notes for the team"
                maxLength={1000}
                value={edit.adminNotes}
                onChange={(event) => setEdit({ ...edit, adminNotes: event.target.value })}
                className="field mt-1.5 h-24 py-3"
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={submit} disabled={state === "Saving…"}>
                {state === "Saving…" ? "Saving…" : "Save changes"}
              </Button>
              <span role="status" className="text-xs text-muted-foreground">
                {state}
              </span>
            </div>
          </div>
        </div>
      </details>
    </li>
  );
}
