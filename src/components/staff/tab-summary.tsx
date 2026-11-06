import { Card, CardHeader, EmptyState, Badge } from "@/components/ui/card";
import { listChangeRequests } from "@/server/services/clinical";
import { ResolveChangeRequestForm } from "./change-requests";
import { CONSENT_LABEL, fmtDateTime } from "./format";
import { ConsentIcon, type TabProps } from "./tab-shared";

export async function SummaryTab({ session, patientId, consents }: TabProps) {
  const requests = await listChangeRequests(session, patientId);
  const open = requests.filter((r) => r.status === "OPEN");
  const tz = session.timezone;
  return (
    <div className="stagger grid items-start gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Shared with you" description="The patient controls this and can change it at any time." />
        <ul className="divide-y divide-line">
          {Object.entries(CONSENT_LABEL).map(([type, label]) => (
            <li key={type} className="flex items-center justify-between px-5 py-3 text-sm transition-colors hover:bg-surface2">
              <span>{label}</span>
              <span className="inline-flex items-center gap-1.5 text-ink2">
                <ConsentIcon granted={!!consents[type]} /> {consents[type] ? "Shared" : "Not shared"}
              </span>
            </li>
          ))}
        </ul>
        <p className="border-t border-line px-5 py-3 text-sm text-muted">
          Everything on this page comes from what the patient reports. It may be incomplete and is not continuously monitored.
        </p>
      </Card>

      <Card>
        <CardHeader title="Medication questions from the patient" description="Reported by patient. Replying does not change a prescription." />
        {open.length === 0 ? (
          <EmptyState title="No open questions" />
        ) : (
          <ul className="divide-y divide-line">
            {open.map((r) => (
              <li key={r.id} className="px-5 py-4">
                <p className="text-sm font-medium">{r.plan.medication.name} <Badge tone="warn">Open</Badge></p>
                <p className="mt-1 text-sm text-ink2">&ldquo;{r.message}&rdquo;</p>
                <p className="text-xs text-muted">Reported by patient · {fmtDateTime(r.createdAt, tz)}</p>
                <ResolveChangeRequestForm id={r.id} />
              </li>
            ))}
          </ul>
        )}
        {requests.length > open.length && (
          <details className="border-t border-line px-5 py-3 text-sm">
            <summary className="cursor-pointer font-medium transition-colors hover:text-accent-hover">Resolved ({requests.length - open.length})</summary>
            <ul className="anim-fade mt-2 space-y-3">
              {requests.filter((r) => r.status === "RESOLVED").map((r) => (
                <li key={r.id}>
                  <p>{r.plan.medication.name}: &ldquo;{r.message}&rdquo;</p>
                  <p className="text-muted">Your response: {r.response}</p>
                </li>
              ))}
            </ul>
          </details>
        )}
      </Card>
    </div>
  );
}
