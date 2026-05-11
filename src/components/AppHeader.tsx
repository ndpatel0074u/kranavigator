import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, ListChecks, UserPlus, Network, Bell, Settings, LogOut, PlusSquare, BarChart3, Sparkles } from "lucide-react";
import { ceo } from "@/data/kra";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/kras", label: "All KRAs", icon: ListChecks },
  { to: "/new", label: "New KRA", icon: PlusSquare },
  { to: "/assign", label: "Assign KRA", icon: UserPlus },
  { to: "/tree", label: "Tree View", icon: Network },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/assistant", label: "AI Assistant", icon: Sparkles },
] as const;

export function AppHeader() {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground font-black text-sm" style={{ background: "var(--gradient-primary)" }}>
            A
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl font-extrabold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              <span className="text-foreground">adani</span>
            </span>
            <span className="text-sm font-semibold bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-magenta)" }}>
              KRA Management
            </span>
          </div>
        </Link>

        <nav className="ml-6 flex items-center gap-1">
          {nav.map((n) => {
            const active = pathname === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`group relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  active
                    ? "text-primary-foreground shadow-[var(--shadow-glow)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
                style={active ? { background: "var(--gradient-primary)" } : undefined}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <IconBtn><Settings className="h-4 w-4" /></IconBtn>
          <IconBtn><Bell className="h-4 w-4" /></IconBtn>
          <IconBtn><LogOut className="h-4 w-4" /></IconBtn>
          <div className="ml-2 flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-primary-foreground" style={{ background: "var(--gradient-magenta)" }}>
              {ceo.initials}
            </div>
            <div className="hidden text-right md:block">
              <div className="text-sm font-semibold leading-none">{ceo.name}</div>
              <div className="text-[11px] text-muted-foreground">{ceo.role}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button
      className="flex h-9 w-9 items-center justify-center rounded-full text-primary-foreground transition-transform hover:scale-105"
      style={{ background: "var(--gradient-primary)" }}
    >
      {children}
    </button>
  );
}