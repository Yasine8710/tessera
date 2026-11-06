import { Inbox, Send } from "lucide-react";
import type { Metadata } from "next";
import { fmtDateTime } from "@/components/staff/format";
import { InviteForm, RequestActions, RevokeInvitationButton } from "@/components/staff/invitation-controls";
import { Badge, Card, CardHeader, EmptyState, PageHeader, type Tone } from "@/components/ui/card";
import { listIncomingRequests, listInvitationsSent } from "@/server/services/care";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Invitations" };

const TONE: Record<string, Tone> = { PENDING: "warn", ACCEPTED: "ok", DECLINED: "neutral", REVOKED: "neutral" };

export default async function InvitationsPage() {
  const session = await requireSession("PROFESSIONAL");
  const [sent, incoming] = await Promise.all([listInvitationsSent(session), listIncomingRequests(session)]);
  const tz = session.timezone;
  const now = Date.now();
  return (
    <>
      <PageHeader title="Invitations" description="Invite patients to connect, and answer requests patients send you. Nothing is shared until the patient chooses what to share." />
      <div className="space-y-6">
        <Card>
          <CardHeader title="Invite a patient" />
          <div className="p-5"><InviteForm /></div>
        </Card>

        <Card>
          <CardHeader title={`Connection requests from patients (${incoming.length})`} />
          {incoming.length === 0 ? (
            <EmptyState icon={Inbox} title="No pending requests" />
          ) : (
            <ul className="stagger divide-y divide-line">
              {incoming.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 transition-colors hover:bg-surface2">
                  <div className="min-w-0">
                    <p className="font-medium">{r.patient.user.name}</p>
                    <p className="truncate text-sm text-muted">{r.patient.user.email} · requested {fmtDateTime(r.createdAt, tz)}</p>
                  </div>
                  <RequestActions relationshipId={r.id} name={r.patient.user.name} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Invitations you sent" description="The link itself is only shown once, when you create the invitation." />
          {sent.length === 0 ? (
            <EmptyState icon={Send} title="No invitations sent yet" />
          ) : (
            <ul className="stagger divide-y divide-line">
              {sent.map((i) => {
                const expired = i.status === "PENDING" && i.expiresAt.getTime() < now;
                return (
                  <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 transition-colors hover:bg-surface2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{i.patientEmail}</p>
                      <p className="text-sm text-muted">Sent {fmtDateTime(i.createdAt, tz)} · {expired ? "expired" : `expires ${fmtDateTime(i.expiresAt, tz)}`}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={expired ? "neutral" : TONE[i.status]}>{expired ? "Expired" : i.status.charAt(0) + i.status.slice(1).toLowerCase()}</Badge>
                      {i.status === "PENDING" && !expired && <RevokeInvitationButton id={i.id} email={i.patientEmail} />}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
