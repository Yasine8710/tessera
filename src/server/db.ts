import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";

/** Opens the SQLCipher database, keying it before Prisma issues any query. */
class EncryptedFactory extends PrismaBetterSQLite3 {
  async connect() {
    const adapter = await super.connect();
    const key = process.env.CARESYNC_DB_KEY;
    const client = (adapter as unknown as { client: { pragma(s: string): unknown } }).client;
    if (key) {
      if (!/^[0-9a-f]{64}$/i.test(key)) throw new Error("CARESYNC_DB_KEY must be 64 hex chars");
      client.pragma(`key = "x'${key}'"`);
    }
    client.pragma("journal_mode = WAL");
    client.pragma("foreign_keys = ON");
    return adapter;
  }
}

/** SQLite has no scalar lists: they are stored as JSON and typed back here. */
const asList = <T>(v: unknown) => (Array.isArray(v) ? (v as T[]) : []);

/** Prisma's CLI resolves relative sqlite paths against prisma/; do the same so CLI and app share one file. */
function resolveUrl(url: string) {
  const p = url.replace(/^file:/, "");
  return path.isAbsolute(p) ? url : "file:" + path.resolve(process.cwd(), "prisma", p);
}

function create() {
  const url = resolveUrl(process.env.DATABASE_URL ?? "file:./dev.db");
  return new PrismaClient({ adapter: new EncryptedFactory({ url }) }).$extends({
    result: {
      medicationPlan: {
        timesOfDay: { needs: { timesOfDay: true }, compute: (r) => asList<string>(r.timesOfDay) },
        daysOfWeek: { needs: { daysOfWeek: true }, compute: (r) => asList<number>(r.daysOfWeek) },
      },
      routineDefinition: {
        daysOfWeek: { needs: { daysOfWeek: true }, compute: (r) => asList<number>(r.daysOfWeek) },
      },
      journalEntry: {
        symptoms: { needs: { symptoms: true }, compute: (r) => asList<string>(r.symptoms) },
      },
    },
  });
}

type Db = ReturnType<typeof create>;
const g = globalThis as unknown as { prisma?: Db };

export const db = g.prisma ?? create();
export type Tx = Omit<Db, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;
if (process.env.NODE_ENV !== "production") g.prisma = db;

/** SQLite has no createMany skipDuplicates: insert only the (planId, scheduledFor) pairs that are missing. */
export async function createIntakesIfMissing(planId: string, times: Date[]) {
  if (!times.length) return;
  const have = await db.medicationIntake.findMany({ where: { planId, scheduledFor: { in: times } }, select: { scheduledFor: true } });
  const seen = new Set(have.map((h) => h.scheduledFor.getTime()));
  const data = [...new Map(times.map((t) => [t.getTime(), t])).values()].filter((t) => !seen.has(t.getTime())).map((scheduledFor) => ({ planId, scheduledFor }));
  if (data.length) await db.medicationIntake.createMany({ data });
}
