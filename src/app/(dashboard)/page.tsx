import { IndianRupee, Plus, Receipt } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { PROPERTY_STATUSES } from "@/lib/constants";
import { requireUser } from "@/lib/auth/session";
import { getExpenses, getHouses, getPayments } from "@/lib/data/queries";
import { money, monthNow } from "@/lib/format";
import { expenseAppliesToMonth, isMaintenanceActive } from "@/lib/ledger";

export default async function DashboardPage() {
  const [user, houses, payments, expenses] = await Promise.all([requireUser(), getHouses(), getPayments(), getExpenses()]);
  const month = monthNow();

  const due = houses.filter(isMaintenanceActive).reduce((s, h) => s + h.monthlyMaintenance, 0);
  const paid = payments.filter((p) => p.month === month).reduce((s, p) => s + p.amount, 0);
  const spent = expenses.filter((e) => expenseAppliesToMonth(e, month)).reduce((s, e) => s + e.amount, 0);

  const stats: [string, string | number][] = [
    ["Total Properties", houses.length],
    ...PROPERTY_STATUSES.map((s): [string, number] => [s, houses.filter((h) => h.propertyStatus === s).length]),
    ["Monthly Due", money(due)],
    ["Current Month Paid", money(paid)],
    ["Current Month Expenses", money(spent)],
    ["Balance", money(paid - spent)],
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-xl shadow-slate-300/30">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Management Overview
            </div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Good day, {user.name?.split(" ")[0] || "Administrator"}</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-300">
              Monitor properties, maintenance collections, expenses and pending payments from one dashboard.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm">
            <div className="text-xs text-slate-400">Current month</div>
            <div className="mt-1 font-semibold">{month}</div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stats.map(([label, value]) => (
          <StatCard key={label} label={label} value={value} />
        ))}
      </div>

      {user.canWrite && (
        <Card>
          <h2 className="font-bold">Quick Actions</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <ButtonLink variant="primary" href="/houses?new=1">
              <Plus size={17} />
              Add House
            </ButtonLink>
            <ButtonLink href="/payments?new=1">
              <Receipt size={17} />
              Add Payment
            </ButtonLink>
            <ButtonLink href="/expenses?new=1">
              <IndianRupee size={17} />
              Add Expense
            </ButtonLink>
          </div>
        </Card>
      )}
    </div>
  );
}
