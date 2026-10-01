"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DatabaseBackup, Upload } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/form";
import { usePermissions } from "@/components/auth/permissions";

type Status = { tone: "emerald" | "amber"; text: string } | null;

export function BackupPanel() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(null);
  const [restoring, setRestoring] = useState(false);
  const { canWrite } = usePermissions();

  const restore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!confirm("Restore will replace current data. Continue?")) return;

    setRestoring(true);
    setStatus(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/backup", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const c = json.counts;
      setStatus({
        tone: "emerald",
        text: `Restore completed: ${c.houses} houses, ${c.members} members, ${c.payments} payments, ${c.expenses} expenses, ${c.rwa} RWA members, ${c.renters} renters, ${c.documents} documents.`,
      });
      router.refresh();
    } catch (err) {
      setStatus({ tone: "amber", text: err instanceof Error && err.message ? err.message : "Invalid backup ZIP." });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Card className="space-y-5 p-6">
      <div>
        <h2 className="text-lg font-bold">Complete Backup & Restore</h2>
        <p className="mt-1 text-sm text-slate-500">
          Includes houses, members, payments, expenses, RWA records, renters, settings, ID documents, photos and expense
          bills/receipts. Backups from the old offline app can also be restored here.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <a
          className={buttonClass({ variant: "primary" })}
          href="/api/backup"
          download
          onClick={() => setStatus({ tone: "emerald", text: "Complete backup downloaded." })}
        >
          <DatabaseBackup size={18} />
          Create Complete Backup
        </a>
        {canWrite && (
          <label className={buttonClass({}, restoring ? "pointer-events-none opacity-60" : "cursor-pointer")}>
            <Upload size={18} />
            {restoring ? "Restoring…" : "Restore ZIP"}
            <input className="hidden" type="file" accept=".zip,application/zip" onChange={restore} disabled={restoring} />
          </label>
        )}
      </div>
      {status && <Notice tone={status.tone}>{status.text}</Notice>}
    </Card>
  );
}
