import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Target, TrendingUp, Clock, Users, ArrowUpRight, Sparkles } from "lucide-react";
import { ceo, objectiveStyles, objectiveTotals, totals, type Objective } from "@/data/kra";
import { useKraStore } from "@/store/kraStore";
import { useState } from "react";
import { KraDetailsDrawer } from "@/components/KraDetailsDrawer";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "CEO Dashboard — Adani KRA Management" }] }),
});

function Dashboard() {
  const { kras } = useKraStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const t = totals();
  const byObjective = objectiveTotals();
  const recent = kras.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)] md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> FY 2025-26 · Top-down view
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Welcome, {ceo.name.split(" ")[0]} {ceo.name.split(" ")[1]}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Your Key Result Areas across {byObjective.length} business objectives, cascaded to {ceo.reports} direct reports.
          </p>
        </div>
        <Link
          to="/new"
          className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:scale-[1.02]"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Plus className="h-4 w-4" /> Create New KRA
        </Link>
      </section>

      {/* Stat tiles */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total KRAs" value={t.total} icon={Target} gradient="var(--gradient-primary)" />
        <StatCard label="Submitted" value={t.submitted} icon={TrendingUp} gradient="var(--gradient-success)" />
        <StatCard label="Drafts / Review" value={t.drafts + t.inReview} icon={Clock} gradient="var(--gradient-warm)" />
        <StatCard label="Cascaded" value={t.cascaded} icon={Users} gradient="var(--gradient-magenta)" />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Weight allocation */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] lg:col-span-2">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold">Weightage Allocation</h2>
              <p className="text-sm text-muted-foreground">Cumulative across all KRAs</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
                {t.weight}%
              </div>
              <div className="text-xs text-muted-foreground">of 100%</div>
            </div>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full" style={{ width: `${t.weight}%`, background: "var(--gradient-primary)" }} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Allocated: {t.weight}%</span>
            <span>Remaining: {Math.max(0, 100 - t.weight)}%</span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
            <Pill label="Avg Progress" value={`${t.avgProgress}%`} tone="bg-[oklch(0.95_0.05_240)] text-[oklch(0.4_0.18_250)]" />
            <Pill label="Submitted" value={`${Math.round((t.submitted / t.total) * 100)}%`} tone="bg-[oklch(0.95_0.06_160)] text-[oklch(0.4_0.16_160)]" />
            <Pill label="In Review" value={`${t.inReview}`} tone="bg-[oklch(0.96_0.07_60)] text-[oklch(0.4_0.18_50)]" />
          </div>
        </div>

        {/* By objective */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-xl font-bold">By Objective</h2>
          <p className="text-sm text-muted-foreground">Weight & avg progress</p>
          <ul className="mt-5 space-y-4">
            {byObjective.map((o) => (
              <li key={o.objective}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-semibold uppercase tracking-wide text-xs text-foreground">{o.objective}</span>
                  <span className="text-muted-foreground">{o.count} · {o.weight}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${o.avgProgress}%`, background: objectiveStyles[o.objective as Objective].gradient }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Recent KRAs */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent KRAs</h2>
          <Link to="/kras" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            View all <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {recent.map((k) => (
            <button key={k.id} onClick={() => setOpenId(k.id)} className="text-left">
              <KraMiniCard k={k} />
            </button>
          ))}
        </div>
      </section>

      <KraDetailsDrawer kraId={openId} open={!!openId} onOpenChange={(b) => !b && setOpenId(null)} />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, gradient }: { label: string; value: number; icon: any; gradient: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl" style={{ background: gradient }} />
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-primary-foreground shadow-md" style={{ background: gradient }}>
          <Icon className="h-5 w-5" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-5 text-3xl font-extrabold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function Pill({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`rounded-2xl px-4 py-3 ${tone}`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="text-lg font-extrabold">{value}</div>
    </div>
  );
}

import type { KRA } from "@/data/kra";
function KraMiniCard({ k }: { k: KRA }) {
  const s = objectiveStyles[k.objective];
  return (
    <div className="group rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/40 p-5 transition hover:shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${s.chip}`}>
          {k.objective}
        </span>
        <div className="text-right">
          <div className="text-xl font-extrabold bg-clip-text text-transparent" style={{ backgroundImage: s.gradient }}>
            {k.weight}%
          </div>
          <div className="text-[10px] text-muted-foreground">weight</div>
        </div>
      </div>
      <h3 className="text-sm font-semibold leading-snug">{k.description}</h3>
      <div className="mt-1 text-xs text-muted-foreground">{k.subObjective} · {k.uom}</div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full" style={{ width: `${k.progress}%`, background: s.gradient }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-semibold">{k.progress}%</span>
        <span className="rounded-full bg-[oklch(0.95_0.06_160)] px-2 py-0.5 text-[10px] font-semibold text-[oklch(0.4_0.16_160)]">
          {k.status}
        </span>
      </div>
    </div>
  );
}
