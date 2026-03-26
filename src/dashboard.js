import { getDashboardMetrics, getLatestAssistantEntry, runConsoleCommand } from "./securityModel.js";
import { loadState, saveState } from "./storage.js";
import {
  clearChildren,
  createElement,
  createSectionList,
  createStatusPill,
  formatTimestamp,
  setHeaderPills
} from "./ui.js";

const alertFeed = document.querySelector("#alert-feed");
const deviceSummary = document.querySelector("#device-summary");
const playbookSummary = document.querySelector("#playbook-summary");
const homePlan = document.querySelector("#home-plan");
const latestRecommendation = document.querySelector("#latest-recommendation");
const dashboardNote = document.querySelector("#dashboard-note");

let state = loadState();

function hasSiteData(nextState) {
  return nextState.rooms.length > 0 || nextState.devices.length > 0 || nextState.playbooks.length > 0;
}

function renderHomePlan(nextState) {
  clearChildren(homePlan);

  if (!nextState.rooms.length) {
    homePlan.append(createElement("p", "empty-note", "No rooms are configured yet."));
    return;
  }

  for (const room of nextState.rooms) {
    const item = createElement("article", `room-tile room-tile-${room.status}`);
    const header = createElement("div", "room-tile-header");
    const titleBlock = createElement("div");
    const name = createElement("strong", "room-name", room.name);
    const zone = createElement("p", "room-zone", room.zone);
    titleBlock.append(name, zone);

    header.append(titleBlock, createStatusPill(room.status, room.status));

    const copy = createElement("p", "room-copy", room.coverage);
    const narrative = createElement("p", "room-meta", room.narrative);
    const footer = createElement("div", "room-footer");
    footer.append(
      createStatusPill(room.profile, "inline"),
      createElement("span", "room-last-sweep", formatTimestamp(room.lastSweepAt, { emptyLabel: "Not scanned" }))
    );

    item.append(header, copy, narrative, footer);
    homePlan.append(item);
  }
}

function renderAlerts(nextState) {
  clearChildren(alertFeed);
  const alerts = nextState.alerts.filter((alert) => !alert.resolved);

  if (!alerts.length) {
    alertFeed.append(
      createElement(
        "p",
        "empty-note",
        hasSiteData(nextState)
          ? "No alerts are currently recorded."
          : "No alerts are recorded because no site data is configured yet."
      )
    );
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

    item.append(
      header,
      createElement("p", "feed-item-copy", alert.detail),
      createElement("p", "feed-item-recommendation", alert.recommendation)
    );

    alertFeed.append(item);
  }
}

function renderRecommendation(nextState) {
  clearChildren(latestRecommendation);
  const entry = getLatestAssistantEntry(nextState);

  if (!entry) {
    latestRecommendation.append(
      createElement(
        "p",
        "empty-note",
        hasSiteData(nextState)
          ? "Run a scan in the console to generate the first recommendation."
          : "No reports are available until a real site or data source is configured."
      )
    );
    return;
  }

  latestRecommendation.append(
    createElement("strong", "recommendation-title", entry.title),
    createElement("p", "recommendation-summary", entry.summary)
  );

  for (const section of entry.sections.slice(0, 2)) {
    latestRecommendation.append(createSectionList(section));
  }
}

function renderDeviceSummary(nextState) {
  clearChildren(deviceSummary);

  if (!nextState.devices.length) {
    deviceSummary.append(createElement("p", "empty-note", "No devices are registered yet."));
    return;
  }

  for (const device of nextState.devices.slice(0, 6)) {
    const row = createElement("article", "compact-row");
    const copy = createElement("div", "compact-copy");
    copy.append(
      createElement("strong", null, device.name),
      createElement(
        "p",
        null,
        `${device.type} · ${formatTimestamp(device.lastSeenAt, { emptyLabel: "Awaiting first heartbeat" })}`
      )
    );
    row.append(copy, createStatusPill(device.status, device.status));
    deviceSummary.append(row);
  }
}

function renderPlaybooks(nextState) {
  clearChildren(playbookSummary);

  if (!nextState.playbooks.length) {
    playbookSummary.append(createElement("p", "empty-note", "No automation playbooks are configured yet."));
    return;
  }

  for (const playbook of nextState.playbooks) {
    const row = createElement("article", "compact-row");
    const copy = createElement("div", "compact-copy");
    copy.append(
      createElement("strong", null, playbook.name),
      createElement("p", null, `${playbook.trigger} · ${playbook.coverage}`)
    );
    row.append(copy, createStatusPill(playbook.state, playbook.state === "Active" ? "stable" : "inline"));
    playbookSummary.append(row);
  }
}

function renderMetrics(nextState) {
  const metrics = getDashboardMetrics(nextState);

  document.querySelector("#metric-alerts").textContent = String(metrics.activeAlerts);
  document.querySelector("#metric-rooms").textContent = String(metrics.attentionRooms);
  document.querySelector("#metric-devices").textContent = String(metrics.deviceIssues);
  document.querySelector("#metric-playbooks").textContent = String(metrics.activePlaybooks);

  document.querySelector("#hero-mode").textContent = nextState.profile.mode;
  document.querySelector("#hero-quiet-hours").textContent = nextState.profile.quietHours;
  document.querySelector("#hero-network").textContent = nextState.profile.networkName;
  document.querySelector("#hero-last-sweep").textContent = formatTimestamp(metrics.lastSweepAt);

  setHeaderPills(
    document.querySelector("#header-mode-pill"),
    document.querySelector("#header-risk-pill"),
    nextState.profile.mode,
    metrics.riskScore
  );
}

function render() {
  renderMetrics(state);
  renderHomePlan(state);
  renderAlerts(state);
  renderRecommendation(state);
  renderDeviceSummary(state);
  renderPlaybooks(state);
}

function handleCommand(command) {
  const result = runConsoleCommand(state, command);
  state = saveState(result.state);
  dashboardNote.textContent = `${result.response.title} updated at ${formatTimestamp(state.updatedAt)}.`;
  render();
}

for (const button of document.querySelectorAll("[data-command]")) {
  button.addEventListener("click", () => {
    handleCommand(button.dataset.command);
  });
}

render();
