import { clearChildren, createElement, createStatusPill } from "./ui.js";

const feedEl = document.querySelector("#radar-feed");
const filtersEl = document.querySelector("#radar-filters");
const noteEl = document.querySelector("#radar-note");
const statusEl = document.querySelector("#radar-status");

let allItems = [];
let activeSource = "all";
let activeSeverity = "all";

const SOURCES = ["all", "CISA", "NVD", "GitHub", "MSRC"];
const SEVERITIES = ["all", "critical", "high", "medium", "low"];

function renderFilters() {
  clearChildren(filtersEl);

  const sourceGroup = createElement("div", "radar-chip-group");
  for (const src of SOURCES) {
    const btn = createElement(
      "button",
      `radar-chip${activeSource === src ? " radar-chip-active" : ""}`,
      src === "all" ? "All Sources" : src
    );
    btn.type = "button";
    btn.addEventListener("click", () => {
      activeSource = src;
      renderFilters();
      renderFeed();
    });
    sourceGroup.append(btn);
  }

  const sevGroup = createElement("div", "radar-chip-group");
  for (const sev of SEVERITIES) {
    const label = sev === "all" ? "All Severity" : sev.charAt(0).toUpperCase() + sev.slice(1);
    const btn = createElement(
      "button",
      `radar-chip radar-chip-sev-${sev}${activeSeverity === sev ? " radar-chip-active" : ""}`,
      label
    );
    btn.type = "button";
    btn.addEventListener("click", () => {
      activeSeverity = sev;
      renderFilters();
      renderFeed();
    });
    sevGroup.append(btn);
  }

  filtersEl.append(sourceGroup, sevGroup);
}

function renderFeed() {
  clearChildren(feedEl);

  const filtered = allItems.filter((item) => {
    if (activeSource !== "all" && item.source !== activeSource) return false;
    if (activeSeverity !== "all" && item.severity !== activeSeverity) return false;
    return true;
  });

  if (filtered.length === 0) {
    feedEl.append(createElement("p", "radar-empty", "No advisories match the current filters."));
    return;
  }

  for (const item of filtered) {
    feedEl.append(createFeedItem(item));
  }
}

function createFeedItem(item) {
  const sev = item.severity || "unknown";
  const pillTone = sev === "critical" || sev === "high" ? "high" : sev === "medium" ? "watch" : "info";

  const article = createElement("article", `feed-item feed-item-${sev}`);

  const header = createElement("div", "feed-item-header");
  const titleBlock = createElement("div");
  const meta = [item.source, item.id, item.published, item.affected].filter(Boolean).join(" · ");
  titleBlock.append(
    createElement("strong", "feed-item-title", item.title),
    createElement("p", "feed-item-meta", meta)
  );
  header.append(titleBlock, createStatusPill(sev.charAt(0).toUpperCase() + sev.slice(1), pillTone));
  article.append(header);

  if (item.description) {
    article.append(createElement("p", "feed-item-copy", item.description));
  }

  if (item.action) {
    const rec = createElement("p", "feed-item-recommendation");
    const label = createElement("strong", "", "Action: ");
    rec.append(label, item.action);
    article.append(rec);
  }

  if (item.url) {
    const link = createElement("a", "feed-item-link", "View advisory →");
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    article.append(link);
  }

  return article;
}

async function load() {
  try {
    const res = await fetch("/api/intel/feeds");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    allItems = data.feeds || [];

    const fetchedAt = data.fetchedAt ? new Date(data.fetchedAt).toLocaleString() : "unknown";
    noteEl.textContent = `${allItems.length} advisories · Updated ${fetchedAt}`;

    clearChildren(statusEl);
    if (data.errors?.length) {
      statusEl.append(createStatusPill(`${data.errors.length} feed error(s)`, "watch"));
    } else {
      statusEl.append(createStatusPill("All feeds OK", "stable"));
    }

    renderFilters();
    renderFeed();
  } catch (err) {
    noteEl.textContent = `Failed to load feeds: ${err.message}`;
    clearChildren(statusEl);
    statusEl.append(createStatusPill("Feed error", "alert"));
  }
}

load();
