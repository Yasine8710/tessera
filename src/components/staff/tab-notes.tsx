import { StickyNote } from "lucide-react";
import { Card, CardHeader, EmptyState } from "@/components/ui/card";
import { listInternalNotes } from "@/server/services/staff";
import { fmtDateTime } from "./format";
import { StaffOnlyBanner, type TabProps } from "./tab-shared";
import { AddNoteForm } from "./task-note-forms";

export async function NotesTab({ session, patientId }: TabProps) {
  const notes = await listInternalNotes(session, patientId);
  return (
    <div className="stagger space-y-6">
      <StaffOnlyBanner />
      <Card>
        <CardHeader title="Internal notes" description="For you and other professionals caring for this patient. The patient can never see these." />
        {notes.length === 0 ? (
          <EmptyState icon={StickyNote} title="No internal notes yet" />
        ) : (
          <ul className="stagger divide-y divide-line">
            {notes.map((n) => (
              <li key={n.id} className="border-l-[3px] border-warn bg-warn-soft/40 px-5 py-3.5">
                <p className="whitespace-pre-line">{n.body}</p>
                <p className="mt-1 text-xs text-muted">{n.author.user.name} · {fmtDateTime(n.createdAt, session.timezone)} · staff only</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <CardHeader title="Add a note" />
        <div className="space-y-3 p-5">
          <StaffOnlyBanner />
          <AddNoteForm patientId={patientId} />
        </div>
      </Card>
    </div>
  );
}
