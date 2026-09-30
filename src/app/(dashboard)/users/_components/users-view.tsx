"use client";

import { useState, useTransition } from "react";
import { Check, Clock, ShieldCheck, ShieldOff, Trash2, X } from "lucide-react";
import { approveUser, deleteUser, rejectUser, setUserAccess, setUserRole } from "@/lib/actions/users";
import { ACCESS, ROLES, USER_STATUS } from "@/lib/auth/constants";
import type { UserRow } from "@/lib/data/queries";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/card";
import { RowActions, Table, Td, Tr } from "@/components/ui/table";
import { Toolbar, matches } from "@/components/ui/toolbar";

const dateFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function UsersView({
  users,
  currentUser,
  title,
  description,
}: {
  users: UserRow[];
  currentUser: { id: number; role: string; canWrite: boolean; isSystemAdmin: boolean };
  title: string;
  description: string;
}) {
  const [q, setQ] = useState("");
  const [pending, startTransition] = useTransition();
  // Managing users is a write operation, so read-only admins only see the list.
  const isAdmin = currentUser.role === ROLES.ADMIN && currentUser.canWrite;
  const canSetAccess = currentUser.isSystemAdmin;
  // Registrations waiting for approval are listed first.
  const rows = users
    .filter((u) => matches(q, u.name, u.email, u.role, u.status))
    .sort((a, b) => Number(b.status === USER_STATUS.PENDING) - Number(a.status === USER_STATUS.PENDING));
  const adminCount = users.filter((u) => u.role === ROLES.ADMIN).length;
  const pendingCount = users.filter((u) => u.status === USER_STATUS.PENDING).length;

  const run = (confirmText: string, action: () => Promise<{ ok: boolean; error?: string }>) => {
    if (!confirm(confirmText)) return;
    startTransition(async () => {
      const result = await action();
      if (!result.ok) alert(result.error);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:w-[28rem]">
          <StatCard label="Total" value={users.length} />
          <StatCard label="Admins" value={adminCount} />
          <StatCard label="Pending" value={pendingCount} tone={pendingCount ? "danger" : undefined} />
        </div>
      </div>

      {isAdmin && pendingCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <Clock size={18} className="shrink-0" />
          {pendingCount} new {pendingCount === 1 ? "registration is" : "registrations are"} waiting for your approval. Approved users
          can log in immediately.
        </div>
      )}

      <Toolbar query={q} onQuery={setQ} placeholder="Search name, email or role" />

      <Table
        headers={["User", "Role", "Access", "Status", "Activity", ...(isAdmin ? ["Actions"] : [])]}
        isEmpty={!rows.length}
        empty={users.length ? "No matching users." : "No users found."}
      >
        {rows.map((u) => {
          const self = u.id === currentUser.id;
          const userIsAdmin = u.role === ROLES.ADMIN;
          const approved = u.status === USER_STATUS.APPROVED;
          return (
            <Tr key={u.id}>
              <Td>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    {initials(u.name ?? u.email)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium">
                      {u.name ?? "—"}
                      {self && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">You</span>}
                    </div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </div>
                </div>
              </Td>
              <Td>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    userIsAdmin ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600",
                  )}
                >
                  {userIsAdmin && <ShieldCheck size={12} />}
                  {userIsAdmin ? "Admin" : "User"}
                </span>
                {u.isSystemAdmin && (
                  <span className="ml-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700" title="Managed from the .env file">
                    System
                  </span>
                )}
              </Td>
              <Td className="whitespace-nowrap">
                {canSetAccess && !u.isSystemAdmin ? (
                  <select
                    aria-label={`Access for ${u.email}`}
                    value={u.access}
                    disabled={pending}
                    onChange={(e) => {
                      const next = e.target.value;
                      const label = next === ACCESS.READ_WRITE ? "Read & Write" : "Read Only";
                      run(`Give ${u.email} ${label} access?`, () => setUserAccess(u.id, next));
                    }}
                    className={cn(
                      "rounded-lg border px-2 py-1.5 text-xs font-semibold outline-none focus:ring-4 focus:ring-indigo-500/10",
                      u.access === ACCESS.READ_WRITE
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700",
                    )}
                  >
                    <option value={ACCESS.READ_WRITE}>Read &amp; Write</option>
                    <option value={ACCESS.READ_ONLY}>Read Only</option>
                  </select>
                ) : (
                  <AccessBadge access={u.isSystemAdmin ? ACCESS.READ_WRITE : u.access} />
                )}
              </Td>
              <Td>
                <StatusBadge status={u.status} />
              </Td>
              <Td className="whitespace-nowrap text-xs">
                <div>
                  <span className="text-slate-500">Joined </span>
                  {dateFmt.format(u.createdAt)}
                </div>
                <div className="mt-0.5">
                  <span className="text-slate-500">Last login </span>
                  {u.lastLoginAt ? dateTimeFmt.format(u.lastLoginAt) : "Never"}
                </div>
              </Td>
              {isAdmin && (
                <Td>
                  {self || u.isSystemAdmin ? (
                    <span className="text-xs text-slate-400">—</span>
                  ) : (
                    <RowActions>
                      {!approved && (
                        <Button
                          variant="primary"
                          disabled={pending}
                          onClick={() => run(`Approve ${u.email}? They will be able to log in.`, () => approveUser(u.id))}
                        >
                          <Check size={15} />
                          Approve
                        </Button>
                      )}
                      {u.status !== USER_STATUS.REJECTED && (
                        <Button
                          variant="danger"
                          size="icon"
                          title={approved ? "Disable user" : "Reject registration"}
                          aria-label={approved ? "Disable user" : "Reject registration"}
                          disabled={pending}
                          onClick={() =>
                            run(
                              approved ? `Disable ${u.email}? They will be logged out.` : `Reject ${u.email}?`,
                              () => rejectUser(u.id),
                            )
                          }
                        >
                          <X size={15} />
                        </Button>
                      )}
                      {!approved ? null : userIsAdmin ? (
                        <Button
                          size="icon"
                          title="Remove admin access"
                          aria-label="Remove admin access"
                          disabled={pending}
                          onClick={() => run(`Remove admin access from ${u.email}?`, () => setUserRole(u.id, ROLES.USER))}
                        >
                          <ShieldOff size={15} />
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          title="Make administrator"
                          aria-label="Make administrator"
                          disabled={pending}
                          onClick={() => run(`Make ${u.email} an administrator?`, () => setUserRole(u.id, ROLES.ADMIN))}
                        >
                          <ShieldCheck size={15} />
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="icon"
                        title="Delete user"
                        aria-label="Delete user"
                        disabled={pending}
                        onClick={() => run(`Delete ${u.email}? They will be logged out and cannot log in again.`, () => deleteUser(u.id))}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </RowActions>
                  )}
                </Td>
              )}
            </Tr>
          );
        })}
      </Table>
    </div>
  );
}

function AccessBadge({ access }: { access: string }) {
  const rw = access === ACCESS.READ_WRITE;
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", rw ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
      {rw ? "Read & Write" : "Read Only"}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    [USER_STATUS.APPROVED]: "bg-emerald-50 text-emerald-700",
    [USER_STATUS.PENDING]: "bg-amber-50 text-amber-700",
    [USER_STATUS.REJECTED]: "bg-red-50 text-red-700",
  };
  const labels: Record<string, string> = {
    [USER_STATUS.APPROVED]: "Approved",
    [USER_STATUS.PENDING]: "Pending",
    [USER_STATUS.REJECTED]: "Rejected",
  };
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", styles[status] ?? "bg-slate-100 text-slate-600")}>
      {labels[status] ?? status}
    </span>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
