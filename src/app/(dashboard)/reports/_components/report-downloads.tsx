"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import type { MonthlyReport } from "@/lib/data/report";
import { Button } from "@/components/ui/button";

/** PDF/Excel exports. The heavy libraries are loaded only when a download is requested. */
export function ReportDownloads({ report }: { report: MonthlyReport }) {
  const [busy, setBusy] = useState<"pdf" | "excel" | null>(null);

  const run = async (kind: "pdf" | "excel") => {
    setBusy(kind);
    try {
      const mod = await import("../_lib/exports");
      if (kind === "pdf") await mod.downloadReportPdf(report);
      else await mod.downloadReportExcel(report);
    } catch (e) {
      console.error(e);
      alert("Could not generate the report.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Button onClick={() => run("excel")} disabled={busy !== null}>
        <Download size={17} />
        {busy === "excel" ? "Preparing…" : "Download Excel"}
      </Button>
      <Button variant="primary" onClick={() => run("pdf")} disabled={busy !== null}>
        <FileText size={17} />
        {busy === "pdf" ? "Preparing…" : "Download PDF"}
      </Button>
    </>
  );
}
