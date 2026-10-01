import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getUsers } from "@/lib/data/queries";
import { UsersView } from "../_components/users-view";

export const metadata: Metadata = { title: "Admin List" };

export default async function AdminListPage() {
  const [me, admins] = await Promise.all([requireUser(), getUsers({ adminsOnly: true })]);
  return (
    <UsersView
      users={admins}
      currentUser={me}
      title="Administrators"
      description="Admins approve new registrations, manage admin access and delete accounts."
    />
  );
}
