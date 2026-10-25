import { AppShell } from "@/components/shell/app-shell";
import type { NavItem } from "@/components/shell/side-nav";
import { requireSession } from "@/server/session";

const NAV: NavItem[] = [
  { href: "/admin", label: "Platform health", icon: "gauge", exact: true },
  { href: "/admin/approvals", label: "Professional approvals", icon: "approve" },
  { href: "/admin/users", label: "Users", icon: "patients" },
  { href: "/admin/organizations", label: "Organizations", icon: "org" },
  { href: "/admin/audit", label: "Audit log", icon: "audit" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession("ADMIN");
  return (
    <AppShell session={session} nav={NAV} area="admin">
      {children}
    </AppShell>
  );
}
