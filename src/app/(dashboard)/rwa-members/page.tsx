import type { Metadata } from "next";
import { getRwaMembers } from "@/lib/data/queries";
import { RwaView } from "./_components/rwa-view";

export const metadata: Metadata = { title: "RWA Members" };

export default async function RwaMembersPage() {
  const members = await getRwaMembers();
  return <RwaView members={members} />;
}
