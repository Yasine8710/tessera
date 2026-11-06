"use strict";
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("tesseraDesktop", {
  notify: (count) => ipcRenderer.send("cs:notify", Number(count) || 0),
  showMenu: () => ipcRenderer.send("cs:menu"),
  setTheme: (mode) => ipcRenderer.send("cs:theme", mode === "dark" ? "dark" : "light"),
  onLock: (cb) => {
    if (typeof cb === "function") ipcRenderer.on("cs:lock", () => cb());
  },
});
