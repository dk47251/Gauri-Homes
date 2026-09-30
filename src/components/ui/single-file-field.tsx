"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import { toViewable, type DocMeta, type ViewableDoc } from "@/lib/types";
import { Button } from "./button";
import { DocViewer } from "./doc-viewer";
import { Field, Input, useReadOnly } from "./form";

/**
 * File input for a single document (photo / ID proof). Shows the saved document or the newly
 * picked file, with preview, optional thumbnail and remove.
 */
export function SingleFileField({
  label,
  accept,
  saved,
  file,
  onFile,
  onRemoveSaved,
  thumbnail = false,
  required = false,
}: {
  label: string;
  accept: string;
  saved: DocMeta | null;
  file: File | null;
  onFile: (file: File | null) => void;
  onRemoveSaved: () => void;
  thumbnail?: boolean;
  required?: boolean;
}) {
  const [viewer, setViewer] = useState<ViewableDoc | null>(null);
  const readOnly = useReadOnly();
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  const setUrl = (url: string | null) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = url;
    setFileUrl(url);
  };
  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  const current: ViewableDoc | null =
    file && fileUrl ? { name: file.name, mime: file.type, url: fileUrl } : saved ? toViewable(saved) : null;

  return (
    <div>
      <Field label={label} required={required}>
        <Input
          type="file"
          accept={accept}
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setUrl(f ? URL.createObjectURL(f) : null);
            onFile(f);
            e.target.value = "";
          }}
        />
      </Field>
      {readOnly && !current && <p className="text-sm text-slate-400">Not uploaded</p>}
      {current && (
        <div className="mt-2 flex items-center gap-3 rounded-lg bg-slate-50 p-2">
          {thumbnail && current.mime.startsWith("image/") && (
            // eslint-disable-next-line @next/next/no-img-element -- user uploads / blob URLs
            <img src={current.url} alt="" className="h-16 w-16 rounded-xl object-cover" />
          )}
          <span className="min-w-0 flex-1 truncate text-sm">
            {current.name}
            {file && <span className="text-xs text-slate-500"> · not saved yet</span>}
          </span>
          <Button onClick={() => setViewer(current)}>
            <Eye size={15} />
            Preview
          </Button>
          {!readOnly && (
            <Button
              variant="danger"
              size="icon"
              aria-label="Remove"
              onClick={() => {
                if (file) {
                  setUrl(null);
                  onFile(null);
                } else onRemoveSaved();
              }}
            >
              <Trash2 size={15} />
            </Button>
          )}
        </div>
      )}
      {viewer && <DocViewer doc={viewer} onClose={() => setViewer(null)} />}
    </div>
  );
}
