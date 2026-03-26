import { boosterFoods, goalPresets, mealLibrary, weeklyPlan } from "./dietPlannerData.js";
import {
  buildStaples,
  countProteins,
  createMealLookup,
  formatMetric,
  percentText,
  suggestBoosters,
  summarizeWeek
} from "./dietPlannerLogic.js";

const STORAGE_KEY = "aegean-week-planner:v1";
const mealLookup = createMealLookup(mealLibrary);
const app = document.querySelector("#app");

const defaultPreset = goalPresets[0];
const state = loadState();

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        selectedDayId: weeklyPlan[0].id,
        presetId: defaultPreset.id,
        goals: { potassium: defaultPreset.potassium, magnesium: defaultPreset.magnesium }
      };
    }

    const parsed = JSON.parse(raw);
    return {
      selectedDayId: weeklyPlan.some((day) => day.id === parsed.selectedDayId) ? parsed.selectedDayId : weeklyPlan[0].id,
      presetId: typeof parsed.presetId === "string" ? parsed.presetId : defaultPreset.id,
      goals: {
        potassium: clampGoal(parsed.goals?.potassium, defaultPreset.potassium),
        magnesium: clampGoal(parsed.goals?.magnesium, defaultPreset.magnesium)
      }
    };
  } catch {
    return {
      selectedDayId: weeklyPlan[0].id,
      presetId: defaultPreset.id,
      goals: { potassium: defaultPreset.potassium, magnesium: defaultPreset.magnesium }
    };
  }
}

function saveState() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clampGoal(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return fallback;
  }
  return Math.round(numeric);
}

function getActivePreset() {
  return goalPresets.find((preset) => preset.id === state.presetId) ?? {
    id: "custom",
    label: "Custom targets",
    note: "Manual values let you personalize the plan."
  };
}

function statusTone(ratio) {
  if (ratio >= 1) {
    return "hit";
  }
  if (ratio >= 0.9) {
    return "near";
  }
  return "low";
}

function render() {
  const week = summarizeWeek(weeklyPlan, mealLookup, state.goals);
  const selectedDay = week.days.find((day) => day.id === state.selectedDayId) ?? week.days[0];
  const boosters = suggestBoosters(selectedDay, boosterFoods);
  const staples = buildStaples(weeklyPlan, mealLookup);
  const proteins = countProteins(weeklyPlan, mealLookup);
  const activePreset = getActivePreset();

  document.title = `Aegean Week | ${selectedDay.name}`;
  app.innerHTML = `
    <div class="app-shell">
      <header class="masthead">
        <div class="masthead-copy">
          <p class="eyebrow">Weekly Mediterranean diet planner</p>
          <h1>Aegean Week</h1>
          <p class="lead">
            Fish, beef, and chicken arranged into a mineral-forward week with steady potassium and magnesium support.
          </p>
          <div class="chip-row" aria-label="Plan tags">
            <span class="chip">Mediterranean leaning</span>
            <span class="chip">Fish / chicken / beef</span>
            <span class="chip">Potassium + magnesium first</span>
          </div>
        </div>
        <div class="masthead-stats">
          ${renderHeadlineStat("Both goals hit", `${week.hits.both}/7`, "days this week")}
          ${renderHeadlineStat("Avg potassium", `${formatMetric(week.averages.potassium)} mg`, "per day")}
          ${renderHeadlineStat("Avg magnesium", `${formatMetric(week.averages.magnesium)} mg`, "per day")}
        </div>
      </header>

      <main class="workspace">
        <section class="planner-panel">
          <div class="section-heading">
            <div>
              <p class="label-line">Week view</p>
              <h2>Dial in each day</h2>
            </div>
            <p class="section-copy">
              The week stays Mediterranean at the base: legumes, greens, yogurt, fruit, whole grains, olive oil, and rotating animal proteins.
            </p>
          </div>

          <div class="day-strip" role="tablist" aria-label="Days of the week">
            ${week.days.map((day) => renderDayButton(day)).join("")}
          </div>

          <div class="day-focus">
            <div class="day-identity">
              <div>
                <p class="label-line">${selectedDay.label}</p>
                <h3>${selectedDay.name}</h3>
                <p class="day-note">${selectedDay.focus}</p>
              </div>
              <div class="prep-note">
                <span class="prep-label">Prep edge</span>
                <p>${selectedDay.prep}</p>
              </div>
            </div>

            <div class="meal-grid">
              ${selectedDay.slots.map((entry) => renderMeal(entry.meal)).join("")}
            </div>
          </div>
        </section>

        <aside class="inspector">
          <section class="inspector-panel goal-panel">
            <div class="section-heading compact">
              <div>
                <p class="label-line">Targets</p>
                <h2>Goal preset</h2>
              </div>
            </div>
            <label class="field">
              <span>Reference</span>
              <select name="presetId">
                ${renderPresetOptions()}
              </select>
            </label>
            <div class="goal-grid">
              <label class="field">
                <span>Potassium goal (mg)</span>
                <input type="number" min="1" step="50" name="potassium" value="${state.goals.potassium}" />
              </label>
              <label class="field">
                <span>Magnesium goal (mg)</span>
                <input type="number" min="1" step="10" name="magnesium" value="${state.goals.magnesium}" />
              </label>
            </div>
            <p class="field-note">${activePreset.note}</p>
          </section>

          <section class="inspector-panel metrics-panel">
            <div class="section-heading compact">
              <div>
                <p class="label-line">Today</p>
                <h2>${selectedDay.name}</h2>
              </div>
            </div>
            <div class="meter-grid">
              ${renderMeter("Potassium", selectedDay.totals.potassium, state.goals.potassium, "sea")}
              ${renderMeter("Magnesium", selectedDay.totals.magnesium, state.goals.magnesium, "copper")}
            </div>
            <div class="macro-strip">
              ${renderMicroStat("Protein", `${formatMetric(selectedDay.totals.protein)} g`)}
              ${renderMicroStat("Fiber", `${formatMetric(selectedDay.totals.fiber)} g`)}
              ${renderMicroStat("Energy", `${formatMetric(selectedDay.totals.calories)} kcal`)}
            </div>
          </section>

          <section class="inspector-panel booster-panel">
            <div class="section-heading compact">
              <div>
                <p class="label-line">Catch-up options</p>
                <h2>Smart boosters</h2>
              </div>
            </div>
            <div class="booster-list">
              ${boosters.map((booster) => renderBooster(booster)).join("")}
            </div>
          </section>

          <section class="inspector-panel staples-panel">
            <div class="section-heading compact">
              <div>
                <p class="label-line">Shopping rhythm</p>
                <h2>Weekly staples</h2>
              </div>
            </div>
            <div class="staples-list">
              ${staples.map((item) => renderStaple(item)).join("")}
            </div>
          </section>

          <section class="inspector-panel source-panel">
            <div class="section-heading compact">
              <div>
                <p class="label-line">Pattern</p>
                <h2>Protein rotation</h2>
              </div>
            </div>
            <div class="protein-grid">
              ${renderMicroStat("Fish meals", String(proteins.Fish))}
              ${renderMicroStat("Chicken meals", String(proteins.Chicken))}
              ${renderMicroStat("Beef meals", String(proteins.Beef))}
            </div>
            <p class="source-note">
              Meal values are directional estimates for planning. If you have kidney disease, blood pressure treatment, or supplement concerns, personalize targets with a clinician.
            </p>
          </section>
        </aside>
      </main>
    </div>
  `;
}

function renderHeadlineStat(label, value, note) {
  return `
    <div class="headline-stat">
      <span class="headline-label">${label}</span>
      <strong>${value}</strong>
      <span class="headline-note">${note}</span>
    </div>
  `;
}

function renderDayButton(day) {
  const potassiumTone = statusTone(day.coverage.potassium);
  const magnesiumTone = statusTone(day.coverage.magnesium);
  return `
    <button
      class="day-button ${day.id === state.selectedDayId ? "is-active" : ""}"
      type="button"
      data-day="${day.id}"
      role="tab"
      aria-selected="${day.id === state.selectedDayId}"
    >
      <span class="day-topline">
        <span>${day.label}</span>
        <span>${formatMetric(day.totals.calories)} kcal</span>
      </span>
      <strong>${day.name}</strong>
      <span class="meter-track mini ${potassiumTone}">
        <span class="meter-fill sea" style="width:${Math.min(day.coverage.potassium * 100, 100)}%"></span>
      </span>
      <span class="meter-track mini ${magnesiumTone}">
        <span class="meter-fill copper" style="width:${Math.min(day.coverage.magnesium * 100, 100)}%"></span>
      </span>
      <span class="day-bottomline">
        <span>K ${percentText(day.coverage.potassium)}</span>
        <span>Mg ${percentText(day.coverage.magnesium)}</span>
      </span>
    </button>
  `;
}

function renderMeal(meal) {
  return `
    <article class="meal-card">
      <div class="meal-heading">
        <div>
          <p class="meal-slot">${meal.slot}</p>
          <h4>${meal.title}</h4>
        </div>
        <span class="protein-pill">${meal.protein}</span>
      </div>
      <p class="meal-copy">${meal.subtitle}</p>
      <div class="nutrient-tags">
        <span>${formatMetric(meal.nutrients.potassium)} mg K</span>
        <span>${formatMetric(meal.nutrients.magnesium)} mg Mg</span>
        <span>${formatMetric(meal.nutrients.protein)} g protein</span>
        <span>${formatMetric(meal.nutrients.fiber)} g fiber</span>
      </div>
      <div class="ingredient-row">
        ${meal.ingredients.map((ingredient) => `<span>${ingredient.name}</span>`).join("")}
      </div>
    </article>
  `;
}

function renderPresetOptions() {
  const options = goalPresets.map(
    (preset) =>
      `<option value="${preset.id}" ${preset.id === state.presetId ? "selected" : ""}>${preset.label}</option>`
  );

  if (!goalPresets.some((preset) => preset.id === state.presetId)) {
    options.push('<option value="custom" selected>Custom targets</option>');
  } else {
    options.push('<option value="custom">Custom targets</option>');
  }

  return options.join("");
}

function renderMeter(label, value, goal, tone) {
  const ratio = value / goal;
  return `
    <article class="meter-card ${statusTone(ratio)}">
      <div class="meter-ring ${tone}" style="--progress:${Math.min(ratio * 100, 100)}">
        <span>${percentText(ratio)}</span>
      </div>
      <div class="meter-copy">
        <strong>${label}</strong>
        <span>${formatMetric(value)} / ${formatMetric(goal)} mg</span>
        <span class="meter-state">${ratio >= 1 ? "Goal covered" : `${formatMetric(goal - value)} mg still open`}</span>
      </div>
    </article>
  `;
}

function renderMicroStat(label, value) {
  return `
    <div class="micro-stat">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function renderBooster(booster) {
  return `
    <article class="booster-card">
      <div class="booster-head">
        <strong>${booster.name}</strong>
        <span>${booster.portion}</span>
      </div>
      <p>${booster.reason}</p>
      <div class="nutrient-tags compact">
        <span>${formatMetric(booster.nutrients.potassium)} mg K</span>
        <span>${formatMetric(booster.nutrients.magnesium)} mg Mg</span>
        <span>${formatMetric(booster.nutrients.calories)} kcal</span>
      </div>
      <small>${booster.note}</small>
    </article>
  `;
}

function renderStaple(item) {
  return `
    <article class="staple-item">
      <div>
        <strong>${item.name}</strong>
        <span>${item.group}</span>
      </div>
      <span class="staple-count">${item.count} meals</span>
    </article>
  `;
}

app.addEventListener("click", (event) => {
  const button = event.target instanceof Element ? event.target.closest("[data-day]") : null;
  if (!button) {
    return;
  }

  state.selectedDayId = button.dataset.day;
  saveState();
  render();
});

app.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
    return;
  }

  if (target.name === "presetId") {
    if (target.value === "custom") {
      state.presetId = "custom";
      saveState();
      render();
      return;
    }

    const preset = goalPresets.find((entry) => entry.id === target.value);
    if (!preset) {
      return;
    }

    state.presetId = preset.id;
    state.goals = { potassium: preset.potassium, magnesium: preset.magnesium };
    saveState();
    render();
    return;
  }

  if (target.name === "potassium" || target.name === "magnesium") {
    state.presetId = "custom";
    state.goals[target.name] = clampGoal(target.value, state.goals[target.name]);
    saveState();
    render();
  }
});

render();
