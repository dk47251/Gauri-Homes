import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Table({ headers, empty = "No records found.", isEmpty, children }: {
  headers: string[];
  empty?: string;
  isEmpty?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-slate-700">
          <tr>
            {headers.map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-3 text-left font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isEmpty ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-10 text-center text-slate-400">
                {empty}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Tr({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cn("border-t border-slate-200 hover:bg-slate-50/60", className)} {...props} />;
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-4 py-3", className)} {...props} />;
}

export function RowActions({ children }: { children: ReactNode }) {
  return <div className="flex gap-2">{children}</div>;
}
