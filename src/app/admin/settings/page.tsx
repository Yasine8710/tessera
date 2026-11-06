import type { Metadata } from "next";
import { RolesTable } from "@/components/admin/roles-table";
import { SettingsForm } from "@/components/admin/settings-form";
import { Card, CardHeader, PageHeader } from "@/components/ui/card";
import { isDesktop } from "@/server/desktop";
import { getSettings } from "@/server/services/admin";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const session = await requireSession("ADMIN");
  const s = await getSettings(session);
  const staleDays = typeof s.staleDays === "number" ? s.staleDays : 7;
  const supportEmail = typeof s.supportEmail === "string" ? s.supportEmail : "";
  const demoEnabled = isDesktop() && !session.isDemo ? s.demoEnabled !== false : undefined;
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Settings" description="Platform settings and the fixed role model." />
      <Card>
        <CardHeader title="Platform settings" />
        <SettingsForm staleDays={staleDays} supportEmail={supportEmail} demoEnabled={demoEnabled} />
      </Card>
      <Card>
        <CardHeader title="Roles and permissions" description="Roles are fixed and cannot be edited here." />
        <RolesTable />
      </Card>
      <Card>
        <CardHeader title="Creating administrators" />
        <div className="space-y-2 px-5 py-4 text-sm text-ink2">
          <p>Administrator accounts cannot be created or closed from the web. On the server, run:</p>
          <pre tabIndex={0} className="overflow-x-auto rounded-md bg-surface2 px-3 py-2 font-mono text-sm text-ink"><code>npm run admin:create</code></pre>
        </div>
      </Card>
    </div>
  );
}
