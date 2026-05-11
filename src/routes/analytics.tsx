import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadialBarChart,
  RadialBar,
  LineChart,
  Line,
} from "recharts";
import { Filter, Target as TargetIcon, TrendingUp, Users2, Layers } from "lucide-react";
import { objectiveStyles, seniorTeam, type Objective } from "@/data/kra";
import { useKraStore, type KRAExtended } from "@/store/kraStore";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
  head: () => ({ meta: [{ title: "Targets vs Actuals — Analytics" }] }),
});

const ALL = "All";

type GroupKey = "objective" | "subObjective" | "uom" | "person" | "timeFrame";

function AnalyticsPage() {
  const { kras } = useKraStore();

  const [obj, setObj] = useState<string>(ALL);
  const [sub, setSub] = useState<string>(ALL);
  const [tf, setTf] = useState<string>(ALL);
  const [uom, setUom] = useState<string>(ALL);
  const [person, setPerson] = useState<string>(ALL);
  const [period, setPeriod] = useState<string>(ALL);
  const [groupBy, setGroupBy] = useState<GroupKey>("objective");

  const objectives = useMemo(
    () => [ALL, ...Array.from(new Set(kras.map((k) => k.objective)))],
    [kras]
  );
  const subs = useMemo(
    () => [
      ALL,
      ...Array.from(
        new Set(kras.filter((k) => obj === ALL || k.objective === obj).map((k) => k.subObjective))
      ),
    ],
    [kras, obj]
  );
  const timeFrames = useMemo(
    () => [ALL, ...Array.from(new Set(kras.map((k) => k.timeFrame)))],
    [kras]
  );
  const uoms = useMemo(() => [ALL, ...Array.from(new Set(kras.map((k) => k.uom)))], [kras]);
  const people = useMemo(() => [ALL, ...seniorTeam.map((s) => s.code)], []);
  const periods = useMemo(() => {
    const s = new Set<string>();
    kras.forEach((k) => k.actuals.forEach((a) => s.add(a.period)));
    return [ALL, ...Array.from(s)];
  }, [kras]);

  const filtered = useMemo(
    () =>
      kras.filter(
        (k) =>
          (obj === ALL || k.objective === obj) &&
          (sub === ALL || k.subObjective === sub) &&
          (tf === ALL || k.timeFrame === tf) &&
          (uom === ALL || k.uom === uom) &&
          (person === ALL || k.cascadedTo.some((c) => c.code === person))
      ),
    [kras, obj, sub, tf, uom, person]
  );

  // Per-KRA target & actual based on selected period & person
  const rows = useMemo(() => {
    return filtered.map((k) => {
      const memberAssigns = k.cascadedTo.filter(
        (c) => person === ALL || c.code === person
      );
      const numericTargets = memberAssigns
        .map((c) => (typeof c.target === "number" ? c.target : NaN))
        .filter((n) => !isNaN(n));
      const personTarget =
        person === ALL
          ? typeof k.target === "number"
            ? k.target
            : NaN
          : numericTargets.reduce((s, n) => s + n, 0);

      const periodActuals =
        period === ALL
          ? k.actuals
          : k.actuals.filter((a) => a.period === period);
      const latest = [...periodActuals].sort((a, b) => +new Date(b.date) - +new Date(a.date))[0];
      const actualVal = latest?.actual ?? 0;
      const progress = latest?.progress ?? k.progress;
      // scale actual to person share
      const actualScaled =
        person === ALL
          ? actualVal
          : memberAssigns.length && k.cascadedTo.length
            ? Math.round(((actualVal * memberAssigns.length) / k.cascadedTo.length) * 10) / 10
            : actualVal;
      return {
        id: k.id,
        kra: k,
        target: isNaN(personTarget as number) ? null : (personTarget as number),
        actual: actualScaled,
        progress,
      };
    });
  }, [filtered, person, period]);

  // Group aggregation for bar chart
  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; target: number; actual: number; progress: number; count: number }>();
    for (const r of rows) {
      const labels: string[] = (() => {
        switch (groupBy) {
          case "objective":
            return [r.kra.objective];
          case "subObjective":
            return [r.kra.subObjective];
          case "uom":
            return [r.kra.uom];
          case "timeFrame":
            return [r.kra.timeFrame];
          case "person":
            return r.kra.cascadedTo
              .filter((c) => person === ALL || c.code === person)
              .map((c) => c.code);
        }
      })();
      labels.forEach((label) => {
        const cur = map.get(label) ?? { name: label, target: 0, actual: 0, progress: 0, count: 0 };
        if (r.target != null) cur.target += r.target;
        cur.actual += r.actual;
        cur.progress += r.progress;
        cur.count += 1;
        map.set(label, cur);
      });
    }
    return Array.from(map.values()).map((g) => ({
      ...g,
      progress: Math.round(g.progress / Math.max(g.count, 1)),
      attainment:
        g.target > 0 ? Math.round((g.actual / g.target) * 100) : Math.round(g.progress / Math.max(g.count, 1)),
    }));
  }, [rows, groupBy, person]);

  // Trend across periods
  const trend = useMemo(() => {
    const periodSet = new Set<string>();
    filtered.forEach((k) => k.actuals.forEach((a) => periodSet.add(a.period)));
    const sorted = Array.from(periodSet);
    return sorted.map((p) => {
      let target = 0;
      let actual = 0;
      filtered.forEach((k) => {
        const a = k.actuals.find((x) => x.period === p);
        if (a) actual += a.actual;
        if (typeof k.target === "number") target += k.target / 4;
      });
      return { period: p, target: Math.round(target), actual: Math.round(actual) };
    });
  }, [filtered]);

  // KPI summary
  const summary = useMemo(() => {
    const totalTarget = rows.reduce((s, r) => s + (r.target ?? 0), 0);
    const totalActual = rows.reduce((s, r) => s + r.actual, 0);
    const avgProgress = Math.round(
      rows.reduce((s, r) => s + r.progress, 0) / Math.max(rows.length, 1)
    );
    const onTrack = rows.filter((r) => r.progress >= 60).length;
    return { totalTarget, totalActual, avgProgress, onTrack, total: rows.length };
  }, [rows]);

  const radial = grouped.slice(0, 6).map((g, i) => ({
    name: g.name,
    value: Math.min(g.attainment, 120),
    fill: `oklch(0.6 0.2 ${(i * 55) % 360})`,
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5" /> Performance Analytics
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Targets vs Actuals</h1>
        <p className="text-muted-foreground">
          Slice progress by objective, sub-objective, period, UoM, time frame, or cascaded leader.
        </p>
      </header>

      {/* Slicers */}
      <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Filter className="h-4 w-4" /> Slicers
        </div>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Slicer label="Objective" value={obj} onChange={(v) => { setObj(v); setSub(ALL); }} options={objectives} />
          <Slicer label="Sub-objective" value={sub} onChange={setSub} options={subs} />
          <Slicer label="Time frame" value={tf} onChange={setTf} options={timeFrames} />
          <Slicer label="UoM" value={uom} onChange={setUom} options={uoms} />
          <Slicer label="Cascaded to" value={person} onChange={setPerson} options={people} />
          <Slicer label="Period" value={period} onChange={setPeriod} options={periods} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Group by</span>
          {(["objective", "subObjective", "uom", "timeFrame", "person"] as GroupKey[]).map((g) => (
            <button
              key={g}
              onClick={() => setGroupBy(g)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                groupBy === g
                  ? "text-primary-foreground shadow-[var(--shadow-glow)]"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
              style={groupBy === g ? { background: "var(--gradient-primary)" } : undefined}
            >
              {g === "subObjective" ? "Sub-objective" : g === "timeFrame" ? "Time frame" : g[0].toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* KPI cards */}
      <section className="grid gap-4 md:grid-cols-4">
        <Kpi icon={<TargetIcon className="h-4 w-4" />} label="Total Target" value={summary.totalTarget.toLocaleString()} />
        <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Total Actual" value={summary.totalActual.toLocaleString()} />
        <Kpi icon={<Layers className="h-4 w-4" />} label="Avg Progress" value={`${summary.avgProgress}%`} />
        <Kpi icon={<Users2 className="h-4 w-4" />} label="On track / Total" value={`${summary.onTrack} / ${summary.total}`} />
      </section>

      {/* Charts */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2">
          <h2 className="mb-1 text-base font-bold">Target vs Actual by {labelFor(groupBy)}</h2>
          <p className="mb-3 text-xs text-muted-foreground">Aggregated values across the filtered KRAs.</p>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={grouped}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="target" name="Target" fill="oklch(0.75 0.12 250)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="actual" name="Actual" fill="oklch(0.55 0.22 320)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="mb-1 text-base font-bold">Attainment %</h2>
          <p className="mb-3 text-xs text-muted-foreground">Top groups by actual / target.</p>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="95%" data={radial} startAngle={90} endAngle={-270}>
                <RadialBar background dataKey="value" cornerRadius={8} />
                <Tooltip />
                <Legend iconSize={8} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 11 }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <h2 className="mb-1 text-base font-bold">Trend across periods</h2>
        <p className="mb-3 text-xs text-muted-foreground">Cumulative target pacing vs actuals reported.</p>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="target" stroke="oklch(0.55 0.18 250)" strokeWidth={2} dot />
              <Line type="monotone" dataKey="actual" stroke="oklch(0.55 0.22 320)" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Detail table */}
      <section className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
          <h2 className="text-base font-bold">KRA Details ({rows.length})</h2>
          <span className="text-xs text-muted-foreground">Filtered view</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Objective</th>
                <th className="px-4 py-2 text-left">Sub-objective</th>
                <th className="px-4 py-2 text-left">KRA</th>
                <th className="px-4 py-2 text-left">UoM</th>
                <th className="px-4 py-2 text-right">Target</th>
                <th className="px-4 py-2 text-right">Actual</th>
                <th className="px-4 py-2 text-right">Progress</th>
                <th className="px-4 py-2 text-left">Cascaded</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border/40">
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${objectiveStyles[r.kra.objective as Objective].chip}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${objectiveStyles[r.kra.objective as Objective].dot}`} />
                      {r.kra.objective}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{r.kra.subObjective}</td>
                  <td className="px-4 py-2 max-w-[280px] truncate" title={r.kra.description}>{r.kra.description}</td>
                  <td className="px-4 py-2 text-muted-foreground">{r.kra.uom}</td>
                  <td className="px-4 py-2 text-right font-mono">{r.target ?? r.kra.target}</td>
                  <td className="px-4 py-2 text-right font-mono">{r.actual}</td>
                  <td className="px-4 py-2 text-right">
                    <ProgressPill value={r.progress} />
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{r.kra.cascadedTo.map((c) => c.code).join(", ")}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    No KRAs match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function labelFor(g: GroupKey) {
  switch (g) {
    case "objective": return "Objective";
    case "subObjective": return "Sub-objective";
    case "uom": return "UoM";
    case "timeFrame": return "Time frame";
    case "person": return "Cascaded leader";
  }
}

function Slicer({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[]; }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string; }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-2 text-2xl font-extrabold">{value}</div>
    </div>
  );
}

function ProgressPill({ value }: { value: number }) {
  const tone =
    value >= 75 ? "bg-[oklch(0.92_0.08_160)] text-[oklch(0.35_0.16_160)]" :
    value >= 50 ? "bg-[oklch(0.95_0.08_85)] text-[oklch(0.4_0.16_70)]" :
    "bg-[oklch(0.95_0.08_25)] text-[oklch(0.45_0.18_25)]";
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{value}%</span>;
}

// silence unused import warnings in case
export type { KRAExtended };