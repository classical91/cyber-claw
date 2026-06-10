import { getDashboardMetrics, getPostureScore, hydrateState } from "./securityModel.js";

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtDate(iso) {
  if (!iso) return "N/A";
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

function buildData(rawState) {
  const state = hydrateState(rawState);
  const posture = getPostureScore(state);
  const metrics = getDashboardMetrics(state);
  return {
    generatedAt: new Date().toISOString(),
    site: state.profile.siteName,
    mode: state.profile.mode,
    networkName: state.profile.networkName,
    posture,
    metrics,
    rooms: state.rooms,
    devices: state.devices,
    openAlerts: state.alerts.filter((a) => !a.resolved),
    resolvedAlerts: state.alerts.filter((a) => a.resolved),
    playbooks: state.playbooks,
    maintenanceRooms: state.rooms.filter((r) => r.profile === "Maintenance"),
    unscannedRooms: state.rooms.filter((r) => !r.lastSweepAt)
  };
}

function notTestedList(d) {
  return [
    ...d.maintenanceRooms.map((r) => `Room in Maintenance mode: ${r.name} (${r.zone})`),
    ...d.unscannedRooms.map((r) => `Room not recently scanned: ${r.name}`),
    "External network traffic analysis (requires NULLVAULT packet capture)",
    "Wi-Fi encryption and neighboring AP analysis (requires NULLVAULT)",
    "Authentication logs and account activity (manual review required)",
    "Physical access controls and social engineering vectors (out of scope)"
  ];
}

export function exportHtml(rawState) {
  const d = buildData(rawState);
  const bandColor = d.posture.score >= 75 ? "#9ff26b" : d.posture.score >= 60 ? "#ffbe5c" : "#ff7389";
  const scoreDisplay = d.posture.categories.length ? String(d.posture.score) : "N/A";

  const categoryRows = d.posture.categories.map((c) => {
    const color = c.score >= 75 ? "#9ff26b" : c.score >= 50 ? "#ffbe5c" : "#ff7389";
    return `<tr>
        <td>${esc(c.name)}</td>
        <td><div style="background:#1a1a1a;border-radius:3px;height:7px;overflow:hidden">
          <div style="width:${c.score}%;background:${color};height:100%"></div>
        </div></td>
        <td style="text-align:right;color:${color};font-variant-numeric:tabular-nums">${c.score}</td>
      </tr>`;
  }).join("\n");

  const alertBlocks = d.openAlerts.map((a) => {
    const color = a.severity === "high" ? "#ff7389" : a.severity === "medium" ? "#ffbe5c" : "#7ebdff";
    return `<article style="border-left:3px solid ${color};padding:12px 16px;margin:10px 0;background:#0f140f;border-radius:0 6px 6px 0">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <strong style="color:#e0e8d8">${esc(a.title)}</strong>
          <span style="color:${color};font-size:.78rem;text-transform:uppercase;letter-spacing:.06em">${esc(a.severity)}</span>
        </div>
        <p style="color:#999;margin:0 0 6px;font-size:.88rem">${esc(a.detail)}</p>
        <p style="margin:0;font-size:.88rem"><strong style="color:#ccc">Action:</strong> ${esc(a.recommendation)}</p>
      </article>`;
  }).join("\n");

  const roomRows = d.rooms.map((r) => {
    const sc = r.status === "alert" ? "#ff7389" : r.status === "watch" ? "#ffbe5c" : "#9ff26b";
    return `<tr>
        <td>${esc(r.name)}</td>
        <td style="color:#888">${esc(r.zone)}</td>
        <td style="color:${sc}">${esc(r.status)}</td>
        <td>${esc(r.profile)}</td>
        <td style="color:#666;font-size:.82rem">${esc(fmtDate(r.lastSweepAt) === "N/A" ? "Not scanned" : fmtDate(r.lastSweepAt))}</td>
      </tr>`;
  }).join("\n");

  const deviceRows = d.devices.map((dv) => {
    const sc = dv.status === "online" ? "#9ff26b" : dv.status === "warning" ? "#ffbe5c" : "#ff7389";
    const roomName = d.rooms.find((r) => r.id === dv.roomId)?.name ?? "Unknown";
    return `<tr>
        <td>${esc(dv.name)}</td>
        <td style="color:#888">${esc(roomName)}</td>
        <td style="color:#888">${esc(dv.type)}</td>
        <td style="color:${sc}">${esc(dv.status)}</td>
        <td style="color:#666;font-size:.82rem">${esc(dv.firmware)}</td>
      </tr>`;
  }).join("\n");

  const notTested = notTestedList(d)
    .map((i) => `<li>${esc(i)}</li>`)
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Defensive Audit Report — ${esc(d.site)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0a0e0a;color:#e0e8d8;font-family:system-ui,-apple-system,sans-serif;padding:0}
  .page{max-width:860px;margin:0 auto;padding:40px 24px}
  h1{color:#9ff26b;font-size:1.6rem;font-weight:700;margin-bottom:6px}
  h2{color:#c8e0b8;font-size:.82rem;font-weight:600;letter-spacing:.07em;margin:28px 0 10px;text-transform:uppercase}
  p{color:#aaa;font-size:.9rem;line-height:1.6;margin:4px 0}
  .meta{color:#666;font-size:.82rem;margin:3px 0}
  .banner{background:#1a1200;border:1px solid #7a5c00;border-radius:6px;color:#f0c040;font-size:.82rem;padding:10px 14px;margin:18px 0}
  .banner strong{color:#ffd966}
  .score-wrap{align-items:center;background:#0f140f;border:1px solid rgba(159,242,107,.12);border-radius:10px;display:flex;gap:28px;flex-wrap:wrap;padding:20px 24px;margin:10px 0}
  .score-num{color:${bandColor};font-size:3rem;font-weight:700;line-height:1}
  .score-band{color:#666;font-size:.76rem;letter-spacing:.08em;margin-top:4px;text-transform:uppercase}
  table{border-collapse:collapse;font-size:.88rem;margin:8px 0;width:100%}
  th{border-bottom:1px solid rgba(255,255,255,.06);color:#555;font-size:.76rem;padding:6px 8px;text-align:left}
  td{border-bottom:1px solid rgba(255,255,255,.04);padding:8px}
  .box{background:#0f140f;border:1px solid rgba(255,255,255,.06);border-radius:8px;margin:10px 0;padding:16px 20px}
  ul{color:#888;font-size:.88rem;padding-left:20px}
  li{margin:5px 0;line-height:1.5}
  .footer{border-top:1px solid rgba(255,255,255,.06);color:#444;font-size:.76rem;margin-top:40px;padding-top:16px;text-align:center}
  @media print{body{background:#fff;color:#111}.score-num{color:#000}.banner{border-color:#ccc;color:#555}}
</style>
</head>
<body>
<div class="page">
  <h1>Defensive Audit Report</h1>
  <p class="meta"><strong>Site:</strong> ${esc(d.site)}</p>
  <p class="meta"><strong>Mode:</strong> ${esc(d.mode)} &nbsp;·&nbsp; <strong>Network:</strong> ${esc(d.networkName)}</p>
  <p class="meta"><strong>Generated:</strong> ${esc(fmtDate(d.generatedAt))}</p>

  <div class="banner">
    <strong>Authorized use only.</strong> This report documents a defensive audit of owned or explicitly authorized systems generated by Home Sentinel (Cyber Claw). Unauthorized use of these tools may be illegal.
  </div>

  <h2>Overall Posture Score</h2>
  <div class="score-wrap">
    <div>
      <div class="score-num">${esc(scoreDisplay)}</div>
      <div class="score-band">${esc(d.posture.band)}</div>
    </div>
    <div style="flex:1;min-width:200px">
      <table><thead><tr><th>Category</th><th style="width:120px">Score</th><th style="width:40px"></th></tr></thead>
      <tbody>${categoryRows}</tbody></table>
    </div>
  </div>

  <h2>Open Findings (${d.openAlerts.length})</h2>
  ${d.openAlerts.length ? alertBlocks : '<p style="color:#555">No open findings.</p>'}

  <h2>Room Status</h2>
  <div class="box">
    <table><thead><tr><th>Room</th><th>Zone</th><th>Status</th><th>Profile</th><th>Last Scanned</th></tr></thead>
    <tbody>${roomRows}</tbody></table>
  </div>

  <h2>Device Inventory (${d.devices.length})</h2>
  <div class="box">
    <table><thead><tr><th>Device</th><th>Room</th><th>Type</th><th>Status</th><th>Firmware</th></tr></thead>
    <tbody>${deviceRows}</tbody></table>
  </div>

  <h2>What Was Not Tested</h2>
  <div class="box"><ul>${notTested}</ul></div>

  <div class="footer">
    Home Sentinel · Cyber Claw &nbsp;·&nbsp; Defensive audit tool for owned systems only
  </div>
</div>
</body>
</html>`;
}

export function exportMarkdown(rawState) {
  const d = buildData(rawState);
  const scoreDisplay = d.posture.categories.length ? d.posture.score : "N/A";
  const lines = [];

  lines.push(`# Defensive Audit Report`);
  lines.push(``);
  lines.push(`**Site:** ${d.site}  `);
  lines.push(`**Mode:** ${d.mode} · **Network:** ${d.networkName}  `);
  lines.push(`**Generated:** ${fmtDate(d.generatedAt)}`);
  lines.push(``);
  lines.push(`> **Authorized use only.** This report documents a defensive audit of owned or explicitly authorized systems. Unauthorized use of these tools may be illegal.`);
  lines.push(``);

  lines.push(`## Overall Posture Score`);
  lines.push(``);
  lines.push(`**${scoreDisplay} / 100** — ${d.posture.band}`);
  lines.push(``);
  if (d.posture.categories.length) {
    lines.push(`| Category | Bar | Score |`);
    lines.push(`|----------|-----|------:|`);
    for (const c of d.posture.categories) {
      const filled = Math.round(c.score / 10);
      const bar = "█".repeat(filled) + "░".repeat(10 - filled);
      lines.push(`| ${c.name} | \`${bar}\` | ${c.score} |`);
    }
    lines.push(``);
  }

  lines.push(`## Open Findings (${d.openAlerts.length})`);
  lines.push(``);
  if (!d.openAlerts.length) {
    lines.push(`No open findings.`);
    lines.push(``);
  } else {
    for (const a of d.openAlerts) {
      lines.push(`### ${a.title}`);
      lines.push(``);
      lines.push(`**Severity:** ${a.severity.toUpperCase()}  `);
      lines.push(`**Detail:** ${a.detail}  `);
      lines.push(`**Action:** ${a.recommendation}`);
      lines.push(``);
    }
  }

  lines.push(`## Room Status`);
  lines.push(``);
  lines.push(`| Room | Zone | Status | Profile | Last Scanned |`);
  lines.push(`|------|------|--------|---------|--------------|`);
  for (const r of d.rooms) {
    const sweep = r.lastSweepAt ? fmtDate(r.lastSweepAt) : "Not scanned";
    lines.push(`| ${r.name} | ${r.zone} | ${r.status} | ${r.profile} | ${sweep} |`);
  }
  lines.push(``);

  lines.push(`## Device Inventory`);
  lines.push(``);
  lines.push(`| Device | Room | Type | Status | Firmware |`);
  lines.push(`|--------|------|------|--------|----------|`);
  for (const dv of d.devices) {
    const roomName = d.rooms.find((r) => r.id === dv.roomId)?.name ?? "Unknown";
    lines.push(`| ${dv.name} | ${roomName} | ${dv.type} | ${dv.status} | ${dv.firmware} |`);
  }
  lines.push(``);

  lines.push(`## What Was Not Tested`);
  lines.push(``);
  for (const item of notTestedList(d)) {
    lines.push(`- ${item}`);
  }
  lines.push(``);

  lines.push(`---`);
  lines.push(``);
  lines.push(`*Home Sentinel · Cyber Claw — Defensive audit tool for owned systems only*`);

  return lines.join("\n");
}

export function downloadReport(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
