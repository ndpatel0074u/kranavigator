import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useKraStore } from "@/store/kraStore";
import { objectiveStyles, seniorTeam } from "@/data/kra";
import { Activity, Edit3, History, TrendingUp, CheckCircle2, ClipboardList, Plus, Users2, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { KraForm } from "@/components/KraForm";

type Tab = "overview" | "trend" | "actuals" | "audit" | "edit";

export function KraDetailsDrawer({
  kraId,
  open,
  onOpenChange,
}: {
  kraId: string | null;
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const { getKra, updateKra, addActual, setStatus } = useKraStore();
  const [tab, setTab] = useState<Tab>("overview");
  const k = kraId ? getKra(kraId) : undefined;
  if (!k) return null;
  const s = objectiveStyles[k.objective];

  const trendData = k.actuals.map((a) => ({ name: a.period, actual: a.actual, progress: a.progress }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-2xl">
        <div className="px-6 pt-6">
          <SheetHeader>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${s.chip}`}>
                {k.objective}
              </span>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                {k.subObjective}
              </span>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                {k.timeFrame} · {k.evaluation}
              </span>
            </div>
            <SheetTitle className="text-2xl font-extrabold leading-snug">{k.description}</SheetTitle>
          </SheetHeader>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <Stat label="Weight" value={`${k.weight}%`} gradient={s.gradient} />
            <Stat label="Target" value={String(k.target)} />
            <Stat label="Progress" value={`${k.progress}%`} gradient={s.gradient} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status:</span>
            {(["Draft", "In Review", "Submitted"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatus(k.id, st)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  k.status === st
                    ? "text-primary-foreground shadow"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
                style={k.status === st ? { background: s.gradient } : undefined}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-1 border-b border-border px-6">
          {([
            ["overview", "Overview", ClipboardList],
            ["trend", "KPI Trend", TrendingUp],
            ["actuals", "Update Actual", Activity],
            ["audit", "Audit Log", History],
            ["edit", "Edit", Edit3],
          ] as const).map(([k2, label, Icon]) => (
            <button
              key={k2}
              onClick={() => setTab(k2)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition ${
                tab === k2
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        <div className="px-6 pb-10 pt-5">
          {tab === "overview" && (
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Users2 className="mr-1 inline h-3.5 w-3.5" /> Cascaded To
                </h4>
                <div className="flex flex-wrap gap-2">
                  {k.cascadedTo.length === 0 && <span className="text-sm text-muted-foreground">Not cascaded yet.</span>}
                </div>
                {k.cascadedTo.length > 0 && (
                  <div className="overflow-hidden rounded-2xl border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 text-left">Member</th>
                          <th className="px-3 py-2 text-right">Target</th>
                          <th className="px-3 py-2 text-right">Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {k.cascadedTo.map((c) => {
                          const m = seniorTeam.find((x) => x.code === c.code);
                          return (
                            <tr key={c.code} className="border-t border-border">
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold text-primary-foreground" style={{ background: s.gradient }}>
                                    {c.code}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="truncate text-xs font-semibold">{m?.name ?? c.code}</div>
                                    <div className="truncate text-[10px] text-muted-foreground">{m?.area}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-right text-sm font-semibold">
                                {c.target} <span className="text-[10px] font-normal text-muted-foreground">{k.uom}</span>
                              </td>
                              <td className="px-3 py-2 text-right text-sm font-semibold">{c.weight}%</td>
                            </tr>
                          );
                        })}
                        <tr className="border-t border-border bg-secondary/40 text-xs font-bold">
                          <td className="px-3 py-2 text-right text-muted-foreground">Total</td>
                          <td></td>
                          <td className="px-3 py-2 text-right">
                            {Math.round(k.cascadedTo.reduce((s2, c) => s2 + (Number(c.weight) || 0), 0) * 10) / 10}% / {k.weight}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Latest Update</h4>
                {k.actuals.length ? (
                  <div className="text-sm">
                    <div className="font-semibold">
                      {k.actuals[k.actuals.length - 1].period}: {k.actuals[k.actuals.length - 1].actual} {k.uom}
                    </div>
                    <div className="text-muted-foreground">{k.actuals[k.actuals.length - 1].note || "—"}</div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No actuals reported yet.</div>
                )}
              </div>
            </div>
          )}

          {tab === "trend" && (
            <div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <h4 className="mb-3 text-sm font-bold">KPI Trend — {k.uom}</h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="oklch(0.58 0.22 260)" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="oklch(0.58 0.22 260)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.015 250)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="actual" stroke="oklch(0.58 0.22 260)" fill="url(#g)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-border bg-card p-4">
                <h4 className="mb-3 text-sm font-bold">Progress %</h4>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.015 250)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="progress" stroke="oklch(0.62 0.26 330)" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {tab === "actuals" && <ActualForm kraId={k.id} uom={k.uom} onAdd={addActual} actuals={k.actuals} />}

          {tab === "audit" && (
            <ul className="space-y-3">
              {k.audit.map((a) => (
                <li key={a.id} className="rounded-2xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold">{a.action}</span>
                    <span className="text-muted-foreground">{new Date(a.date).toLocaleString()}</span>
                  </div>
                  <div className="mt-1 text-sm">{a.detail}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">by {a.by}</div>
                </li>
              ))}
            </ul>
          )}

          {tab === "edit" && (
            <KraForm
              initial={k}
              submitLabel="Save Changes"
              onSubmit={(v) => {
                updateKra(k.id, v);
                setTab("overview");
              }}
              onCancel={() => setTab("overview")}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value, gradient }: { label: string; value: string; gradient?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className="mt-1 text-xl font-extrabold"
        style={gradient ? { backgroundImage: gradient, WebkitBackgroundClip: "text", color: "transparent" } : undefined}
      >
        {value}
      </div>
    </div>
  );
}

function ActualForm({
  kraId,
  uom,
  actuals,
  onAdd,
}: {
  kraId: string;
  uom: string;
  actuals: { period: string; actual: number; progress: number; date: string; by: string; note?: string; id: string }[];
  onAdd: (id: string, e: { period: string; actual: number; progress: number; note?: string; by: string }) => void;
}) {
  const [period, setPeriod] = useState("");
  const [actual, setActual] = useState<number | "">("");
  const [progress, setProgress] = useState<number | "">("");
  const [note, setNote] = useState("");
  const [uploadMsg, setUploadMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const handleFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      let count = 0;
      for (const r of rows) {
        const lower: Record<string, unknown> = {};
        Object.entries(r).forEach(([k, v]) => (lower[k.toString().trim().toLowerCase()] = v));
        const period = String(lower["period"] ?? "");
        const actual = Number(lower["actual"]);
        const progress = Number(lower["progress"] ?? lower["progress %"] ?? lower["progress%"] ?? 0);
        const note = String(lower["note"] ?? "");
        if (!period || isNaN(actual)) continue;
        onAdd(kraId, { period, actual, progress: isNaN(progress) ? 0 : progress, note, by: "Excel Upload" });
        count++;
      }
      setUploadMsg(
        count > 0
          ? { kind: "ok", text: `Imported ${count} row${count === 1 ? "" : "s"} from ${file.name}` }
          : { kind: "err", text: "No valid rows found. Expected columns: period, actual, progress, note." },
      );
    } catch {
      setUploadMsg({ kind: "err", text: "Failed to parse file. Use .xlsx or .csv." });
    }
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!period || actual === "" || progress === "") return;
          onAdd(kraId, { period, actual: Number(actual), progress: Number(progress), note, by: "CEO" });
          setPeriod("");
          setActual("");
          setProgress("");
          setNote("");
        }}
        className="space-y-3 rounded-2xl border border-border bg-card p-4"
      >
        <div className="flex items-center gap-2 text-sm font-bold">
          <Plus className="h-4 w-4" /> Report Actual
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input className="rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm" placeholder="Period (e.g. Q1)" value={period} onChange={(e) => setPeriod(e.target.value)} />
          <input type="number" className="rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm" placeholder={`Actual (${uom})`} value={actual} onChange={(e) => setActual(e.target.value === "" ? "" : Number(e.target.value))} />
          <input type="number" min={0} max={100} className="rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm" placeholder="Progress %" value={progress} onChange={(e) => setProgress(e.target.value === "" ? "" : Number(e.target.value))} />
        </div>
        <textarea className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm" placeholder="Add a note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button type="submit" className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
          <CheckCircle2 className="h-4 w-4" /> Submit Update
        </button>
      </form>

      <div className="space-y-2 rounded-2xl border border-dashed border-border bg-secondary/30 p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold">
              <Upload className="h-4 w-4" /> Bulk Upload Actuals
            </div>
            <div className="text-[11px] text-muted-foreground">
              Excel/CSV with columns: <span className="font-semibold">period, actual, progress, note</span>
            </div>
          </div>
          <label className="cursor-pointer rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-secondary">
            Choose file
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {uploadMsg && (
          <div
            className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${
              uploadMsg.kind === "ok"
                ? "bg-emerald-500/10 text-emerald-700"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {uploadMsg.text}
          </div>
        )}
      </div>

      <div>
        <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Reported Actuals</h4>
        <ul className="space-y-2">
          {actuals.length === 0 && <li className="text-sm text-muted-foreground">No updates yet.</li>}
          {[...actuals].reverse().map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-sm">
              <div>
                <div className="font-semibold">{a.period} — {a.actual} {uom}</div>
                {a.note && <div className="text-xs text-muted-foreground">{a.note}</div>}
              </div>
              <div className="text-right text-xs">
                <div className="font-bold">{a.progress}%</div>
                <div className="text-muted-foreground">{new Date(a.date).toLocaleDateString()}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}