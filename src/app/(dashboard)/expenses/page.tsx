import type { Metadata } from "next";
import { getExpenses } from "@/lib/data/queries";
import { ExpensesView } from "./_components/expenses-view";

export const metadata: Metadata = { title: "Expenses" };

export default async function ExpensesPage() {
  const expenses = await getExpenses();
  return <ExpensesView expenses={expenses} />;
}
