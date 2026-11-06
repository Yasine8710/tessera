import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EndRelationshipButton } from "@/components/staff/invitation-controls";
import { first, fmtDay } from "@/components/staff/format";
import { AdherenceTab } from "@/components/staff/tab-adherence";
import { AppointmentsTab } from "@/components/staff/tab-appointments";
import { JournalTab } from "@/components/staff/tab-journal";
import { NotesTab } from "@/components/staff/tab-notes";
import { PlansTab } from "@/components/staff/tab-plans";
import { RoutinesTab } from "@/components/staff/tab-routines";
import { TABS, TabNav, type TabId } from "@/components/staff/tab-shared";
import { SummaryTab } from "@/components/staff/tab-summary";
import { TasksTab } from "@/components/staff/tab-tasks";
import { Masthead } from "@/components/staff/editorial";
import { AppError } from "@/server/errors";
import { requireSession } from "@/server/session";
import { patientProfileForStaff } from "@/server/services/staff";

export const metadata: Metadata = { title: "Patient profile" };

type Props = {
  params: Promise<{ patientId: string }>;
  searchParams: Promise<{ tab?: string | string[]; days?: string | string[]; page?: string | string[] }>;
};

function age(dob: Date | null) {
  if (!dob) return null;
  const now = new Date();
  let a = now.getUTCFullYear() - dob.getUTCFullYear();
  if (now.getUTCMonth() < dob.getUTCMonth() || (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate())) a--;
  return a;
}

export default async function PatientProfilePage({ params, searchParams }: Props) {
  const session = await requireSession("PROFESSIONAL");
  const { patientId } = await params;
  const sp = await searchParams;

  let bundle: Awaited<ReturnType<typeof patientProfileForStaff>>;
  try {
    bundle = await patientProfileForStaff(session, patientId);
  } catch (e) {
    if (e instanceof AppError && (e.code === "NOT_FOUND" || e.code === "FORBIDDEN")) notFound();
    throw e;
  }
  const { patient, relationship, consents } = bundle;
  const tab: TabId = TABS.find((t) => t.id === first(sp.tab))?.id ?? "summary";
  const days = [7, 30, 90].includes(Number(first(sp.days))) ? Number(first(sp.days)) : 30;
  const page = Math.max(1, Math.floor(Number(first(sp.page))) || 1);
  const props = { session, patientId, consents };
  const years = age(patient.dateOfBirth);

  return (
    <>
      <Link href="/staff/patients" className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink2 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> All patients
      </Link>
      <Masthead
        eyebrow="Patient profile"
        title={patient.user.name}
        description={[
          years !== null ? `Age ${years}` : "Age not provided",
          `Timezone ${patient.user.timezone}`,
          relationship.startedAt ? `Connected since ${fmtDay(relationship.startedAt, session.timezone)}` : null,
        ].filter(Boolean).join(" · ")}
        action={<EndRelationshipButton relationshipId={relationship.id} name={patient.user.name} />}
      />
      <TabNav patientId={patientId} active={tab} />
      {tab === "summary" && <SummaryTab {...props} />}
      {tab === "plans" && <PlansTab {...props} />}
      {tab === "adherence" && <AdherenceTab {...props} days={days} />}
      {tab === "journal" && <JournalTab {...props} page={page} />}
      {tab === "routines" && <RoutinesTab {...props} />}
      {tab === "appointments" && <AppointmentsTab {...props} />}
      {tab === "tasks" && <TasksTab {...props} />}
      {tab === "notes" && <NotesTab {...props} />}
    </>
  );
}
