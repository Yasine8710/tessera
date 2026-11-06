import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check, LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSession, homeFor } from "@/server/session";

export const metadata: Metadata = { title: "Awaiting approval", robots: { index: false } };

const STAGES = [
  { label: "Account created", state: "done" },
  { label: "Licence review by an administrator", state: "current" },
  { label: "Staff access enabled", state: "next" },
] as const;

export default async function PendingApprovalPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "PROFESSIONAL") redirect(homeFor(session.role));
  if (session.professionalId) redirect("/staff");

  return (
    <AuthShell title="Your account is awaiting approval" photo="waiting-room" focal="50% 50%" description={<>Signed in as {session.email}.</>}>
      <div className="space-y-6">
        <ol aria-label="Approval progress" className="stagger">
          {STAGES.map((s, i) => (
            <li key={s.label} className="relative flex items-center gap-4 border-t border-line py-4 last:border-b" aria-current={s.state === "current" ? "step" : undefined}>
              <span className="w-6 text-sm font-semibold tabular-nums text-muted" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={
                  s.state === "done"
                    ? "grid size-5 shrink-0 place-items-center rounded-[3px] bg-ok text-bg"
                    : s.state === "current"
                      ? "anim-pulse size-5 shrink-0 rounded-[3px] border-2 border-accent bg-accent-soft"
                      : "size-5 shrink-0 rounded-[3px] border-2 border-line2"
                }
                aria-hidden
              >
                {s.state === "done" && <Check className="size-3.5" />}
              </span>
              <span className={s.state === "next" ? "text-muted" : "font-medium"}>{s.label}</span>
              <span className="ml-auto text-xs text-muted">{s.state === "done" ? "Done" : s.state === "current" ? "In progress" : "Waiting"}</span>
            </li>
          ))}
        </ol>
        <Alert tone="warn" title="Staff access is not active yet">
          An administrator needs to verify your licence details before you can see patients or send invitations. This is a manual review and can take some time.
        </Alert>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink2">
          <li>You will be able to use staff features as soon as your account is approved. Refresh this page or sign in again to check.</li>
          <li>If your account is declined or suspended, you will not gain access. Contact the service operator for details.</li>
          <li>No patient data is available to you while you wait.</li>
        </ul>
        <form action={logoutAction}>
          <Button type="submit" variant="secondary" className="press">
            <LogOut className="size-4" aria-hidden />
            Sign out
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
