"use client";

import { useState } from "react";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";
import { deletePayment } from "@/lib/actions/payments";
import type { HouseRow, PaymentRow } from "@/lib/data/queries";
import { money } from "@/lib/format";
import { useDelete } from "@/hooks/use-action";
import { useOpenNew } from "@/hooks/use-open-new";
import { usePermissions } from "@/components/auth/permissions";
import { Button } from "@/components/ui/button";
import { RowActions, Table, Td, Tr } from "@/components/ui/table";
import { Toolbar, matches } from "@/components/ui/toolbar";
import { PaymentModal } from "./payment-modal";

export function PaymentsView({ houses, payments }: { houses: HouseRow[]; payments: PaymentRow[] }) {
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<PaymentRow | "new" | null>(null);
  const { remove } = useDelete(deletePayment, "Delete payment?");
  const { canWrite } = usePermissions();
  useOpenNew(() => canWrite && setEdit("new"));

  const houseById = new Map(houses.map((h) => [h.id, h]));
  const rows = payments.filter((p) => {
    const h = houseById.get(p.houseId);
    return matches(q, p.txn, h?.number, h?.owner);
  });

  return (
    <div className="space-y-4">
      <Toolbar query={q} onQuery={setQ} placeholder="Search house, member, transaction">
        {canWrite && (
          <Button variant="primary" onClick={() => setEdit("new")} disabled={!houses.length} title={houses.length ? undefined : "Add a house first"}>
            <Plus size={18} />
            Add Payment
          </Button>
        )}
      </Toolbar>

      <Table
        headers={["Date", "House", "Payment Type", "Maintenance Month", "Amount", "Mode", "Transaction", "Actions"]}
        isEmpty={!rows.length}
        empty={payments.length ? "No matching payments." : "No payments recorded yet."}
      >
        {rows.map((p) => {
          const h = houseById.get(p.houseId);
          return (
            <Tr key={p.id}>
              <Td>{p.date}</Td>
              <Td>
                <div className="font-medium">{h?.number}</div>
                <div className="text-xs text-slate-500">{h?.owner}</div>
              </Td>
              <Td>
                <span
                  className={
                    p.kind === "Advance"
                      ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                      : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600"
                  }
                >
                  {p.kind}
                  {p.kind === "Advance" && ` · ${p.advanceMonths}m`}
                </span>
              </Td>
              <Td>{p.month}</Td>
              <Td>{money(p.amount)}</Td>
              <Td>{p.mode}</Td>
              <Td>{p.txn}</Td>
              <Td>
                <RowActions>
                  <Button size="icon" aria-label={canWrite ? "Edit" : "View"} title={canWrite ? "Edit" : "View"} onClick={() => setEdit(p)}>
                    {canWrite ? <Edit size={15} /> : <Eye size={15} />}
                  </Button>
                  {canWrite && (
                    <Button variant="danger" size="icon" aria-label="Delete" onClick={() => remove(p.id)}>
                      <Trash2 size={15} />
                    </Button>
                  )}
                </RowActions>
              </Td>
            </Tr>
          );
        })}
      </Table>

      {edit && <PaymentModal payment={edit === "new" ? null : edit} houses={houses} readOnly={!canWrite} onClose={() => setEdit(null)} />}
    </div>
  );
}
