import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { startServer, stopServer } from "../server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appPort = Number(process.env.NULLVAULT_PORT) || 30003;
const displayHost = process.env.NULLVAULT_HOSTNAME || "nullvault.local";

let mainWindow = null;
let backendServer = null;
let serverOrigin = `http://127.0.0.1:${appPort}`;

async function ensureBackend() {
  let started;

  try {
    started = await startServer({ port: appPort, host: "127.0.0.1" });
  } catch (error) {
    if (error?.code !== "EADDRINUSE") {
      throw error;
    }

    started = await startServer({ port: 0, host: "127.0.0.1" });
  }

  backendServer = started.server;
  serverOrigin = `http://127.0.0.1:${started.port}`;
  return serverOrigin;
}

function getWindowFromEvent(event) {
  return BrowserWindow.fromWebContents(event.sender) ?? mainWindow;
}

function registerIpc() {
  ipcMain.handle("desktop:get-runtime", async () => ({
    isDesktop: true,
    serverOrigin,
    serverLabel: serverOrigin.replace(/^https?:\/\/(127\.0\.0\.1|localhost)/, displayHost)
  }));

  ipcMain.handle("desktop:minimize", (event) => {
    const window = getWindowFromEvent(event);
    window?.minimize();
  });

  ipcMain.handle("desktop:toggle-maximize", (event) => {
    const window = getWindowFromEvent(event);
    if (!window) {
      return { maximized: false };
    }

    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }

    return { maximized: window.isMaximized() };
  });

  ipcMain.handle("desktop:close", (event) => {
    const window = getWindowFromEvent(event);
    window?.close();
  });
}

async function createMainWindow() {
  const origin = await ensureBackend();

  mainWindow = new BrowserWindow({
    width: 1480,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#0a0e0a",
    frame: false,
    title: "NULLVAULT",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: false
    }
  });

  await mainWindow.loadURL(origin);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  app.setName("NULLVAULT");
  registerIpc();
  await createMainWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopServer(backendServer).catch(() => {});
});
