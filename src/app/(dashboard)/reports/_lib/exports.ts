import type { MonthlyReport } from "@/lib/data/report";
import { moneyPdf } from "@/lib/format";

/** Monthly Financial Report as an A4 PDF: income, expenses and summary tables. */
export async function downloadReportPdf(report: MonthlyReport) {
  const { jsPDF } = await import("jspdf");
  const { month, summary: s } = report;
  const d = new jsPDF({ unit: "mm", format: "a4" });
  const Mg = 14;
  const bottom = 282;
  let y = 14;

  const table = (title: string, headers: string[], rows: string[][], widths: number[]) => {
    if (y + 12 > bottom) {
      d.addPage();
      y = 14;
    }
    d.setTextColor("#111827");
    d.setFont("helvetica", "bold");
    d.setFontSize(10);
    d.text(title, Mg, y);
    y += 5;

    [headers, ...rows].forEach((row, ri) => {
      d.setFontSize(7.5);
      const heights = row.map((cell, i) => d.splitTextToSize(String(cell), widths[i] - 4).length);
      const rh = Math.max(7, Math.min(16, Math.max(...heights) * 3.7 + 2.5));
      if (y + rh > bottom) {
        d.addPage();
        y = 14;
      }
      let x = Mg;
      row.forEach((cell, i) => {
        d.setFillColor(ri === 0 ? "#F3F4F6" : ri % 2 === 0 ? "#FAFAFA" : "#FFFFFF");
        d.setDrawColor("#D1D5DB");
        d.setLineWidth(0.25);
        d.rect(x, y, widths[i], rh, "FD");
        d.setTextColor("#111827");
        d.setFont("helvetica", ri === 0 ? "bold" : "normal");
        d.setFontSize(7.5);
        const lines = d.splitTextToSize(String(cell), widths[i] - 4);
        const last = i === widths.length - 1;
        d.text(lines, last ? x + widths[i] - 2 : x + 2, y + 4.5, { align: last ? "right" : "left", maxWidth: widths[i] - 4 });
        x += widths[i];
      });
      y += rh;
    });
    y += 5;
  };

  d.setTextColor("#111827");
  d.setFont("helvetica", "normal");
  d.setFontSize(9);
  d.text(`Month: ${month}`, Mg, y);
  y += 6;
  d.text(`Beginning Balance: ${moneyPdf(s.beginningBalance)}`, Mg, y);
  y += 7;

  const incomeRows = report.income.map((r) => [r.date, `${r.house} / ${r.member}`, r.kind, moneyPdf(r.amount)]);
  incomeRows.push(["", "Total Income", "", moneyPdf(s.paid)]);
  table("Income", ["Date", "House / Member", "Type", "Amount"], incomeRows, [35, 78, 32, 37]);

  const expenseRows = report.expenses.map((r) => [r.date, r.description || r.category, moneyPdf(r.amount)]);
  expenseRows.push(["", "Total Expenses", moneyPdf(s.spent)]);
  table("Expenses", ["Date", "Description", "Amount"], expenseRows, [38, 107, 37]);

  if (y + 38 > bottom) {
    d.addPage();
    y = 14;
  }
  d.setTextColor("#111827");
  d.setFont("helvetica", "bold");
  d.setFontSize(10);
  d.text("Summary", Mg, y);
  y += 6;
  d.setFont("helvetica", "normal");
  d.setFontSize(9);
  const lines: [string, number][] = [
    ["Maintenance Due", s.due],
    ["Maintenance Collected", s.paid],
    ["Previous Pending", s.previousPending],
    ["Current Pending", s.pending],
    ["Advance Balance", s.advanceBalance],
    ["Expenses", s.spent],
    ["Net Income / Loss", s.paid - s.spent],
    ["Ending Balance", s.endingBalance],
  ];
  for (const [label, value] of lines) {
    d.text(`${label}:`, Mg, y);
    d.text(moneyPdf(value), Mg + 90, y, { align: "right" });
    y += 5;
  }

  d.save(`Gauri-Report-${month}.pdf`);
}

/** Monthly report workbook: summary, house-wise ledger, expenses and transactions. */
export async function downloadReportExcel(report: MonthlyReport) {
  const XLSX = await import("xlsx");
  const { month, summary: s } = report;
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet([
      {
        Month: month,
        "Total Properties": report.totalProperties,
        "Maintenance Due": s.due,
        "Previous Pending": s.previousPending,
        Collected: s.paid,
        Pending: s.pending,
        "Advance Balance": s.advanceBalance,
        Expenses: s.spent,
        "Net Balance": s.paid - s.spent,
        "Ending Balance": s.endingBalance,
      },
    ]),
    "Monthly Summary",
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      report.houseWise.map((r) => ({
        House: r.house,
        Member: r.member,
        Due: r.due,
        "Previous Pending": r.previousPending,
        Paid: r.paid,
        Pending: r.pending,
        "Advance Balance": r.advanceBalance,
      })),
    ),
    "House-wise Payments",
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      report.expenses.map((r) => ({
        Date: r.date,
        Category: r.category,
        Description: r.description,
        Amount: r.amount,
        Mode: r.mode,
        Vendor: r.vendor,
        Recurring: r.recurring ? "Monthly" : "No",
        Remarks: r.remarks,
      })),
    ),
    "Expenses",
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      report.income.map((r) => ({
        Date: r.date,
        House: r.house,
        Member: r.member,
        Type: r.kind,
        "Advance Months": r.kind === "Advance" ? r.advanceMonths : "",
        Amount: r.amount,
        Mode: r.mode,
        "Transaction / Receipt": r.txn,
        Remarks: r.remarks,
      })),
    ),
    "Transactions",
  );

  XLSX.writeFile(wb, `Gauri-Report-${month}.xlsx`);
}
