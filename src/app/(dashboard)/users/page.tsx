import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getUsers } from "@/lib/data/queries";
import { UsersView } from "./_components/users-view";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const [me, users] = await Promise.all([requireUser(), getUsers()]);
  return <UsersView users={users} currentUser={me} title="All Users" description="Everyone who has registered an account. Only the administrator can change Read & Write / Read Only access." />;
}
