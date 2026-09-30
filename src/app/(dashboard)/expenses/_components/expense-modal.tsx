"use client";

import { useState } from "react";
import { saveExpense } from "@/lib/actions/expenses";
import { EXPENSE_CATEGORIES, PAYMENT_MODES } from "@/lib/constants";
import type { ExpenseRow } from "@/lib/data/queries";
import { today } from "@/lib/format";
import type { ExpenseInput } from "@/lib/validation";
import { buildFormData, useAction } from "@/hooks/use-action";
import { DocumentList } from "@/components/ui/document-list";
import { Field, FieldSet, FormError, Input, Select, Textarea, FormActions, ReadOnlyScope } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";

type Form = ExpenseInput & { amount: number };

export function ExpenseModal({ expense, onClose, readOnly = false }: { expense: ExpenseRow | null; onClose: () => void; readOnly?: boolean }) {
  const [f, setF] = useState<Form>(() =>
    expense
      ? {
          id: expense.id,
          date: expense.date,
          category: expense.category as Form["category"],
          description: expense.description,
          amount: expense.amount,
          mode: expense.mode as Form["mode"],
          vendor: expense.vendor,
          remarks: expense.remarks,
          recurring: expense.recurring,
          recurringStart: expense.recurringStart,
          recurringEnd: expense.recurringEnd,
        }
      : {
          date: today(),
          category: "Maintenance",
          description: "",
          amount: 0,
          mode: "Cash",
          vendor: "",
          remarks: "",
          recurring: false,
          recurringStart: today(),
          recurringEnd: "",
        },
  );
  const [keep, setKeep] = useState(() => expense?.documents ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const set = (patch: Partial<Form>) => setF((x) => ({ ...x, ...patch }));
  const { run, pending, error } = useAction(saveExpense, onClose);

  return (
    <Modal title={readOnly ? "View Expense" : expense ? "Edit Expense" : "Add Expense"} onClose={onClose}>
      <ReadOnlyScope readOnly={readOnly}>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(buildFormData(f, { documents: files }, keep.map((d) => d.id)));
          }}
        >
          <Field label="Expense Date" required>
            <Input type="date" required value={f.date} onChange={(e) => set({ date: e.target.value })} />
          </Field>
          <Field label="Category" required>
            <Select value={f.category} onChange={(e) => set({ category: e.target.value as Form["category"] })}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Description" required>
            <Input required value={f.description} onChange={(e) => set({ description: e.target.value })} />
          </Field>
          <Field label="Amount" required>
            <Input type="number" min={0} required value={f.amount} onChange={(e) => set({ amount: +e.target.value })} />
          </Field>
          <Field label="Payment Mode">
            <Select value={f.mode} onChange={(e) => set({ mode: e.target.value as Form["mode"] })}>
              {PAYMENT_MODES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </Select>
          </Field>
          <Field label="Vendor / Person">
            <Input value={f.vendor} onChange={(e) => set({ vendor: e.target.value })} />
          </Field>
          <Field label="Recurring Expense">
            <Select value={String(f.recurring)} onChange={(e) => set({ recurring: e.target.value === "true" })}>
              <option value="false">No</option>
              <option value="true">Yes — Every Month</option>
            </Select>
          </Field>
          {f.recurring && (
            <>
              <Field label="Recurring Start Date">
                <Input type="date" value={f.recurringStart || f.date} onChange={(e) => set({ recurringStart: e.target.value })} />
              </Field>
              <Field label="Recurring End Date">
                <Input type="date" value={f.recurringEnd} onChange={(e) => set({ recurringEnd: e.target.value })} />
              </Field>
            </>
          )}
          <Field label="Remarks" className="md:col-span-2">
            <Textarea value={f.remarks} onChange={(e) => set({ remarks: e.target.value })} />
          </Field>

          <FieldSet title="Bill / Receipt Documents">
            <Input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []);
                setFiles((x) => [...x, ...picked]);
                e.target.value = "";
              }}
            />
            <p className="mt-1 text-xs text-slate-500">
              Upload bill/receipt as PDF, JPG, JPEG or PNG (max 10 MB each). Documents are stored in the SQLite database.
            </p>
            <DocumentList
              saved={keep}
              onRemoveSaved={(id) => setKeep((x) => x.filter((d) => d.id !== id))}
              files={files}
              onRemoveFile={(i) => setFiles((x) => x.filter((_, j) => j !== i))}
            />
          </FieldSet>

          <FormError message={error} />
          <FormActions onClose={onClose} pending={pending} saveLabel="Save Expense" />
        </form>
      </ReadOnlyScope>
    </Modal>
  );
}
