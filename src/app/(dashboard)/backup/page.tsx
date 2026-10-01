import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { BackupPanel } from "./_components/backup-panel";

export const metadata: Metadata = { title: "Backup & Restore" };

export default async function BackupPage() {
  const user = await requireUser();
  if (!user.canWrite) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-bold">Backup & Restore</h2>
        <p className="mt-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          You have read-only access. Backup download and restore need Read &amp; Write permission from the administrator.
        </p>
      </Card>
    );
  }
  return <BackupPanel />;
}
