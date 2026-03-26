export function createElement(tagName, className, textContent) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (textContent !== undefined) {
    element.textContent = textContent;
  }

  return element;
}

export function clearChildren(element) {
  element.replaceChildren();
}

export function formatTimestamp(timestamp, options = {}) {
  if (!timestamp) {
    return options.emptyLabel ?? "Awaiting scan";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

export function createStatusPill(label, tone = "stable") {
  const pill = createElement("span", `status-pill status-pill-${tone}`);
  pill.textContent = label;
  return pill;
}

export function createSectionList(section) {
  const wrapper = createElement("section", "report-section");
  const title = createElement("p", "report-section-title", section.label);
  const list = createElement("ul", "report-list");

  for (const item of section.items) {
    const listItem = createElement("li");
    listItem.textContent = item;
    list.append(listItem);
  }

  wrapper.append(title, list);
  return wrapper;
}

export function setHeaderPills(modeElement, riskElement, mode, riskScore) {
  if (modeElement) {
    modeElement.textContent = `Mode: ${mode}`;
  }

  if (riskElement) {
    riskElement.textContent = `Risk: ${riskScore}`;
  }
}
