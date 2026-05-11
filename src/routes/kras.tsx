import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Filter, Plus, Pencil, Users2, Eye } from "lucide-react";
import { objectiveStyles, type Objective } from "@/data/kra";
import { useKraStore } from "@/store/kraStore";
import { KraDetailsDrawer } from "@/components/KraDetailsDrawer";

export const Route = createFileRoute("/kras")({
  component: KraList,
  head: () => ({ meta: [{ title: "All KRAs — Adani KRA Management" }] }),
});

const objectives: ("All" | Objective)[] = [
  "All",
  "P&L Delivery",
  "Future Proofing",
  "Talent Development",
  "Capex",
  "BD, M&A & Growth",
  "Digitization & Tech",
];

function KraList() {
  const { kras } = useKraStore();
  const [obj, setObj] = useState<(typeof objectives)[number]>("All");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      kras.filter((k) => {
        const matchesObj = obj === "All" || k.objective === obj;
        const text = (k.description + k.subObjective + k.objective).toLowerCase();
        return matchesObj && text.includes(q.toLowerCase());
      }),
    [obj, q, kras]
  );

  const cumulative = filtered.reduce((s, k) => s + k.weight, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">KRA List</h1>
          <p className="text-muted-foreground">Manage and track all Key Result Areas</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]" style={{ background: "var(--gradient-primary)" }}>
            Cumulative Weight <span className="ml-2 text-base font-extrabold">{cumulative}%</span>
          </div>
          <button className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-secondary">
            Submit KRA
          </button>
          <Link to="/new" className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-primary-foreground" style={{ background: "var(--gradient-magenta)" }}>
            <Plus className="h-4 w-4" /> Create New KRA
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search KRAs by description or objective…"
              className="w-full rounded-2xl border border-border bg-secondary/50 py-3 pl-11 pr-4 text-sm outline-none focus:border-ring"
            />
          </div>
          <button className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {objectives.map((o) => {
            const active = obj === o;
            return (
              <button
                key={o}
                onClick={() => setObj(o)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "text-primary-foreground shadow-md"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
                style={active ? { background: o === "All" ? "var(--gradient-primary)" : objectiveStyles[o as Objective].gradient } : undefined}
              >
                {o}
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {kras.length} KRAs
      </div>

      <div className="space-y-4">
        {filtered.map((k) => {
          const s = objectiveStyles[k.objective];
          return (
            <div key={k.id} className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${s.chip}`}>
                      {k.objective}
                    </span>
                    <StatusBadge status={k.status} />
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                      {k.evaluation}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold leading-snug">{k.description}</h3>
                </div>
                <div className="rounded-2xl px-5 py-3 text-right text-primary-foreground shadow-md" style={{ background: s.gradient }}>
                  <div className="text-[10px] uppercase tracking-wider opacity-80">Weight</div>
                  <div className="text-2xl font-extrabold leading-none">{k.weight}%</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                <Field label="Sub Objective" value={k.subObjective} />
                <Field label="UoM" value={k.uom} />
                <Field label="Target" value={String(k.target)} />
                <Field label="Time Frame" value={k.timeFrame} />
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {k.cascadedTo.slice(0, 5).map((c) => (
                      <div key={c.code} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card text-[10px] font-bold text-primary-foreground" style={{ background: s.gradient }}>
                        {c.code}
                      </div>
                    ))}
                    {k.cascadedTo.length > 5 && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-secondary text-[10px] font-bold">
                        +{k.cascadedTo.length - 5}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <Users2 className="mr-1 inline h-3.5 w-3.5" /> Cascaded to {k.cascadedTo.length} leader{k.cascadedTo.length !== 1 ? "s" : ""}
                  </div>
                </div>

                <div className="flex flex-1 items-center gap-3 md:max-w-md">
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full" style={{ width: `${k.progress}%`, background: s.gradient }} />
                    </div>
                  </div>
                  <div className="text-sm font-bold">{k.progress}%</div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setOpenId(k.id)} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">
                    <Eye className="h-3.5 w-3.5" /> Details
                  </button>
                  <button onClick={() => setOpenId(k.id)} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-primary-foreground" style={{ background: s.gradient }}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <KraDetailsDrawer kraId={openId} open={!!openId} onOpenChange={(b) => !b && setOpenId(null)} />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary/60 px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Submitted"
      ? "bg-[oklch(0.95_0.06_160)] text-[oklch(0.38_0.16_160)]"
      : status === "Draft"
      ? "bg-[oklch(0.96_0.07_60)] text-[oklch(0.42_0.18_50)]"
      : "bg-[oklch(0.95_0.06_290)] text-[oklch(0.42_0.2_285)]";
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${tone}`}>{status}</span>;
}