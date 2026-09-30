"use client";

import { useState } from "react";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";
import { deleteRwaMember } from "@/lib/actions/rwa";
import type { RwaRow } from "@/lib/data/queries";
import { documentUrl } from "@/lib/types";
import { useDelete } from "@/hooks/use-action";
import { usePermissions } from "@/components/auth/permissions";
import { Button } from "@/components/ui/button";
import { RowActions, Table, Td, Tr } from "@/components/ui/table";
import { Toolbar, matches } from "@/components/ui/toolbar";
import { RwaModal } from "./rwa-modal";

export function RwaView({ members }: { members: RwaRow[] }) {
  const [q, setQ] = useState("");
  const { canWrite } = usePermissions();
  const [edit, setEdit] = useState<RwaRow | "new" | null>(null);
  const { remove } = useDelete(deleteRwaMember, "Delete?");

  const rows = members.filter((m) => matches(q, m.name, m.phone, m.houseFlat, m.designation));

  return (
    <div className="space-y-4">
      <Toolbar query={q} onQuery={setQ} placeholder="Search RWA member">
        {canWrite && (
          <Button variant="primary" onClick={() => setEdit("new")}>
            <Plus size={18} />
            Add RWA Member
          </Button>
        )}
      </Toolbar>

      <Table
        headers={["Photo", "Name", "House / Flat No.", "Designation", "Phone", "DOB", "Status", "Actions"]}
        isEmpty={!rows.length}
        empty={members.length ? "No matching members." : "No RWA members yet."}
      >
        {rows.map((m) => {
          const photo = m.documents.find((d) => d.kind === "PHOTO");
          return (
            <Tr key={m.id}>
              <Td>
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- served from SQLite
                  <img src={documentUrl(photo.id)} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  "—"
                )}
              </Td>
              <Td className="font-medium">{m.name}</Td>
              <Td>{m.houseFlat}</Td>
              <Td>{m.designation}</Td>
              <Td>{m.phone}</Td>
              <Td>{m.dob}</Td>
              <Td>{m.status}</Td>
              <Td>
                <RowActions>
                  <Button size="icon" aria-label={canWrite ? "Edit" : "View"} title={canWrite ? "Edit" : "View"} onClick={() => setEdit(m)}>
                    {canWrite ? <Edit size={15} /> : <Eye size={15} />}
                  </Button>
                  {canWrite && (
                    <Button variant="danger" size="icon" aria-label="Delete" onClick={() => remove(m.id)}>
                      <Trash2 size={15} />
                    </Button>
                  )}
                </RowActions>
              </Td>
            </Tr>
          );
        })}
      </Table>

      {edit && <RwaModal member={edit === "new" ? null : edit} readOnly={!canWrite} onClose={() => setEdit(null)} />}
    </div>
  );
}
