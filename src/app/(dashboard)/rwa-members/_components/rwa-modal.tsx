"use client";

import { useState } from "react";
import { saveRwaMember } from "@/lib/actions/rwa";
import { DESIGNATIONS, RECORD_STATUSES, RWA_ID_TYPES } from "@/lib/constants";
import type { RwaRow } from "@/lib/data/queries";
import type { RwaInput } from "@/lib/validation";
import { buildFormData, useAction } from "@/hooks/use-action";
import { Field, FormError, Input, Select, Textarea, FormActions, ReadOnlyScope } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { SingleFileField } from "@/components/ui/single-file-field";

const blank = (): RwaInput => ({
  name: "",
  houseFlat: "",
  designation: DESIGNATIONS[0],
  phone: "",
  dob: "",
  idProofType: "Aadhaar",
  idProofNumber: "",
  status: "Active",
  notes: "",
});

export function RwaModal({ member, onClose, readOnly = false }: { member: RwaRow | null; onClose: () => void; readOnly?: boolean }) {
  const [f, setF] = useState<RwaInput>(() =>
    member
      ? {
          id: member.id,
          name: member.name,
          houseFlat: member.houseFlat,
          designation: member.designation as RwaInput["designation"],
          phone: member.phone,
          dob: member.dob,
          idProofType: member.idProofType,
          idProofNumber: member.idProofNumber,
          status: member.status as RwaInput["status"],
          notes: member.notes,
        }
      : blank(),
  );
  const [photo, setPhoto] = useState(() => member?.documents.find((d) => d.kind === "PHOTO") ?? null);
  const [idProof, setIdProof] = useState(() => member?.documents.find((d) => d.kind === "ID_PROOF") ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const set = (patch: Partial<RwaInput>) => setF((x) => ({ ...x, ...patch }));
  const { run, pending, error } = useAction(saveRwaMember, onClose);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const keep = [photo, idProof].filter((d) => d !== null).map((d) => d.id);
    run(
      buildFormData(
        f,
        { photo: photoFile ? [photoFile] : [], idProof: idFile ? [idFile] : [] },
        keep,
      ),
    );
  };

  return (
    <Modal title={readOnly ? "View RWA Member" : member ? "Edit RWA Member" : "Add RWA Member"} onClose={onClose}>
      <ReadOnlyScope readOnly={readOnly}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <Field label="Member Name" required>
            <Input required value={f.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="House / Flat No.">
            <Input value={f.houseFlat} onChange={(e) => set({ houseFlat: e.target.value })} />
          </Field>
          <Field label="Designation" required>
            <Select value={f.designation} onChange={(e) => set({ designation: e.target.value as RwaInput["designation"] })}>
              {DESIGNATIONS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
          </Field>
          <Field label="Phone Number">
            <Input type="tel" value={f.phone} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
          <Field label="Date of Birth (DOB)">
            <Input type="date" value={f.dob} onChange={(e) => set({ dob: e.target.value })} />
          </Field>
          <Field label="Status">
            <Select value={f.status} onChange={(e) => set({ status: e.target.value as RwaInput["status"] })}>
              {RECORD_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="ID Proof Type">
            <Select value={f.idProofType} onChange={(e) => set({ idProofType: e.target.value })}>
              {RWA_ID_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="ID Proof Number">
            <Input value={f.idProofNumber} onChange={(e) => set({ idProofNumber: e.target.value })} />
          </Field>
          <SingleFileField
            label="Photo"
            accept="image/*"
            thumbnail
            saved={photo}
            file={photoFile}
            onFile={setPhotoFile}
            onRemoveSaved={() => setPhoto(null)}
          />
          <SingleFileField
            label="ID Proof Document"
            accept="image/*,.pdf"
            saved={idProof}
            file={idFile}
            onFile={setIdFile}
            onRemoveSaved={() => setIdProof(null)}
          />
          <Field label="Notes" className="md:col-span-2">
            <Textarea value={f.notes} onChange={(e) => set({ notes: e.target.value })} />
          </Field>

          <FormError message={error} />
          <FormActions onClose={onClose} pending={pending} saveLabel="Save RWA Member" />
        </form>
      </ReadOnlyScope>
    </Modal>
  );
}
