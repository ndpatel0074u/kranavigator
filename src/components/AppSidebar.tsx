import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, ListChecks, UserPlus, Network, PlusSquare, BarChart3, Sparkles, Bell, Settings, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
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

export function AppSidebar() {
  const { pathname } = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3 px-2 py-2">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-primary-foreground font-black text-sm"
            style={{ background: "var(--gradient-primary)" }}
          >
            A
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-display text-base font-extrabold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                adani
              </span>
              <span className="text-[11px] font-semibold bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-magenta)" }}>
                KRA Management
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Navigation</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((n) => {
                const active = pathname === n.to;
                const Icon = n.icon;
                return (
                  <SidebarMenuItem key={n.to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={n.label}>
                      <Link
                        to={n.to}
                        className={active ? "text-primary-foreground" : ""}
                        style={active ? { background: "var(--gradient-primary)" } : undefined}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{n.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Account</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Settings"><Settings className="h-4 w-4" /><span>Settings</span></SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Notifications"><Bell className="h-4 w-4" /><span>Notifications</span></SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Log out"><LogOut className="h-4 w-4" /><span>Log out</span></SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-primary-foreground"
            style={{ background: "var(--gradient-magenta)" }}
          >
            {ceo.initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold">{ceo.name}</div>
              <div className="truncate text-[11px] text-muted-foreground">{ceo.role}</div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}