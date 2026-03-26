import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("nullvaultDesktop", {
  isDesktop: true,
  getRuntime: () => ipcRenderer.invoke("desktop:get-runtime"),
  minimize: () => ipcRenderer.invoke("desktop:minimize"),
  toggleMaximize: () => ipcRenderer.invoke("desktop:toggle-maximize"),
  close: () => ipcRenderer.invoke("desktop:close")
});
