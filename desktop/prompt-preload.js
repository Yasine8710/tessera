"use strict";
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("promptApi", {
  init: () => ipcRenderer.invoke("prompt:init"),
  done: (value) => ipcRenderer.send("prompt:done", value),
});
