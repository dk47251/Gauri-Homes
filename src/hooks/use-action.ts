"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/types";

/**
 * Wraps a Server Action returning ActionResult: tracks pending state and error message,
 * and calls `onSuccess` when it succeeds.
 */
export function useAction<A extends unknown[]>(
  action: (...args: A) => Promise<ActionResult>,
  onSuccess?: (result: ActionResult) => void,
) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (...args: A) =>
    startTransition(async () => {
      setError(null);
      const result = await action(...args);
      if (result.ok) onSuccess?.(result);
      else setError(result.error);
    });

  return { run, pending, error, setError };
}

/** Confirms, then runs a delete action; alerts on failure. */
export function useDelete(action: (id: number) => Promise<ActionResult>, message = "Delete?") {
  const [pending, startTransition] = useTransition();
  const remove = (id: number) => {
    if (!confirm(message)) return;
    startTransition(async () => {
      const result = await action(id);
      if (!result.ok) alert(result.error);
    });
  };
  return { remove, pending };
}

/** Builds the FormData our save actions expect: JSON payload + files + kept document IDs. */
export function buildFormData(
  payload: unknown,
  files: Record<string, File[]> = {},
  keepDocumentIds: string[] = [],
) {
  const fd = new FormData();
  fd.set("payload", JSON.stringify(payload));
  for (const [field, list] of Object.entries(files)) for (const f of list) fd.append(field, f);
  for (const id of keepDocumentIds) fd.append("keepDocumentIds", id);
  return fd;
}
