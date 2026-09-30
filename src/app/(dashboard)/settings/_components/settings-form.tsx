"use client";

import { useState } from "react";
import { saveSettings } from "@/lib/actions/settings";
import type { SettingRow } from "@/lib/data/queries";
import type { SettingsInput } from "@/lib/validation";
import { buildFormData, useAction } from "@/hooks/use-action";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FormError, Input, Notice, ReadOnlyScope, Select } from "@/components/ui/form";
import { usePermissions } from "@/components/auth/permissions";

type Form = SettingsInput & { retentionDays: number };

export function SettingsForm({ settings }: { settings: SettingRow }) {
  const [s, setS] = useState<Form>(() => ({
    autoBackup: settings.autoBackup,
    backupTime: settings.backupTime,
    backupEmail: settings.backupEmail,
    emailApiUrl: settings.emailApiUrl,
    emailBackup: settings.emailBackup,
    localBackup: settings.localBackup,
    retentionDays: settings.retentionDays,
  }));
  const [saved, setSaved] = useState(false);
  const set = (patch: Partial<Form>) => {
    setSaved(false);
    setS((x) => ({ ...x, ...patch }));
  };
  const { run, pending, error } = useAction(saveSettings, () => setSaved(true));
  const { canWrite } = usePermissions();

  return (
    <ReadOnlyScope readOnly={!canWrite}>
      <Card className="p-6">
        <h2 className="text-lg font-bold">Backup Settings</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(buildFormData(s));
          }}
        >
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Automatic Backup">
              <Select value={String(s.autoBackup)} onChange={(e) => set({ autoBackup: e.target.value === "true" })}>
                <option value="true">ON</option>
                <option value="false">OFF</option>
              </Select>
            </Field>
            <Field label="Backup Time">
              <Input type="time" value={s.backupTime} onChange={(e) => set({ backupTime: e.target.value })} />
            </Field>
            <Field label="Backup Email">
              <Input type="email" value={s.backupEmail} onChange={(e) => set({ backupEmail: e.target.value })} />
            </Field>
            <Field label="Email Backup">
              <Select value={String(s.emailBackup)} onChange={(e) => set({ emailBackup: e.target.value === "true" })}>
                <option value="true">ON</option>
                <option value="false">OFF</option>
              </Select>
            </Field>
            <Field label="Email API URL">
              <Input placeholder="Optional future/server endpoint" value={s.emailApiUrl} onChange={(e) => set({ emailApiUrl: e.target.value })} />
            </Field>
            <Field label="Keep Local Backups (days)">
              <Input type="number" min={1} value={s.retentionDays} onChange={(e) => set({ retentionDays: +e.target.value })} />
            </Field>
          </div>

          <Notice className="mt-5">
            These preferences are saved in the database. Scheduled/emailed backups need a server job (e.g. a cron calling
            <code className="mx-1 rounded bg-amber-100 px-1">GET /api/backup</code>) — until then use Backup &amp; Restore to download a
            backup manually.
          </Notice>

          <div className="mt-5 space-y-3">
            <FormError message={error} />
            {saved && <Notice tone="emerald">Settings saved.</Notice>}
            {canWrite ? (
              <Button type="submit" variant="primary" disabled={pending}>
                {pending ? "Saving…" : "Save Settings"}
              </Button>
            ) : (
              <p className="text-sm text-slate-500">You have read-only access, so settings cannot be changed.</p>
            )}
          </div>
        </form>
      </Card>
    </ReadOnlyScope>
  );
}
