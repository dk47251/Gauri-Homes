"use client";

import { useState } from "react";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";
import { deleteRenter } from "@/lib/actions/renters";
import type { RenterRow } from "@/lib/data/queries";
import { documentUrl } from "@/lib/types";
import { useDelete } from "@/hooks/use-action";
import { usePermissions } from "@/components/auth/permissions";
import { Button } from "@/components/ui/button";
import { RowActions, Table, Td, Tr } from "@/components/ui/table";
import { Toolbar, matches } from "@/components/ui/toolbar";
import { RenterModal } from "./renter-modal";

export function RentersView({ renters }: { renters: RenterRow[] }) {
  const [q, setQ] = useState("");
  const { canWrite } = usePermissions();
  const [edit, setEdit] = useState<RenterRow | "new" | null>(null);
  const { remove } = useDelete(deleteRenter, "Delete renter record?");

  const rows = renters.filter((r) => matches(q, r.name, r.houseFlat, r.phone, r.nationality));

  return (
    <div className="space-y-4">
      <Toolbar query={q} onQuery={setQ} placeholder="Search renter, house, phone">
        {canWrite && (
          <Button variant="primary" onClick={() => setEdit("new")}>
            <Plus size={18} />
            Add Renter / Tenant
          </Button>
        )}
      </Toolbar>

      <Table
        headers={["Photo", "Name", "House / Flat", "Age", "Nationality", "Family Members", "Phone", "Valid ID", "Actions"]}
        isEmpty={!rows.length}
        empty={renters.length ? "No matching renters." : "No renters / tenants yet."}
      >
        {rows.map((r) => {
          const photo = r.documents.find((d) => d.kind === "PHOTO");
          return (
            <Tr key={r.id}>
              <Td>
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- served from SQLite
                  <img src={documentUrl(photo.id)} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  "—"
                )}
              </Td>
              <Td className="font-medium">{r.name}</Td>
              <Td>{r.houseFlat}</Td>
              <Td>{r.age}</Td>
              <Td>{r.nationality}</Td>
              <Td title={r.familyMembers.filter(Boolean).join(", ")}>{r.familyCount}</Td>
              <Td>{r.phone}</Td>
              <Td>{r.validIdType}</Td>
              <Td>
                <RowActions>
                  <Button size="icon" aria-label={canWrite ? "Edit" : "View"} title={canWrite ? "Edit" : "View"} onClick={() => setEdit(r)}>
                    {canWrite ? <Edit size={15} /> : <Eye size={15} />}
                  </Button>
                  {canWrite && (
                    <Button variant="danger" size="icon" aria-label="Delete" onClick={() => remove(r.id)}>
                      <Trash2 size={15} />
                    </Button>
                  )}
                </RowActions>
              </Td>
            </Tr>
          );
        })}
      </Table>

      {edit && <RenterModal renter={edit === "new" ? null : edit} readOnly={!canWrite} onClose={() => setEdit(null)} />}
    </div>
  );
}
