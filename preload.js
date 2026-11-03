const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("desktop", {
  schedule: list => ipcRenderer.invoke("schedule", list)
});
