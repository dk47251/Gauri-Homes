"use client";

import { useState } from "react";
import { saveRenter } from "@/lib/actions/renters";
import { ID_TYPES } from "@/lib/constants";
import type { RenterRow } from "@/lib/data/queries";
import { today } from "@/lib/format";
import type { RenterInput } from "@/lib/validation";
import { buildFormData, useAction } from "@/hooks/use-action";
import { Field, FieldSet, FormError, Input, Select, Textarea, FormActions, ReadOnlyScope } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { SingleFileField } from "@/components/ui/single-file-field";

type Form = Omit<RenterInput, "familyMembers" | "age" | "familyCount"> & {
  familyMembers: string[];
  age: number;
  familyCount: number;
};

const blank = (): Form => ({
  houseFlat: "",
  name: "",
  age: 0,
  nationality: "Indian",
  phone: "",
  familyCount: 1,
  familyMembers: [""],
  moveInDate: today(),
  validIdType: "Aadhaar",
  validIdNumber: "",
  notes: "",
});

export function RenterModal({ renter, onClose, readOnly = false }: { renter: RenterRow | null; onClose: () => void; readOnly?: boolean }) {
  const [f, setF] = useState<Form>(() =>
    renter
      ? {
          id: renter.id,
          houseFlat: renter.houseFlat,
          name: renter.name,
          age: renter.age,
          nationality: renter.nationality,
          phone: renter.phone,
          familyCount: renter.familyCount,
          familyMembers: renter.familyMembers,
          moveInDate: renter.moveInDate,
          validIdType: renter.validIdType as Form["validIdType"],
          validIdNumber: renter.validIdNumber,
          notes: renter.notes,
        }
      : blank(),
  );
  const [photo, setPhoto] = useState(() => renter?.documents.find((d) => d.kind === "PHOTO") ?? null);
  const [validId, setValidId] = useState(() => renter?.documents.find((d) => d.kind === "ID_PROOF") ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const set = (patch: Partial<Form>) => setF((x) => ({ ...x, ...patch }));
  const { run, pending, error } = useAction(saveRenter, onClose);

  const setFamilyCount = (count: number) => {
    const safe = Math.max(1, count || 1);
    set({ familyCount: safe, familyMembers: Array.from({ length: safe }, (_, i) => f.familyMembers[i] ?? "") });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const keep = [photo, validId].filter((d) => d !== null).map((d) => d.id);
    run(buildFormData(f, { photo: photoFile ? [photoFile] : [], validId: idFile ? [idFile] : [] }, keep));
  };

  return (
    <Modal title={readOnly ? "View Renter / Tenant" : renter ? "Edit Renter / Tenant" : "Add Renter / Tenant"} onClose={onClose}>
      <ReadOnlyScope readOnly={readOnly}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <SingleFileField
            label="Photo"
            accept="image/*"
            thumbnail
            saved={photo}
            file={photoFile}
            onFile={setPhotoFile}
            onRemoveSaved={() => setPhoto(null)}
          />
          <Field label="House / Flat No." required>
            <Input required value={f.houseFlat} onChange={(e) => set({ houseFlat: e.target.value })} />
          </Field>
          <Field label="Name" required>
            <Input required value={f.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Age" required>
            <Input type="number" min={0} max={120} required value={f.age} onChange={(e) => set({ age: +e.target.value })} />
          </Field>
          <Field label="Nationality" required>
            <Input required value={f.nationality} onChange={(e) => set({ nationality: e.target.value })} />
          </Field>
          <Field label="Phone Number">
            <Input type="tel" value={f.phone} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
          <Field label="Number of Family Members" required>
            <Input type="number" min={1} required value={f.familyCount} onChange={(e) => setFamilyCount(+e.target.value)} />
          </Field>
          <Field label="Move-in Date">
            <Input type="date" value={f.moveInDate} onChange={(e) => set({ moveInDate: e.target.value })} />
          </Field>

          <FieldSet title="Family Member Names">
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: f.familyCount || 1 }, (_, i) => (
                <Field key={i} label={`Family Member ${i + 1} Name`}>
                  <Input
                    value={f.familyMembers[i] ?? ""}
                    onChange={(e) => {
                      const names = [...f.familyMembers];
                      names[i] = e.target.value;
                      set({ familyMembers: names });
                    }}
                  />
                </Field>
              ))}
            </div>
          </FieldSet>

          <Field label="Valid ID Proof Type" required>
            <Select value={f.validIdType} onChange={(e) => set({ validIdType: e.target.value as Form["validIdType"] })}>
              {ID_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Valid ID Proof Number" required>
            <Input required value={f.validIdNumber} onChange={(e) => set({ validIdNumber: e.target.value })} />
          </Field>

          <FieldSet title="Valid ID Proof Document">
            <SingleFileField
              label="Upload image or PDF"
              accept="image/*,.pdf"
              saved={validId}
              file={idFile}
              onFile={setIdFile}
              onRemoveSaved={() => setValidId(null)}
            />
          </FieldSet>

          <Field label="Notes" className="md:col-span-2">
            <Textarea value={f.notes} onChange={(e) => set({ notes: e.target.value })} />
          </Field>

          <FormError message={error} />
          <FormActions onClose={onClose} pending={pending} saveLabel="Save Renter" />
        </form>
      </ReadOnlyScope>
    </Modal>
  );
}
