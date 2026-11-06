import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { DemoPanel } from "@/components/auth/demo-panel";
import { SetupForm } from "@/components/auth/setup-form";
import { isDesktop } from "@/server/desktop";
import { demoAvailable } from "@/server/services/demo";
import { adminExists } from "@/server/services/auth";

export const metadata: Metadata = { title: "Set up Tessera" };
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if (!isDesktop()) notFound();
  if (await adminExists()) redirect("/login");
  return (
    <AuthShell
      title="Welcome to Tessera"
      photo="clinician-tablet"
      focal="55% 50%"
      description="Create the administrator account for this computer. Everything is stored encrypted on this PC only."
    >
      <SetupForm />
      {(await demoAvailable()) && <DemoPanel className="mt-8" />}
    </AuthShell>
  );
}
