import { useState } from "react";
import { seniorTeam, type CascadeAssignment, type KRA, type Objective } from "@/data/kra";
import { Check, Plus, Trash2, X } from "lucide-react";

const objectives: Objective[] = [
  "P&L Delivery",
  "Future Proofing",
  "Talent Development",
  "Capex",
  "BD, M&A & Growth",
  "Digitization & Tech",
];

export type KraFormValue = Omit<KRA, "id">;

const empty: KraFormValue = {
  objective: "P&L Delivery",
  subObjective: "",
  description: "",
  uom: "",
  target: "",
  weight: 5,
  progress: 0,
  cascadedTo: [],
  timeFrame: "Annually",
  evaluation: "Quantitative",
  status: "Draft",
  owner: "CEO",
};

export function KraForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save KRA",
}: {
  initial?: Partial<KraFormValue>;
  onSubmit: (v: KraFormValue) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [v, setV] = useState<KraFormValue>({ ...empty, ...initial });
  const set = <K extends keyof KraFormValue>(k: K, val: KraFormValue[K]) =>
    setV((p) => ({ ...p, [k]: val }));

  const toggleCascade = (code: string) => {
    setV((p) => {
      const exists = p.cascadedTo.find((c) => c.code === code);
      if (exists) return { ...p, cascadedTo: p.cascadedTo.filter((c) => c.code !== code) };
      const remaining = Math.max(
        0,
        p.weight - p.cascadedTo.reduce((s, c) => s + (Number(c.weight) || 0), 0),
      );
      const isNum = typeof p.target === "number" || (!isNaN(Number(p.target)) && p.target !== "");
      const t = isNum ? Number(p.target) : p.target;
      return {
        ...p,
        cascadedTo: [
          ...p.cascadedTo,
          {
            code,
            target: isNum ? Math.round((Number(t) / (p.cascadedTo.length + 1)) * 10) / 10 : (p.target as string),
            weight: remaining > 0 ? remaining : Math.round((p.weight / (p.cascadedTo.length + 1)) * 10) / 10,
          } satisfies CascadeAssignment,
        ],
      };
    });
  };

  const updateCascade = (code: string, patch: Partial<CascadeAssignment>) => {
    setV((p) => ({
      ...p,
      cascadedTo: p.cascadedTo.map((c) => (c.code === code ? { ...c, ...patch } : c)),
    }));
  };

  const distributeEvenly = () => {
    setV((p) => {
      if (p.cascadedTo.length === 0) return p;
      const w = Math.round((p.weight / p.cascadedTo.length) * 10) / 10;
      const isNum = typeof p.target === "number" || (!isNaN(Number(p.target)) && p.target !== "");
      const t = isNum
        ? Math.round((Number(p.target) / p.cascadedTo.length) * 10) / 10
        : p.target;
      return {
        ...p,
        cascadedTo: p.cascadedTo.map((c) => ({ ...c, weight: w, target: t })),
      };
    });
  };

  const totalCascadedWeight = v.cascadedTo.reduce((s, c) => s + (Number(c.weight) || 0), 0);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!v.description.trim() || !v.subObjective.trim() || !v.uom.trim()) return;
        onSubmit(v);
      }}
      className="space-y-5"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Business Objective">
          <select
            value={v.objective}
            onChange={(e) => set("objective", e.target.value as Objective)}
            className="input"
          >
            {objectives.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </Field>
        <Field label="Sub Objective">
          <input
            value={v.subObjective}
            onChange={(e) => set("subObjective", e.target.value)}
            className="input"
            placeholder="e.g. Revenue, EBITDA"
          />
        </Field>
      </div>

      <Field label="KRA Description">
        <textarea
          value={v.description}
          onChange={(e) => set("description", e.target.value)}
          className="input min-h-[80px]"
          placeholder="What outcome will be achieved?"
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-4">
        <Field label="Unit of Measure">
          <input value={v.uom} onChange={(e) => set("uom", e.target.value)} className="input" placeholder="Rs Cr / # / %" />
        </Field>
        <Field label="Target">
          <input
            value={String(v.target)}
            onChange={(e) => set("target", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Weight (%)">
          <input
            type="number"
            min={0}
            max={100}
            value={v.weight}
            onChange={(e) => set("weight", Number(e.target.value))}
            className="input"
          />
        </Field>
        <Field label="Time Frame">
          <select
            value={v.timeFrame}
            onChange={(e) => set("timeFrame", e.target.value as KRA["timeFrame"])}
            className="input"
          >
            <option>Annually</option>
            <option>Quarterly</option>
            <option>Monthly</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Evaluation Type">
          <select
            value={v.evaluation}
            onChange={(e) => set("evaluation", e.target.value as KRA["evaluation"])}
            className="input"
          >
            <option>Quantitative</option>
            <option>Qualitative</option>
          </select>
        </Field>
        <Field label="Status">
          <select
            value={v.status}
            onChange={(e) => set("status", e.target.value as KRA["status"])}
            className="input"
          >
            <option>Draft</option>
            <option>In Review</option>
            <option>Submitted</option>
          </select>
        </Field>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Cascade to Senior Team ({v.cascadedTo.length} selected)
          </span>
          {v.cascadedTo.length > 0 && (
            <button
              type="button"
              onClick={distributeEvenly}
              className="rounded-lg border border-border px-2 py-1 text-[11px] font-semibold hover:bg-secondary"
            >
              Split evenly
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-dashed border-border bg-secondary/30 p-3">
          {seniorTeam.map((m) => {
            const active = v.cascadedTo.some((c) => c.code === m.code);
            return (
              <button
                type="button"
                key={m.code}
                onClick={() => toggleCascade(m.code)}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                  active
                    ? "border-transparent text-primary-foreground shadow"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
                style={active ? { background: "var(--gradient-primary)" } : undefined}
              >
                {active ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />} {m.code} · {m.name.split(" ")[0]}
              </button>
            );
          })}
        </div>

        {v.cascadedTo.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Member</th>
                  <th className="px-3 py-2 text-left">Target ({v.uom || "—"})</th>
                  <th className="px-3 py-2 text-left">Weight (%)</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {v.cascadedTo.map((c) => {
                  const m = seniorTeam.find((x) => x.code === c.code);
                  return (
                    <tr key={c.code} className="border-t border-border">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
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
                            updateCascade(c.code, { target: raw !== "" && !isNaN(num) ? num : raw });
                          }}
                          className="input"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          value={c.weight}
                          onChange={(e) => updateCascade(c.code, { weight: Number(e.target.value) })}
                          className="input"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => toggleCascade(c.code)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive"
                          aria-label="Remove"
                        >
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
                    <span className={totalCascadedWeight > v.weight ? "text-destructive" : ""}>
                      {Math.round(totalCascadedWeight * 10) / 10}% / {v.weight}%
                    </span>
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        {onCancel && (
          <button type="button" onClick={onCancel} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary">
            <X className="h-4 w-4" /> Cancel
          </button>
        )}
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Check className="h-4 w-4" /> {submitLabel}
        </button>
      </div>

      <style>{`
        .input{width:100%;border-radius:0.85rem;border:1px solid var(--border);background:color-mix(in oklab, var(--secondary) 50%, transparent);padding:0.6rem 0.85rem;font-size:0.875rem;outline:none}
        .input:focus{border-color:var(--ring)}
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}