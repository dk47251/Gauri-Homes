"use client";

import { useState } from "react";
import { Download, Eye, Trash2 } from "lucide-react";
import { documentUrl, toViewable, type DocMeta, type ViewableDoc } from "@/lib/types";
import { formatBytes } from "@/lib/format";
import { Button } from "./button";
import { DocViewer, downloadUrl } from "./doc-viewer";
import { useReadOnly } from "./form";

/**
 * Lists saved documents plus newly selected (not yet uploaded) files, with preview,
 * download and remove. Removing a saved document takes effect when the form is saved.
 */
export function DocumentList({
  saved,
  onRemoveSaved,
  files = [],
  onRemoveFile,
}: {
  saved: DocMeta[];
  onRemoveSaved: (id: string) => void;
  files?: File[];
  onRemoveFile?: (index: number) => void;
}) {
  const [viewer, setViewer] = useState<(ViewableDoc & { temporary?: boolean }) | null>(null);
  const readOnly = useReadOnly();

  // Unsaved files get a short-lived object URL that is revoked when the viewer closes.
  const previewFile = (f: File) => setViewer({ name: f.name, mime: f.type, url: URL.createObjectURL(f), temporary: true });
  const closeViewer = () => {
    if (viewer?.temporary) URL.revokeObjectURL(viewer.url);
    setViewer(null);
  };

  if (!saved.length && !files.length) return null;

  return (
    <div className="mt-3 space-y-2">
      {saved.map((d) => (
        <Row
          key={d.id}
          name={d.name}
          meta={formatBytes(d.size)}
          onPreview={() => setViewer(toViewable(d))}
          onDownload={() => downloadUrl(documentUrl(d.id), d.name)}
          onRemove={readOnly ? undefined : () => onRemoveSaved(d.id)}
        />
      ))}
      {files.map((f, i) => (
        <Row
          key={`${f.name}-${f.lastModified}-${i}`}
          name={f.name}
          meta={`${formatBytes(f.size)} · not saved yet`}
          onPreview={() => previewFile(f)}
          onRemove={() => onRemoveFile?.(i)}
        />
      ))}
      {viewer && <DocViewer doc={viewer} onClose={closeViewer} />}
    </div>
  );
}

function Row({
  name,
  meta,
  onPreview,
  onDownload,
  onRemove,
}: {
  name: string;
  meta: string;
  onPreview: () => void;
  onDownload?: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{name}</div>
        <div className="text-xs text-slate-500">{meta}</div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button onClick={onPreview}>
          <Eye size={15} />
          Preview
        </Button>
        {onDownload && (
          <Button size="icon" aria-label="Download" onClick={onDownload}>
            <Download size={15} />
          </Button>
        )}
        {onRemove && (
          <Button variant="danger" size="icon" aria-label="Remove" onClick={onRemove}>
            <Trash2 size={15} />
          </Button>
        )}
      </div>
    </div>
  );
}
