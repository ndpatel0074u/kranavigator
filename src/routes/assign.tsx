import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Trash2 } from "lucide-react";
import { objectiveStyles, seniorTeam, type CascadeAssignment } from "@/data/kra";
import { useKraStore } from "@/store/kraStore";

export const Route = createFileRoute("/assign")({
  component: AssignPage,
  head: () => ({ meta: [{ title: "Assign KRA — Adani KRA Management" }] }),
});

function AssignPage() {
  const { kras, updateKra } = useKraStore();
  const [selectedKra, setSelectedKra] = useState(kras[0].id);
  const [assignments, setAssignments] = useState<CascadeAssignment[]>([]);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const kra = useMemo(() => kras.find((k) => k.id === selectedKra)!, [kras, selectedKra]);
  const s = objectiveStyles[kra.objective];

  // when KRA changes, preload its existing cascade
  useEffect(() => {
    setAssignments(kra.cascadedTo.map((c) => ({ ...c })));
    setSavedMsg(null);
  }, [kra.id]);

  const isNumTarget = typeof kra.target === "number";

  const toggle = (code: string) =>
    setAssignments((p) => {
      const exists = p.find((c) => c.code === code);
      if (exists) return p.filter((c) => c.code !== code);
      const remainingW = Math.max(0, kra.weight - p.reduce((s2, c) => s2 + (Number(c.weight) || 0), 0));
      const t = isNumTarget
        ? Math.round(((kra.target as number) / (p.length + 1)) * 10) / 10
        : (kra.target as string);
      return [
        ...p,
        {
          code,
          target: t,
          weight: remainingW > 0 ? remainingW : Math.round((kra.weight / (p.length + 1)) * 10) / 10,
        },
      ];
    });

  const update = (code: string, patch: Partial<CascadeAssignment>) =>
    setAssignments((p) => p.map((c) => (c.code === code ? { ...c, ...patch } : c)));

  const distribute = () => {
    if (assignments.length === 0) return;
    const w = Math.round((kra.weight / assignments.length) * 10) / 10;
    const t = isNumTarget
      ? Math.round(((kra.target as number) / assignments.length) * 10) / 10
      : (kra.target as string);
    setAssignments((p) => p.map((c) => ({ ...c, weight: w, target: t })));
  };

  const totalWeight = assignments.reduce((s2, c) => s2 + (Number(c.weight) || 0), 0);

  const save = () => {
    updateKra(kra.id, { cascadedTo: assignments });
    setSavedMsg(`Cascaded to ${assignments.length} member${assignments.length === 1 ? "" : "s"} ✓`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Assign KRA</h1>
        <p className="text-muted-foreground">Cascade a CEO KRA down to the senior leadership team</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Left: pick KRA */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="mb-4 text-lg font-bold">1. Select a KRA</h2>
          <div className="max-h-[560px] space-y-2 overflow-y-auto pr-2">
            {kras.map((k) => {
              const active = k.id === selectedKra;
              const ks = objectiveStyles[k.objective];
              return (
                <button
                  key={k.id}
                  onClick={() => setSelectedKra(k.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    active ? "border-transparent shadow-[var(--shadow-glow)]" : "border-border hover:bg-secondary/60"
                  }`}
                  style={active ? { background: "linear-gradient(180deg, oklch(0.99 0.005 250), oklch(0.96 0.04 270))" } : undefined}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ks.chip}`}>
                        {k.objective}
                      </span>
                      <div className="mt-2 text-sm font-semibold leading-snug">{k.description}</div>
                      <div className="text-xs text-muted-foreground">{k.subObjective} · {k.uom}</div>
                    </div>
                    <div className="text-xs font-bold text-muted-foreground">{k.weight}%</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: pick people */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selected KRA</div>
                <div className="mt-1 text-lg font-bold leading-snug">{kra.description}</div>
              </div>
              <div className="rounded-xl px-3 py-2 text-primary-foreground" style={{ background: s.gradient }}>
                <div className="text-[10px] uppercase opacity-80">Weight</div>
                <div className="text-lg font-extrabold leading-none">{kra.weight}%</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">2. Select & Allocate</h2>
              {assignments.length > 0 && (
                <button onClick={distribute} className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-semibold hover:bg-secondary">
                  Split evenly
                </button>
              )}
            </div>
            <div className="mb-4 flex flex-wrap gap-1.5 rounded-2xl border border-dashed border-border bg-secondary/30 p-3">
              {seniorTeam.map((m) => {
                const sel = assignments.some((c) => c.code === m.code);
                return (
                  <button
                    key={m.code}
                    onClick={() => toggle(m.code)}
                    className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                      sel
                        ? "border-transparent text-primary-foreground shadow"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                    style={sel ? { background: s.gradient } : undefined}
                  >
                    {sel && <Check className="h-3 w-3" />} {m.code} · {m.name.split(" ")[0]}
                  </button>
                );
              })}
            </div>

            {assignments.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Member</th>
                      <th className="px-3 py-2 text-left">Target ({kra.uom})</th>
                      <th className="px-3 py-2 text-left">Weight (%)</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((c) => {
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
                          <td className="px-3 py-2">
                            <input
                              value={String(c.target)}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const num = Number(raw);
                                update(c.code, { target: raw !== "" && !isNaN(num) ? num : raw });
                              }}
                              className="w-full rounded-lg border border-border bg-secondary/40 px-2 py-1.5 text-xs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              value={c.weight}
                              onChange={(e) => update(c.code, { weight: Number(e.target.value) })}
                              className="w-full rounded-lg border border-border bg-secondary/40 px-2 py-1.5 text-xs"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button onClick={() => toggle(c.code)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive" aria-label="Remove">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="border-t border-border bg-secondary/40 text-xs font-bold">
                      <td className="px-3 py-2 text-right text-muted-foreground">Cascaded weight total</td>
                      <td></td>
                      <td className="px-3 py-2">
                        <span className={totalWeight > kra.weight ? "text-destructive" : ""}>
                          {Math.round(totalWeight * 10) / 10}% / {kra.weight}%
                        </span>
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Pick team members above to allocate target & weight.
              </div>
            )}

            {savedMsg && (
              <div className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700">
                {savedMsg}
              </div>
            )}

            <button
              disabled={assignments.length === 0}
              onClick={save}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:scale-[1.01] disabled:opacity-50"
              style={{ background: "var(--gradient-primary)" }}
            >
              Cascade to {assignments.length || "0"} member{assignments.length === 1 ? "" : "s"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}