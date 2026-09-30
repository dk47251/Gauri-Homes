"use client";

import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

const ReadOnlyContext = createContext(false);

/** Everything inside renders view-only: inputs are disabled and file pickers/remove buttons hidden. */
export function ReadOnlyScope({ readOnly, children }: { readOnly: boolean; children: ReactNode }) {
  return <ReadOnlyContext.Provider value={readOnly}>{children}</ReadOnlyContext.Provider>;
}

export const useReadOnly = () => useContext(ReadOnlyContext);

export function Field({
  label,
  required = false,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

export function Input({ className, disabled, ...props }: ComponentProps<"input">) {
  const readOnly = useReadOnly();
  if (readOnly && props.type === "file") return null;
  return (
    <input
      className={cn(props.type === "file" ? "form-file" : "form-control", className)}
      disabled={readOnly || disabled}
      {...props}
    />
  );
}

export function Select({ className, disabled, ...props }: ComponentProps<"select">) {
  const readOnly = useReadOnly();
  return <select className={cn("form-control", className)} disabled={readOnly || disabled} {...props} />;
}

export function Textarea({ className, rows = 3, disabled, ...props }: ComponentProps<"textarea">) {
  const readOnly = useReadOnly();
  return <textarea rows={rows} className={cn("form-control", className)} disabled={readOnly || disabled} {...props} />;
}

/** Modal footer: Cancel + Save, or just Close when the form is read-only. */
export function FormActions({ onClose, pending, saveLabel }: { onClose: () => void; pending: boolean; saveLabel: string }) {
  const readOnly = useReadOnly();
  return (
    <div className="flex justify-end gap-3 md:col-span-2">
      <Button onClick={onClose}>{readOnly ? "Close" : "Cancel"}</Button>
      {!readOnly && (
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : saveLabel}
        </Button>
      )}
    </div>
  );
}

/** Bordered group inside a form, e.g. "ID Proof Documents". */
export function FieldSet({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-xl border border-slate-200 p-4 md:col-span-2", className)}>
      <div className="mb-3 font-semibold">{title}</div>
      {children}
    </div>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 md:col-span-2">
      {message}
    </div>
  );
}

export function Notice({ tone = "amber", className, children }: { tone?: "amber" | "emerald"; className?: string; children: ReactNode }) {
  const tones = {
    amber: "bg-amber-50 text-amber-800",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return <div className={cn("rounded-xl p-4 text-sm", tones[tone], className)}>{children}</div>;
}
