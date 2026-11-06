"use strict";
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("caresyncDesktop", {
  notify: (count) => ipcRenderer.send("cs:notify", Number(count) || 0),
  onLock: (cb) => {
    if (typeof cb === "function") ipcRenderer.on("cs:lock", () => cb());
  },
});
