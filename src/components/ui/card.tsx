import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60", className)}>{children}</div>;
}

export function StatCard({ label, value, tone }: { label: string; value: ReactNode; tone?: "danger" | "success" }) {
  return (
    <Card>
      <div className="text-sm text-slate-500">{label}</div>
      <div
        className={cn(
          "mt-2 text-2xl font-bold",
          tone === "danger" && "text-red-600",
          tone === "success" && "text-emerald-600",
        )}
      >
        {value}
      </div>
    </Card>
  );
}
