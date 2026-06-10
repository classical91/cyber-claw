import {
  ROOM_PROFILE_OPTIONS,
  getDashboardMetrics,
  getPostureScore,
  resolveAlert,
  setRoomProfile
} from "./securityModel.js";
import { loadState, saveState } from "./storage.js";
import {
  clearChildren,
  createElement,
  createStatusPill,
  formatTimestamp
} from "./ui.js";
import { downloadReport, exportHtml, exportMarkdown } from "./reportExporter.js";

const roomGrid = document.querySelector("#room-grid");
const gridAlerts = document.querySelector("#grid-alerts");
const deviceInventory = document.querySelector("#device-inventory");
const playbookList = document.querySelector("#playbook-list");
const postureEl = document.querySelector("#posture-score");
const gridNote = document.querySelector("#grid-note");

let state = loadState();

function bandTone(band) {
  switch (band) {
    case "Hardened": return "stable";
    case "Good": return "stable";
    case "Needs Attention": return "watch";
    case "Risky": return "alert";
    case "Critical": return "alert";
    default: return "inline";
  }
}

function renderPostureScore(nextState) {
  if (!postureEl) return;
  clearChildren(postureEl);

  const posture = getPostureScore(nextState);

  if (!posture.categories.length) {
    postureEl.append(createElement("p", "empty-note", "No site data configured yet."));
    return;
  }

  const display = createElement("div", "posture-display");

  const scoreBlock = createElement("div", "posture-score-block");
  scoreBlock.append(
    createElement("span", `posture-number posture-band-${posture.band.toLowerCase().replace(/\s+/g, "-")}`, String(posture.score)),
    createElement("span", "posture-band-label", posture.band)
  );
  display.append(scoreBlock);

  const categories = createElement("div", "posture-categories");
  for (const cat of posture.categories) {
    const row = createElement("div", "posture-category");
    const nameEl = createElement("span", "posture-category-name", cat.name);
    const barWrap = createElement("div", "posture-bar-wrap");
    const barFill = createElement("div", "posture-bar-fill");
    barFill.style.width = `${cat.score}%`;
    if (cat.score >= 75) barFill.classList.add("posture-bar-good");
    else if (cat.score >= 50) barFill.classList.add("posture-bar-warn");
    else barFill.classList.add("posture-bar-risk");
    barWrap.append(barFill);
    const scoreLabel = createElement("span", "posture-category-score", `${cat.score}`);
    row.append(nameEl, barWrap, scoreLabel);
    categories.append(row);
  }
  display.append(categories);
  postureEl.append(display);
}

function renderRooms(nextState) {
  clearChildren(roomGrid);

  for (const room of nextState.rooms) {
    const article = createElement("article", `room-card room-card-${room.status}`);
    const header = createElement("div", "room-card-header");
    const titleBlock = createElement("div");
    titleBlock.append(
      createElement("strong", "room-name", room.name),
      createElement("p", "room-zone", `${room.zone} · ${room.coverage}`)
    );
    header.append(titleBlock, createStatusPill(room.status, room.status));

    const note = createElement("p", "room-copy", room.narrative);
    const controls = createElement("div", "room-controls");
    const select = createElement("select", "profile-select");
    select.setAttribute("aria-label", `${room.name} profile`);

    for (const profile of ROOM_PROFILE_OPTIONS) {
      const option = createElement("option");
      option.value = profile;
      option.textContent = profile;
      option.selected = room.profile === profile;
      select.append(option);
    }

    select.addEventListener("change", () => {
      state = saveState(setRoomProfile(state, room.id, select.value));
      gridNote.textContent = `${room.name} profile changed to ${select.value}.`;
      render();
    });

    controls.append(select, createElement("span", "room-last-sweep", formatTimestamp(room.lastSweepAt)));
    article.append(header, note, controls);
    roomGrid.append(article);
  }
}

function renderAlerts(nextState) {
  clearChildren(gridAlerts);
  const alerts = nextState.alerts.filter((alert) => !alert.resolved);

  if (!alerts.length) {
    gridAlerts.append(createElement("p", "empty-note", "No active incidents are waiting in the queue."));
    return;
  }

  for (const alert of alerts) {
    const item = createElement("article", `feed-item feed-item-${alert.severity}`);
    const header = createElement("div", "feed-item-header");
    const titleBlock = createElement("div");
    titleBlock.append(
      createElement("strong", "feed-item-title", alert.title),
      createElement("p", "feed-item-meta", formatTimestamp(alert.observedAt))
    );
    header.append(titleBlock, createStatusPill(alert.severity, alert.severity));

    const button = createElement("button", "button button-secondary", "Resolve");
    button.type = "button";
    button.addEventListener("click", () => {
      state = saveState(resolveAlert(state, alert.id));
      gridNote.textContent = `${alert.title} marked resolved.`;
      render();
    });

    item.append(
      header,
      createElement("p", "feed-item-copy", alert.detail),
      createElement("p", "feed-item-recommendation", alert.recommendation),
      button
    );
    gridAlerts.append(item);
  }
}

function renderDevices(nextState) {
  clearChildren(deviceInventory);

  for (const device of nextState.devices) {
    const row = createElement("article", "inventory-row");
    const nameBlock = createElement("div", "inventory-primary");
    const roomName = nextState.rooms.find((room) => room.id === device.roomId)?.name ?? "Unknown";

    nameBlock.append(
      createElement("strong", null, device.name),
      createElement("p", null, `${device.type} · ${roomName}`)
    );

    const meta = createElement("div", "inventory-meta");
    meta.append(
      createElement("span", null, device.battery === null ? "Wired" : `Battery ${device.battery}%`),
      createElement("span", null, device.signal),
      createElement("span", null, device.firmware),
      createElement("span", null, formatTimestamp(device.lastSeenAt))
    );

    row.append(nameBlock, meta, createStatusPill(device.status, device.status));
    deviceInventory.append(row);
  }
}

function renderPlaybooks(nextState) {
  clearChildren(playbookList);

  for (const playbook of nextState.playbooks) {
    const row = createElement("article", "compact-row");
    const copy = createElement("div", "compact-copy");
    copy.append(
      createElement("strong", null, playbook.name),
      createElement("p", null, `${playbook.trigger} · ${playbook.coverage}`)
    );
    row.append(copy, createStatusPill(playbook.state, playbook.state === "Active" ? "stable" : "inline"));
    playbookList.append(row);
  }
}

function renderSummary(nextState) {
  const metrics = getDashboardMetrics(nextState);
  const posture = metrics.postureScore;

  document.querySelector("#grid-site").textContent = nextState.profile.siteName;
  document.querySelector("#grid-mode").textContent = nextState.profile.mode;
  document.querySelector("#grid-risk").textContent = `${posture.score} — ${posture.band}`;
  document.querySelector("#grid-updated").textContent = formatTimestamp(nextState.updatedAt);

  const modePill = document.querySelector("#grid-mode-pill");
  const scorePill = document.querySelector("#grid-risk-pill");
  if (modePill) modePill.textContent = `Mode: ${nextState.profile.mode}`;
  if (scorePill) {
    scorePill.textContent = `Posture: ${posture.score} / 100`;
    scorePill.className = `status-pill status-pill-inline status-pill-${bandTone(posture.band)}`;
  }
}

function render() {
  renderSummary(state);
  renderPostureScore(state);
  renderRooms(state);
  renderAlerts(state);
  renderDevices(state);
  renderPlaybooks(state);
}

render();

const exportHtmlBtn = document.querySelector("#export-html");
const exportMdBtn = document.querySelector("#export-md");

if (exportHtmlBtn) {
  exportHtmlBtn.addEventListener("click", () => {
    const slug = new Date().toISOString().slice(0, 10);
    downloadReport(exportHtml(state), `audit-report-${slug}.html`, "text/html");
  });
}

if (exportMdBtn) {
  exportMdBtn.addEventListener("click", () => {
    const slug = new Date().toISOString().slice(0, 10);
    downloadReport(exportMarkdown(state), `audit-report-${slug}.md`, "text/markdown");
  });
}
