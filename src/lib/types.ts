import type { DocumentKind } from "./constants";

/** Document metadata sent to the browser. File bytes are served by /api/documents/[id]. */
export type DocMeta = {
  id: string;
  name: string;
  mime: string;
  size: number;
  kind: string;
  uploadedAt: Date;
};

/** Anything the document viewer can show: a stored document or a not-yet-uploaded file. */
export type ViewableDoc = { name: string; mime: string; url: string };

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

export const documentUrl = (id: string, download = false) =>
  `/api/documents/${id}${download ? "?download=1" : ""}`;

export const toViewable = (d: DocMeta): ViewableDoc => ({ name: d.name, mime: d.mime, url: documentUrl(d.id) });

export const docsOfKind = (docs: DocMeta[], kind: DocumentKind) => docs.filter((d) => d.kind === kind);
