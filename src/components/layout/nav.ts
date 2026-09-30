import {
  BarChart3,
  Building2,
  DatabaseBackup,
  Home,
  IndianRupee,
  Receipt,
  ReceiptText,
  Settings,
  ShieldCheck,
  UserRound,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavLink = { href: string; label: string; icon: LucideIcon };

/** Who may see an entry: "write" = Read & Write users, "systemAdmin" = the .env administrator only. */
type Visibility = { visibleTo?: "write" | "systemAdmin" };

/** A sidebar entry is either a link or a dropdown group of links. */
export type NavItem = (NavLink | { label: string; icon: LucideIcon; children: NavLink[] }) & Visibility;

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/houses", label: "Houses & Members", icon: Building2 },
  { href: "/rwa-members", label: "RWA Members", icon: Users },
  { href: "/renters", label: "Renters / Tenants", icon: UserRound },
  { href: "/maintenance", label: "Monthly Maintenance", icon: Receipt },
  { href: "/payments", label: "Payment Records", icon: ReceiptText },
  { href: "/pending", label: "Pending Payments", icon: Wallet },
  { href: "/expenses", label: "Expenses", icon: IndianRupee },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/backup", label: "Backup & Restore", icon: DatabaseBackup, visibleTo: "write" },
  {
    label: "Users",
    icon: UserCog,
    visibleTo: "systemAdmin",
    children: [
      { href: "/users", label: "List", icon: Users },
      { href: "/users/admins", label: "Admin List", icon: ShieldCheck },
    ],
  },
  { href: "/settings", label: "Settings", icon: Settings, visibleTo: "systemAdmin" },
];

export const visibleNavItems = (p: { canWrite: boolean; isSystemAdmin: boolean }) =>
  NAV_ITEMS.filter(
    (n) => !n.visibleTo || (n.visibleTo === "write" ? p.canWrite : p.isSystemAdmin),
  );

export const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname === href);

const HEADER_TITLES: Record<string, string> = { "/users": "Users", "/users/admins": "Admin List" };

export function navLabel(pathname: string) {
  if (HEADER_TITLES[pathname]) return HEADER_TITLES[pathname];
  const links = NAV_ITEMS.flatMap((n) => ("children" in n ? n.children : [n]));
  return links.find((n) => isActive(pathname, n.href))?.label ?? "Dashboard";
}
