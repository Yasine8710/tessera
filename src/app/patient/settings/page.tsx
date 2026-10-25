import type { Metadata } from "next";
import { SettingsView } from "@/components/account/settings-view";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Settings" };

export default async function Page() {
  return <SettingsView session={await requireSession("PATIENT")} />;
}
