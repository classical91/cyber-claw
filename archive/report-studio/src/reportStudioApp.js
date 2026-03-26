import {
  EXAMPLE_MARKETS,
  MARKET_PLATFORM_GROUPS,
  MARKET_SIGNAL_ITEMS,
  STORAGE_KEY,
  WORKFLOW_STEPS,
  buildExecutiveBrief,
  buildLaunchPlan,
  buildLaunchSprint,
  buildMarkdownBrief,
  buildOfferLadder,
  buildRiskRegister,
  countSelectedPlatforms,
  countSelectedTopicSignals,
  createChannel,
  createInitialState,
  createModule,
  createSampleState,
  ensureStateShape,
  getStudioHealth,
  getWorkflowProgress,
  rankChannels
} from "./reportEngine.js";

const app = document.querySelector("#app");

const scoreLabels = {
  demandProof: ["Thin", "Early", "Visible", "Proven", "Hot"],
  specificity: ["Broad", "Loose", "Usable", "Tight", "Laser"],
  sourceDepth: ["Shallow", "Light", "Decent", "Robust", "Deep"],
  backendPotential: ["Low", "Limited", "Good", "Strong", "Layered"],
  confidence: ["Low", "Shaky", "Decent", "High", "Very high"],
  effort: ["Light", "Moderate", "Stretching", "Heavy", "Intense"],
  urgency: ["Later", "Soon", "Near-term", "This week", "Immediate"],
  depth: ["Note", "Cheat sheet", "Guide section", "Deep section", "Flagship"]
};

const formatOptions = [
  "Fast-read guide",
  "Cheat sheet + appendix",
  "Guide + prompt pack",
  "Mini report series"
];
const researchWindowOptions = ["Same day", "This week", "Two-week sprint", "Monthly build"];
const launchWindowOptions = ["Today", "This week", "This month", "This quarter"];

let state = loadState();
let refs = {};
let listenersBound = false;

renderShell();

function loadState() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return createInitialState();
    }

    return ensureStateShape(JSON.parse(saved));
  } catch {
    return createInitialState();
  }
}

function persistState() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function renderShell() {
  const health = getStudioHealth(state);
  const progress = getWorkflowProgress(state);
  const completedSteps = progress.filter((step) => step.completion >= 80).length;

  app.innerHTML = `
    <main class="app-shell">
      <section class="hero-panel">
        <div class="hero-grid">
          <div class="hero-copy">
            <p class="eyebrow">Transcript-Inspired Product Studio</p>
            <h1>Turn a researched knowledge niche into a sellable fast-read report.</h1>
            <p>
              This workspace turns the transcript into a practical operating model: map the market,
              package the guide, add a backend offer, and plan the first promotion loop without
              losing sight of fact-checking and source rights.
            </p>
          </div>
          <div class="hero-actions">
            <div class="button-row">
              <button class="button" type="button" data-action="load-sample">Load Transcript Example</button>
              <button class="button secondary" type="button" data-action="reset-app">Reset Workspace</button>
            </div>
            <div class="button-row">
              <button class="button ghost" type="button" data-action="copy-brief">Copy Launch Brief</button>
            </div>
            <div class="hero-stats">
              <div class="stat-chip">
                <span>Opportunity score</span>
                <strong id="hero-score">${health.overall}</strong>
              </div>
              <div class="stat-chip">
                <span>Steps ready</span>
                <strong id="hero-progress">${completedSteps}/${WORKFLOW_STEPS.length}</strong>
              </div>
              <div class="stat-chip">
                <span>Lead channel</span>
                <strong id="hero-channel">${escapeHtml(health.leadChannel)}</strong>
              </div>
              <div class="stat-chip">
                <span>Launch window</span>
                <strong id="hero-window">${escapeHtml(state.signals.decisionWindow)}</strong>
              </div>
            </div>
            <p class="status-note" id="app-status">
              Changes save locally in this browser. Use the sample to see the transcript translated into a full plan.
            </p>
          </div>
        </div>
      </section>

      <section class="workspace-grid">
        <nav class="step-rail" aria-label="Workflow steps">
          <h2>Workflow</h2>
          <p class="panel-intro">Move step by step from demand proof to launch plan.</p>
          <div class="step-list" id="step-rail"></div>
        </nav>

        <section class="workflow-stack" id="workflow-panels" aria-label="Profit extraction workflow"></section>

        <aside class="summary-panel">
          <h2>Launch Pulse</h2>
          <p class="panel-intro">A live read on demand proof, offer quality, launch speed, and risk.</p>
          <div class="summary-stack" id="summary-panel"></div>
        </aside>
      </section>
    </main>
  `;

  refs = {
    status: document.querySelector("#app-status"),
    rail: document.querySelector("#step-rail"),
    panels: document.querySelector("#workflow-panels"),
    summary: document.querySelector("#summary-panel")
  };

  if (!listenersBound) {
    app.addEventListener("input", handleFieldInput);
    app.addEventListener("change", handleFieldChange);
    app.addEventListener("click", handleClick);
    listenersBound = true;
  }

  renderPanels();
  renderStepRail();
  renderSummary();
}

function setStatus(message) {
  if (refs.status) {
    refs.status.textContent = message;
  }
}

function refreshHeroStats() {
  const health = getStudioHealth(state);
  const progress = getWorkflowProgress(state);
  const completedSteps = progress.filter((step) => step.completion >= 80).length;

  const scoreRef = document.querySelector("#hero-score");
  const progressRef = document.querySelector("#hero-progress");
  const channelRef = document.querySelector("#hero-channel");
  const windowRef = document.querySelector("#hero-window");

  if (scoreRef) {
    scoreRef.textContent = String(health.overall);
  }
  if (progressRef) {
    progressRef.textContent = `${completedSteps}/${WORKFLOW_STEPS.length}`;
  }
  if (channelRef) {
    channelRef.textContent = health.leadChannel;
  }
  if (windowRef) {
    windowRef.textContent = state.signals.decisionWindow;
  }
}

function saveAndRefresh({ fullRender = false, statusMessage } = {}) {
  persistState();
  if (fullRender) {
    renderPanels();
  }
  renderStepRail();
  renderSummary();
  refreshHeroStats();
  if (statusMessage) {
    setStatus(statusMessage);
  }
}

function renderStepRail() {
  const progress = getWorkflowProgress(state);

  refs.rail.innerHTML = progress
    .map((step, index) => {
      const isActive = state.activeStep === step.id;
      const metadata = WORKFLOW_STEPS.find((entry) => entry.id === step.id);

      return `
        <button
          class="step-button${isActive ? " is-active" : ""}"
          type="button"
          data-action="jump-step"
          data-step-id="${step.id}"
        >
          <span class="step-number">${index + 1}</span>
          <strong>${escapeHtml(step.title)}</strong>
          <span>${escapeHtml(metadata?.description || "")}</span>
          <div class="step-meta">
            <small>${step.completion}% complete</small>
            <small>${step.completion >= 80 ? "Ready" : "In progress"}</small>
          </div>
          <div class="progress-bar" aria-hidden="true">
            <div class="progress-fill" style="width: ${step.completion}%"></div>
          </div>
        </button>
      `;
    })
    .join("");
}

function renderPanels() {
  const progressById = Object.fromEntries(
    getWorkflowProgress(state).map((step) => [step.id, step.completion])
  );
  const selectedPlatforms = countSelectedPlatforms(state.project.platformCoverage);
  const selectedTopicSignals = countSelectedTopicSignals(state.project.topicSignals);
  const totalPlatforms = MARKET_PLATFORM_GROUPS.flatMap((group) => group.items).length;
  const totalTopicSignals = MARKET_SIGNAL_ITEMS.length;

  refs.panels.innerHTML = `
    <section class="workflow-section" id="step-market-map" data-step-id="market-map">
      <div class="section-header">
        <div>
          <p class="eyebrow">Step 1</p>
          <h2>Market Map</h2>
          <p>Start where people already pay to learn. This is the proof layer before you package anything.</p>
        </div>
        <span class="section-badge">${progressById["market-map"]}% complete</span>
      </div>
      <div class="field-grid two">
        ${renderTextField("Studio name", "project", "brandName", state.project.brandName, "Profit Extraction Studio")}
        ${renderTextField("Knowledge niche", "project", "niche", state.project.niche, "AI prompting for freelancers")}
        ${renderTextField("Buyer", "project", "buyer", state.project.buyer, "Freelancers and small agencies")}
        ${renderSelectField("Format", "project", "format", state.project.format, formatOptions)}
        ${renderTextField("Source mix", "project", "sourceMix", state.project.sourceMix, "Courses, books, videos, forums")}
        ${renderSelectField(
          "Launch window",
          "signals",
          "decisionWindow",
          state.signals.decisionWindow,
          launchWindowOptions
        )}
      </div>
      <div class="platform-board" style="margin-top: 18px;">
        <div class="platform-board-header">
          <div>
            <p class="eyebrow">Transcript Source List</p>
            <h3>Where to look for big knowledge markets</h3>
            <p class="panel-intro">Check off the platforms you have actually scanned so the market score reflects real coverage.</p>
          </div>
          <span class="section-badge">${selectedPlatforms}/${totalPlatforms} platforms checked</span>
        </div>
        <div class="platform-board-grid">
          ${MARKET_PLATFORM_GROUPS.map(renderPlatformGroup).join("")}
        </div>
      </div>
      <div class="platform-board" style="margin-top: 18px;">
        <div class="platform-board-header">
          <div>
            <p class="eyebrow">What You're Looking For</p>
            <h3>Opportunity signals to confirm</h3>
            <p class="panel-intro">Use these checks before trusting a niche. The transcript keeps coming back to demand, questions, and a clear transformation.</p>
          </div>
          <span class="section-badge">${selectedTopicSignals}/${totalTopicSignals} signals confirmed</span>
        </div>
        <div class="chip-stack">
          ${MARKET_SIGNAL_ITEMS.map(renderTopicSignalChip).join("")}
        </div>
        <div class="example-market-block">
          <div class="platform-group-head">
            <strong>Example markets from the transcript</strong>
            <p>Tap one to drop it into the niche field, then narrow it into a sharper sub-topic.</p>
          </div>
          <div class="chip-stack">
            ${EXAMPLE_MARKETS.map(renderExampleMarketChip).join("")}
          </div>
        </div>
      </div>
      <div style="margin-top: 14px;">
        ${renderTextAreaField(
          "Demand notes",
          "project",
          "evidenceNotes",
          state.project.evidenceNotes,
          "What proof tells you buyers already pay for this?"
        )}
      </div>
      <div class="card-grid two" style="margin-top: 14px;">
        ${renderRangeCard(
          "Demand proof",
          "How visible is the evidence that people already spend in this niche?",
          "signals",
          "demandProof",
          state.signals.demandProof,
          "demandProof"
        )}
        ${renderRangeCard(
          "Specificity",
          "Does the niche solve a narrow, concrete transformation?",
          "signals",
          "specificity",
          state.signals.specificity,
          "specificity"
        )}
        ${renderRangeCard(
          "Source depth",
          "How much research material do you already have to synthesize?",
          "signals",
          "sourceDepth",
          state.signals.sourceDepth,
          "sourceDepth"
        )}
        ${renderRangeCard(
          "Backend potential",
          "How likely is this niche to support upsells, services, or software referrals?",
          "signals",
          "backendPotential",
          state.signals.backendPotential,
          "backendPotential"
        )}
      </div>
    </section>

    <section class="workflow-section" id="step-research-angle" data-step-id="research-angle">
      <div class="section-header">
        <div>
          <p class="eyebrow">Step 2</p>
          <h2>Research Angle</h2>
          <p>Translate the research into a sharp idea, a promised outcome, and the exact beginner questions the report will answer.</p>
        </div>
        <span class="section-badge">${progressById["research-angle"]}% complete</span>
      </div>
      <div class="field-grid two">
        ${renderTextAreaField(
          "Transformation",
          "project",
          "transformation",
          state.project.transformation,
          "What changes for the buyer after reading?"
        )}
        ${renderTextAreaField(
          "Angle",
          "project",
          "angle",
          state.project.angle,
          "What contrarian or memorable framing makes this report different?"
        )}
      </div>
      <div class="field-grid two" style="margin-top: 14px;">
        ${renderTextAreaField(
          "Promise",
          "project",
          "promise",
          state.project.promise,
          "Describe the result in simple language."
        )}
        ${renderSelectField(
          "Research pace",
          "project",
          "researchWindow",
          state.project.researchWindow,
          researchWindowOptions
        )}
      </div>
      <div class="field-grid two" style="margin-top: 14px;">
        ${renderTextAreaField(
          "Repeated expert pattern",
          "project",
          "expertPattern",
          state.project.expertPattern,
          "What do the best sources keep repeating?"
        )}
        ${renderTextAreaField(
          "Question cluster",
          "project",
          "faqCluster",
          state.project.faqCluster,
          "Which beginner questions or objections keep appearing?"
        )}
      </div>
    </section>

    <section class="workflow-section" id="step-report-stack" data-step-id="report-stack">
      <div class="section-header">
        <div>
          <p class="eyebrow">Step 3</p>
          <h2>Report Stack</h2>
          <p>Build the paid product, the bonus layers around it, and the path to a higher-value backend offer.</p>
        </div>
        <span class="section-badge">${progressById["report-stack"]}% complete</span>
      </div>
      <div class="field-grid two">
        ${renderTextField("Paid report name", "offer", "reportName", state.offer.reportName, "The AI Output Extraction System")}
        ${renderTextField("Entry price", "offer", "entryPrice", state.offer.entryPrice, "$17")}
        ${renderTextField("Lead magnet", "offer", "leadMagnet", state.offer.leadMagnet, "10 beginner mistakes cheat sheet")}
        ${renderTextField("Premium upsell", "offer", "premiumUpsell", state.offer.premiumUpsell, "200-prompt pack")}
        ${renderTextField("Backend offer", "offer", "backendOffer", state.offer.backendOffer, "Audit, setup, or consulting")}
        ${renderTextField("Delivery model", "offer", "deliveryModel", state.offer.deliveryModel, "Simple checkout + follow-up email")}
      </div>
      <div class="field-grid two" style="margin-top: 14px;">
        ${renderTextAreaField(
          "Primary CTA",
          "offer",
          "callToAction",
          state.offer.callToAction,
          "What should the buyer do after seeing your content?"
        )}
        ${renderTextAreaField(
          "Affiliate or tool plan",
          "offer",
          "affiliatePlan",
          state.offer.affiliatePlan,
          "Optional tools, referrals, or resource links connected to the report."
        )}
      </div>
      <div class="card-grid" style="margin-top: 18px;">${state.modules.map(renderModuleCard).join("")}</div>
      <div class="section-actions">
        <button class="button secondary" type="button" data-action="add-module">Add Module</button>
      </div>
    </section>

    <section class="workflow-section" id="step-promotion" data-step-id="promotion">
      <div class="section-header">
        <div>
          <p class="eyebrow">Step 4</p>
          <h2>Promotion</h2>
          <p>Pick the fastest channels, craft the first hooks, and make the CTA specific enough to act on immediately.</p>
        </div>
        <span class="section-badge">${progressById.promotion}% complete</span>
      </div>
      <div class="card-grid">${state.channels.map(renderChannelCard).join("")}</div>
      <div class="section-actions">
        <button class="button secondary" type="button" data-action="add-channel">Add Channel</button>
      </div>
    </section>

    <section class="workflow-section" id="step-guardrails" data-step-id="guardrails">
      <div class="section-header">
        <div>
          <p class="eyebrow">Step 5</p>
          <h2>Guardrails</h2>
          <p>Keep the synthesis original, factual, and away from risky or regulated claims.</p>
        </div>
        <span class="section-badge">${progressById.guardrails}% complete</span>
      </div>
      <div class="field-grid two">
        ${renderTextAreaField(
          "Fact-check plan",
          "guardrails",
          "factCheckPlan",
          state.guardrails.factCheckPlan,
          "How will you validate claims, examples, and prompts before selling?"
        )}
        ${renderTextAreaField(
          "Rights and source plan",
          "guardrails",
          "rightsPlan",
          state.guardrails.rightsPlan,
          "How will you summarize ideas without copying protected material?"
        )}
      </div>
      <div class="field-grid two" style="margin-top: 14px;">
        ${renderTextAreaField(
          "Disclosure plan",
          "guardrails",
          "disclosurePlan",
          state.guardrails.disclosurePlan,
          "How will you disclose affiliate links, earnings limits, or sponsorships?"
        )}
        ${renderTextAreaField(
          "Excluded topics",
          "guardrails",
          "exclusions",
          state.guardrails.exclusions,
          "Which categories are off-limits because they are too risky or regulated?"
        )}
      </div>
      <div style="margin-top: 14px;">
        ${renderTextAreaField(
          "Boundary note",
          "guardrails",
          "boundaryNote",
          state.guardrails.boundaryNote,
          "What reminder keeps the report educational rather than over-claiming or impersonating expertise?"
        )}
      </div>
    </section>
  `;
}

function renderSummary() {
  const health = getStudioHealth(state);
  const offerLadder = buildOfferLadder(state);
  const rankedChannels = rankChannels(state).slice(0, 4);
  const launchPlan = buildLaunchPlan(state);
  const sprint = buildLaunchSprint(state);
  const risks = buildRiskRegister(state);

  refs.summary.innerHTML = `
    <section class="summary-card">
      <p class="eyebrow">Opportunity score</p>
      <div class="score-hero">
        <div>
          <strong>${health.overall}</strong>
          <p>/ 100 readiness</p>
        </div>
        <span class="pill">${escapeHtml(health.leadChannel)}</span>
      </div>
      <div class="score-grid">
        <div class="mini-stat"><span>Market proof</span><strong>${health.marketProof}</strong></div>
        <div class="mini-stat"><span>Offer strength</span><strong>${health.offerStrength}</strong></div>
        <div class="mini-stat"><span>Launch readiness</span><strong>${health.launchReadiness}</strong></div>
        <div class="mini-stat"><span>Safety</span><strong>${health.safety}</strong></div>
      </div>
    </section>

    <section class="summary-card">
      <p class="eyebrow">Executive brief</p>
      <h3>What the plan says right now</h3>
      <p class="brief-text">${escapeHtml(buildExecutiveBrief(state))}</p>
    </section>

    <section class="summary-card">
      <p class="eyebrow">Offer ladder</p>
      <h3>How the product makes money</h3>
      <ul class="focus-list">
        ${offerLadder
          .map(
            (step) => `
              <li class="focus-item">
                <strong>${escapeHtml(step.stage)}: ${escapeHtml(step.title)}</strong>
                <p>${escapeHtml(step.detail)}</p>
              </li>
            `
          )
          .join("")}
      </ul>
    </section>

    <section class="summary-card">
      <p class="eyebrow">Top channels</p>
      <h3>What to ship first</h3>
      ${
        rankedChannels.length > 0
          ? `<ul class="rank-list">
              ${rankedChannels
                .map(
                  (channel) => `
                    <li class="list-item">
                      <strong>${escapeHtml(channel.channel || "Untitled channel")}</strong>
                      <p>${escapeHtml(channel.hook || "Hook still needed")}</p>
                      <small>${channel.recommendation} | score ${channel.score}</small>
                    </li>
                  `
                )
                .join("")}
            </ul>`
          : `<p class="empty-state">Add at least one channel to see a launch queue.</p>`
      }
    </section>

    <section class="summary-card">
      <p class="eyebrow">Launch buckets</p>
      <h3>Channel sequencing</h3>
      <ul class="bucket-list">
        ${renderBucket("Ship now", launchPlan.now, "ship now")}
        ${renderBucket("Run this week", launchPlan.next, "run this week")}
        ${renderBucket("Test messaging", launchPlan.test, "test")}
        ${renderBucket("Keep warm", launchPlan.later, "keep warm")}
      </ul>
    </section>

    <section class="summary-card">
      <p class="eyebrow">7-day sprint</p>
      <h3>Small moves that create momentum</h3>
      <ul class="cadence-list">
        ${sprint
          .map(
            (item) => `
              <li class="list-item">
                <strong>${escapeHtml(item.title)}</strong>
                <p>${escapeHtml(item.detail)}</p>
              </li>
            `
          )
          .join("")}
      </ul>
    </section>

    <section class="summary-card">
      <p class="eyebrow">Risk register</p>
      <h3>What needs attention</h3>
      ${
        risks.length > 0
          ? `<ul class="risk-list">
              ${risks
                .map(
                  (risk) => `
                    <li class="list-item">
                      <strong>${escapeHtml(risk.title)}</strong>
                      <p>${escapeHtml(risk.detail)}</p>
                      <small>${risk.severity === "high" ? "High attention" : "Watch closely"}</small>
                    </li>
                  `
                )
                .join("")}
            </ul>`
          : `<p class="empty-state">No major blockers surfaced yet. Keep validating the niche as you refine the offer.</p>`
      }
    </section>
  `;
}

function renderBucket(label, items, emptyLabel) {
  const firstItem = items[0];

  return `
    <li class="bucket-item">
      <strong>${escapeHtml(label)}</strong>
      <p>${items.length} channel${items.length === 1 ? "" : "s"}</p>
      <small>${
        firstItem
          ? `${escapeHtml(firstItem.channel || "Untitled channel")} leads this bucket`
          : `No channels in ${emptyLabel} yet`
      }</small>
    </li>
  `;
}

function renderTextField(label, scope, name, value, placeholder, itemId) {
  const dataAttrs = itemId ? `data-collection="${scope}" data-id="${itemId}"` : `data-scope="${scope}"`;
  const id = `${scope}-${name}-${itemId || "base"}`;

  return `
    <div class="field">
      <label class="field-label" for="${id}">${escapeHtml(label)}</label>
      <input id="${id}" type="text" name="${name}" ${dataAttrs} value="${escapeHtml(
        value
      )}" placeholder="${escapeHtml(placeholder || "")}" />
    </div>
  `;
}

function renderTextAreaField(label, scope, name, value, placeholder, itemId) {
  const dataAttrs = itemId ? `data-collection="${scope}" data-id="${itemId}"` : `data-scope="${scope}"`;
  const id = `${scope}-${name}-${itemId || "base"}`;

  return `
    <div class="field">
      <label class="field-label" for="${id}">${escapeHtml(label)}</label>
      <textarea id="${id}" name="${name}" ${dataAttrs} placeholder="${escapeHtml(
        placeholder || ""
      )}">${escapeHtml(value)}</textarea>
    </div>
  `;
}

function renderSelectField(label, scope, name, value, options, itemId) {
  const dataAttrs = itemId ? `data-collection="${scope}" data-id="${itemId}"` : `data-scope="${scope}"`;
  const id = `${scope}-${name}-${itemId || "base"}`;

  return `
    <div class="field">
      <label class="field-label" for="${id}">${escapeHtml(label)}</label>
      <select id="${id}" name="${name}" ${dataAttrs}>
        ${options
          .map(
            (option) =>
              `<option value="${escapeHtml(option)}"${option === value ? " selected" : ""}>${escapeHtml(
                option
              )}</option>`
          )
          .join("")}
      </select>
    </div>
  `;
}

function renderRangeCard(title, description, scope, name, value, labelSet, itemId) {
  const dataAttrs = itemId ? `data-collection="${scope}" data-id="${itemId}"` : `data-scope="${scope}"`;
  const id = `${scope}-${name}-${itemId || "base"}`;

  return `
    <article class="workflow-card">
      <div class="card-header">
        <div>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(description)}</p>
        </div>
        <span class="range-value">${escapeHtml(getRangeLabel(labelSet, value))}</span>
      </div>
      <div class="field field-range">
        <label class="field-label" for="${id}">${escapeHtml(title)}</label>
        <input
          id="${id}"
          type="range"
          min="1"
          max="5"
          step="1"
          name="${name}"
          value="${value}"
          ${dataAttrs}
          data-range-set="${labelSet}"
        />
        <span class="field-help">1 = weak or early, 5 = strong or ready</span>
      </div>
    </article>
  `;
}

function renderPlatformGroup(group) {
  return `
    <article class="platform-group">
      <div class="platform-group-head">
        <strong>${escapeHtml(group.title)}</strong>
        <p>${escapeHtml(group.description)}</p>
      </div>
      <div class="platform-chip-grid">
        ${group.items
          .map((item) => {
            const isActive = Boolean(state.project.platformCoverage?.[item.id]);

            return `
              <button
                class="platform-chip${isActive ? " is-active" : ""}"
                type="button"
                data-action="toggle-platform"
                data-platform-id="${item.id}"
                aria-pressed="${isActive ? "true" : "false"}"
              >
                ${escapeHtml(item.label)}
              </button>
            `;
          })
          .join("")}
      </div>
    </article>
  `;
}

function renderTopicSignalChip(item) {
  const isActive = Boolean(state.project.topicSignals?.[item.id]);

  return `
    <button
      class="platform-chip${isActive ? " is-active" : ""}"
      type="button"
      data-action="toggle-topic-signal"
      data-signal-id="${item.id}"
      aria-pressed="${isActive ? "true" : "false"}"
    >
      ${escapeHtml(item.label)}
    </button>
  `;
}

function renderExampleMarketChip(label) {
  const isActive = state.project.niche.trim().toLowerCase() === label.toLowerCase();

  return `
    <button
      class="platform-chip platform-chip-example${isActive ? " is-active" : ""}"
      type="button"
      data-action="use-example-market"
      data-market-label="${escapeHtml(label)}"
    >
      ${escapeHtml(label)}
    </button>
  `;
}

function renderModuleCard(module, index) {
  return `
    <article class="workflow-card">
      <div class="card-header">
        <div>
          <h3>Module ${index + 1}</h3>
          <p>Each module should earn its place by giving the buyer one clear outcome.</p>
        </div>
        <button
          class="button-link"
          type="button"
          data-action="remove-module"
          data-id="${module.id}"
          ${state.modules.length === 1 ? "disabled" : ""}
        >
          Remove
        </button>
      </div>
      <div class="field-grid two">
        ${renderTextField("Module title", "modules", "title", module.title, "The extraction mindset", module.id)}
        ${renderTextField(
          "Proof source",
          "modules",
          "proofSource",
          module.proofSource,
          "Course, expert pattern, FAQ cluster, or research source",
          module.id
        )}
      </div>
      <div style="margin-top: 14px;">
        ${renderTextAreaField(
          "Buyer outcome",
          "modules",
          "outcome",
          module.outcome,
          "What will the reader be able to do after this section?",
          module.id
        )}
      </div>
      <div style="margin-top: 14px;">
        ${renderRangeCard(
          "Depth",
          "How much of the product weight should this module carry?",
          "modules",
          "depth",
          module.depth,
          "depth",
          module.id
        )}
      </div>
    </article>
  `;
}

function renderChannelCard(channel, index) {
  return `
    <article class="workflow-card">
      <div class="card-header">
        <div>
          <h3>Channel ${index + 1}</h3>
          <p>Pair one clear hook with one clear call to action. Do not make the reader guess.</p>
        </div>
        <button
          class="button-link"
          type="button"
          data-action="remove-channel"
          data-id="${channel.id}"
          ${state.channels.length === 1 ? "disabled" : ""}
        >
          Remove
        </button>
      </div>
      <div class="field-grid two">
        ${renderTextField("Channel", "channels", "channel", channel.channel, "Short-form video", channel.id)}
        ${renderTextField("Cadence", "channels", "cadence", channel.cadence, "3 posts this week", channel.id)}
      </div>
      <div class="field-grid two" style="margin-top: 14px;">
        ${renderTextAreaField("Hook", "channels", "hook", channel.hook, "Why AI gives you generic outputs", channel.id)}
        ${renderTextAreaField("CTA", "channels", "cta", channel.cta, "Get the guide and appendix", channel.id)}
      </div>
      <div class="card-grid two" style="margin-top: 14px;">
        ${renderRangeCard(
          "Confidence",
          "How likely is this channel to work for the current offer?",
          "channels",
          "confidence",
          channel.confidence,
          "confidence",
          channel.id
        )}
        ${renderRangeCard(
          "Effort",
          "How much energy will this channel take to keep alive?",
          "channels",
          "effort",
          channel.effort,
          "effort",
          channel.id
        )}
        ${renderRangeCard(
          "Urgency",
          "How quickly should this channel be tested?",
          "channels",
          "urgency",
          channel.urgency,
          "urgency",
          channel.id
        )}
      </div>
    </article>
  `;
}

function getRangeLabel(labelSet, value) {
  const labels = scoreLabels[labelSet] || scoreLabels.confidence;
  const safeValue = Math.max(1, Math.min(5, Number(value) || 1));
  return `${safeValue} - ${labels[safeValue - 1]}`;
}

function updateRangeChip(target) {
  if (target.type !== "range") {
    return;
  }

  const card = target.closest(".workflow-card");
  const chip = card?.querySelector(".range-value");
  if (chip) {
    chip.textContent = getRangeLabel(target.dataset.rangeSet || "confidence", target.value);
  }
}

function updateScopedState(target) {
  const { scope, collection, id } = target.dataset;
  const value = target.type === "range" ? Number(target.value) : target.value;

  if (scope) {
    state = ensureStateShape({
      ...state,
      [scope]: {
        ...state[scope],
        [target.name]: value
      }
    });
    return;
  }

  if (collection && id) {
    state = ensureStateShape({
      ...state,
      [collection]: state[collection].map((item) =>
        item.id === id
          ? {
              ...item,
              [target.name]: value
            }
          : item
      )
    });
  }
}

function handleFieldInput(event) {
  const target = event.target;
  if (
    !(target instanceof HTMLInputElement) &&
    !(target instanceof HTMLTextAreaElement) &&
    !(target instanceof HTMLSelectElement)
  ) {
    return;
  }

  if (!target.dataset.scope && !target.dataset.collection) {
    return;
  }

  updateScopedState(target);
  updateRangeChip(target);
  persistState();
}

function handleFieldChange(event) {
  const target = event.target;
  if (
    !(target instanceof HTMLInputElement) &&
    !(target instanceof HTMLTextAreaElement) &&
    !(target instanceof HTMLSelectElement)
  ) {
    return;
  }

  if (!target.dataset.scope && !target.dataset.collection) {
    return;
  }

  updateScopedState(target);
  updateRangeChip(target);
  saveAndRefresh({
    fullRender: target.dataset.collection === "modules" || target.dataset.collection === "channels",
    statusMessage: "Studio updated."
  });
}

async function handleClick(event) {
  const button = event.target.closest("[data-action]");
  if (!(button instanceof HTMLElement)) {
    return;
  }

  const action = button.dataset.action;
  if (!action) {
    return;
  }

  if (action === "jump-step") {
    const stepId = button.dataset.stepId;
    if (!stepId) {
      return;
    }

    state = ensureStateShape({
      ...state,
      activeStep: stepId
    });
    persistState();
    renderStepRail();
    document.querySelector(`#step-${stepId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setStatus("Jumped to the selected workflow step.");
    return;
  }

  if (action === "load-sample") {
    state = createSampleState();
    saveAndRefresh({
      fullRender: true,
      statusMessage: "Loaded the transcript-inspired example so you can explore the full flow quickly."
    });
    return;
  }

  if (action === "toggle-platform") {
    const platformId = button.dataset.platformId;
    if (!platformId) {
      return;
    }

    const nextValue = !Boolean(state.project.platformCoverage?.[platformId]);
    state = ensureStateShape({
      ...state,
      project: {
        ...state.project,
        platformCoverage: {
          ...state.project.platformCoverage,
          [platformId]: nextValue
        }
      }
    });
    saveAndRefresh({
      fullRender: true,
      statusMessage: nextValue
        ? "Added a research platform to the market scan."
        : "Removed a research platform from the market scan."
    });
    return;
  }

  if (action === "toggle-topic-signal") {
    const signalId = button.dataset.signalId;
    if (!signalId) {
      return;
    }

    const nextValue = !Boolean(state.project.topicSignals?.[signalId]);
    state = ensureStateShape({
      ...state,
      project: {
        ...state.project,
        topicSignals: {
          ...state.project.topicSignals,
          [signalId]: nextValue
        }
      }
    });
    saveAndRefresh({
      fullRender: true,
      statusMessage: nextValue
        ? "Confirmed a demand signal for this niche."
        : "Removed a demand signal from the niche check."
    });
    return;
  }

  if (action === "use-example-market") {
    const marketLabel = button.dataset.marketLabel;
    if (!marketLabel) {
      return;
    }

    state = ensureStateShape({
      ...state,
      project: {
        ...state.project,
        niche: marketLabel
      }
    });
    saveAndRefresh({
      fullRender: true,
      statusMessage: `Set the niche to ${marketLabel}. Now narrow it into a sharper angle.`
    });
    return;
  }

  if (action === "reset-app") {
    state = createInitialState();
    saveAndRefresh({
      fullRender: true,
      statusMessage: "Reset the workspace. You can shape a new niche from scratch."
    });
    return;
  }

  if (action === "add-module") {
    state = ensureStateShape({
      ...state,
      modules: [...state.modules, createModule()]
    });
    saveAndRefresh({
      fullRender: true,
      statusMessage: "Added a new report module."
    });
    return;
  }

  if (action === "remove-module") {
    const id = button.dataset.id;
    if (!id || state.modules.length === 1) {
      return;
    }

    state = ensureStateShape({
      ...state,
      modules: state.modules.filter((module) => module.id !== id)
    });
    saveAndRefresh({
      fullRender: true,
      statusMessage: "Removed the module."
    });
    return;
  }

  if (action === "add-channel") {
    state = ensureStateShape({
      ...state,
      channels: [...state.channels, createChannel()]
    });
    saveAndRefresh({
      fullRender: true,
      statusMessage: "Added a new promotion channel."
    });
    return;
  }

  if (action === "remove-channel") {
    const id = button.dataset.id;
    if (!id || state.channels.length === 1) {
      return;
    }

    state = ensureStateShape({
      ...state,
      channels: state.channels.filter((channel) => channel.id !== id)
    });
    saveAndRefresh({
      fullRender: true,
      statusMessage: "Removed the promotion channel."
    });
    return;
  }

  if (action === "copy-brief") {
    try {
      await navigator.clipboard.writeText(buildMarkdownBrief(state));
      setStatus("Copied the launch brief to your clipboard.");
    } catch {
      setStatus("Clipboard access failed. Try again on localhost in a secure browser context.");
    }
  }
}
