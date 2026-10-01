import "server-only";
import { getHouses, getPayments } from "./queries";
import { isMaintenanceActive, ledger } from "@/lib/ledger";

/** Ledger balances for every active, maintenance-applicable house for `month`. */
export async function getLedgerRows(month: string) {
  const [houses, payments] = await Promise.all([getHouses(), getPayments()]);
  return houses.filter(isMaintenanceActive).map((h) => ({ ...h, ...ledger(h, payments, month) }));
}

export type LedgerRow = Awaited<ReturnType<typeof getLedgerRows>>[number];
