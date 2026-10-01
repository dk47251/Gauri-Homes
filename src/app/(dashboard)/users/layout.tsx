import { requireSystemAdminPage } from "@/lib/auth/session";

/** Users screens are only for the system administrator. */
export default async function UsersLayout({ children }: LayoutProps<"/users">) {
  await requireSystemAdminPage();
  return children;
}
