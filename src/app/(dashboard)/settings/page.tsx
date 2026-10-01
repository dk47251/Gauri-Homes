import type { Metadata } from "next";
import { getSettings } from "@/lib/data/queries";
import { SettingsForm } from "./_components/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const settings = await getSettings();
  return <SettingsForm settings={settings} />;
}
