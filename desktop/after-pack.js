"use strict";
// electron-builder's extraResources skips node_modules and dot-folders, which the Next standalone server needs. Copy it verbatim.
const { cpSync, rmSync } = require("node:fs");
const path = require("node:path");

exports.default = async function afterPack(context) {
  const from = path.resolve(__dirname, "..", ".next", "standalone");
  const to = path.join(context.appOutDir, "resources", "server");
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true });
};
