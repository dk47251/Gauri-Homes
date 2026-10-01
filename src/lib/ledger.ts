/**
 * Maintenance ledger calculations. Pure functions — safe to use on server and client.
 */

export type LedgerHouse = {
  id: number;
  maintenanceApplicable: boolean;
  status: string;
  startDate: string;
  monthlyMaintenance: number;
};

export type LedgerPayment = {
  houseId: number;
  month: string;
  date: string;
  amount: number;
  kind: string;
  advanceMonths: number;
};

export type LedgerResult = {
  previousPending: number;
  currentDue: number;
  currentPaid: number;
  pending: number;
  advanceBalance: number;
};

type Expenseish = { date: string; recurring: boolean; recurringStart: string; recurringEnd: string };

export function monthDiff(start: string, end: string) {
  const a = new Date(start + "-01");
  const b = new Date(end + "-01");
  return (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth();
}

export function addMonths(month: string, count: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + count, 1));
  return d.toISOString().slice(0, 7);
}

/** A recurring expense applies to every month in its range; otherwise only to its own month. */
export function expenseAppliesToMonth(x: Expenseish, month: string) {
  if (x.recurring) {
    const start = (x.recurringStart || x.date).slice(0, 7);
    const end = (x.recurringEnd || "9999-12").slice(0, 7);
    return month >= start && month <= end;
  }
  return x.date.startsWith(month);
}

const EMPTY: LedgerResult = { previousPending: 0, currentDue: 0, currentPaid: 0, pending: 0, advanceBalance: 0 };

/**
 * Walks every month from the house start month to `month`, applying regular payments to their
 * month and advance payments as expiring credits, and returns the balances for `month`.
 */
export function ledger(h: LedgerHouse, payments: LedgerPayment[], month: string): LedgerResult {
  const active = h.maintenanceApplicable && h.status === "Active";
  const startMonth = h.startDate?.slice(0, 7) || month;
  const diff = monthDiff(startMonth, month);
  const monthsDue = active && diff >= 0 ? diff + 1 : 0;
  if (!active || monthsDue <= 0) return { ...EMPTY };

  const housePayments = payments
    .filter((p) => p.houseId === h.id)
    .sort((a, b) => a.month.localeCompare(b.month) || a.date.localeCompare(b.date));

  let credits: { amount: number; expires: string }[] = [];
  let previousPending = 0;
  let currentDue = 0;
  let currentPaid = 0;
  let currentPending = 0;

  for (let i = 0; i < monthsDue; i++) {
    const m = addMonths(startMonth, i);
    const due = h.monthlyMaintenance;

    // Remove advance credits whose declared coverage period has ended.
    credits = credits.filter((c) => c.expires >= m && c.amount > 0);

    const monthPayments = housePayments.filter((p) => p.month === m);
    const regularPaid = monthPayments
      .filter((p) => (p.kind || "Regular") === "Regular")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    for (const payment of monthPayments.filter((p) => p.kind === "Advance")) {
      const months = Math.max(1, payment.advanceMonths || 1);
      credits.push({ amount: payment.amount || 0, expires: addMonths(m, months - 1) });
    }

    const afterRegular = Math.max(0, due - regularPaid);
    let advanceUsed = 0;
    for (const credit of credits) {
      if (afterRegular - advanceUsed <= 0) break;
      const used = Math.min(afterRegular - advanceUsed, credit.amount);
      credit.amount -= used;
      advanceUsed += used;
    }

    const totalCovered = Math.min(due, regularPaid + advanceUsed);
    const monthPending = Math.max(0, due - totalCovered);

    if (m < month) previousPending += monthPending;
    if (m === month) {
      currentDue = due;
      currentPaid = regularPaid + advanceUsed;
      currentPending = monthPending;
    }
  }

  return {
    previousPending,
    currentDue,
    currentPaid,
    pending: previousPending + currentPending,
    advanceBalance: credits.reduce((sum, c) => sum + c.amount, 0),
  };
}

export const isMaintenanceActive = (h: Pick<LedgerHouse, "maintenanceApplicable" | "status">) =>
  h.maintenanceApplicable && h.status === "Active";
