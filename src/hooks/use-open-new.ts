"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Opens the "create" modal when the page is visited with `?new=1` (dashboard quick actions),
 * then strips the param so a refresh doesn't reopen it.
 */
export function useOpenNew(open: () => void) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const wantsNew = params.get("new") === "1";

  useEffect(() => {
    if (!wantsNew) return;
    open();
    const next = new URLSearchParams(params);
    next.delete("new");
    router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per ?new=1 visit
  }, [wantsNew]);
}
