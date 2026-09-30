import "server-only";
import { MAX_UPLOAD_BYTES, type DocumentKind } from "./constants";
import type { Prisma } from "@/generated/prisma/client";

/** Selects document metadata only — never load file bytes into list queries. */
export const docMetaSelect = {
  id: true,
  name: true,
  mime: true,
  size: true,
  kind: true,
  uploadedAt: true,
} satisfies Prisma.DocumentSelect;

export type NewDocument = { name: string; mime: string; size: number; kind: DocumentKind; data: Uint8Array<ArrayBuffer> };

const ALLOWED = /^(image\/|application\/pdf$)/;

/** Reads uploaded files for `field` from a FormData and converts them to Document rows. */
export async function readUploads(
  formData: FormData,
  field: string,
  kind: DocumentKind,
): Promise<NewDocument[]> {
  const files = formData.getAll(field).filter((f): f is File => f instanceof File && f.size > 0);
  const out: NewDocument[] = [];
  for (const file of files) {
    if (file.size > MAX_UPLOAD_BYTES) throw new Error(`${file.name} is larger than 10 MB.`);
    const mime = file.type || "application/octet-stream";
    if (!ALLOWED.test(mime)) throw new Error(`${file.name}: only images and PDF files are allowed.`);
    out.push({
      name: file.name,
      mime,
      size: file.size,
      kind,
      data: new Uint8Array(await file.arrayBuffer()),
    });
  }
  return out;
}

/** IDs of existing documents the form wants to keep (everything else of that owner is deleted). */
export function keptDocumentIds(formData: FormData) {
  return formData.getAll("keepDocumentIds").map(String).filter(Boolean);
}
