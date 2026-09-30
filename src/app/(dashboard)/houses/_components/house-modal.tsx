"use client";

import { useState } from "react";
import { saveHouse } from "@/lib/actions/houses";
import { MAINTENANCE_OPTIONS, PROPERTY_STATUSES, RECORD_STATUSES } from "@/lib/constants";
import type { HouseRow } from "@/lib/data/queries";
import { today } from "@/lib/format";
import type { HouseInput } from "@/lib/validation";
import { buildFormData, useAction } from "@/hooks/use-action";
import { Field, FormError, Input, Select, Textarea, FormActions, ReadOnlyScope } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";

const blankHouse = (): HouseInput => ({
  number: "",
  owner: "",
  mobile: "",
  whatsapp: "",
  email: "",
  propertyStatus: PROPERTY_STATUSES[0],
  maintenanceApplicable: true,
  monthlyMaintenance: 0,
  dueDate: "",
  startDate: today(),
  status: "Active",
  notes: "",
});

const toInput = ({ id, number, owner, mobile, whatsapp, email, propertyStatus, maintenanceApplicable, monthlyMaintenance, dueDate, startDate, status, notes }: HouseRow): HouseInput => ({
  id, number, owner, mobile, whatsapp, email, maintenanceApplicable, monthlyMaintenance, dueDate, startDate, notes,
  propertyStatus: propertyStatus as HouseInput["propertyStatus"],
  status: status as HouseInput["status"],
});

export function HouseModal({ house, onClose, readOnly = false }: { house: HouseRow | null; onClose: () => void; readOnly?: boolean }) {
  const [f, setF] = useState<HouseInput>(() => (house ? toInput(house) : blankHouse()));
  const set = (patch: Partial<HouseInput>) => setF((x) => ({ ...x, ...patch }));
  const { run, pending, error } = useAction(saveHouse, onClose);

  return (
    <Modal title={readOnly ? "View Property" : house ? "Edit Property" : "Add House / Property"} onClose={onClose}>
      <ReadOnlyScope readOnly={readOnly}>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(buildFormData(f));
          }}
        >
          <Field label="House / Plot Number" required>
            <Input required value={f.number} onChange={(e) => set({ number: e.target.value })} />
          </Field>
          <Field label="Owner Name" required>
            <Input required value={f.owner} onChange={(e) => set({ owner: e.target.value })} />
          </Field>
          <Field label="Mobile Number">
            <Input type="tel" value={f.mobile} onChange={(e) => set({ mobile: e.target.value })} />
          </Field>
          <Field label="WhatsApp Number">
            <Input type="tel" value={f.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} />
          </Field>
          <Field label="Property Status" required>
            <Select value={f.propertyStatus} onChange={(e) => set({ propertyStatus: e.target.value as HouseInput["propertyStatus"] })}>
              {PROPERTY_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Maintenance Applicable">
            <Select value={String(f.maintenanceApplicable)} onChange={(e) => set({ maintenanceApplicable: e.target.value === "true" })}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
          </Field>
          <Field label="Monthly Maintenance">
            <Select value={String(f.monthlyMaintenance)} onChange={(e) => set({ monthlyMaintenance: Number(e.target.value) })}>
              {MAINTENANCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Due Date">
            <Input type="date" value={f.dueDate} onChange={(e) => set({ dueDate: e.target.value })} />
          </Field>
          <Field label="Start Date">
            <Input type="date" value={f.startDate} onChange={(e) => set({ startDate: e.target.value })} />
          </Field>
          <Field label="Status">
            <Select value={f.status} onChange={(e) => set({ status: e.target.value as HouseInput["status"] })}>
              {RECORD_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Notes" className="md:col-span-2">
            <Textarea value={f.notes} onChange={(e) => set({ notes: e.target.value })} />
          </Field>

          <FormError message={error} />
          <FormActions onClose={onClose} pending={pending} saveLabel="Save Property" />
        </form>
      </ReadOnlyScope>
    </Modal>
  );
}
