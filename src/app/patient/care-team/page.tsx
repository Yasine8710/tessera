import { MailPlus, Users } from "lucide-react";
import type { Metadata } from "next";
import { ConnectForm, EndRelationshipButton, InvitationResponse } from "@/components/patient/care-team-actions";
import { ConsentSwitches } from "@/components/patient/consent-switches";
import type { ConsentState } from "@/components/patient/consent-fields";
import { fmtPlainDate } from "@/components/patient/format";
import { Badge, Card, CardHeader, EmptyState, PageHeader } from "@/components/ui/card";
import { requireSession } from "@/server/session";
import { listCareTeam, listInvitationsForPatient } from "@/server/services/care";

export const metadata: Metadata = { title: "Care team" };

export default async function CareTeamPage() {
  const s = await requireSession("PATIENT");
  const [team, invitations] = await Promise.all([listCareTeam(s), listInvitationsForPatient(s)]);
  const active = team.filter((r) => r.status === "ACTIVE");
  const requested = team.filter((r) => r.status === "REQUESTED");
  const consentsOf = (r: (typeof team)[number]): ConsentState => ({
    JOURNAL: !!r.consents.find((c) => c.type === "JOURNAL")?.granted,
    MEASUREMENTS: !!r.consents.find((c) => c.type === "MEASUREMENTS")?.granted,
    ROUTINES: !!r.consents.find((c) => c.type === "ROUTINES")?.granted,
    MEDICATION_ADHERENCE: !!r.consents.find((c) => c.type === "MEDICATION_ADHERENCE")?.granted,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Care team" description="The professionals connected to you and exactly what each can see. You are in control and can change this at any time." />

      {invitations.length > 0 && (
        <Card className="border-accent/40">
          <CardHeader title="Invitations waiting for you" description="Nothing is shared until you accept and choose what to share." />
          <ul className="divide-y divide-line">
            {invitations.map((inv) => (
              <li key={inv.id} className="space-y-3 px-5 py-4">
                <div>
                  <p className="font-semibold">{inv.professional.user.name}</p>
                  <p className="text-sm text-muted">
                    {inv.professional.profession} - invited you on {fmtPlainDate(inv.createdAt)}
                  </p>
                </div>
                <InvitationResponse invitationId={inv.id} name={inv.professional.user.name} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <section aria-labelledby="team-h" className="space-y-4">
        <h2 id="team-h" className="text-lg font-semibold">
          Your care team
        </h2>
        {active.length === 0 ? (
          <Card>
            <EmptyState icon={Users} title="No one is connected yet">
              Accept an invitation or send a connection request below.
            </EmptyState>
          </Card>
        ) : (
          active.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
                <div>
                  <h3 className="text-base font-semibold">{r.professional.user.name}</h3>
                  <p className="text-sm text-muted">
                    {r.professional.profession}
                    {r.professional.specialty ? `, ${r.professional.specialty}` : ""}
                    {r.startedAt ? ` - connected ${fmtPlainDate(r.startedAt)}` : ""}
                  </p>
                </div>
                <Badge tone="ok">Connected</Badge>
              </div>
              <div className="space-y-4 px-5 py-4">
                <div>
                  <h4 className="mb-2 text-sm font-semibold">What you share with {r.professional.user.name}</h4>
                  <ConsentSwitches relationshipId={r.id} consents={consentsOf(r)} name={r.professional.user.name} />
                </div>
                <EndRelationshipButton relationshipId={r.id} name={r.professional.user.name} />
              </div>
            </Card>
          ))
        )}
      </section>

      {requested.length > 0 && (
        <Card>
          <CardHeader title="Requests you sent" description="Waiting for the professional to accept. They cannot see anything until they do." />
          <ul className="divide-y divide-line">
            {requested.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="font-medium">{r.professional.user.name}</p>
                  <p className="text-sm text-muted">{r.professional.profession}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone="warn">Awaiting their reply</Badge>
                  <EndRelationshipButton relationshipId={r.id} name={r.professional.user.name} pendingRequest />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card id="connect">
        <CardHeader title="Connect with a professional" action={<MailPlus className="size-5 text-muted" aria-hidden />} />
        <ConnectForm />
      </Card>
    </div>
  );
}
