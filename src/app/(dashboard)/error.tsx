"use client";

import { Button } from "@/components/ui/button";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
      <h2 className="text-lg font-bold text-red-700">Something went wrong</h2>
      <p className="mt-2 text-sm text-slate-500">{error.message || "Could not load this page."}</p>
      <Button variant="primary" className="mt-5" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
