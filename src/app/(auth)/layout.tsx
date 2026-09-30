import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

/** Login / register shell. Already-logged-in users are sent to the dashboard. */
export default async function AuthLayout({ children }: LayoutProps<"/">) {
  if (await getCurrentUser()) redirect("/");

  return (
    <div className="grid min-h-screen bg-slate-100 lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 font-black shadow-lg shadow-indigo-500/25">
            G
          </div>
          <div>
            <div className="font-bold tracking-tight">Gauri Home</div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Management</div>
          </div>
        </div>
        <div className="max-w-md">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Colony & RWA management
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Houses, maintenance, payments and expenses — in one place.</h2>
          <p className="mt-3 text-sm text-slate-300">
            Track pending dues, send WhatsApp reminders, manage RWA members and renters, and download monthly reports.
          </p>
        </div>
        <p className="text-xs text-slate-500">© {new Date().getFullYear()} Gauri Home Management</p>
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
      </aside>

      <main className="flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
