import {
  ROOM_PROFILE_OPTIONS,
  getDashboardMetrics,
  resolveAlert,
  setRoomProfile
} from "../../../src/securityModel.js";
import { loadState, saveState } from "../../../src/storage.js";
import {
  clearChildren,
  createElement,
  createStatusPill,
  formatTimestamp,
  setHeaderPills
} from "../../../src/ui.js";

const roomGrid = document.querySelector("#room-grid");
const gridAlerts = document.querySelector("#grid-alerts");
const deviceInventory = document.querySelector("#device-inventory");
const playbookList = document.querySelector("#playbook-list");
const gridNote = document.querySelector("#grid-note");

let state = loadState();

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
    const item = createElement("article", "feed-item");
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

  document.querySelector("#grid-site").textContent = nextState.profile.siteName;
  document.querySelector("#grid-mode").textContent = nextState.profile.mode;
  document.querySelector("#grid-risk").textContent = String(metrics.riskScore);
  document.querySelector("#grid-updated").textContent = formatTimestamp(nextState.updatedAt);

  setHeaderPills(
    document.querySelector("#grid-mode-pill"),
    document.querySelector("#grid-risk-pill"),
    nextState.profile.mode,
    metrics.riskScore
  );
}

function render() {
  renderSummary(state);
  renderRooms(state);
  renderAlerts(state);
  renderDevices(state);
  renderPlaybooks(state);
}

render();
