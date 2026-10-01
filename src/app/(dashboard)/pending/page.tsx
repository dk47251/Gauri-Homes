import type { Metadata } from "next";
import { Card, StatCard } from "@/components/ui/card";
import { MonthPicker } from "@/components/ui/month-picker";
import { Table, Td, Tr } from "@/components/ui/table";
import { getLedgerRows } from "@/lib/data/ledger-rows";
import { money, parseMonth } from "@/lib/format";
import { WhatsAppReminder } from "./_components/whatsapp-reminder";

export const metadata: Metadata = { title: "Pending Payments" };

export default async function PendingPage({ searchParams }: PageProps<"/pending">) {
  const month = parseMonth((await searchParams).month);
  const rows = (await getLedgerRows(month)).filter((r) => r.pending > 0);
  const total = rows.reduce((s, r) => s + r.pending, 0);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <MonthPicker month={month} />
        <p className="mt-2 text-xs text-slate-500">
          Only houses with a real outstanding balance are shown. Pending is calculated from dues, regular payments and advance
          payments.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Houses with Pending" value={rows.length} />
        <StatCard label="Total Pending" value={money(total)} tone="danger" />
      </div>

      <Table
        headers={["House", "Member", "Previous Pending", "Current Due", "Current Paid", "Total Pending", "Advance Balance", "WhatsApp"]}
        isEmpty={!rows.length}
        empty="No pending payments for this month. 🎉"
      >
        {rows.map((r) => (
          <Tr key={r.id}>
            <Td className="font-medium">{r.number}</Td>
            <Td>{r.owner}</Td>
            <Td>{money(r.previousPending)}</Td>
            <Td>{money(r.currentDue)}</Td>
            <Td>{money(r.currentPaid)}</Td>
            <Td className="font-bold text-red-600">{money(r.pending)}</Td>
            <Td>{money(r.advanceBalance)}</Td>
            <Td>
              <WhatsAppReminder
                owner={r.owner}
                phone={r.whatsapp || r.mobile}
                pending={r.pending}
                month={month}
                dueDate={r.dueDate}
              />
            </Td>
          </Tr>
        ))}
      </Table>
    </div>
  );
}
