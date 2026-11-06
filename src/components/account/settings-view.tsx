import { Download } from "lucide-react";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { getPreferences } from "@/server/services/notifications";
import type { Session } from "@/server/session";
import { DeleteAccount } from "./delete-account";
import { PreferencesForm } from "./preferences-form";

export async function SettingsView({ session }: { session: Session }) {
  const p = await getPreferences(session);
  const prefs = {
    doseReminders: p.doseReminders,
    missedAlerts: p.missedAlerts,
    routineReminders: p.routineReminders,
    appointmentAlerts: p.appointmentAlerts,
    messageAlerts: p.messageAlerts,
  };
  const role = session.role === "PATIENT" ? "Patient" : "Verified professional";
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Settings" description="Your profile, time zone and notification choices." />

      <Card>
        <CardHeader title="Profile" />
        <dl className="grid gap-4 px-5 py-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Name</dt>
            <dd className="mt-0.5 font-medium">{session.name}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-muted">Email</dt>
            <dd className="mt-0.5 break-words font-medium">{session.email}</dd>
          </div>
          <div>
            <dt className="text-muted">Account</dt>
            <dd className="mt-0.5 flex flex-wrap items-center gap-2">
              <Badge tone="accent">{role}</Badge>
              <Badge tone={session.emailVerified ? "ok" : "warn"}>{session.emailVerified ? "Email verified" : "Email not verified"}</Badge>
            </dd>
          </div>
        </dl>
      </Card>

      <Card>
        <CardHeader title="Time zone and notifications" />
        <PreferencesForm initial={prefs} timezone={session.timezone} />
      </Card>

      <Card>
        <CardHeader title="Your data" description="Download a copy of the data Tessera holds about you as a JSON file." />
        <div className="px-5 py-4">
          <a href="/api/account/export" download className={buttonClass({ variant: "secondary" })}>
            <Download className="size-4" aria-hidden /> Download my data
          </a>
        </div>
      </Card>

      <Card className="border-danger/40">
        <CardHeader title="Danger zone" description="Delete your account" />
        <DeleteAccount />
      </Card>
    </div>
  );
}
