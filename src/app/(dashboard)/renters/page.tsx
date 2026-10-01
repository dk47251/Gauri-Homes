import type { Metadata } from "next";
import { getRenters } from "@/lib/data/queries";
import { RentersView } from "./_components/renters-view";

export const metadata: Metadata = { title: "Renters / Tenants" };

export default async function RentersPage() {
  const renters = await getRenters();
  return <RentersView renters={renters} />;
}
