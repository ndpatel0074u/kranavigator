import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Crown,
  LayoutGrid,
  Network,
  Search,
  Target,
  User,
  Users2,
} from "lucide-react";
import { ceo, objectiveStyles, seniorTeam, type Objective } from "@/data/kra";
import { useKraStore } from "@/store/kraStore";
import { KraDetailsDrawer } from "@/components/KraDetailsDrawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/tree")({
  component: TreeView,
  head: () => ({ meta: [{ title: "KRA Hierarchy — Adani KRA Management" }] }),
});

type GroupBy = "objective" | "subObjective" | "person";

function TreeView() {
  const { kras } = useKraStore();
  const [groupBy, setGroupBy] = useState<GroupBy>("objective");
  const [subFilter, setSubFilter] = useState<string>("__all");
  const [objFilter, setObjFilter] = useState<string>("__all");
  const [personFilter, setPersonFilter] = useState<string>("__all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  // reset sub filter when objective filter changes
  const subOptions = useMemo(() => {
    const set = new Set<string>();
    kras
      .filter((k) => objFilter === "__all" || k.objective === objFilter)
      .forEach((k) => set.add(k.subObjective));
    return Array.from(set).sort();
  }, [kras, objFilter]);

  const filtered = useMemo(() => {
    return kras.filter((k) => {
      if (objFilter !== "__all" && k.objective !== objFilter) return false;
      if (subFilter !== "__all" && k.subObjective !== subFilter) return false;
      if (personFilter !== "__all" && !k.cascadedTo.some((c) => c.code === personFilter)) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !k.description.toLowerCase().includes(q) &&
          !k.subObjective.toLowerCase().includes(q) &&
          !k.objective.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [kras, objFilter, subFilter, personFilter, query]);

  // Build groups based on `groupBy`
  type Group = {
    key: string;
    title: string;
    subtitle?: string;
    badge?: string;
    style?: { gradient: string; chip: string };
    children: { key: string; title: string; subtitle?: string; kraIds: string[] }[];
  };

  const groups: Group[] = useMemo(() => {
    if (groupBy === "objective") {
      const m = new Map<Objective, Map<string, string[]>>();
      filtered.forEach((k) => {
        if (!m.has(k.objective)) m.set(k.objective, new Map());
        const sub = m.get(k.objective)!;
        if (!sub.has(k.subObjective)) sub.set(k.subObjective, []);
        sub.get(k.subObjective)!.push(k.id);
      });
      return Array.from(m.entries()).map(([obj, subMap]) => {
        const total = Array.from(subMap.values()).reduce((s, a) => s + a.length, 0);
        return {
          key: obj,
          title: obj,
          subtitle: `${subMap.size} sub-objectives`,
          badge: `${total} KRAs`,
          style: objectiveStyles[obj],
          children: Array.from(subMap.entries()).map(([sub, ids]) => ({
            key: `${obj}-${sub}`,
            title: sub,
            subtitle: `${ids.length} KRA${ids.length > 1 ? "s" : ""}`,
            kraIds: ids,
          })),
        };
      });
    }
    if (groupBy === "subObjective") {
      const m = new Map<string, { obj: Objective; ids: string[] }>();
      filtered.forEach((k) => {
        if (!m.has(k.subObjective)) m.set(k.subObjective, { obj: k.objective, ids: [] });
        m.get(k.subObjective)!.ids.push(k.id);
      });
      return Array.from(m.entries()).map(([sub, v]) => ({
        key: sub,
        title: sub,
        subtitle: v.obj,
        badge: `${v.ids.length} KRAs`,
        style: objectiveStyles[v.obj],
        children: [{ key: sub, title: "KRAs", kraIds: v.ids }],
      }));
    }
    // person
    const m = new Map<string, string[]>();
    filtered.forEach((k) =>
      k.cascadedTo.forEach((c) => {
        if (!m.has(c.code)) m.set(c.code, []);
        m.get(c.code)!.push(k.id);
      })
    );
    return seniorTeam
      .map((p) => ({
        key: p.code,
        title: p.name,
        subtitle: p.area,
        badge: `${(m.get(p.code) ?? []).length} KRAs`,
        children: [{ key: p.code, title: "Cascaded KRAs", kraIds: m.get(p.code) ?? [] }],
      }))
      .filter((g) => g.children[0].kraIds.length > 0);
  }, [filtered, groupBy]);

  const allObjectives = Array.from(new Set(kras.map((k) => k.objective)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">KRA Hierarchy</h1>
          <p className="text-muted-foreground">
            Drill into the cascade by objective, sub-objective or person
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-2xl border border-border bg-card p-1 shadow-sm">
          {([
            ["objective", "Objective", Target],
            ["subObjective", "Sub-Objective", LayoutGrid],
            ["person", "Person", User],
          ] as const).map(([k, label, Icon]) => (
            <button
              key={k}
              onClick={() => setGroupBy(k)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                groupBy === k
                  ? "text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={groupBy === k ? { background: "var(--gradient-primary)" } : undefined}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search KRA…"
            className="w-40 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="min-w-[180px]">
          <Select
            value={objFilter}
            onValueChange={(v) => {
              setObjFilter(v);
              setSubFilter("__all");
            }}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Objective" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All Objectives</SelectItem>
              {allObjectives.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[200px]">
          <Select value={subFilter} onValueChange={setSubFilter}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Sub-Objective" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All Sub-Objectives</SelectItem>
              {subOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[180px]">
          <Select value={personFilter} onValueChange={setPersonFilter}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Person" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All People</SelectItem>
              {seniorTeam.map((p) => (
                <SelectItem key={p.code} value={p.code}>
                  {p.name} — {p.area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {kras.length} KRAs
        </div>
      </div>

      {/* CEO header */}
      <div className="flex items-center gap-3 rounded-2xl border border-transparent p-4 shadow-[var(--shadow-glow)]"
        style={{ background: "linear-gradient(180deg, oklch(0.99 0.005 250), oklch(0.96 0.04 270))" }}>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-extrabold text-primary-foreground shadow-md"
          style={{ background: "var(--gradient-magenta)" }}
        >
          {ceo.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 font-bold">
            {ceo.name} <Crown className="h-3.5 w-3.5 text-[oklch(0.7_0.18_60)]" />
          </div>
          <div className="text-xs text-muted-foreground">{ceo.role}</div>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Network className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{ceo.reports} reports</span>
        </div>
      </div>

      <div className="space-y-3">
        {groups.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No KRAs match the current filters.
          </div>
        )}
        {groups.map((g) => (
          <GroupNode key={g.key} g={g} groupBy={groupBy} onOpen={(id) => setOpenId(id)} />
        ))}
      </div>

      <KraDetailsDrawer
        kraId={openId}
        open={!!openId}
        onOpenChange={(b) => !b && setOpenId(null)}
      />
    </div>
  );
}

function GroupNode({
  g,
  groupBy,
  onOpen,
}: {
  g: any;
  groupBy: GroupBy;
  onOpen: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-secondary/40"
      >
        {g.style ? (
          <span
            className="h-8 w-1.5 rounded-full"
            style={{ background: g.style.gradient }}
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-[10px] font-bold text-muted-foreground">
            {g.title.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">{g.title}</div>
          {g.subtitle && (
            <div className="truncate text-[11px] text-muted-foreground">{g.subtitle}</div>
          )}
        </div>
        {g.badge && (
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
            {g.badge}
          </span>
        )}
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="space-y-2 border-t border-border bg-secondary/20 p-3">
          {g.children.map((c: any) => (
            <SubGroup key={c.key} c={c} showHeader={groupBy === "objective"} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubGroup({
  c,
  showHeader,
  onOpen,
}: {
  c: { key: string; title: string; subtitle?: string; kraIds: string[] };
  showHeader: boolean;
  onOpen: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const { getKra } = useKraStore();
  return (
    <div className="rounded-xl border border-border bg-card">
      {showHeader && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-2 px-3 py-2 text-left"
        >
          <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-bold">{c.title}</div>
            {c.subtitle && (
              <div className="truncate text-[10px] text-muted-foreground">{c.subtitle}</div>
            )}
          </div>
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      )}
      {open && (
        <div className="grid gap-2 p-2 md:grid-cols-2 xl:grid-cols-3">
          {c.kraIds.map((id) => {
            const k = getKra(id);
            if (!k) return null;
            const s = objectiveStyles[k.objective];
            return (
              <button
                key={id}
                onClick={() => onOpen(id)}
                className="group rounded-xl border border-border bg-card p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${s.chip}`}>
                    {k.objective}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:text-foreground" />
                </div>
                <div className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">{k.description}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{k.subObjective}</div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full" style={{ width: `${k.progress}%`, background: s.gradient }} />
                  </div>
                  <span className="text-[11px] font-bold">{k.progress}%</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Weight {k.weight}%</span>
                  <span className="inline-flex items-center gap-1">
                    <Users2 className="h-3 w-3" /> {k.cascadedTo.length}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
