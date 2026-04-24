import { execFile } from "node:child_process";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { parseInterfaceList, summarizePacketCsv } from "./src/wiresharkAnalyzer.js";
import { buildNoInstallAudit } from "./src/wifiNoInstallAudit.js";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_PORT = Number(process.env.NULLVAULT_PORT) || 30003;
const DEFAULT_HOST_LABEL = process.env.NULLVAULT_HOSTNAME || "nullvault.local";
const IS_PUBLIC_DEPLOY = Boolean(
  process.env.RAILWAY_ENVIRONMENT ||
    process.env.RAILWAY_PROJECT_ID ||
    process.env.NULLVAULT_PUBLIC_DEPLOY === "1"
);
const LOCAL_API_TOKEN = process.env.NULLVAULT_LOCAL_API_TOKEN || "";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

let activeServer = null;

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function normalizeRemoteAddress(address = "") {
  return String(address).replace(/^::ffff:/, "");
}

function isLoopbackAddress(address = "") {
  const normalized = normalizeRemoteAddress(address);
  return normalized === "::1" || normalized === "127.0.0.1" || normalized.startsWith("127.");
}

function isTrustedLocalRequest(request) {
  if (IS_PUBLIC_DEPLOY) {
    return false;
  }

  const token = request.headers["x-nullvault-local-token"];
  if (LOCAL_API_TOKEN && token === LOCAL_API_TOKEN) {
    return true;
  }

  return isLoopbackAddress(request.socket.remoteAddress);
}

function sendLocalApiDisabled(response) {
  sendJson(response, 403, {
    ok: false,
    available: false,
    error:
      "Local capture APIs are disabled outside trusted local mode. Run NULLVAULT on localhost to use host network tooling."
  });
}

function clampNumber(value, defaults) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return defaults.value;
  }

  if (parsed < defaults.min) {
    return defaults.min;
  }

  if (parsed > defaults.max) {
    return defaults.max;
  }

  return Math.round(parsed);
}

function parseOptionsFromBody(body = {}) {
  return {
    interfaceId: String(body.interfaceId ?? body.interface ?? "1"),
    durationSeconds: clampNumber(body.durationSeconds, { min: 3, max: 45, value: 10 }),
    packetCount: clampNumber(body.packetCount, { min: 50, max: 4000, value: 400 }),
    displayFilter: body.displayFilter ? String(body.displayFilter).trim() : ""
  };
}

function parsePcapFromBody(body = {}) {
  const filePath = body.filePath ? String(body.filePath).trim() : "";
  return {
    filePath,
    packetCount: clampNumber(body.packetCount, { min: 50, max: 5000, value: 600 }),
    displayFilter: body.displayFilter ? String(body.displayFilter).trim() : ""
  };
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) {
    return {};
  }

  return JSON.parse(raw);
}

async function runTshark(args, timeoutMs) {
  return execFileAsync("tshark", args, {
    timeout: timeoutMs,
    maxBuffer: 10 * 1024 * 1024
  });
}

async function runHostCommand(command, args, timeoutMs) {
  try {
    const result = await execFileAsync(command, args, {
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
      windowsHide: true
    });

    return {
      ok: true,
      stdout: String(result.stdout ?? ""),
      stderr: String(result.stderr ?? "")
    };
  } catch (error) {
    return {
      ok: false,
      stdout: String(error?.stdout ?? ""),
      stderr: String(error?.stderr ?? ""),
      reason: error instanceof Error ? error.message : "Command failed"
    };
  }
}

async function getNoInstallWifiAudit() {
  if (process.platform !== "win32") {
    return {
      ok: false,
      available: false,
      error: "No-install Wi-Fi audit currently supports Windows hosts only."
    };
  }

  const [netshInterfaces, netshProfiles, arpTable, netstat] = await Promise.all([
    runHostCommand("netsh", ["wlan", "show", "interfaces"], 8000),
    runHostCommand("netsh", ["wlan", "show", "profiles"], 8000),
    runHostCommand("arp", ["-a"], 8000),
    runHostCommand("netstat", ["-ano"], 12000)
  ]);

  const commandStatus = {
    netshInterfaces: netshInterfaces.ok,
    netshProfiles: netshProfiles.ok,
    arpTable: arpTable.ok,
    netstat: netstat.ok
  };

  const anySuccessful = Object.values(commandStatus).some(Boolean);
  if (!anySuccessful) {
    return {
      ok: false,
      available: false,
      error: "Built-in network audit commands are unavailable in this environment.",
      details: {
        netshInterfaces: netshInterfaces.reason,
        netshProfiles: netshProfiles.reason,
        arpTable: arpTable.reason,
        netstat: netstat.reason
      }
    };
  }

  const report = buildNoInstallAudit({
    netshInterfaces: netshInterfaces.stdout,
    netshProfiles: netshProfiles.stdout,
    arpTable: arpTable.stdout,
    netstat: netstat.stdout
  });

  const warnings = [];
  const failedCommands = Object.entries(commandStatus)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);

  if (failedCommands.length > 0) {
    warnings.push(`Some local commands failed: ${failedCommands.join(", ")}`);
  }

  return {
    ok: true,
    available: true,
    mode: "no-install",
    commandStatus,
    warnings,
    report
  };
}

async function getCaptureStatus() {
  try {
    const versionResult = await runTshark(["-v"], 5000);
    const interfacesResult = await runTshark(["-D"], 8000);
    return {
      available: true,
      versionLine: String(versionResult.stdout ?? "").split(/\r?\n/)[0] || "tshark detected",
      interfaces: parseInterfaceList(interfacesResult.stdout)
    };
  } catch (error) {
    return {
      available: false,
      reason:
        error instanceof Error
          ? error.message
          : "tshark was not found. Install Wireshark with Npcap to enable packet capture."
    };
  }
}

function buildCaptureArgs(options) {
  const args = [
    "-i",
    options.interfaceId,
    "-a",
    `duration:${options.durationSeconds}`,
    "-c",
    String(options.packetCount),
    "-T",
    "fields",
    "-E",
    "separator=,",
    "-E",
    "quote=n",
    "-e",
    "frame.time_epoch",
    "-e",
    "ip.src",
    "-e",
    "ip.dst",
    "-e",
    "tcp.srcport",
    "-e",
    "tcp.dstport",
    "-e",
    "udp.srcport",
    "-e",
    "udp.dstport",
    "-e",
    "_ws.col.Protocol",
    "-e",
    "frame.len"
  ];

  if (options.displayFilter) {
    args.push("-Y", options.displayFilter);
  }

  return args;
}

function buildPcapArgs(options) {
  const args = [
    "-r",
    options.filePath,
    "-c",
    String(options.packetCount),
    "-T",
    "fields",
    "-E",
    "separator=,",
    "-E",
    "quote=n",
    "-e",
    "frame.time_epoch",
    "-e",
    "ip.src",
    "-e",
    "ip.dst",
    "-e",
    "tcp.srcport",
    "-e",
    "tcp.dstport",
    "-e",
    "udp.srcport",
    "-e",
    "udp.dstport",
    "-e",
    "_ws.col.Protocol",
    "-e",
    "frame.len"
  ];

  if (options.displayFilter) {
    args.push("-Y", options.displayFilter);
  }

  return args;
}

async function handleApi(request, response, url) {
  if (
    (url.pathname.startsWith("/api/wifi/") || url.pathname.startsWith("/api/wireshark/")) &&
    !isTrustedLocalRequest(request)
  ) {
    sendLocalApiDisabled(response);
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/wifi/no-install-audit") {
    const audit = await getNoInstallWifiAudit();
    sendJson(response, 200, audit);
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/wireshark/status") {
    const status = await getCaptureStatus();

    if (!status.available) {
      sendJson(response, 200, {
        ok: true,
        available: false,
        message:
          "tshark is unavailable on this host. Install Wireshark + Npcap to enable live packet features.",
        reason: status.reason
      });
      return true;
    }

    sendJson(response, 200, {
      ok: true,
      available: true,
      version: status.versionLine,
      interfaces: status.interfaces
    });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/wireshark/capture-summary") {
    let body;
    try {
      body = await readJsonBody(request);
    } catch {
      sendJson(response, 400, { ok: false, error: "Invalid JSON body." });
      return true;
    }

    const status = await getCaptureStatus();
    if (!status.available) {
      sendJson(response, 200, {
        ok: false,
        available: false,
        error:
          "Live capture requires tshark + Npcap. Install Wireshark with packet capture support."
      });
      return true;
    }

    const options = parseOptionsFromBody(body);

    try {
      const capture = await runTshark(
        buildCaptureArgs(options),
        options.durationSeconds * 1000 + 8000
      );
      const summary = summarizePacketCsv(capture.stdout);

      sendJson(response, 200, {
        ok: true,
        available: true,
        options,
        summary
      });
      return true;
    } catch (error) {
      sendJson(response, 200, {
        ok: false,
        available: true,
        error: error instanceof Error ? error.message : "Capture failed."
      });
      return true;
    }
  }

  if (request.method === "POST" && url.pathname === "/api/wireshark/pcap-summary") {
    let body;
    try {
      body = await readJsonBody(request);
    } catch {
      sendJson(response, 400, { ok: false, error: "Invalid JSON body." });
      return true;
    }

    const options = parsePcapFromBody(body);
    if (!options.filePath) {
      sendJson(response, 400, { ok: false, error: "filePath is required." });
      return true;
    }

    if (!existsSync(options.filePath)) {
      sendJson(response, 400, { ok: false, error: "PCAP file path does not exist." });
      return true;
    }

    try {
      const result = await runTshark(buildPcapArgs(options), 30000);
      const summary = summarizePacketCsv(result.stdout);
      sendJson(response, 200, {
        ok: true,
        options,
        summary
      });
      return true;
    } catch (error) {
      sendJson(response, 200, {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to parse pcap."
      });
      return true;
    }
  }

  return false;
}

export function createRequestHandler({ basePath = "" } = {}) {
  return async (request, response) => {
    try {
      const url = new URL(request.url || "/", `http://${request.headers.host}`);

      const apiHandled = await handleApi(request, response, url);
      if (apiHandled) {
        return;
      }

      let staticPath = url.pathname;
      if (basePath && (staticPath === basePath || staticPath.startsWith(`${basePath}/`))) {
        staticPath = staticPath.slice(basePath.length) || "/";
      }

      const requestedPath = staticPath === "/" ? "index.html" : staticPath.replace(/^\/+/, "");
      const filePath = path.join(__dirname, requestedPath);

      if (!filePath.startsWith(__dirname) || !existsSync(filePath)) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found");
        return;
      }

      const fileStats = await stat(filePath);
      if (!fileStats.isFile()) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found");
        return;
      }

      const ext = path.extname(filePath);
      response.writeHead(200, {
        "Content-Type": mimeTypes[ext] || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      createReadStream(filePath).pipe(response);
    } catch (error) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(`Server error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };
}

export function createServer() {
  return http.createServer(createRequestHandler());
}

export async function startServer({ port = DEFAULT_PORT, host } = {}) {
  if (activeServer?.listening) {
    const address = activeServer.address();
    const activePort = typeof address === "object" && address ? address.port : port;
    return { server: activeServer, port: activePort };
  }

  const server = createServer();

  await new Promise((resolve, reject) => {
    function handleError(error) {
      server.off("listening", handleListening);
      reject(error);
    }

    function handleListening() {
      server.off("error", handleError);
      resolve();
    }

    server.once("error", handleError);
    server.once("listening", handleListening);
    server.listen(port, host);
  });

  server.once("close", () => {
    if (activeServer === server) {
      activeServer = null;
    }
  });

  activeServer = server;
  const address = server.address();
  const activePort = typeof address === "object" && address ? address.port : port;
  return { server, port: activePort };
}

export async function stopServer(server = activeServer) {
  if (!server) {
    return;
  }

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  if (server === activeServer) {
    activeServer = null;
  }
}

function isDirectRun() {
  const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
  return entryPath === __filename;
}

if (isDirectRun()) {
  startServer()
    .then(({ port }) => {
      console.log(`NULLVAULT is running at http://${DEFAULT_HOST_LABEL}:${port}`);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
