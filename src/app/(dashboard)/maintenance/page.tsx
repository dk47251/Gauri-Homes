import type { Metadata } from "next";
import { Card, StatCard } from "@/components/ui/card";
import { MonthPicker } from "@/components/ui/month-picker";
import { Table, Td, Tr } from "@/components/ui/table";
import { getLedgerRows } from "@/lib/data/ledger-rows";
import { money, parseMonth } from "@/lib/format";

export const metadata: Metadata = { title: "Monthly Maintenance" };

export default async function MaintenancePage({ searchParams }: PageProps<"/maintenance">) {
  const month = parseMonth((await searchParams).month);
  const rows = await getLedgerRows(month);
  const sum = (key: "currentDue" | "pending" | "advanceBalance") => rows.reduce((s, r) => s + r[key], 0);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <MonthPicker month={month} label="Maintenance Month" />
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Due" value={money(sum("currentDue"))} />
        <StatCard label="Total Pending" value={money(sum("pending"))} tone="danger" />
        <StatCard label="Advance Balance" value={money(sum("advanceBalance"))} tone="success" />
      </div>

      <Table
        headers={["House", "Member/Owner", "Previous Pending", "Current Due", "Current Paid", "Total Pending", "Advance Balance"]}
        isEmpty={!rows.length}
        empty="No active houses with maintenance applicable."
      >
        {rows.map((r) => (
          <Tr key={r.id}>
            <Td className="font-medium">{r.number}</Td>
            <Td>{r.owner}</Td>
            <Td>{money(r.previousPending)}</Td>
            <Td>{money(r.currentDue)}</Td>
            <Td>{money(r.currentPaid)}</Td>
            <Td className="font-semibold">{money(r.pending)}</Td>
            <Td>{money(r.advanceBalance)}</Td>
          </Tr>
        ))}
      </Table>
    </div>
  );
}
