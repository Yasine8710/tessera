import { Prisma } from "@prisma/client";
import { db, type Tx } from "./db";

/**
 * Records who did what and when. Callers must pass identifiers and
 * non-sensitive facts only (never message bodies, notes, passwords or tokens).
 */
export async function audit(
  actorId: string | null,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, string | number | boolean | null>,
  tx: Tx = db,
) {
  await tx.auditEvent.create({
    data: { actorId, action, entityType, entityId, metadata: metadata ?? undefined },
  });
}
