import { AppShell } from "@/components/shell/app-shell";
import type { NavItem } from "@/components/shell/side-nav";
import { requireSession } from "@/server/session";

const NAV: NavItem[] = [
  { href: "/patient", label: "Overview", icon: "overview", exact: true },
  { href: "/patient/medications", label: "Medications", icon: "pill" },
  { href: "/patient/routines", label: "Routines", icon: "routine" },
  { href: "/patient/appointments", label: "Appointments", icon: "calendar" },
  { href: "/patient/journal", label: "Health journal", icon: "journal" },
  { href: "/patient/progress", label: "Progress", icon: "progress" },
  { href: "/patient/care-plan", label: "Care plan", icon: "plan" },
  { href: "/patient/care-team", label: "Care team", icon: "team" },
  { href: "/patient/messages", label: "Messages", icon: "message" },
  { href: "/patient/settings", label: "Settings", icon: "settings" },
];

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession("PATIENT");
  return (
    <AppShell session={session} nav={NAV} area="patient">
      {children}
    </AppShell>
  );
}
