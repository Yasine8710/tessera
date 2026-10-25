"use client";

import { Check, SkipForward } from "lucide-react";
import { useState } from "react";
import { reportIntakeAction } from "@/app/actions/patient";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { useAction } from "@/components/ui/use-action";
import { DialogButton } from "./dialog-button";
import { fmtDateTime, fmtTime, localInputToIso, toLocalInput } from "./format";
import { DoseStatusBadge } from "./status";

export type DoseView = {
  id: string;
  scheduledFor: string;
  status: "SCHEDULED" | "TAKEN" | "SKIPPED" | "MISSED";
  takenAt: string | null;
  note: string | null;
  name: string;
  dose: string;
  route: string | null;
};

const HOUR = 3600_000;
const FOURTEEN_DAYS = 14 * 24 * HOUR;

function ReportForm({ dose, mode, tz, nowIso, close }: { dose: DoseView; mode: "TAKEN" | "SKIPPED"; tz: string; nowIso: string; close: () => void }) {
  const { run, pending, error } = useAction();
  const now = new Date(nowIso);
  const [time, setTime] = useState(toLocalInput(now, tz));
  const [note, setNote] = useState("");
  const [timeError, setTimeError] = useState<string>();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    let takenAt: string | undefined;
    if (mode === "TAKEN" && time) {
      takenAt = localInputToIso(time, tz);
      if (!takenAt) return setTimeError("Enter a valid time.");
      if (new Date(takenAt).getTime() > Date.now() + 5 * 60_000) return setTimeError("The time cannot be in the future.");
    }
    setTimeError(undefined);
    const ok = await run(() => reportIntakeAction({ intakeId: dose.id, status: mode, takenAt, note: note.trim() || undefined }), mode === "TAKEN" ? "Recorded as taken" : "Recorded as skipped");
    if (ok) close();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-ink2">
        {dose.name}, {dose.dose} - due {fmtDateTime(dose.scheduledFor, tz)}. This is saved as reported by you.
      </p>
      {mode === "TAKEN" && (
        <Field label="When did you take it?" hint="Optional. Leave as is if you took it just now." error={timeError}>
          {(p) => <Input type="datetime-local" required value={time} max={toLocalInput(now, tz)} onChange={(e) => setTime(e.target.value)} {...p} />}
        </Field>
      )}
      <Field label={mode === "SKIPPED" ? "Reason (optional)" : "Note (optional)"} hint="Up to 500 characters.">
        {(p) => <Textarea maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} {...p} />}
      </Field>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={close}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {mode === "TAKEN" ? "Record as taken" : "Record as skipped"}
        </Button>
      </div>
    </form>
  );
}

/** One scheduled dose with report controls. `compact` records "taken" in one tap (overview). */
export function DoseRow({ dose, tz, nowIso, compact, showDate }: { dose: DoseView; tz: string; nowIso: string; compact?: boolean; showDate?: boolean }) {
  const { run, pending } = useAction();
  const now = new Date(nowIso).getTime();
  const at = new Date(dose.scheduledFor).getTime();
  const reportable = (dose.status === "SCHEDULED" || dose.status === "MISSED") && at <= now + HOUR && at >= now - FOURTEEN_DAYS;
  const notDue = dose.status === "SCHEDULED" && at > now + HOUR;
  const reported = dose.status === "TAKEN" || dose.status === "SKIPPED";

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
      <div className="w-24 shrink-0 text-sm font-medium tabular-nums">{showDate ? fmtDateTime(dose.scheduledFor, tz) : fmtTime(dose.scheduledFor, tz)}</div>
      <div className="min-w-0 flex-1 basis-48">
        <p className="font-medium">{dose.name}</p>
        <p className="text-sm text-muted">
          {dose.dose}
          {dose.route ? `, ${dose.route}` : ""}
        </p>
        {reported && (
          <p className="text-sm text-muted">
            Reported by you{dose.status === "TAKEN" && dose.takenAt ? ` - taken ${fmtDateTime(dose.takenAt, tz)}` : ""}
            {dose.note ? ` - "${dose.note}"` : ""}
          </p>
        )}
        {dose.status === "MISSED" && <p className="text-sm text-muted">No report was recorded for this dose.</p>}
      </div>
      <DoseStatusBadge status={dose.status} />
      {reportable && (
        <div className="flex gap-2">
          {compact ? (
            <Button
              size="sm"
              loading={pending}
              onClick={() => run(() => reportIntakeAction({ intakeId: dose.id, status: "TAKEN" }), "Recorded as taken")}
              aria-label={`Record ${dose.name} as taken`}
            >
              <Check className="size-4" aria-hidden /> Taken
            </Button>
          ) : (
            <DialogButton label="Taken" ariaLabel={`Record ${dose.name} as taken`} title="Record as taken" variant="primary" icon={<Check className="size-4" aria-hidden />}>
              {(close) => <ReportForm dose={dose} mode="TAKEN" tz={tz} nowIso={nowIso} close={close} />}
            </DialogButton>
          )}
          <DialogButton label="Skip" ariaLabel={`Record ${dose.name} as skipped`} title="Record as skipped" icon={<SkipForward className="size-4" aria-hidden />}>
            {(close) => <ReportForm dose={dose} mode="SKIPPED" tz={tz} nowIso={nowIso} close={close} />}
          </DialogButton>
        </div>
      )}
      {notDue && <span className="text-sm text-muted">Not due yet</span>}
    </li>
  );
}
