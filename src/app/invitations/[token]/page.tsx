import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { InvitationResponse } from "@/components/auth/invitation-response";
import { Alert } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { fmtDate } from "@/components/auth/format-date";
import { previewInvitation } from "@/server/services/care";
import { getSession, homeFor } from "@/server/session";

export const metadata: Metadata = { title: "Care team invitation", robots: { index: false, follow: false } };

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [inv, session] = await Promise.all([previewInvitation(token), getSession()]);

  if (!inv) {
    return (
      <AuthShell title="Invitation unavailable">
        <div className="space-y-4">
          <Alert tone="danger" title="This invitation cannot be used">
            It may have expired, been withdrawn, or already been used. Ask the professional to send a new invitation.
          </Alert>
          <LinkButton href={session ? homeFor(session.role) : "/login"} variant="secondary">
            {session ? "Go to my account" : "Sign in"}
          </LinkButton>
        </div>
      </AuthShell>
    );
  }

  const who = `${inv.professionalName} (${inv.profession})`;
  const expires = fmtDate(inv.expiresAt, session?.timezone ?? "UTC");

  return (
    <AuthShell
      title="You have been invited to connect"
      description={
        <>
          {who} invited you to share health information with them on CareSync. This link expires on {expires}.
        </>
      }
      wide
    >
      {!session ? (
        <div className="space-y-5">
          <p className="text-ink2">
            This invitation was sent to <strong>{inv.patientEmail}</strong>. Sign in or create a patient account using that exact email address, then open this invitation link from your email again to review it.
          </p>
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/login">Sign in</LinkButton>
            <LinkButton href="/register/patient" variant="secondary">
              Create a patient account
            </LinkButton>
          </div>
          <p className="text-sm text-muted">You decide what is shared only after you sign in. Nothing is shared by opening this page.</p>
        </div>
      ) : session.role !== "PATIENT" ? (
        <div className="space-y-4">
          <Alert tone="info" title="Invitations are accepted by patient accounts">
            You are signed in with a {session.role === "PROFESSIONAL" ? "professional" : "administrator"} account. To accept, sign out and use a patient account registered with {inv.patientEmail}.
          </Alert>
          <LinkButton href={homeFor(session.role)} variant="secondary">
            Back to my account
          </LinkButton>
        </div>
      ) : (
        <div className="space-y-5">
          {session.email !== inv.patientEmail && (
            <Alert tone="warn" title="Different email address">
              This invitation was sent to {inv.patientEmail}, but you are signed in as {session.email}. Accepting will fail unless the addresses match.
            </Alert>
          )}
          <p className="text-sm text-muted">
            Connecting lets {inv.professionalName} message you and see only the data categories you switch on below. Information you record yourself is self-reported and may be incomplete; it is not a clinical record. CareSync is not an emergency service.
          </p>
          <InvitationResponse token={token} invitationId={inv.id} professionalName={inv.professionalName} />
        </div>
      )}
    </AuthShell>
  );
}
