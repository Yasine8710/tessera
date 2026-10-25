import "dotenv/config";
import { db } from "../src/server/db";
import { DEMO_ACCOUNTS, ensureDemoData } from "../src/server/services/demo";

async function main() {
  await ensureDemoData();
  console.log("Synthetic demo data ready.");
  console.log(`  patient: ${DEMO_ACCOUNTS.patient.email}`);
  console.log(`  staff:   ${DEMO_ACCOUNTS.staff.email}`);
  console.log("  password: see DEMO_PASSWORD in src/server/services/demo.ts (synthetic accounts only)");
}

main().finally(() => db.$disconnect());
