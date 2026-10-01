import type { Metadata } from "next";
import { getHousesWithAccounts } from "@/lib/data/queries";
import { HousesView } from "./_components/houses-view";

export const metadata: Metadata = { title: "Houses & Members" };

export default async function HousesPage() {
  const houses = await getHousesWithAccounts();
  return <HousesView houses={houses} />;
}
