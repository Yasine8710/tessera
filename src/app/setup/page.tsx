import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SetupForm } from "@/components/auth/setup-form";
import { isDesktop } from "@/server/desktop";
import { adminExists } from "@/server/services/auth";

export const metadata: Metadata = { title: "Set up Tessera" };
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if (!isDesktop()) notFound();
  if (await adminExists()) redirect("/login");
  return (
    <AuthShell
      title="Welcome to Tessera"
      description="Create the administrator account for this computer. Everything is stored encrypted on this PC only."
    >
      <SetupForm />
    </AuthShell>
  );
}
