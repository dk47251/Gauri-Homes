"use client";

import { useState } from "react";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";
import { deleteExpense } from "@/lib/actions/expenses";
import type { ExpenseRow } from "@/lib/data/queries";
import { money } from "@/lib/format";
import { toViewable, type ViewableDoc } from "@/lib/types";
import { useDelete } from "@/hooks/use-action";
import { useOpenNew } from "@/hooks/use-open-new";
import { usePermissions } from "@/components/auth/permissions";
import { Button } from "@/components/ui/button";
import { DocViewer } from "@/components/ui/doc-viewer";
import { RowActions, Table, Td, Tr } from "@/components/ui/table";
import { Toolbar, matches } from "@/components/ui/toolbar";
import { ExpenseModal } from "./expense-modal";

export function ExpensesView({ expenses }: { expenses: ExpenseRow[] }) {
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<ExpenseRow | "new" | null>(null);
  const [viewer, setViewer] = useState<ViewableDoc | null>(null);
  const { remove } = useDelete(deleteExpense, "Delete expense?");
  const { canWrite } = usePermissions();
  useOpenNew(() => canWrite && setEdit("new"));

  const rows = expenses.filter((x) => matches(q, x.category, x.description, x.vendor));

  return (
    <div className="space-y-4">
      <Toolbar query={q} onQuery={setQ} placeholder="Search expense, category, vendor">
        {canWrite && (
          <Button variant="primary" onClick={() => setEdit("new")}>
            <Plus size={18} />
            Add Expense
          </Button>
        )}
      </Toolbar>

      <Table
        headers={["Date", "Category", "Description", "Amount", "Mode", "Vendor", "Recurring", "Bill/Receipt", "Actions"]}
        isEmpty={!rows.length}
        empty={expenses.length ? "No matching expenses." : "No expenses recorded yet."}
      >
        {rows.map((x) => (
          <Tr key={x.id}>
            <Td className="whitespace-nowrap">{x.date}</Td>
            <Td>{x.category}</Td>
            <Td>{x.description}</Td>
            <Td>{money(x.amount)}</Td>
            <Td>{x.mode}</Td>
            <Td>{x.vendor}</Td>
            <Td>{x.recurring ? "Monthly" : "No"}</Td>
            <Td>
              {x.documents.length ? (
                <Button onClick={() => setViewer(toViewable(x.documents[0]))}>
                  <Eye size={15} />
                  Preview ({x.documents.length})
                </Button>
              ) : (
                <span className="text-slate-400">None</span>
              )}
            </Td>
            <Td>
              <RowActions>
                <Button size="icon" aria-label={canWrite ? "Edit" : "View"} title={canWrite ? "Edit" : "View"} onClick={() => setEdit(x)}>
                  {canWrite ? <Edit size={15} /> : <Eye size={15} />}
                </Button>
                {canWrite && (
                  <Button variant="danger" size="icon" aria-label="Delete" onClick={() => remove(x.id)}>
                    <Trash2 size={15} />
                  </Button>
                )}
              </RowActions>
            </Td>
          </Tr>
        ))}
      </Table>

      {edit && <ExpenseModal expense={edit === "new" ? null : edit} readOnly={!canWrite} onClose={() => setEdit(null)} />}
      {viewer && <DocViewer doc={viewer} onClose={() => setViewer(null)} />}
    </div>
  );
}
