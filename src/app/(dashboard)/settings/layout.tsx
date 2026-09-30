import { requireSystemAdminPage } from "@/lib/auth/session";

/** Settings are only for the system administrator. */
export default async function SettingsLayout({ children }: LayoutProps<"/settings">) {
  await requireSystemAdminPage();
  return children;
}
