import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "./form";

/** Search box + primary action row shown above list tables. */
export function Toolbar({
  query,
  onQuery,
  placeholder,
  children,
}: {
  query: string;
  onQuery: (q: string) => void;
  placeholder: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative min-w-60 flex-1">
        <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={18} />
        <Input className="pl-10" type="search" placeholder={placeholder} value={query} onChange={(e) => onQuery(e.target.value)} />
      </div>
      {children}
    </div>
  );
}

/** Case-insensitive match of `q` against any of the given values. */
export const matches = (q: string, ...values: (string | number | null | undefined)[]) =>
  values.join(" ").toLowerCase().includes(q.trim().toLowerCase());
