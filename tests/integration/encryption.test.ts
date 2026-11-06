import { mkdtempSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const store = require("../../desktop/db.js") as typeof import("../../desktop/db");
const KEY = "a".repeat(64);
const WRONG = "b".repeat(64);
const dir = mkdtempSync(path.join(tmpdir(), "cs-enc-"));
const file = path.join(dir, "enc.db");

describe("encrypted database", () => {
  it("applies migrations once and is unreadable without the key", () => {
    const db = store.open(path.resolve("."), file, KEY);
    const first = store.applyMigrations(db, path.resolve("prisma", "migrations"));
    const second = store.applyMigrations(db, path.resolve("prisma", "migrations"));
    store.checkpoint(db);
    db.close();
    expect(first.length).toBeGreaterThan(0);
    expect(second).toEqual([]);
    expect(readFileSync(file).subarray(0, 15).toString()).not.toBe("SQLite format 3");
    expect(() => store.open(path.resolve("."), file, WRONG)).toThrow();
  });

  it("the Prisma client works against it with the key and fails without", async () => {
    const prev = { url: process.env.DATABASE_URL, key: process.env.CARESYNC_DB_KEY };
    process.env.DATABASE_URL = "file:" + file.split(path.sep).join("/");
    process.env.CARESYNC_DB_KEY = KEY;
    vi.resetModules();
    const g = globalThis as { prisma?: unknown };
    delete g.prisma;
    const { db } = await import("@/server/db");
    expect(await db.user.count()).toBe(0);
    await db.$disconnect();

    delete process.env.CARESYNC_DB_KEY;
    vi.resetModules();
    delete g.prisma;
    const { db: bare } = await import("@/server/db");
    await expect(bare.user.count()).rejects.toThrow();
    await bare.$disconnect().catch(() => {});

    process.env.DATABASE_URL = prev.url;
    if (prev.key) process.env.CARESYNC_DB_KEY = prev.key;
    vi.resetModules();
    delete g.prisma;
  });
});

afterAll(() => vi.resetModules());
