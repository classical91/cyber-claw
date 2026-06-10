import checklistData from "./checklist-data.js";

const STORAGE_KEY = "seccheck-v1";

function loadChecked() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}

function saveChecked(checked) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
}

function countItems(cat) {
  return Object.values(cat.subs).reduce((n, sub) => n + sub.items.length, 0);
}

function countChecked(cat, checked) {
  return Object.values(cat.subs).reduce(
    (n, sub) => n + sub.items.filter((item) => checked[item.id]).length,
    0
  );
}

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderApp() {
  const checked = loadChecked();
  const root = document.getElementById("root");
  if (!root) return;

  const totalItems = Object.values(checklistData).reduce((n, cat) => n + countItems(cat), 0);
  const totalChecked = Object.values(checklistData).reduce((n, cat) => n + countChecked(cat, checked), 0);
  const pct = totalItems ? Math.round((totalChecked / totalItems) * 100) : 0;

  root.innerHTML = `
    <div class="sc-shell">
      <header class="sc-header">
        <div class="sc-brand">
          <strong>SecCheck</strong>
          <span class="sc-tagline">Security checklist · No tracking · No accounts</span>
        </div>
        <div class="sc-progress-wrap">
          <div class="sc-progress-bar">
            <div class="sc-progress-fill" style="width:${pct}%"></div>
          </div>
          <span class="sc-progress-label">${totalChecked} / ${totalItems} (${pct}%)</span>
        </div>
      </header>

      <nav class="sc-nav" id="sc-nav">
        ${Object.entries(checklistData).map(([key, cat]) => {
          const done = countChecked(cat, checked);
          const total = countItems(cat);
          const complete = done === total && total > 0;
          return `<a class="sc-nav-item${complete ? " sc-nav-complete" : ""}" href="#cat-${esc(key)}"
            title="${esc(cat.label)} — ${done}/${total}">
            ${cat.icon ?? ""}
            <span>${esc(cat.label)}</span>
          </a>`;
        }).join("")}
      </nav>

      <main class="sc-main">
        ${Object.entries(checklistData).map(([key, cat]) => {
          const done = countChecked(cat, checked);
          const total = countItems(cat);
          return `
          <section class="sc-category" id="cat-${esc(key)}">
            <div class="sc-cat-header">
              <span class="sc-cat-icon">${cat.icon ?? ""}</span>
              <h2 class="sc-cat-title" style="color:${esc(cat.color)}">${esc(cat.label)}</h2>
              <span class="sc-cat-count">${done}/${total}</span>
            </div>
            ${Object.entries(cat.subs).map(([subKey, sub]) => `
              <div class="sc-sub" id="sub-${esc(subKey)}">
                <h3 class="sc-sub-title">${esc(sub.label)}</h3>
                <ul class="sc-items">
                  ${sub.items.map((item) => `
                    <li class="sc-item${checked[item.id] ? " sc-item-done" : ""}">
                      <label class="sc-label">
                        <input type="checkbox" class="sc-check" data-id="${esc(item.id)}"
                          ${checked[item.id] ? "checked" : ""}>
                        <span class="sc-text">${esc(item.text)}</span>
                      </label>
                      ${item.path ? `<span class="sc-path">${esc(item.path)}</span>` : ""}
                    </li>
                  `).join("")}
                </ul>
              </div>
            `).join("")}
          </section>`;
        }).join("")}
      </main>

      <footer class="sc-footer">
        SecCheck · Open source security checklist · No tracking · No accounts
        <button class="sc-reset" id="sc-reset" type="button">Reset all</button>
      </footer>
    </div>
  `;

  document.getElementById("sc-reset")?.addEventListener("click", () => {
    if (confirm("Reset all checkboxes?")) {
      saveChecked({});
      renderApp();
    }
  });

  document.querySelectorAll(".sc-check").forEach((cb) => {
    cb.addEventListener("change", () => {
      const updated = loadChecked();
      if (cb.checked) updated[cb.dataset.id] = true;
      else delete updated[cb.dataset.id];
      saveChecked(updated);
      cb.closest(".sc-item")?.classList.toggle("sc-item-done", cb.checked);
      updateProgress();
    });
  });
}

function updateProgress() {
  const checked = loadChecked();
  const totalItems = Object.values(checklistData).reduce((n, cat) => n + countItems(cat), 0);
  const totalChecked = Object.values(checklistData).reduce((n, cat) => n + countChecked(cat, checked), 0);
  const pct = totalItems ? Math.round((totalChecked / totalItems) * 100) : 0;
  const fill = document.querySelector(".sc-progress-fill");
  const label = document.querySelector(".sc-progress-label");
  if (fill) fill.style.width = `${pct}%`;
  if (label) label.textContent = `${totalChecked} / ${totalItems} (${pct}%)`;
}

renderApp();
