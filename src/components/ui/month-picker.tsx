"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Field, Input } from "./form";

/** Month selector synced to the `?month=YYYY-MM` search param so it survives refresh and sharing. */
export function MonthPicker({ month, label = "Month" }: { month: string; label?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const change = (value: string) => {
    if (!value) return;
    const next = new URLSearchParams(params);
    next.set("month", value);
    startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }));
  };

  return (
    <Field label={label}>
      <Input className="max-w-xs" type="month" value={month} aria-busy={pending} onChange={(e) => change(e.target.value)} />
    </Field>
  );
}
