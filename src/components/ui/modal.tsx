"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export function Modal({
  title,
  onClose,
  size = "4xl",
  children,
}: {
  title: string;
  onClose: () => void;
  size?: "2xl" | "4xl" | "5xl";
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const widths = { "2xl": "max-w-2xl", "4xl": "max-w-4xl", "5xl": "max-w-5xl" };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn("max-h-[92vh] w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-2xl", widths[size])}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <h3 className="text-lg font-bold tracking-tight">{title}</h3>
          <button type="button" aria-label="Close" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900" onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
