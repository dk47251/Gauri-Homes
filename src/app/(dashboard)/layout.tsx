import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  return (
    <AppShell
      user={{ name: user.name ?? user.email, email: user.email }}
      permissions={{ userId: user.id, canWrite: user.canWrite, isAdmin: user.role === "ADMIN", isSystemAdmin: user.isSystemAdmin }}
    >
      {children}
    </AppShell>
  );
}
