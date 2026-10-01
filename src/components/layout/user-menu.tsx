import { LogOut } from "lucide-react";
import { logout } from "@/lib/actions/auth";

export function UserMenu({ name, email }: { name: string; email: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <div className="text-sm font-semibold leading-tight">{name}</div>
        <div className="text-xs text-slate-500">{email}</div>
      </div>
      <div
        aria-hidden
        className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700"
      >
        {initials || "U"}
      </div>
      <form action={logout}>
        <button
          type="submit"
          title="Log out"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={16} />
          <span className="hidden md:inline">Logout</span>
        </button>
      </form>
    </div>
  );
}
