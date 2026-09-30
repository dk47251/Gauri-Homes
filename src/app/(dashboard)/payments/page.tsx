import type { Metadata } from "next";
import { getHouses, getPayments } from "@/lib/data/queries";
import { PaymentsView } from "./_components/payments-view";

export const metadata: Metadata = { title: "Payment Records" };

export default async function PaymentsPage() {
  const [houses, payments] = await Promise.all([getHouses(), getPayments()]);
  return <PaymentsView houses={houses} payments={payments} />;
}
