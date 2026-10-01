"use client";

import { useState } from "react";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";
import { deleteHouse } from "@/lib/actions/houses";
import type { HouseWithAccount } from "@/lib/data/queries";
import { money } from "@/lib/format";
import { useDelete } from "@/hooks/use-action";
import { useOpenNew } from "@/hooks/use-open-new";
import { usePermissions } from "@/components/auth/permissions";
import { Button } from "@/components/ui/button";
import { RowActions, Table, Td, Tr } from "@/components/ui/table";
import { Toolbar, matches } from "@/components/ui/toolbar";
import { HouseModal } from "./house-modal";
import { MemberModal } from "./member-modal";

export function HousesView({ houses }: { houses: HouseWithAccount[] }) {
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<HouseWithAccount | "new" | null>(null);
  const [memberHouseId, setMemberHouseId] = useState<number | null>(null);
  const { remove } = useDelete(deleteHouse, "Delete this property and its related records?");
  const { canWrite } = usePermissions();
  useOpenNew(() => canWrite && setEdit("new"));

  const rows = houses.filter((h) => matches(q, h.number, h.owner, h.mobile, h.whatsapp));
  const memberHouse = houses.find((h) => h.id === memberHouseId);

  return (
    <div className="space-y-4">
      <Toolbar query={q} onQuery={setQ} placeholder="Search house, owner, mobile, WhatsApp">
        {canWrite && (
          <Button variant="primary" onClick={() => setEdit("new")}>
            <Plus size={18} />
            Add House
          </Button>
        )}
      </Toolbar>

      <Table
        headers={["House/Plot", "Owner", "Property Status", "Maintenance", "Monthly", "Status", "Actions"]}
        isEmpty={!rows.length}
        empty={houses.length ? "No matching properties." : "No properties yet. Click “Add House” to get started."}
      >
        {rows.map((h) => (
          <Tr key={h.id}>
            <Td className="font-medium">{h.number}</Td>
            <Td>{h.owner}</Td>
            <Td>{h.propertyStatus}</Td>
            <Td>{h.maintenanceApplicable ? "Yes" : "No"}</Td>
            <Td>{money(h.monthlyMaintenance)}</Td>
            <Td>{h.status}</Td>
            <Td>
              <RowActions>
                <Button onClick={() => setMemberHouseId(h.id)}>Member</Button>
                <Button size="icon" aria-label={canWrite ? "Edit" : "View"} title={canWrite ? "Edit" : "View"} onClick={() => setEdit(h)}>
                  {canWrite ? <Edit size={15} /> : <Eye size={15} />}
                </Button>
                {canWrite && (
                  <Button variant="danger" size="icon" aria-label="Delete" onClick={() => remove(h.id)}>
                    <Trash2 size={15} />
                  </Button>
                )}
              </RowActions>
            </Td>
          </Tr>
        ))}
      </Table>

      {edit && <HouseModal house={edit === "new" ? null : edit} readOnly={!canWrite} onClose={() => setEdit(null)} />}
      {memberHouse && <MemberModal house={memberHouse} readOnly={!canWrite} onClose={() => setMemberHouseId(null)} />}
    </div>
  );
}
