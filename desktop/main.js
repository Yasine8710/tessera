"use strict";
const { app, BrowserWindow, Menu, Tray, Notification, dialog, shell, session, ipcMain, nativeImage, powerMonitor, clipboard } = require("electron");
const { spawn } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");

const secrets = require("./secrets");
const store = require("./db");

app.setName("Tessera");
// Lets automated tests use a throwaway data folder instead of the real one.
if (process.env.TESSERA_DATA_DIR) app.setPath("userData", process.env.TESSERA_DATA_DIR);
app.setAppUserModelId("com.tessera.desktop");

const packaged = app.isPackaged;
const serverDir = packaged ? path.join(process.resourcesPath, "server") : path.join(__dirname, "..", ".next", "standalone");
const migrationsDir = packaged ? path.join(process.resourcesPath, "migrations") : path.join(__dirname, "..", "prisma", "migrations");
const iconPath = packaged ? path.join(process.resourcesPath, "icon.png") : path.join(__dirname, "..", "build", "icon.png");

const dataDir = app.getPath("userData");
const dbFile = path.join(dataDir, "tessera.db");
const backupDir = path.join(dataDir, "backups");

const launchToken = crypto.randomBytes(24).toString("hex");
const REMINDER_MS = 5 * 60_000;

let win = null;
let tray = null;
let child = null;
let port = 0;
let keys = null;
let quitting = false;
let reminderTimer = null;
let restarting = false;
let hideHintShown = 0;

const base = () => `http://127.0.0.1:${port}`;

// ---------- single instance ----------
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => showWindow());
}

// ---------- helpers ----------
function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port: p } = srv.address();
      srv.close(() => resolve(p));
    });
  });
}

async function api(pathname, init = {}) {
  return fetch(base() + pathname, {
    ...init,
    headers: { "x-tessera-token": launchToken, ...(init.headers || {}) },
  });
}

async function waitForServer(timeoutMs = 60_000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    if (!child) throw new Error("The Tessera engine stopped while starting.");
    try {
      const r = await api("/api/health");
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("The Tessera engine did not start in time.");
}

function promptText(parent, title, label) {
  return new Promise((resolve) => {
    const w = new BrowserWindow({
      width: 480,
      height: 220,
      parent: parent || undefined,
      modal: !!parent,
      resizable: false,
      minimizable: false,
      maximizable: false,
      autoHideMenuBar: true,
      title,
      icon: iconPath,
      webPreferences: { preload: path.join(__dirname, "prompt-preload.js"), contextIsolation: true, sandbox: true, nodeIntegration: false },
    });
    w.removeMenu();
    const wc = w.webContents;
    const onInit = (e) => (e.sender === wc ? { title, label } : undefined);
    let settled = false;
    const finish = (v) => {
      if (settled) return;
      settled = true;
      ipcMain.removeHandler("prompt:init");
      ipcMain.removeListener("prompt:done", onDone);
      resolve(v);
      if (!w.isDestroyed()) w.close();
    };
    const onDone = (e, v) => {
      if (e.sender === wc) finish(typeof v === "string" ? v.trim() : null);
    };
    ipcMain.handle("prompt:init", (e) => onInit(e));
    ipcMain.on("prompt:done", onDone);
    w.on("closed", () => finish(null));
    w.loadFile(path.join(__dirname, "prompt.html"));
  });
}

// ---------- secrets + database ----------
async function prepareData() {
  fs.mkdirSync(dataDir, { recursive: true });
  const hasDb = fs.existsSync(dbFile);
  if (!secrets.exists(dataDir)) {
    if (hasDb) {
      // Database exists but its key is gone (e.g. new Windows profile). Only the recovery key can open it.
      const entered = await promptText(null, "Recovery key needed", "This data file was locked with a key that is not on this Windows account. Paste your Tessera recovery key:");
      if (!entered || !store.validKey(entered)) throw new Error("A valid recovery key is required to open the existing data.");
      store.open(serverDir, dbFile, entered).close();
      keys = secrets.create(dataDir, entered.toLowerCase());
    } else {
      keys = secrets.create(dataDir);
    }
  } else {
    keys = secrets.load(dataDir);
  }

  let db;
  try {
    db = store.open(serverDir, dbFile, keys.dbKey);
  } catch {
    throw new Error("The Tessera database could not be opened with its key. It may be damaged. Restore a backup from File, Restore from backup.");
  }
  try {
    if (hasDb && store.pendingCount(db, migrationsDir) > 0) {
      store.checkpoint(db);
      fs.mkdirSync(backupDir, { recursive: true });
      fs.copyFileSync(dbFile, path.join(backupDir, `pre-update-${stamp()}.db`));
    }
    store.applyMigrations(db, migrationsDir);
    store.checkpoint(db);
  } finally {
    db.close();
  }
}

const stamp = () => new Date().toISOString().replace(/[:.]/g, "-");

// ---------- server process ----------
async function startServer() {
  port = await freePort();
  const serverJs = path.join(serverDir, "server.js");
  if (!fs.existsSync(serverJs)) throw new Error("The Tessera engine is missing. Reinstall the application.");
  child = spawn(process.execPath, [serverJs], {
    cwd: serverDir,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      DATABASE_URL: "file:" + dbFile.split(path.sep).join("/"),
      TESSERA_DB_KEY: keys.dbKey,
      TESSERA_DESKTOP: "1",
      TESSERA_LAUNCH_TOKEN: launchToken,
      APP_SECRET: keys.appSecret,
      CRON_SECRET: keys.cronSecret,
      APP_URL: base(),
      DEMO_MODE: "false",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  });
  const log = fs.createWriteStream(path.join(dataDir, "engine.log"), { flags: "a" });
  child.stdout.pipe(log, { end: false });
  child.stderr.pipe(log, { end: false });
  const mine = child;
  child.on("exit", (code) => {
    if (child === mine) child = null;
    if (!quitting && !restarting) onEngineCrash(code);
  });
  await waitForServer();
}

function stopServer() {
  return new Promise((resolve) => {
    if (!child) return resolve();
    const c = child;
    const t = setTimeout(() => c.kill("SIGKILL"), 4000);
    c.once("exit", () => {
      clearTimeout(t);
      resolve();
    });
    c.kill();
  });
}

let crashes = 0;
async function onEngineCrash(code) {
  if (++crashes > 2) {
    dialog.showErrorBox("Tessera", `The Tessera engine stopped (code ${code}). Details are in engine.log in the data folder.`);
    return app.quit();
  }
  try {
    await startServer();
    if (win) win.loadURL(base());
  } catch (e) {
    dialog.showErrorBox("Tessera", String(e.message || e));
    app.quit();
  }
}

// ---------- window ----------
const LOADING =
  "data:text/html;charset=utf-8," +
  encodeURIComponent(
    `<meta charset=utf-8><style>html,body{height:100%;margin:0;background:#0f2a33;color:#e6f6f5;font:16px 'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center}</style><div>Starting Tessera...</div>`,
  );

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: "#0f2a33",
    title: "Tessera",
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      backgroundThrottling: false,
      devTools: !packaged,
    },
  });
  win.once("ready-to-show", () => win.show());
  win.loadURL(LOADING);

  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith(base() + "/") && !url.startsWith("data:text/html")) {
      e.preventDefault();
      openExternal(url);
    }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(base() + "/")) return { action: "allow" };
    openExternal(url);
    return { action: "deny" };
  });
  win.on("close", (e) => {
    if (quitting) return;
    e.preventDefault();
    win.hide();
    if (hideHintShown++ < 3) {
      new Notification({ title: "Tessera is still running", body: "Reminders keep working. Use the tray icon to open or quit." }).show();
    }
  });
  win.on("closed", () => (win = null));
}

function openExternal(url) {
  try {
    const u = new URL(url);
    if (u.protocol === "https:" || u.protocol === "mailto:") shell.openExternal(url);
  } catch {}
}

function showWindow() {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

function createTray() {
  const img = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(img);
  tray.setToolTip("Tessera");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Open Tessera", click: showWindow },
      { type: "separator" },
      { label: "Quit", click: () => app.quit() },
    ]),
  );
  tray.on("click", showWindow);
}

// ---------- menu + data tools ----------
function buildMenu() {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "&File",
        submenu: [
          { label: "Back up data...", click: () => backupData() },
          { label: "Restore from backup...", click: () => restoreData() },
          { type: "separator" },
          { label: "Show recovery key...", click: () => showRecoveryKey() },
          { label: "Open data folder", click: () => shell.openPath(dataDir) },
          { type: "separator" },
          { label: "Quit", accelerator: "Ctrl+Q", click: () => app.quit() },
        ],
      },
      { label: "&View", submenu: [{ role: "reload" }, { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }, { role: "togglefullscreen" }] },
      {
        label: "&Help",
        submenu: [
          { label: "Reset administrator password...", click: () => resetAdmin() },
          { type: "separator" },
          {
            label: "About Tessera",
            click: () =>
              dialog.showMessageBox(win, {
                type: "info",
                title: "About Tessera",
                message: `Tessera ${app.getVersion()}`,
                detail:
                  "Data is stored encrypted on this computer only.\n\nTessera is not an emergency service and is not a substitute for professional medical judgment. It has not had an independent security audit and makes no regulatory compliance claims.",
              }),
          },
        ],
      },
    ]),
  );
}

async function backupData() {
  const r = await dialog.showSaveDialog(win, {
    title: "Back up Tessera data",
    defaultPath: path.join(app.getPath("documents"), `Tessera-backup-${new Date().toISOString().slice(0, 10)}.db`),
    filters: [{ name: "Tessera backup (encrypted)", extensions: ["db"] }],
  });
  if (r.canceled || !r.filePath) return;
  try {
    const db = store.open(serverDir, dbFile, keys.dbKey);
    store.checkpoint(db);
    db.close();
    fs.copyFileSync(dbFile, r.filePath);
    await dialog.showMessageBox(win, {
      type: "info",
      message: "Backup saved.",
      detail: "The file is encrypted. To open it on another PC or Windows account you also need the recovery key (File, Show recovery key). Keep that key somewhere safe and separate.",
    });
  } catch (e) {
    dialog.showErrorBox("Backup failed", String(e.message || e));
  }
}

async function restoreData() {
  const r = await dialog.showOpenDialog(win, { title: "Restore Tessera backup", properties: ["openFile"], filters: [{ name: "Tessera backup", extensions: ["db"] }] });
  if (r.canceled || !r.filePaths[0]) return;
  const src = r.filePaths[0];
  const confirm = await dialog.showMessageBox(win, {
    type: "warning",
    buttons: ["Cancel", "Replace current data"],
    defaultId: 0,
    cancelId: 0,
    message: "Replace all current data with this backup?",
    detail: "A copy of the current data is kept in the backups folder first.",
  });
  if (confirm.response !== 1) return;

  let key = keys.dbKey;
  let probe;
  try {
    probe = store.open(serverDir, src, key);
  } catch {
    const entered = await promptText(win, "Recovery key", "This backup was made with a different key. Paste the recovery key it was created with:");
    if (!entered || !store.validKey(entered)) return;
    try {
      key = entered.toLowerCase();
      probe = store.open(serverDir, src, key);
    } catch {
      return dialog.showErrorBox("Restore failed", "That key does not open this backup.");
    }
  }
  try {
    probe.prepare("select count(*) from user").get();
  } catch {
    probe.close();
    return dialog.showErrorBox("Restore failed", "That file is not a Tessera backup.");
  }
  probe.close();

  restarting = true;
  try {
    win.loadURL(LOADING);
    await stopServer();
    fs.mkdirSync(backupDir, { recursive: true });
    const cur = store.open(serverDir, dbFile, keys.dbKey);
    store.checkpoint(cur);
    cur.close();
    fs.copyFileSync(dbFile, path.join(backupDir, `pre-restore-${stamp()}.db`));
    store.removeSidecars(dbFile);
    fs.copyFileSync(src, dbFile);
    if (key !== keys.dbKey) {
      keys.dbKey = key;
      secrets.save(dataDir, keys);
    }
    await prepareData();
    await startServer();
    await win.loadURL(base());
    dialog.showMessageBox(win, { type: "info", message: "Backup restored." });
  } catch (e) {
    dialog.showErrorBox("Restore failed", String(e.message || e));
  } finally {
    restarting = false;
  }
}

async function showRecoveryKey() {
  const r = await dialog.showMessageBox(win, {
    type: "warning",
    buttons: ["Close", "Copy to clipboard"],
    defaultId: 0,
    cancelId: 0,
    message: "Tessera recovery key",
    detail: `${keys.dbKey}\n\nAnyone with this key and a backup file can read your data. Store it offline, away from the backup.`,
  });
  if (r.response === 1) {
    clipboard.writeText(keys.dbKey);
    setTimeout(() => clipboard.clear(), 60_000);
  }
}

async function resetAdmin() {
  const email = await promptText(win, "Reset administrator password", "Administrator email:");
  if (!email) return;
  try {
    const r = await api("/api/desktop/recover", {
      method: "POST",
      headers: { authorization: `Bearer ${keys.cronSecret}`, "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const j = await r.json();
    if (!r.ok) return dialog.showErrorBox("Reset", j.error || "Could not create a reset link.");
    await win.loadURL(base() + j.path);
  } catch (e) {
    dialog.showErrorBox("Reset", String(e.message || e));
  }
}

// ---------- reminders + notifications ----------
function startScheduler() {
  const tick = () =>
    api("/api/cron/reminders", { method: "POST", headers: { authorization: `Bearer ${keys.cronSecret}` } }).catch(() => {});
  tick();
  reminderTimer = setInterval(tick, REMINDER_MS);
}

ipcMain.on("cs:notify", (e, count) => {
  if (!win || e.sender !== win.webContents || !e.senderFrame.url.startsWith(base() + "/")) return;
  if (!Notification.isSupported() || !(count > 0)) return;
  const n = new Notification({
    title: "Tessera",
    // Deliberately generic: toasts can appear on a locked screen and must not reveal health details.
    body: count === 1 ? "You have a new notification." : `You have ${count} new notifications.`,
  });
  n.on("click", showWindow);
  n.show();
});

// ---------- lifecycle ----------
app.on("before-quit", () => {
  quitting = true;
  if (reminderTimer) clearInterval(reminderTimer);
});
app.on("will-quit", () => {
  if (child) child.kill();
});
app.on("window-all-closed", () => {});

app.whenReady().then(async () => {
  if (!app.hasSingleInstanceLock()) return;
  try {
    // Deny every permission request (camera, mic, location, notifications API...). OS toasts go through the main process.
    session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    await session.defaultSession.clearStorageData({ storages: ["cookies"] });

    // The port changes whenever the engine restarts, so match any loopback port and only add the token for the live engine.
    session.defaultSession.webRequest.onBeforeSendHeaders({ urls: ["http://127.0.0.1/*"] }, (details, cb) => {
      if (port && details.url.startsWith(base() + "/")) details.requestHeaders["x-tessera-token"] = launchToken;
      cb({ requestHeaders: details.requestHeaders });
    });

    createWindow();
    createTray();
    buildMenu();

    await prepareData();
    await startServer();
    await win.loadURL(base());
    startScheduler();
    powerMonitor.on("lock-screen", () => win && !win.isDestroyed() && win.webContents.send("cs:lock"));
  } catch (e) {
    dialog.showErrorBox("Tessera could not start", String(e.message || e));
    quitting = true;
    app.quit();
  }
});
