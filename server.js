import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = Number(process.env.PORT) || 0;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

function resolveFilePath(pathname) {
  // Root
  if (pathname === "/" || pathname === "") return "index.html";

  const clean = pathname.replace(/^\/+/, "");

  // Exact file — check first
  const exactPath = path.join(__dirname, clean);
  if (existsSync(exactPath)) {
    return clean;
  }

  // Directory index — e.g. /seccheck/ -> seccheck/index.html
  const indexPath = path.join(__dirname, clean.replace(/\/$/, ""), "index.html");
  if (existsSync(indexPath)) {
    return path.join(clean.replace(/\/$/, ""), "index.html");
  }

  // SPA fallback — if path starts with a known SPA prefix, serve its index.html
  const parts = clean.split("/");
  const spaDirs = ["seccheck"];
  if (spaDirs.includes(parts[0])) {
    const spaIndex = path.join(__dirname, parts[0], "index.html");
    if (existsSync(spaIndex)) return path.join(parts[0], "index.html");
  }

  return clean;
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);
    const resolved = resolveFilePath(url.pathname);
    const filePath = path.join(__dirname, resolved);

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
});

server.listen(port, () => {
  const address = server.address();
  const actualPort = typeof address === "object" && address ? address.port : port;
  console.log(`Home Sentinel is running at http://localhost:${actualPort}`);
});
