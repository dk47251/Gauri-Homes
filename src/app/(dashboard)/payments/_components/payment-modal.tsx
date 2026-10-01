"use client";

import { useState } from "react";
import { savePayment } from "@/lib/actions/payments";
import { PAYMENT_MODES, type PaymentKind } from "@/lib/constants";
import type { HouseRow, PaymentRow } from "@/lib/data/queries";
import { money, monthNow, today } from "@/lib/format";
import type { PaymentInput } from "@/lib/validation";
import { buildFormData, useAction } from "@/hooks/use-action";
import { Field, FormError, Input, Notice, Select, Textarea, FormActions, ReadOnlyScope } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";

type Form = PaymentInput & { houseId: number; amount: number; advanceMonths: number; kind: PaymentKind };

export function PaymentModal({
  payment,
  houses,
  onClose,
  readOnly = false,
}: {
  payment: PaymentRow | null;
  houses: HouseRow[];
  onClose: () => void;
  readOnly?: boolean;
}) {
  const [f, setF] = useState<Form>(() =>
    payment
      ? {
          id: payment.id,
          houseId: payment.houseId,
          date: payment.date,
          month: payment.month,
          amount: payment.amount,
          mode: payment.mode as Form["mode"],
          txn: payment.txn,
          remarks: payment.remarks,
          kind: payment.kind as PaymentKind,
          advanceMonths: payment.advanceMonths,
        }
      : {
          houseId: houses[0]?.id ?? 0,
          date: today(),
          month: monthNow(),
          amount: 0,
          mode: "Cash",
          txn: "",
          remarks: "",
          kind: "Regular",
          advanceMonths: 1,
        },
  );
  const set = (patch: Partial<Form>) => setF((x) => ({ ...x, ...patch }));
  const { run, pending, error, setError } = useAction(savePayment, onClose);

  const selectedHouse = houses.find((h) => h.id === f.houseId);
  const isAdvance = f.kind === "Advance";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.houseId) return setError("Select a house.");
    if (isAdvance && (!f.advanceMonths || f.advanceMonths < 1)) {
      return setError("Advance payment ke liye months ki sankhya 1 ya usse zyada honi chahiye.");
    }
    run(buildFormData(f));
  };

  return (
    <Modal title={readOnly ? "View Payment" : payment ? "Edit Payment" : "Add Payment"} onClose={onClose}>
      <ReadOnlyScope readOnly={readOnly}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <Field label="House" required>
            <Select value={f.houseId} onChange={(e) => set({ houseId: +e.target.value })}>
              {houses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.number} — {h.owner}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Payment Type" required>
            <Select value={f.kind} onChange={(e) => set({ kind: e.target.value as PaymentKind })}>
              <option value="Regular">Regular Payment</option>
              <option value="Advance">Advance Payment</option>
            </Select>
          </Field>
          <Field label="Payment Date" required>
            <Input type="date" required value={f.date} onChange={(e) => set({ date: e.target.value })} />
          </Field>
          <Field label={isAdvance ? "Advance Start Month" : "Maintenance Month"} required>
            <Input type="month" required value={f.month} onChange={(e) => set({ month: e.target.value })} />
          </Field>
          <Field label="Amount" required>
            <Input type="number" min={1} required value={f.amount} onChange={(e) => set({ amount: +e.target.value })} />
          </Field>
          {isAdvance && (
            <Field label="Advance For (Months)" required>
              <Input type="number" min={1} value={f.advanceMonths} onChange={(e) => set({ advanceMonths: +e.target.value })} />
            </Field>
          )}
          <Field label="Payment Mode">
            <Select value={f.mode} onChange={(e) => set({ mode: e.target.value as Form["mode"] })}>
              {PAYMENT_MODES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </Select>
          </Field>
          <Field label="Transaction / Receipt Number">
            <Input value={f.txn} onChange={(e) => set({ txn: e.target.value })} />
          </Field>

          <Notice className="md:col-span-2">
            {isAdvance
              ? `Advance payment ${selectedHouse ? money(selectedHouse.monthlyMaintenance) : ""} monthly maintenance ke against future months mein adjust hoga. Extra amount Advance Balance ke roop mein rahega.`
              : "Regular payment sirf selected maintenance month ke against count hoga."}
          </Notice>

          <Field label="Remarks" className="md:col-span-2">
            <Textarea value={f.remarks} onChange={(e) => set({ remarks: e.target.value })} />
          </Field>

          <FormError message={error} />
          <FormActions onClose={onClose} pending={pending} saveLabel="Save Payment" />
        </form>
      </ReadOnlyScope>
    </Modal>
  );
}
