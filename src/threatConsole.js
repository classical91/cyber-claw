import {
  COMMAND_SUGGESTIONS,
  getDashboardMetrics,
  runConsoleCommand
} from "./securityModel.js";
import { loadState, saveState } from "./storage.js";
import {
  clearChildren,
  createElement,
  createSectionList,
  createStatusPill,
  formatTimestamp,
  setHeaderPills
} from "./ui.js";

const consoleLog = document.querySelector("#console-log");
const commandForm = document.querySelector("#command-form");
const commandInput = document.querySelector("#command-input");
const quickRow = document.querySelector("#console-quick-row");
const suggestedCommands = document.querySelector("#suggested-commands");
const consoleSummary = document.querySelector("#console-summary");
const consoleAlerts = document.querySelector("#console-alerts");

let state = loadState();

function createConsoleUserEntry(entry) {
  const article = createElement("article", "console-entry console-entry-user");
  const bubble = createElement("div", "console-bubble");
  bubble.append(
    createElement("p", "console-command", entry.text),
    createElement("span", "console-time", formatTimestamp(entry.timestamp))
  );
  article.append(bubble);
  return article;
}

function createConsoleAssistantEntry(entry) {
  const article = createElement("article", "console-entry console-entry-assistant");
  const report = createElement("div", `console-report console-report-${entry.severity}`);
  const header = createElement("div", "console-report-header");
  const titleBlock = createElement("div");
  titleBlock.append(
    createElement("strong", "console-report-title", entry.title),
    createElement("p", "console-report-summary", entry.summary)
  );
  header.append(titleBlock, createStatusPill(entry.severity, entry.severity));

  report.append(header);

  for (const section of entry.sections) {
    report.append(createSectionList(section));
  }

  report.append(createElement("span", "console-time", formatTimestamp(entry.timestamp)));
  article.append(report);
  return article;
}

function renderConsoleLog(nextState) {
  clearChildren(consoleLog);

  if (!nextState.commandLog.length) {
    consoleLog.append(
      createElement(
        "p",
        "empty-note",
        "No command history is available yet. With demo data removed, this console stays empty until you connect real site data."
      )
    );
    return;
  }

  for (const entry of nextState.commandLog) {
    consoleLog.append(
      entry.role === "user" ? createConsoleUserEntry(entry) : createConsoleAssistantEntry(entry)
    );
  }

  consoleLog.scrollTop = consoleLog.scrollHeight;
}

function renderQuickButtons() {
  clearChildren(quickRow);
  clearChildren(suggestedCommands);

  for (const command of COMMAND_SUGGESTIONS.slice(0, 4)) {
    const button = createElement("button", "quick-command", command);
    button.type = "button";
    button.addEventListener("click", () => submitCommand(command));
    quickRow.append(button);
  }

  for (const command of COMMAND_SUGGESTIONS) {
    const button = createElement("button", "button button-secondary");
    button.type = "button";
    button.textContent = command;
    button.addEventListener("click", () => submitCommand(command));
    suggestedCommands.append(button);
  }
}

function renderSidebar(nextState) {
  const metrics = getDashboardMetrics(nextState);
  clearChildren(consoleSummary);

  const summaryItems = [
    ["Mode", nextState.profile.mode],
    ["Risk score", String(metrics.riskScore)],
    ["Open alerts", String(metrics.activeAlerts)],
    ["Device issues", String(metrics.deviceIssues)],
    ["Protected rooms", String(metrics.roomsCovered)],
    ["Last sweep", formatTimestamp(metrics.lastSweepAt)]
  ];

  for (const [label, value] of summaryItems) {
    const card = createElement("article", "summary-card");
    card.append(createElement("p", "summary-label", label), createElement("strong", null, value));
    consoleSummary.append(card);
  }

  clearChildren(consoleAlerts);
  const alerts = nextState.alerts.filter((alert) => !alert.resolved);

  if (!alerts.length) {
    consoleAlerts.append(createElement("p", "empty-note", "No open alerts are recorded."));
  } else {
    for (const alert of alerts) {
      const row = createElement("article", "compact-row");
      const copy = createElement("div", "compact-copy");
      copy.append(
        createElement("strong", null, alert.title),
        createElement("p", null, alert.recommendation)
      );
      row.append(copy, createStatusPill(alert.severity, alert.severity));
      consoleAlerts.append(row);
    }
  }

  document.querySelector("#console-site").textContent = nextState.profile.siteName;
  document.querySelector("#console-mesh").textContent = nextState.profile.networkName;
  document.querySelector("#console-updated").textContent = formatTimestamp(nextState.updatedAt);
  setHeaderPills(
    document.querySelector("#console-mode-pill"),
    document.querySelector("#console-risk-pill"),
    nextState.profile.mode,
    metrics.riskScore
  );
}

function render() {
  renderConsoleLog(state);
  renderQuickButtons();
  renderSidebar(state);
}

function submitCommand(command) {
  const result = runConsoleCommand(state, command);
  state = saveState(result.state);
  render();
  commandInput.value = "";
  commandInput.focus();
}

commandForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitCommand(commandInput.value);
});

render();
