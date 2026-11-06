"use strict";
const fs = require("node:fs");
const path = require("node:path");

let Database;
/** The same N-API cipher build the server uses, so there is one copy of SQLCipher in the app. */
function sqlite(serverDir) {
  if (Database) return Database;
  try {
    Database = require(path.join(serverDir, "node_modules", "better-sqlite3"));
  } catch {
    Database = require("better-sqlite3");
  }
  return Database;
}

const validKey = (k) => /^[0-9a-f]{64}$/i.test(k);

/** Opens an encrypted database; throws if the key is wrong or the file is not a database. */
function open(serverDir, file, key) {
  if (!validKey(key)) throw new Error("Invalid key format.");
  const db = new (sqlite(serverDir))(file);
  try {
    db.pragma(`key = "x'${key}'"`);
    db.prepare("select count(*) from sqlite_master").get();
  } catch (e) {
    db.close();
    throw e;
  }
  return db;
}

function applyMigrations(db, dir) {
  db.exec("create table if not exists _cs_migrations(name text primary key, applied_at text not null)");
  const done = new Set(db.prepare("select name from _cs_migrations").all().map((r) => r.name));
  const names = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  const pending = names.filter((n) => !done.has(n));
  const mark = db.prepare("insert into _cs_migrations(name, applied_at) values (?, ?)");
  for (const name of pending) {
    const sql = fs.readFileSync(path.join(dir, name, "migration.sql"), "utf8");
    db.transaction(() => {
      db.exec(sql);
      mark.run(name, new Date().toISOString());
    })();
  }
  return pending;
}

function pendingCount(db, dir) {
  let done = new Set();
  try {
    done = new Set(db.prepare("select name from _cs_migrations").all().map((r) => r.name));
  } catch {}
  return fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory() && !done.has(d.name)).length;
}

/** Flushes the WAL so the single .db file is a complete, still-encrypted snapshot. */
function checkpoint(db) {
  db.pragma("wal_checkpoint(TRUNCATE)");
}

function removeSidecars(file) {
  for (const ext of ["-wal", "-shm", "-journal"]) fs.rmSync(file + ext, { force: true });
}

module.exports = { open, applyMigrations, pendingCount, checkpoint, removeSidecars, validKey };
