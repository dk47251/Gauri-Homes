import "server-only";
import { getExpenses, getHouses, getPayments } from "./queries";
import { expenseAppliesToMonth, isMaintenanceActive, ledger } from "@/lib/ledger";

/** Everything the monthly report screen, PDF and Excel export need, computed on the server. */
export async function getMonthlyReport(month: string) {
  const [houses, payments, expenses] = await Promise.all([getHouses(), getPayments(), getExpenses()]);
  const houseById = new Map(houses.map((h) => [h.id, h]));

  const monthPayments = payments
    .filter((p) => p.month === month)
    .sort((a, b) => a.date.localeCompare(b.date));
  const monthExpenses = expenses
    .filter((x) => expenseAppliesToMonth(x, month))
    .sort((a, b) => a.date.localeCompare(b.date));
  const active = houses.filter(isMaintenanceActive);

  const due = active.reduce((s, h) => s + h.monthlyMaintenance, 0);
  const paid = monthPayments.reduce((s, p) => s + p.amount, 0);
  const spent = monthExpenses.reduce((s, x) => s + x.amount, 0);
  const ledgers = active.map((h) => ledger(h, payments, month));
  const previousPending = ledgers.reduce((s, l) => s + l.previousPending, 0);
  const pending = ledgers.reduce((s, l) => s + l.pending, 0);
  const advanceBalance = ledgers.reduce((s, l) => s + l.advanceBalance, 0);
  const beginningBalance =
    payments.filter((p) => p.month < month).reduce((s, p) => s + p.amount, 0) -
    expenses.filter((x) => x.date.slice(0, 7) < month).reduce((s, x) => s + x.amount, 0);

  return {
    month,
    totalProperties: houses.length,
    summary: {
      due,
      paid,
      spent,
      previousPending,
      pending,
      advanceBalance,
      beginningBalance,
      endingBalance: beginningBalance + paid - spent,
    },
    income: monthPayments.map((p) => {
      const h = houseById.get(p.houseId);
      return {
        date: p.date,
        house: h?.number ?? "—",
        member: h?.owner ?? "Unknown",
        kind: p.kind,
        amount: p.amount,
        mode: p.mode,
        txn: p.txn,
        remarks: p.remarks,
        advanceMonths: p.advanceMonths,
      };
    }),
    expenses: monthExpenses.map((x) => ({
      date: x.recurring ? `${month}-01` : x.date,
      category: x.category,
      description: x.description,
      amount: x.amount,
      mode: x.mode,
      vendor: x.vendor,
      recurring: x.recurring,
      remarks: x.remarks,
    })),
    houseWise: houses.map((h) => {
      const l = ledger(h, payments, month);
      return {
        house: h.number,
        member: h.owner,
        due: l.currentDue,
        previousPending: l.previousPending,
        paid: l.currentPaid,
        pending: l.pending,
        advanceBalance: l.advanceBalance,
      };
    }),
  };
}

export type MonthlyReport = Awaited<ReturnType<typeof getMonthlyReport>>;
