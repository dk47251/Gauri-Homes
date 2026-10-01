"use client";

import { useEffect } from "react";
import { Download, X } from "lucide-react";
import type { ViewableDoc } from "@/lib/types";
import { Button } from "./button";

export function downloadUrl(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url.startsWith("/api/documents/") ? `${url}?download=1` : url;
  a.download = name;
  a.click();
}

export function DocViewer({ doc, onClose }: { doc: ViewableDoc; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-4">
          <div className="truncate font-semibold">{doc.name}</div>
          <div className="flex gap-2">
            <Button size="icon" aria-label="Download" onClick={() => downloadUrl(doc.url, doc.name)}>
              <Download size={16} />
            </Button>
            <Button size="icon" aria-label="Close" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-4">
          {doc.mime.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element -- user uploads / blob URLs
            <img src={doc.url} alt={doc.name} className="mx-auto max-h-[75vh] max-w-full object-contain" />
          ) : doc.mime === "application/pdf" ? (
            <iframe src={doc.url} title={doc.name} className="h-[75vh] w-full rounded bg-white" />
          ) : (
            <div className="rounded-xl bg-white p-8 text-center">Preview is not available for this file type. Use Download.</div>
          )}
        </div>
      </div>
    </div>
  );
}
