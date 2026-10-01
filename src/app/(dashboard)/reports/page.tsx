import type { Metadata } from "next";
import { Card, StatCard } from "@/components/ui/card";
import { MonthPicker } from "@/components/ui/month-picker";
import { Table, Td, Tr } from "@/components/ui/table";
import { getMonthlyReport } from "@/lib/data/report";
import { money, parseMonth } from "@/lib/format";
import { ReportDownloads } from "./_components/report-downloads";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage({ searchParams }: PageProps<"/reports">) {
  const month = parseMonth((await searchParams).month);
  const report = await getMonthlyReport(month);
  const s = report.summary;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <MonthPicker month={month} label="Month / Year" />
          <ReportDownloads report={report} />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
        <StatCard label="Due" value={money(s.due)} />
        <StatCard label="Collected" value={money(s.paid)} tone="success" />
        <StatCard label="Pending" value={money(s.pending)} tone="danger" />
        <StatCard label="Advance" value={money(s.advanceBalance)} />
        <StatCard label="Expenses" value={money(s.spent)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Beginning Balance" value={money(s.beginningBalance)} />
        <StatCard label="Net Income / Loss" value={money(s.paid - s.spent)} tone={s.paid - s.spent < 0 ? "danger" : "success"} />
        <StatCard label="Ending Balance" value={money(s.endingBalance)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="space-y-2">
          <h2 className="font-bold">Income</h2>
          <Table headers={["Date", "House / Member", "Type", "Amount"]} isEmpty={!report.income.length} empty="No income this month.">
            {report.income.map((r, i) => (
              <Tr key={i}>
                <Td>{r.date}</Td>
                <Td>
                  {r.house} / {r.member}
                </Td>
                <Td>{r.kind}</Td>
                <Td>{money(r.amount)}</Td>
              </Tr>
            ))}
          </Table>
        </section>
        <section className="space-y-2">
          <h2 className="font-bold">Expenses</h2>
          <Table headers={["Date", "Description", "Amount"]} isEmpty={!report.expenses.length} empty="No expenses this month.">
            {report.expenses.map((r, i) => (
              <Tr key={i}>
                <Td>{r.date}</Td>
                <Td>{r.description || r.category}</Td>
                <Td>{money(r.amount)}</Td>
              </Tr>
            ))}
          </Table>
        </section>
      </div>
    </div>
  );
}
