# Cyber Claw Home Sentinel

Home Sentinel is the Cyber Claw command-center shell. It links the active security workspaces:

- `/seccheck/` for Security Checklists
- `/threat-console.html` for the threat console
- `/nullvault/` for the NULLVAULT packet and local-network workspace

NULLVAULT also keeps its standalone local server for host network tooling at `apps/nullvault/server.js`.

## Run Locally

```powershell
npm install
npm run dev
```

The root Home Sentinel site starts from `server.js`. NULLVAULT is available from the same server at:

```txt
http://localhost:<printed-port>/nullvault/
```

For direct local capture work, run the standalone NULLVAULT server:

```powershell
npm --prefix apps/nullvault run dev
```

That server defaults to `http://nullvault.local:30003` or `http://127.0.0.1:30003`.

## Deployment

Railway should deploy from the repository root. The root site remains Cyber Claw/Home Sentinel, and NULLVAULT is mounted as `/nullvault/`.

Host/network command APIs are protected by NULLVAULT's local-mode guard. Public Railway environments return a disabled response for those APIs instead of running host tools.

## Tests

```powershell
npm test
```
