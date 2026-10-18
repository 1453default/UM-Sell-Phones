import { BrandLogo } from "@/components/public/BrandLogo";
import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { checkAdmin, listPickupRequests, updatePickupRequest } from "@/lib/pickup.functions";
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
    return { isAdmin, rows: isAdmin ? await listPickupRequests() : [] };
  },
  component: AdminPage,
});

type Row = Awaited<ReturnType<typeof listPickupRequests>>[number];
const label = (s: string) => s.replace("_", " ").replace(/^./, (c) => c.toUpperCase());

function AdminPage() {
  const { isAdmin, rows: initial } = Route.useLoaderData();
  const navigate = useNavigate();
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
  async function signOut() {
    await navigate({ to: "/auth", replace: true });
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (!isAdmin)
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <h1 className="text-2xl font-bold">No admin access</h1>
        <p className="mt-3 text-muted-foreground">This account is not an administrator.</p>
        <Button variant="outline" className="mt-6" onClick={signOut}>Sign out</Button>
      </main>
    );

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4"><BrandLogo /><h1 className="font-display text-3xl font-bold">Pickup requests</h1></div>
        <Button variant="outline" onClick={signOut}>Sign out</Button>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <input aria-label="Search" placeholder="Search reference, name, mobile, model" value={q} onChange={(e) => setQ(e.target.value)} className="field max-w-xs" />
        <select aria-label="Filter by status" value={filter} onChange={(e) => setFilter(e.target.value)} className="field max-w-[200px]">
          <option value="all">All statuses ({rows.length})</option>
          {REQUEST_STATUSES.map((s) => (
            <option key={s} value={s}>{label(s)} ({rows.filter((r) => r.status === s).length})</option>
          ))}
        </select>
      </div>
      {shown.length === 0 ? (
        <p className="mt-10 text-muted-foreground">No requests found.</p>
      ) : (
        <ul className="mt-6 divide-y divide-border border-y border-border">
          {shown.map((r) => (
            <RequestItem key={r.id} row={r} onSaved={(n) => setRows((all) => all.map((x) => (x.id === n.id ? n : x)))} />
          ))}
        </ul>
      )}
    </main>
  );
}

function RequestItem({ row, onSaved }: { row: Row; onSaved: (r: Row) => void }) {
  const save = useServerFn(updatePickupRequest);
  const [edit, setEdit] = useState({
    status: row.status,
    assignedTo: row.assigned_to ?? "",
    adminNotes: row.admin_notes ?? "",
    slotDate: row.slot_date,
    slotTime: row.slot_time,
  });
  const [state, setState] = useState("");
  async function submit() {
    if (state === "Saving…") return;
    setState("Saving…");
    try {
      const saved = await save({ data: { id: row.id, ...edit, status: edit.status as (typeof REQUEST_STATUSES)[number] } });
      onSaved(saved);
      setState("Saved");
    } catch (error) {
      setState(error instanceof Error && error.message === "Choose a valid upcoming pickup date and time." ? error.message : "Could not save. Please try again.");
    }
  }
  return (
    <li className="py-5">
      <details>
        <summary className="flex cursor-pointer flex-wrap items-baseline gap-x-5 gap-y-1">
          <span className="font-num font-bold">{row.reference}</span>
          <span>{row.customer_name}</span>
          <a href={`tel:${row.mobile}`} className="underline">{row.mobile}</a>
          <span className="text-muted-foreground">{row.model} · {row.variant}</span>
          <span className="font-num">{formatINR(Number(row.estimate))}</span>
          <span className="text-sm">{formatPickupDate(row.slot_date)}, {row.slot_time}</span>
          <span className="border border-border px-2 text-xs font-semibold uppercase">{label(row.status)}</span>
        </summary>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div className="space-y-2 text-sm">
            <p><strong>Address:</strong> {row.address_line}, {row.locality}{row.landmark ? ` (near ${row.landmark})` : ""}, Hyderabad {row.pincode}</p>
            <p><strong>Phone verification:</strong> {row.phone_verification_status}</p>
            <p><strong>Device:</strong> {row.brand} {row.model}, {row.variant}</p>
            <p><strong>Base value:</strong> {formatINR(Number(row.base_value))} · <strong>Estimate:</strong> {formatINR(Number(row.estimate))}</p>
            <p><strong>Submitted:</strong> {new Date(row.created_at).toLocaleString("en-IN")}</p>
            <ul className="list-disc pl-5 text-muted-foreground">
              {row.answer_summary.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </div>
          <div className="space-y-3">
            <select aria-label="Status" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })} className="field">
              {REQUEST_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
            </select>
            <input aria-label="Assigned to" placeholder="Assigned to (staff name)" value={edit.assignedTo} onChange={(e) => setEdit({ ...edit, assignedTo: e.target.value })} className="field" />
            <div className="grid grid-cols-2 gap-3">
              <input aria-label="Pickup date" type="date" value={edit.slotDate} onChange={(e) => setEdit({ ...edit, slotDate: e.target.value })} className="field" />
              <select aria-label="Time slot" value={edit.slotTime} onChange={(e) => setEdit({ ...edit, slotTime: e.target.value })} className="field">
                {PICKUP_SLOTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <textarea aria-label="Notes" placeholder="Internal notes" value={edit.adminNotes} onChange={(e) => setEdit({ ...edit, adminNotes: e.target.value })} className="field h-24 py-3" />
            <div className="flex items-center gap-3">
              <Button onClick={submit} disabled={state === "Saving…"}>Save changes</Button>
              <span role="status" className="text-sm text-muted-foreground">{state}</span>
            </div>
          </div>
        </div>
      </details>
    </li>
  );
}
