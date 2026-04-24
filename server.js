import { createReadStream, existsSync, statSync } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createRequestHandler as createNullvaultRequestHandler } from "./apps/nullvault/server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = Number(process.env.PORT) || 0;
const nullvaultHandler = createNullvaultRequestHandler({ basePath: "/nullvault" });

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

function isFile(p) {
  try { return statSync(p).isFile(); } catch { return false; }
}

function resolveFilePath(pathname) {
  if (pathname === "/" || pathname === "") return "index.html";

  // Strip leading slashes, normalize
  const clean = pathname.replace(/^\/+/, "").replace(/\/+$/, "");

  // 1. Try exact file
  const exactPath = path.join(__dirname, clean);
  if (isFile(exactPath)) return clean;

  // 2. Try as directory index (e.g. seccheck -> seccheck/index.html)
  const indexPath = path.join(__dirname, clean, "index.html");
  if (isFile(indexPath)) return path.join(clean, "index.html");

  // 3. SPA fallback for known subdirs
  const topDir = clean.split("/")[0];
  const spaIndex = path.join(__dirname, topDir, "index.html");
  if (isFile(spaIndex)) return path.join(topDir, "index.html");

  return null;
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);

    if (
      url.pathname === "/nullvault" ||
      url.pathname.startsWith("/nullvault/") ||
      url.pathname.startsWith("/api/wifi/") ||
      url.pathname.startsWith("/api/wireshark/")
    ) {
      await nullvaultHandler(request, response);
      return;
    }

    const resolved = resolveFilePath(url.pathname);

    if (!resolved) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const filePath = path.join(__dirname, resolved);

    if (!filePath.startsWith(__dirname) || !isFile(filePath)) {
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
});

server.listen(port, () => {
  const address = server.address();
  const actualPort = typeof address === "object" && address ? address.port : port;
  console.log(`Home Sentinel is running at http://localhost:${actualPort}`);
});
