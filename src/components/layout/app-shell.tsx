"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ChevronDown, Menu } from "lucide-react";
import { cn } from "@/lib/cn";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { isActive, navLabel, visibleNavItems, type NavLink } from "./nav";
import { UserMenu } from "./user-menu";
import { PermissionsProvider, type Permissions } from "@/components/auth/permissions";

export function AppShell({
  user,
  permissions,
  children,
}: {
  user: { name: string; email: string };
  permissions: Permissions;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {open && <div className="fixed inset-0 z-20 bg-slate-950/40 md:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto bg-sidebar p-4 text-white shadow-slate-900/20 transition-transform md:translate-x-0 md:shadow-2xl",
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        )}
      >
        <div className="mb-7 flex items-center gap-3 border-b border-white/10 px-2 pb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 font-black text-white shadow-lg shadow-indigo-500/25">
            G
          </div>
          <div>
            <div className="font-bold tracking-tight">Gauri Home</div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Management</div>
          </div>
        </div>

        <nav className="space-y-1">
          {visibleNavItems(permissions).map((item) =>
            "children" in item ? (
              <NavGroup key={item.label} label={item.label} icon={item.icon} items={item.children} pathname={pathname} onNavigate={() => setOpen(false)} />
            ) : (
              <SidebarLink key={item.href} item={item} active={isActive(pathname, item.href)} onNavigate={() => setOpen(false)} />
            ),
          )}
        </nav>
      </aside>

      <main className="md:ml-64">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur md:px-6">
          <Button size="icon" className="md:hidden" aria-label="Toggle menu" onClick={() => setOpen((v) => !v)}>
            <Menu size={18} />
          </Button>
          <div className="flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600">{APP_NAME}</div>
            <h1 className="mt-0.5 text-xl font-bold tracking-tight">{navLabel(pathname)}</h1>
            <p className="text-xs text-slate-500">Colony & RWA management</p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 lg:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            SQLite Connected
          </div>
          {!permissions.canWrite && (
            <span
              className="hidden rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 sm:inline"
              title="You can view everything but cannot create, edit or delete."
            >
              Read Only
            </span>
          )}
          <UserMenu name={user.name} email={user.email} />
        </header>
        <div className="p-4 md:p-6">
          <PermissionsProvider value={permissions}>{children}</PermissionsProvider>
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ item, active, nested = false, onNavigate }: { item: NavLink; active: boolean; nested?: boolean; onNavigate: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
        nested && "py-2 pl-4",
        active ? "bg-indigo-500 text-white shadow-sm" : "text-slate-300 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon size={nested ? 16 : 18} />
      {item.label}
    </Link>
  );
}

/** Collapsible sidebar group. Stays open while one of its pages is active. */
function NavGroup({
  label,
  icon: Icon,
  items,
  pathname,
  onNavigate,
}: {
  label: string;
  icon: NavLink["icon"];
  items: NavLink[];
  pathname: string;
  onNavigate: () => void;
}) {
  const containsActive = items.some((i) => isActive(pathname, i.href));
  const [toggled, setToggled] = useState(false);
  const expanded = containsActive || toggled;

  return (
    <div>
      <button
        type="button"
        onClick={() => setToggled((v) => !v)}
        aria-expanded={expanded}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-white/10 hover:text-white",
          containsActive ? "text-white" : "text-slate-300",
        )}
      >
        <Icon size={18} />
        <span className="flex-1">{label}</span>
        <ChevronDown size={16} className={cn("transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded && (
        <div className="ml-5 mt-1 space-y-1 border-l border-white/10 pl-2">
          {items.map((item) => (
            <SidebarLink key={item.href} item={item} nested active={isActive(pathname, item.href)} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}
