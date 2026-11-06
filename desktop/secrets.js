"use strict";
const { safeStorage } = require("electron");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const hex = (n) => crypto.randomBytes(n).toString("hex");

/** Per-install secrets, encrypted at rest with Windows DPAPI (bound to this Windows user). */
function file(dir) {
  return path.join(dir, "secrets.bin");
}

function requireEncryption() {
  if (!safeStorage.isEncryptionAvailable()) throw new Error("Windows secure storage is not available for this user.");
}

function exists(dir) {
  return fs.existsSync(file(dir));
}

function save(dir, secrets) {
  requireEncryption();
  fs.writeFileSync(file(dir), safeStorage.encryptString(JSON.stringify(secrets)));
}

function load(dir) {
  requireEncryption();
  return JSON.parse(safeStorage.decryptString(fs.readFileSync(file(dir))));
}

function create(dir, dbKey = hex(32)) {
  const secrets = { dbKey, appSecret: hex(32), cronSecret: hex(24) };
  save(dir, secrets);
  return secrets;
}

module.exports = { exists, load, create, save };
