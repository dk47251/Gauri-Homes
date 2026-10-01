"use client";

import { useState } from "react";
import { saveMemberAccount } from "@/lib/actions/houses";
import type { HouseWithAccount } from "@/lib/data/queries";
import { money } from "@/lib/format";
import type { MemberInput } from "@/lib/validation";
import { buildFormData, useAction } from "@/hooks/use-action";
import { DocumentList } from "@/components/ui/document-list";
import { Field, FieldSet, FormError, Input, Textarea, FormActions, ReadOnlyScope } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";

export function MemberModal({ house, onClose, readOnly = false }: { house: HouseWithAccount; onClose: () => void; readOnly?: boolean }) {
  const m = house.member;
  // A house without a member account starts pre-filled from the owner details.
  const [f, setF] = useState<MemberInput>({
    houseId: house.id,
    name: m?.name ?? house.owner,
    mobile: m?.mobile ?? house.mobile,
    whatsapp: m?.whatsapp ?? house.whatsapp,
    email: m?.email ?? "",
    startDate: m?.startDate ?? house.startDate,
    notes: m?.notes ?? "",
  });
  const [keep, setKeep] = useState(() => m?.documents ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const set = (patch: Partial<MemberInput>) => setF((x) => ({ ...x, ...patch }));
  const { run, pending, error } = useAction(saveMemberAccount, onClose);

  return (
    <Modal title={`Member Account — ${house.number}`} onClose={onClose}>
      <ReadOnlyScope readOnly={readOnly}>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(buildFormData(f, { documents: files }, keep.map((d) => d.id)));
          }}
        >
          <Field label="Member Name" required>
            <Input required value={f.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="House / Flat">
            <Input readOnly value={house.number} />
          </Field>
          <Field label="Mobile">
            <Input type="tel" value={f.mobile} onChange={(e) => set({ mobile: e.target.value })} />
          </Field>
          <Field label="WhatsApp">
            <Input type="tel" value={f.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label="Start Date">
            <Input type="date" value={f.startDate} onChange={(e) => set({ startDate: e.target.value })} />
          </Field>
          <Field label="Notes" className="md:col-span-2">
            <Textarea value={f.notes} onChange={(e) => set({ notes: e.target.value })} />
          </Field>

          <FieldSet title="ID Proof Documents">
            <Input
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []);
                setFiles((x) => [...x, ...picked]);
                e.target.value = "";
              }}
            />
            <DocumentList
              saved={keep}
              onRemoveSaved={(id) => setKeep((x) => x.filter((d) => d.id !== id))}
              files={files}
              onRemoveFile={(i) => setFiles((x) => x.filter((_, j) => j !== i))}
            />
          </FieldSet>

          <FieldSet title="Payment History / House Ledger">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {["Date", "Maintenance Month", "Type", "Amount", "Mode", "Receipt/Txn"].map((h) => (
                      <th key={h} className="whitespace-nowrap px-3 py-2 text-left font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {house.payments.length ? (
                    house.payments.map((p) => (
                      <tr key={p.id} className="border-t border-slate-200">
                        <td className="px-3 py-2">{p.date}</td>
                        <td className="px-3 py-2">{p.month}</td>
                        <td className="px-3 py-2">{p.kind}</td>
                        <td className="px-3 py-2">{money(p.amount)}</td>
                        <td className="px-3 py-2">{p.mode}</td>
                        <td className="px-3 py-2">{p.txn || "—"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                        No payments recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </FieldSet>

          <FormError message={error} />
          <FormActions onClose={onClose} pending={pending} saveLabel="Save Member Account" />
        </form>
      </ReadOnlyScope>
    </Modal>
  );
}
