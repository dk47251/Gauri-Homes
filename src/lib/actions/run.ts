import "server-only";
import { revalidatePath } from "next/cache";
import { requireUser, requireWriteAccess } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/types";

/**
 * Runs a mutation for a logged-in user with Read & Write access (redirects to /login when logged
 * out; read-only users get an error result), refreshes every page (ledger figures are shared across screens) and
 * turns thrown errors into a serialisable result for the client.
 */
export async function runAction(fn: () => Promise<unknown>, message?: string): Promise<ActionResult> {
  // Server Actions are public POST endpoints, so each one must verify the session itself.
  await requireUser();
  try {
    await requireWriteAccess();
    await fn();
  } catch (e) {
    console.error(e);
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
  }
  revalidatePath("/", "layout");
  return { ok: true, message };
}

/** Validates an ID received from the client before it reaches a query. */
export function assertId(id: unknown): number {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new Error("Invalid record ID.");
  return n;
}
