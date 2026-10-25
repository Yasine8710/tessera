import { AppShell } from "@/components/shell/app-shell";
import type { NavItem } from "@/components/shell/side-nav";
import { requireSession } from "@/server/session";

const NAV: NavItem[] = [
  { href: "/staff", label: "Overview", icon: "overview", exact: true },
  { href: "/staff/patients", label: "Patients", icon: "patients" },
  { href: "/staff/monitoring", label: "Monitoring", icon: "monitor" },
  { href: "/staff/appointments", label: "Appointments", icon: "calendar" },
  { href: "/staff/messages", label: "Messages", icon: "message" },
  { href: "/staff/reports", label: "Reports", icon: "reports" },
  { href: "/staff/invitations", label: "Invitations", icon: "invite" },
  { href: "/staff/settings", label: "Settings", icon: "settings" },
];

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession("PROFESSIONAL");
  return (
    <AppShell session={session} nav={NAV} area="staff">
      {children}
    </AppShell>
  );
}
