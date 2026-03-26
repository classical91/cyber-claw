import {
  BLEND_MODE_OPTIONS,
  FONT_OPTIONS,
  TOOL_DEFINITIONS,
  addLayer,
  clamp,
  createInitialState,
  createLayer,
  duplicateLayer,
  ensureStateShape,
  getSelectedLayer,
  moveLayerBy,
  removeLayer,
  reorderLayer,
  resizeLayer,
  selectLayer,
  setTool,
  toggleLayerVisibility,
  updateDocument,
  updateLayer,
  updateSettings
} from "./editorState.js";

const STORAGE_KEY = "photon-studio/workspace-v1";
const MAX_HISTORY = 36;

const app = document.querySelector("#app");

let refs = {};
let state = loadState();
let historyStack = [];
let historyIndex = -1;
let statusMessage = "Ready to build.";
let interaction = null;
let draftShape = null;

if (app) {
  initialize();
}

function initialize() {
  renderShell();
  bindEvents();
  seedHistory("Opened workspace");
  renderAll();
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? ensureStateShape(JSON.parse(raw)) : createInitialState();
  } catch {
    return createInitialState();
  }
}

function persistState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    statusMessage = "Working in memory only.";
  }
}

function snapshotState() {
  return JSON.stringify(state);
}

function seedHistory(label) {
  historyStack = [
    {
      label,
      snapshot: snapshotState(),
      time: new Date().toISOString()
    }
  ];
  historyIndex = 0;
}

function pushHistory(label) {
  const snapshot = snapshotState();
  const current = historyStack[historyIndex];

  if (current?.snapshot === snapshot) {
    if (current && label) {
      current.label = label;
    }
    return;
  }

  historyStack = historyStack.slice(0, historyIndex + 1);
  historyStack.push({
    label,
    snapshot,
    time: new Date().toISOString()
  });

  if (historyStack.length > MAX_HISTORY) {
    historyStack.shift();
  }

  historyIndex = historyStack.length - 1;
}

function restoreHistory(index) {
  const entry = historyStack[index];
  if (!entry) {
    return;
  }

  state = ensureStateShape(JSON.parse(entry.snapshot));
  historyIndex = index;
  persistState();
  statusMessage = `History: ${entry.label}`;
  renderAll();
}

function commitState(nextState, options = {}) {
  state = ensureStateShape(nextState);
  persistState();

  if (options.historyLabel) {
    pushHistory(options.historyLabel);
  }

  if (options.status) {
    statusMessage = options.status;
  }

  renderAll();
}

function patchState(nextState, options = {}) {
  state = ensureStateShape(nextState);
  persistState();

  if (options.status) {
    statusMessage = options.status;
  }

  renderVisualState();
}

function renderShell() {
  app.innerHTML = `
    <div class="studio-shell">
      <header class="studio-topbar">
        <div class="brand-block">
          <div class="brand-mark">PH</div>
          <div class="brand-copy">
            <strong>Photon Studio</strong>
            <span id="status-line">Ready to build.</span>
          </div>
        </div>

        <div class="document-strip">
          <span class="meta-chip" id="doc-chip"></span>
          <span class="meta-chip" id="layer-chip"></span>
          <span class="meta-chip" id="selection-chip"></span>
        </div>

        <div class="action-strip">
          <button class="action-button" type="button" data-action="undo">Undo</button>
          <button class="action-button" type="button" data-action="redo">Redo</button>
          <button class="action-button accent" type="button" data-action="import">Import</button>
          <button class="action-button" type="button" data-action="export">Export PNG</button>
          <button class="action-button" type="button" data-action="reset">Reset</button>
        </div>
      </header>

      <div class="studio-body">
        <aside class="tool-rail" id="tool-rail"></aside>

        <section class="workspace">
          <div class="workspace-top">
            <div>
              <p class="workspace-kicker">Creative Workspace</p>
              <h1 id="workspace-title">Poster-grade editing in the browser</h1>
            </div>

            <div class="workspace-controls">
              <button class="mini-button" type="button" data-action="toggle-grid">Grid</button>
              <button class="mini-button" type="button" data-action="add-pixel-layer">Pixel Layer</button>
              <button class="mini-button" type="button" data-action="add-text-layer">Text Layer</button>

              <label class="zoom-control" for="zoom-range">
                <span>Zoom</span>
                <input id="zoom-range" type="range" min="0.35" max="1.4" step="0.01" />
                <strong id="zoom-value"></strong>
              </label>
            </div>
          </div>

          <div class="canvas-viewport" id="canvas-viewport">
            <div class="artboard-scaler" id="artboard-scaler">
              <div class="artboard" id="artboard">
                <div class="checkerboard"></div>
                <div class="artboard-content" id="artboard-content">
                  <div class="layer-stack" id="layer-stack"></div>
                </div>
                <div class="artboard-overlay" id="artboard-overlay"></div>
              </div>
            </div>
          </div>

          <div class="workspace-footer">
            <div class="footer-block">
              <p class="footer-label">Recent Moves</p>
              <div class="history-strip" id="history-strip"></div>
            </div>

            <div class="footer-block">
              <p class="footer-label">Quick Swatches</p>
              <div class="swatch-strip" id="swatch-strip"></div>
            </div>
          </div>
        </section>

        <aside class="inspector">
          <section class="inspector-section">
            <div class="section-heading">
              <div>
                <p class="section-kicker">Selection</p>
                <h2>Inspector</h2>
              </div>
            </div>
            <div id="selection-controls"></div>
          </section>

          <section class="inspector-section">
            <div class="section-heading compact">
              <div>
                <p class="section-kicker">Stack</p>
                <h2>Layers</h2>
              </div>
            </div>
            <div id="layers-panel"></div>
          </section>

          <section class="inspector-section">
            <div class="section-heading compact">
              <div>
                <p class="section-kicker">Session</p>
                <h2>History</h2>
              </div>
            </div>
            <div id="history-panel"></div>
          </section>
        </aside>
      </div>

      <input id="file-input" type="file" accept="image/*" hidden />
    </div>
  `;

  refs = {
    statusLine: document.querySelector("#status-line"),
    docChip: document.querySelector("#doc-chip"),
    layerChip: document.querySelector("#layer-chip"),
    selectionChip: document.querySelector("#selection-chip"),
    toolRail: document.querySelector("#tool-rail"),
    zoomRange: document.querySelector("#zoom-range"),
    zoomValue: document.querySelector("#zoom-value"),
    workspaceTitle: document.querySelector("#workspace-title"),
    scaler: document.querySelector("#artboard-scaler"),
    artboard: document.querySelector("#artboard"),
    artboardContent: document.querySelector("#artboard-content"),
    layerStack: document.querySelector("#layer-stack"),
    artboardOverlay: document.querySelector("#artboard-overlay"),
    selectionControls: document.querySelector("#selection-controls"),
    layersPanel: document.querySelector("#layers-panel"),
    historyPanel: document.querySelector("#history-panel"),
    historyStrip: document.querySelector("#history-strip"),
    swatchStrip: document.querySelector("#swatch-strip"),
    fileInput: document.querySelector("#file-input")
  };
}

function bindEvents() {
  app.addEventListener("click", handleClick);
  app.addEventListener("input", handleInput);
  app.addEventListener("change", handleChange);
  refs.artboard.addEventListener("pointerdown", handleArtboardPointerDown);
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("keydown", handleKeyDown);
  refs.fileInput.addEventListener("change", handleFileImport);
}

function renderAll() {
  renderHeader();
  renderToolRail();
  renderWorkspaceMeta();
  renderStage();
  renderSelectionControls();
  renderLayersPanel();
  renderHistory();
  renderSwatches();
}

function renderVisualState() {
  renderHeader();
  renderWorkspaceMeta();
  renderStage();
  renderLayersPanel();
  renderHistory();
  renderSwatches();
}

function renderHeader() {
  const selected = getSelectedLayer(state);
  refs.statusLine.textContent = statusMessage;
  refs.docChip.textContent = `${state.document.name} | ${state.document.width} x ${state.document.height}`;
  refs.layerChip.textContent = `${state.layers.length} layer${state.layers.length === 1 ? "" : "s"}`;
  refs.selectionChip.textContent = selected ? `Selected: ${selected.name}` : "No selection";
  refs.workspaceTitle.textContent = `${state.document.name} | ${state.document.width} x ${state.document.height}`;

  for (const button of app.querySelectorAll('[data-action="undo"]')) {
    button.disabled = historyIndex <= 0;
  }
  for (const button of app.querySelectorAll('[data-action="redo"]')) {
    button.disabled = historyIndex >= historyStack.length - 1;
  }
}

function renderToolRail() {
  refs.toolRail.innerHTML = `
    <div class="tool-group">
      <p class="tool-group-label">Tools</p>
      ${TOOL_DEFINITIONS.map((tool) => renderToolButton(tool)).join("")}
    </div>
    <div class="tool-note">
      <strong>Shortcuts</strong>
      <p>V move, B brush, E erase, R rect, O ellipse, T text, Ctrl/Cmd+Z undo.</p>
    </div>
  `;
}

function renderToolButton(tool) {
  const selected = tool.id === state.activeTool;
  return `
    <button
      class="tool-button${selected ? " is-active" : ""}"
      type="button"
      data-tool="${tool.id}"
      aria-pressed="${selected ? "true" : "false"}"
    >
      <span>${escapeHtml(tool.label)}</span>
      <small>${tool.short}</small>
    </button>
  `;
}

function renderWorkspaceMeta() {
  refs.zoomRange.value = String(state.document.zoom);
  refs.zoomValue.textContent = `${Math.round(state.document.zoom * 100)}%`;
  refs.scaler.style.setProperty("--zoom", String(state.document.zoom));
  refs.artboard.style.width = `${state.document.width}px`;
  refs.artboard.style.height = `${state.document.height}px`;
  refs.artboard.style.background = state.document.background;
  refs.artboard.classList.toggle("show-grid", state.document.showGrid);
  refs.artboardContent.style.filter = buildFilterString(state.settings.globalAdjustments);

  const gridButton = app.querySelector('[data-action="toggle-grid"]');
  if (gridButton) {
    gridButton.classList.toggle("is-active", state.document.showGrid);
  }
}

function renderStage() {
  refs.layerStack.innerHTML = state.layers
    .filter((layer) => layer.visible)
    .map((layer) => renderLayerMarkup(layer))
    .join("");

  hydrateRasterCanvases();
  renderOverlay();
}

function renderLayerMarkup(layer) {
  const commonStyle = [
    `left:${layer.x}px`,
    `top:${layer.y}px`,
    `width:${layer.width}px`,
    `height:${layer.height}px`,
    `opacity:${layer.opacity}`,
    `mix-blend-mode:${layer.blendMode}`,
    `transform:rotate(${layer.rotation}deg)`,
    `filter:${buildFilterString(layer.filters)}`
  ].join(";");

  if (layer.type === "shape") {
    const shapeStyle = [
      commonStyle,
      `background:${layer.fill}`,
      `border:${layer.strokeWidth}px solid ${layer.stroke}`,
      `border-radius:${layer.shape === "ellipse" ? "999px" : "24px"}`
    ].join(";");

    return `
      <div
        class="layer-node layer-shape"
        data-layer-id="${layer.id}"
        data-layer-type="${layer.type}"
        style="${shapeStyle}"
      ></div>
    `;
  }

  if (layer.type === "text") {
    return `
      <div
        class="layer-node layer-text"
        data-layer-id="${layer.id}"
        data-layer-type="${layer.type}"
        style="${commonStyle};color:${layer.color};font-size:${layer.fontSize}px;font-family:${escapeAttribute(layer.fontFamily)};font-weight:${layer.weight}"
      >${escapeHtml(layer.text).replace(/\r?\n/g, "<br />")}</div>
    `;
  }

  if (layer.type === "image") {
    return `
      <img
        class="layer-node layer-image"
        data-layer-id="${layer.id}"
        data-layer-type="${layer.type}"
        draggable="false"
        alt=""
        src="${escapeAttribute(layer.src)}"
        style="${commonStyle};object-fit:${layer.objectFit}"
      />
    `;
  }

  return `
    <canvas
      class="layer-node layer-raster"
      data-layer-id="${layer.id}"
      data-layer-type="${layer.type}"
      style="${commonStyle}"
    ></canvas>
  `;
}

function hydrateRasterCanvases() {
  for (const layer of state.layers) {
    if (layer.type !== "raster" || !layer.visible) {
      continue;
    }

    const canvas = refs.layerStack.querySelector(`canvas[data-layer-id="${layer.id}"]`);
    if (!canvas) {
      continue;
    }

    canvas.width = state.document.width;
    canvas.height = state.document.height;

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (!layer.dataUrl) {
      continue;
    }

    const image = new Image();
    image.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = layer.dataUrl;
  }
}

function renderOverlay() {
  refs.artboardOverlay.innerHTML = "";

  if (draftShape) {
    const preview = document.createElement("div");
    preview.className = "shape-preview";
    preview.style.left = `${draftShape.x}px`;
    preview.style.top = `${draftShape.y}px`;
    preview.style.width = `${draftShape.width}px`;
    preview.style.height = `${draftShape.height}px`;
    preview.style.background = state.settings.shape.fill;
    preview.style.border = `${state.settings.shape.strokeWidth}px solid ${state.settings.shape.stroke}`;
    preview.style.borderRadius = state.activeTool === "shape-ellipse" ? "999px" : "24px";
    refs.artboardOverlay.append(preview);
  }

  const selected = getSelectedLayer(state);
  if (!selected || !selected.visible || !isTransformable(selected)) {
    return;
  }

  const box =
    interaction?.preview && interaction.layerId === selected.id ? interaction.preview : selected;

  const selection = document.createElement("div");
  selection.className = "selection-box";
  selection.style.left = `${box.x}px`;
  selection.style.top = `${box.y}px`;
  selection.style.width = `${box.width}px`;
  selection.style.height = `${box.height}px`;
  selection.style.transform = `rotate(${box.rotation || 0}deg)`;

  const label = document.createElement("span");
  label.className = "selection-label";
  label.textContent = selected.name;
  selection.append(label);

  if (!selected.locked) {
    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = "resize-handle";
    handle.dataset.handle = "resize";
    handle.dataset.layerId = selected.id;
    selection.append(handle);
  }

  refs.artboardOverlay.append(selection);
}

function renderSelectionControls() {
  const selected = getSelectedLayer(state);
  refs.selectionControls.innerHTML = `
    ${renderToolDefaults()}
    ${renderDocumentLook()}
    ${selected ? renderSelectedLayerControls(selected) : renderEmptySelection()}
  `;
}

function renderToolDefaults() {
  if (state.activeTool === "brush" || state.activeTool === "eraser") {
    return `
      <div class="panel-card">
        <div class="subsection-heading">
          <strong>${state.activeTool === "brush" ? "Brush" : "Eraser"} Defaults</strong>
        </div>
        <div class="control-grid two">
          ${renderRangeField("Size", "tool-setting", "brush.size", state.settings.brush.size, 2, 80, 1)}
          ${renderRangeField("Opacity", "tool-setting", "brush.opacity", state.settings.brush.opacity, 0.1, 1, 0.01)}
        </div>
        ${state.activeTool === "brush"
          ? `
            <div class="control-grid">
              ${renderColorField("Color", "tool-setting", "brush.color", state.settings.brush.color)}
            </div>
          `
          : ""}
      </div>
    `;
  }

  if (state.activeTool === "shape-rect" || state.activeTool === "shape-ellipse") {
    return `
      <div class="panel-card">
        <div class="subsection-heading">
          <strong>Shape Defaults</strong>
        </div>
        <div class="control-grid two">
          ${renderColorField("Fill", "tool-setting", "shape.fill", state.settings.shape.fill)}
          ${renderColorField("Stroke", "tool-setting", "shape.stroke", state.settings.shape.stroke)}
        </div>
        <div class="control-grid">
          ${renderNumberField("Stroke Width", "tool-setting", "shape.strokeWidth", state.settings.shape.strokeWidth, 0, 24, 1)}
        </div>
      </div>
    `;
  }

  if (state.activeTool === "text") {
    return `
      <div class="panel-card">
        <div class="subsection-heading">
          <strong>Text Defaults</strong>
        </div>
        <div class="control-grid">
          ${renderTextAreaField("Sample Copy", "tool-setting", "text.content", state.settings.text.content)}
        </div>
        <div class="control-grid two">
          ${renderColorField("Color", "tool-setting", "text.color", state.settings.text.color)}
          ${renderNumberField("Size", "tool-setting", "text.fontSize", state.settings.text.fontSize, 12, 200, 1)}
        </div>
        <div class="control-grid two">
          ${renderSelectField("Font", "tool-setting", "text.fontFamily", FONT_OPTIONS, state.settings.text.fontFamily)}
          ${renderRangeField("Weight", "tool-setting", "text.weight", state.settings.text.weight, 300, 900, 100)}
        </div>
      </div>
    `;
  }

  return `
    <div class="panel-card panel-muted">
      <div class="subsection-heading">
        <strong>Move Tool</strong>
      </div>
      <p>Drag image, text, and shape layers on the artboard. Use the corner handle to resize the selected layer.</p>
    </div>
  `;
}

function renderDocumentLook() {
  const look = state.settings.globalAdjustments;
  return `
    <div class="panel-card">
      <div class="subsection-heading">
        <strong>Document Look</strong>
      </div>
      <div class="control-grid two">
        ${renderColorField("Backdrop", "document-field", "background", state.document.background)}
        ${renderRangeField("Brightness", "global-adjustment", "brightness", look.brightness, 40, 180, 1)}
      </div>
      <div class="control-grid two">
        ${renderRangeField("Contrast", "global-adjustment", "contrast", look.contrast, 40, 180, 1)}
        ${renderRangeField("Saturation", "global-adjustment", "saturation", look.saturation, 0, 200, 1)}
      </div>
      <div class="control-grid two">
        ${renderRangeField("Blur", "global-adjustment", "blur", look.blur, 0, 20, 0.1)}
        ${renderRangeField("Hue", "global-adjustment", "hueRotate", look.hueRotate, 0, 360, 1)}
      </div>
    </div>
  `;
}

function renderSelectedLayerControls(layer) {
  return `
    <div class="panel-card">
      <div class="subsection-heading">
        <strong>${escapeHtml(layer.name)}</strong>
        <span class="layer-type-badge">${layer.type}</span>
      </div>
      <div class="control-grid two">
        ${renderTextField("Name", "layer-field", "name", layer.name)}
        ${renderSelectField("Blend", "layer-field", "blendMode", BLEND_MODE_OPTIONS, layer.blendMode)}
      </div>

      <div class="control-grid two">
        ${renderRangeField("Opacity", "layer-field", "opacity", layer.opacity, 0, 1, 0.01)}
        ${renderRangeField("Rotation", "layer-field", "rotation", layer.rotation, -180, 180, 1)}
      </div>

      ${layer.type !== "raster"
        ? `
          <div class="control-grid two">
            ${renderNumberField("X", "layer-field", "x", layer.x, -2000, 4000, 1)}
            ${renderNumberField("Y", "layer-field", "y", layer.y, -2000, 4000, 1)}
          </div>
          <div class="control-grid two">
            ${renderNumberField("Width", "layer-field", "width", layer.width, 24, 4000, 1)}
            ${renderNumberField("Height", "layer-field", "height", layer.height, 24, 4000, 1)}
          </div>
        `
        : `
          <p class="hint-copy">Pixel layers always match the document size so painting stays aligned to the canvas.</p>
        `}

      ${renderLayerSpecificFields(layer)}
      ${renderLayerFilters(layer)}

      <div class="button-row">
        <button class="mini-button" type="button" data-action="layer-up" data-layer-id="${layer.id}">Bring Forward</button>
        <button class="mini-button" type="button" data-action="layer-down" data-layer-id="${layer.id}">Send Back</button>
      </div>

      <div class="button-row">
        <button class="mini-button" type="button" data-action="duplicate-layer" data-layer-id="${layer.id}">Duplicate</button>
        <button class="mini-button danger" type="button" data-action="delete-layer" data-layer-id="${layer.id}">Delete</button>
      </div>
    </div>
  `;
}

function renderLayerSpecificFields(layer) {
  if (layer.type === "shape") {
    return `
      <div class="control-grid two">
        ${renderColorField("Fill", "layer-field", "fill", layer.fill)}
        ${renderColorField("Stroke", "layer-field", "stroke", layer.stroke)}
      </div>
      <div class="control-grid two">
        ${renderNumberField("Stroke Width", "layer-field", "strokeWidth", layer.strokeWidth, 0, 24, 1)}
        ${renderSelectField("Kind", "layer-field", "shape", [
          { value: "rect", label: "Rectangle" },
          { value: "ellipse", label: "Ellipse" }
        ], layer.shape)}
      </div>
    `;
  }

  if (layer.type === "text") {
    return `
      <div class="control-grid">
        ${renderTextAreaField("Copy", "layer-field", "text", layer.text)}
      </div>
      <div class="control-grid two">
        ${renderColorField("Color", "layer-field", "color", layer.color)}
        ${renderNumberField("Size", "layer-field", "fontSize", layer.fontSize, 12, 200, 1)}
      </div>
      <div class="control-grid two">
        ${renderSelectField("Font", "layer-field", "fontFamily", FONT_OPTIONS, layer.fontFamily)}
        ${renderRangeField("Weight", "layer-field", "weight", layer.weight, 300, 900, 100)}
      </div>
    `;
  }

  if (layer.type === "image") {
    return `
      <p class="hint-copy">Imported images can be moved, resized, filtered, and blended into the stack.</p>
    `;
  }

  return `
    <p class="hint-copy">Paint with the brush or eraser while this pixel layer is selected.</p>
  `;
}

function renderLayerFilters(layer) {
  return `
    <div class="subsection-heading spaced">
      <strong>Layer Adjustments</strong>
    </div>
    <div class="control-grid two">
      ${renderRangeField("Brightness", "layer-filter", "brightness", layer.filters.brightness, 40, 180, 1)}
      ${renderRangeField("Contrast", "layer-filter", "contrast", layer.filters.contrast, 40, 180, 1)}
    </div>
    <div class="control-grid two">
      ${renderRangeField("Saturation", "layer-filter", "saturation", layer.filters.saturation, 0, 200, 1)}
      ${renderRangeField("Blur", "layer-filter", "blur", layer.filters.blur, 0, 20, 0.1)}
    </div>
    <div class="control-grid">
      ${renderRangeField("Hue", "layer-filter", "hueRotate", layer.filters.hueRotate, 0, 360, 1)}
    </div>
  `;
}

function renderEmptySelection() {
  return `
    <div class="panel-card panel-muted">
      <strong>No layer selected</strong>
      <p>Pick a layer from the stack or click a shape, image, or text block on the artboard.</p>
    </div>
  `;
}

function renderLayersPanel() {
  const layers = [...state.layers].reverse();

  refs.layersPanel.innerHTML = `
    <div class="layer-list">
      ${layers
        .map((layer) => {
          const active = layer.id === state.selectedLayerId;
          return `
            <div class="layer-row${active ? " is-active" : ""}">
              <button class="layer-main" type="button" data-action="select-layer" data-layer-id="${layer.id}">
                <span class="layer-name">${escapeHtml(layer.name)}</span>
                <span class="layer-meta">${layer.type}${layer.locked ? " | locked" : ""}</span>
              </button>
              <button class="layer-toggle" type="button" data-action="toggle-visibility" data-layer-id="${layer.id}">
                ${layer.visible ? "Hide" : "Show"}
              </button>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderHistory() {
  const recent = [...historyStack].reverse();

  refs.historyPanel.innerHTML = `
    <div class="history-list">
      ${recent
        .map((entry, reverseIndex) => {
          const actualIndex = historyStack.length - reverseIndex - 1;
          const active = actualIndex === historyIndex;

          return `
            <button
              class="history-row${active ? " is-current" : ""}"
              type="button"
              data-action="jump-history"
              data-history-index="${actualIndex}"
            >
              <span>${escapeHtml(entry.label)}</span>
              <small>${formatTime(entry.time)}</small>
            </button>
          `;
        })
        .join("")}
    </div>
  `;

  refs.historyStrip.innerHTML = recent
    .slice(0, 5)
    .map((entry, reverseIndex) => {
      const actualIndex = historyStack.length - reverseIndex - 1;
      const active = actualIndex === historyIndex;
      return `
        <button
          class="history-chip${active ? " is-current" : ""}"
          type="button"
          data-action="jump-history"
          data-history-index="${actualIndex}"
        >
          ${escapeHtml(entry.label)}
        </button>
      `;
    })
    .join("");
}

function renderSwatches() {
  refs.swatchStrip.innerHTML = state.swatches
    .map(
      (swatch) => `
        <button
          class="swatch-button"
          type="button"
          data-action="apply-swatch"
          data-color="${swatch}"
          style="--swatch:${swatch}"
          aria-label="Apply ${swatch}"
        ></button>
      `
    )
    .join("");
}

function handleClick(event) {
  const toolButton = event.target.closest("[data-tool]");
  if (toolButton) {
    const nextTool = toolButton.dataset.tool;
    commitState(setTool(state, nextTool), {
      status: `${toolLabel(nextTool)} ready.`
    });
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) {
    return;
  }

  const action = actionButton.dataset.action;
  const layerId = actionButton.dataset.layerId;

  if (action === "undo") {
    restoreHistory(historyIndex - 1);
    return;
  }

  if (action === "redo") {
    restoreHistory(historyIndex + 1);
    return;
  }

  if (action === "import") {
    refs.fileInput.click();
    return;
  }

  if (action === "export") {
    exportDocument();
    return;
  }

  if (action === "reset") {
    if (!window.confirm("Reset the workspace back to the default demo composition?")) {
      return;
    }

    state = createInitialState();
    persistState();
    seedHistory("Reset workspace");
    statusMessage = "Workspace reset.";
    renderAll();
    return;
  }

  if (action === "toggle-grid") {
    commitState(updateDocument(state, { showGrid: !state.document.showGrid }), {
      historyLabel: "Toggled grid",
      status: state.document.showGrid ? "Grid hidden." : "Grid shown."
    });
    return;
  }

  if (action === "add-pixel-layer") {
    addPixelLayer();
    return;
  }

  if (action === "add-text-layer") {
    addTextLayerAt({
      x: Math.round(state.document.width * 0.18),
      y: Math.round(state.document.height * 0.16)
    });
    return;
  }

  if (action === "select-layer" && layerId) {
    commitState(selectLayer(state, layerId), {
      status: `Selected ${getLayer(layerId)?.name || "layer"}.`
    });
    return;
  }

  if (action === "toggle-visibility" && layerId) {
    commitState(toggleLayerVisibility(state, layerId), {
      historyLabel: "Toggled layer visibility",
      status: `${getLayer(layerId)?.name || "Layer"} visibility updated.`
    });
    return;
  }

  if (action === "duplicate-layer" && layerId) {
    commitState(duplicateLayer(state, layerId), {
      historyLabel: "Duplicated layer",
      status: "Layer duplicated."
    });
    return;
  }

  if (action === "delete-layer" && layerId) {
    commitState(removeLayer(state, layerId), {
      historyLabel: "Deleted layer",
      status: "Layer removed."
    });
    return;
  }

  if (action === "layer-up" && layerId) {
    commitState(reorderLayer(state, layerId, "up"), {
      historyLabel: "Moved layer forward",
      status: "Layer moved forward."
    });
    return;
  }

  if (action === "layer-down" && layerId) {
    commitState(reorderLayer(state, layerId, "down"), {
      historyLabel: "Moved layer backward",
      status: "Layer moved backward."
    });
    return;
  }

  if (action === "apply-swatch") {
    applySwatch(actionButton.dataset.color);
    return;
  }

  if (action === "jump-history") {
    restoreHistory(Number(actionButton.dataset.historyIndex));
  }
}

function handleInput(event) {
  const target = event.target;

  if (target.id === "zoom-range") {
    patchState(updateDocument(state, { zoom: Number(target.value) }));
    refs.zoomValue.textContent = `${Math.round(state.document.zoom * 100)}%`;
    return;
  }

  if (target.dataset.documentField === "background") {
    patchState(updateDocument(state, { background: target.value }));
    return;
  }

  if (target.dataset.toolSetting) {
    const [group, key] = target.dataset.toolSetting.split(".");
    patchState(updateSettings(state, group, { [key]: parseInputValue(target) }));
    return;
  }

  if (target.dataset.globalAdjustment) {
    patchState(
      updateSettings(state, "globalAdjustments", {
        [target.dataset.globalAdjustment]: Number(target.value)
      })
    );
    return;
  }

  if (target.dataset.layerField) {
    const selected = getSelectedLayer(state);
    if (!selected) {
      return;
    }

    patchState(
      updateLayer(state, selected.id, {
        [target.dataset.layerField]: parseInputValue(target)
      })
    );
    return;
  }

  if (target.dataset.layerFilter) {
    const selected = getSelectedLayer(state);
    if (!selected) {
      return;
    }

    patchState(
      updateLayer(state, selected.id, {
        filters: {
          [target.dataset.layerFilter]: Number(target.value)
        }
      })
    );
  }
}

function handleChange(event) {
  const target = event.target;

  if (target.dataset.globalAdjustment) {
    pushHistory("Adjusted document look");
    statusMessage = "Document look updated.";
    renderAll();
    return;
  }

  if (target.dataset.layerField) {
    pushHistory("Updated layer settings");
    statusMessage = "Layer settings updated.";
    renderAll();
    return;
  }

  if (target.dataset.layerFilter) {
    pushHistory("Adjusted layer filters");
    statusMessage = "Layer look updated.";
    renderAll();
    return;
  }

  if (target.dataset.documentField === "background") {
    pushHistory("Changed backdrop");
    statusMessage = "Backdrop color updated.";
    renderAll();
  }
}

function handleArtboardPointerDown(event) {
  if (event.button !== 0) {
    return;
  }

  const point = getArtboardPoint(event);
  const resizeHandle = event.target.closest("[data-handle='resize']");
  const node = event.target.closest(".layer-node[data-layer-id]");
  const layerId = resizeHandle?.dataset.layerId || node?.dataset.layerId;
  const layer = layerId ? getLayer(layerId) : null;

  if (resizeHandle && layer && isTransformable(layer)) {
    interaction = {
      mode: "resize",
      pointerId: event.pointerId,
      layerId: layer.id,
      startX: point.x,
      startY: point.y,
      preview: {
        x: layer.x,
        y: layer.y,
        width: layer.width,
        height: layer.height,
        rotation: layer.rotation
      }
    };
    return;
  }

  if (state.activeTool === "move") {
    if (layer) {
      if (state.selectedLayerId !== layer.id) {
        state = selectLayer(state, layer.id);
        persistState();
        statusMessage = `Selected ${layer.name}.`;
        renderAll();
      }

      if (isTransformable(layer)) {
        interaction = {
          mode: "move",
          pointerId: event.pointerId,
          layerId: layer.id,
          startX: point.x,
          startY: point.y,
          preview: {
            x: layer.x,
            y: layer.y,
            width: layer.width,
            height: layer.height,
            rotation: layer.rotation
          }
        };
      }
    }
    return;
  }

  if (state.activeTool === "text") {
    if (layer && layer.type !== "raster") {
      commitState(selectLayer(state, layer.id), {
        status: `Selected ${layer.name}.`
      });
      return;
    }

    addTextLayerAt(point);
    return;
  }

  if (state.activeTool === "shape-rect" || state.activeTool === "shape-ellipse") {
    draftShape = {
      x: point.x,
      y: point.y,
      width: 1,
      height: 1
    };

    interaction = {
      mode: "shape",
      pointerId: event.pointerId,
      startX: point.x,
      startY: point.y
    };

    renderOverlay();
    return;
  }

  if (state.activeTool === "brush" || state.activeTool === "eraser") {
    const layerForPaint = ensurePaintLayer();
    const canvas = refs.layerStack.querySelector(`canvas[data-layer-id="${layerForPaint.id}"]`);
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = state.settings.brush.size;
    context.globalAlpha = state.settings.brush.opacity;
    context.strokeStyle = state.settings.brush.color;
    context.globalCompositeOperation =
      state.activeTool === "eraser" ? "destination-out" : "source-over";
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(point.x + 0.01, point.y + 0.01);
    context.stroke();

    interaction = {
      mode: "paint",
      pointerId: event.pointerId,
      layerId: layerForPaint.id,
      canvas,
      context,
      lastPoint: point
    };
  }
}

function handlePointerMove(event) {
  if (!interaction || interaction.pointerId !== event.pointerId) {
    return;
  }

  const point = getArtboardPoint(event);

  if (interaction.mode === "move") {
    const layer = getLayer(interaction.layerId);
    if (!layer) {
      return;
    }

    interaction.preview = {
      ...interaction.preview,
      x: Math.round(layer.x + (point.x - interaction.startX)),
      y: Math.round(layer.y + (point.y - interaction.startY))
    };
    updateLiveNode(interaction.layerId, interaction.preview);
    renderOverlay();
    return;
  }

  if (interaction.mode === "resize") {
    const layer = getLayer(interaction.layerId);
    if (!layer) {
      return;
    }

    interaction.preview = {
      ...interaction.preview,
      width: Math.max(24, Math.round(layer.width + (point.x - interaction.startX))),
      height: Math.max(24, Math.round(layer.height + (point.y - interaction.startY)))
    };
    updateLiveNode(interaction.layerId, interaction.preview);
    renderOverlay();
    return;
  }

  if (interaction.mode === "shape") {
    draftShape = normalizeRect(interaction.startX, interaction.startY, point.x, point.y);
    renderOverlay();
    return;
  }

  if (interaction.mode === "paint") {
    interaction.context.beginPath();
    interaction.context.moveTo(interaction.lastPoint.x, interaction.lastPoint.y);
    interaction.context.lineTo(point.x, point.y);
    interaction.context.stroke();
    interaction.lastPoint = point;
  }
}

function handlePointerUp(event) {
  if (!interaction || interaction.pointerId !== event.pointerId) {
    return;
  }

  const current = interaction;
  interaction = null;

  if (current.mode === "move") {
    const layer = getLayer(current.layerId);
    if (!layer) {
      renderStage();
      return;
    }

    const deltaX = current.preview.x - layer.x;
    const deltaY = current.preview.y - layer.y;

    if (deltaX || deltaY) {
      commitState(moveLayerBy(state, current.layerId, deltaX, deltaY), {
        historyLabel: "Moved layer",
        status: "Layer moved."
      });
      return;
    }

    renderStage();
    return;
  }

  if (current.mode === "resize") {
    const layer = getLayer(current.layerId);
    if (!layer) {
      renderStage();
      return;
    }

    if (current.preview.width !== layer.width || current.preview.height !== layer.height) {
      commitState(resizeLayer(state, current.layerId, current.preview.width, current.preview.height), {
        historyLabel: "Resized layer",
        status: "Layer resized."
      });
      return;
    }

    renderStage();
    return;
  }

  if (current.mode === "shape") {
    if (draftShape && draftShape.width >= 8 && draftShape.height >= 8) {
      const next = addLayer(
        state,
        createLayer("shape", {
          name: `Shape ${state.layers.filter((layer) => layer.type === "shape").length + 1}`,
          shape: state.activeTool === "shape-ellipse" ? "ellipse" : "rect",
          x: draftShape.x,
          y: draftShape.y,
          width: draftShape.width,
          height: draftShape.height,
          fill: state.settings.shape.fill,
          stroke: state.settings.shape.stroke,
          strokeWidth: state.settings.shape.strokeWidth
        })
      );

      draftShape = null;
      commitState(next, {
        historyLabel: "Created shape",
        status: "Shape layer added."
      });
      return;
    }

    draftShape = null;
    renderStage();
    return;
  }

  if (current.mode === "paint") {
    const dataUrl = current.canvas.toDataURL("image/png");
    commitState(updateLayer(state, current.layerId, { dataUrl }), {
      historyLabel: state.activeTool === "eraser" ? "Erased pixels" : "Paint stroke",
      status: state.activeTool === "eraser" ? "Eraser pass committed." : "Stroke committed."
    });
  }
}

function handleKeyDown(event) {
  const activeElement = document.activeElement;
  const typing =
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    activeElement instanceof HTMLSelectElement;

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    if (event.shiftKey) {
      restoreHistory(historyIndex + 1);
    } else {
      restoreHistory(historyIndex - 1);
    }
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
    event.preventDefault();
    restoreHistory(historyIndex + 1);
    return;
  }

  if (typing) {
    return;
  }

  const shortcuts = {
    v: "move",
    b: "brush",
    e: "eraser",
    r: "shape-rect",
    o: "shape-ellipse",
    t: "text"
  };

  const nextTool = shortcuts[event.key.toLowerCase()];
  if (nextTool) {
    commitState(setTool(state, nextTool), {
      status: `${toolLabel(nextTool)} ready.`
    });
    return;
  }

  if (event.key === "Delete" || event.key === "Backspace") {
    const selected = getSelectedLayer(state);
    if (selected && !selected.locked) {
      event.preventDefault();
      commitState(removeLayer(state, selected.id), {
        historyLabel: "Deleted layer",
        status: "Layer removed."
      });
    }
  }
}

function addPixelLayer() {
  const next = addLayer(
    state,
    createLayer("raster", {
      name: `Pixel ${state.layers.filter((layer) => layer.type === "raster").length + 1}`,
      width: state.document.width,
      height: state.document.height
    })
  );

  commitState(next, {
    historyLabel: "Added pixel layer",
    status: "New pixel layer added."
  });
}

function ensurePaintLayer() {
  const selected = getSelectedLayer(state);
  if (selected?.type === "raster" && !selected.locked) {
    return selected;
  }

  const next = addLayer(
    state,
    createLayer("raster", {
      name: `Pixel ${state.layers.filter((layer) => layer.type === "raster").length + 1}`,
      width: state.document.width,
      height: state.document.height
    })
  );

  state = next;
  persistState();
  pushHistory("Added pixel layer");
  statusMessage = "New pixel layer added for painting.";
  renderAll();

  return getSelectedLayer(state);
}

function addTextLayerAt(point) {
  const next = addLayer(
    state,
    createLayer("text", {
      name: `Text ${state.layers.filter((layer) => layer.type === "text").length + 1}`,
      x: point.x,
      y: point.y,
      text: state.settings.text.content,
      color: state.settings.text.color,
      fontSize: state.settings.text.fontSize,
      fontFamily: state.settings.text.fontFamily,
      weight: state.settings.text.weight
    })
  );

  commitState(next, {
    historyLabel: "Added text layer",
    status: "Text layer added."
  });
}

function applySwatch(color) {
  const selected = getSelectedLayer(state);
  let next = state;

  if (selected?.type === "shape") {
    next = updateLayer(next, selected.id, { fill: color });
    next = updateSettings(next, "shape", { fill: color });
  } else if (selected?.type === "text") {
    next = updateLayer(next, selected.id, { color });
    next = updateSettings(next, "text", { color });
  } else {
    next = updateSettings(next, "brush", { color });
  }

  commitState(next, {
    historyLabel: "Applied swatch",
    status: `Applied ${color}.`
  });
}

async function handleFileImport(event) {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  try {
    const src = await readFileAsDataUrl(file);
    const bitmap = await loadImage(src);
    const maxWidth = state.document.width * 0.62;
    const maxHeight = state.document.height * 0.74;
    const scale = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const next = addLayer(
      state,
      createLayer("image", {
        name: file.name.replace(/\.[^.]+$/, "") || "Imported Image",
        src,
        x: Math.round((state.document.width - width) / 2),
        y: Math.round((state.document.height - height) / 2),
        width,
        height,
        objectFit: "cover"
      })
    );

    commitState(next, {
      historyLabel: "Imported image",
      status: `${file.name} imported.`
    });
  } catch {
    statusMessage = "Image import failed.";
    renderHeader();
  } finally {
    refs.fileInput.value = "";
  }
}

async function exportDocument() {
  try {
    const baseCanvas = document.createElement("canvas");
    baseCanvas.width = state.document.width;
    baseCanvas.height = state.document.height;
    const context = baseCanvas.getContext("2d");

    context.fillStyle = state.document.background;
    context.fillRect(0, 0, baseCanvas.width, baseCanvas.height);

    for (const layer of state.layers) {
      if (!layer.visible) {
        continue;
      }

      await drawLayerToCanvas(context, layer);
    }

    let outputCanvas = baseCanvas;
    const globalFilter = buildCanvasFilter(state.settings.globalAdjustments);
    if (globalFilter !== "none") {
      const adjusted = document.createElement("canvas");
      adjusted.width = baseCanvas.width;
      adjusted.height = baseCanvas.height;
      const adjustedContext = adjusted.getContext("2d");
      adjustedContext.filter = globalFilter;
      adjustedContext.drawImage(baseCanvas, 0, 0);
      outputCanvas = adjusted;
    }

    const blob = await new Promise((resolve) => outputCanvas.toBlob(resolve, "image/png"));
    if (!blob) {
      throw new Error("No export blob");
    }

    downloadBlob(blob, `${slugify(state.document.name)}.png`);
    statusMessage = "PNG exported.";
    renderHeader();
  } catch {
    statusMessage = "Export failed.";
    renderHeader();
  }
}

async function drawLayerToCanvas(context, layer) {
  context.save();
  context.globalAlpha = layer.opacity;
  context.globalCompositeOperation = layer.blendMode === "normal" ? "source-over" : layer.blendMode;
  context.filter = buildCanvasFilter(layer.filters);

  if (layer.type === "raster") {
    if (layer.dataUrl) {
      const image = await loadImage(layer.dataUrl);
      context.drawImage(image, 0, 0, state.document.width, state.document.height);
    }
    context.restore();
    return;
  }

  context.translate(layer.x, layer.y);
  context.rotate((layer.rotation * Math.PI) / 180);

  if (layer.type === "shape") {
    context.fillStyle = layer.fill;
    if (layer.shape === "ellipse") {
      context.beginPath();
      context.ellipse(layer.width / 2, layer.height / 2, layer.width / 2, layer.height / 2, 0, 0, Math.PI * 2);
      context.fill();
      if (layer.strokeWidth > 0) {
        context.strokeStyle = layer.stroke;
        context.lineWidth = layer.strokeWidth;
        context.stroke();
      }
    } else {
      drawRoundedRect(context, 0, 0, layer.width, layer.height, 24);
      context.fill();
      if (layer.strokeWidth > 0) {
        context.strokeStyle = layer.stroke;
        context.lineWidth = layer.strokeWidth;
        context.stroke();
      }
    }
  }

  if (layer.type === "text") {
    context.fillStyle = layer.color;
    context.textBaseline = "top";
    context.font = `${layer.weight} ${layer.fontSize}px ${layer.fontFamily}`;

    const lines = String(layer.text || "").split(/\r?\n/);
    lines.forEach((line, index) => {
      context.fillText(line, 0, index * layer.fontSize * 1.05, layer.width);
    });
  }

  if (layer.type === "image") {
    const image = await loadImage(layer.src);
    context.drawImage(image, 0, 0, layer.width, layer.height);
  }

  context.restore();
}

function updateLiveNode(layerId, box) {
  const node = refs.layerStack.querySelector(`[data-layer-id="${layerId}"]`);
  if (!node) {
    return;
  }

  node.style.left = `${box.x}px`;
  node.style.top = `${box.y}px`;
  node.style.width = `${box.width}px`;
  node.style.height = `${box.height}px`;
  node.style.transform = `rotate(${box.rotation || 0}deg)`;
}

function getLayer(layerId) {
  return state.layers.find((layer) => layer.id === layerId) || null;
}

function getArtboardPoint(event) {
  const rect = refs.artboard.getBoundingClientRect();
  const x = clamp(
    ((event.clientX - rect.left) / rect.width) * state.document.width,
    0,
    state.document.width
  );
  const y = clamp(
    ((event.clientY - rect.top) / rect.height) * state.document.height,
    0,
    state.document.height
  );

  return {
    x: Math.round(x),
    y: Math.round(y)
  };
}

function isTransformable(layer) {
  return Boolean(layer) && !layer.locked && layer.type !== "raster";
}

function normalizeRect(startX, startY, endX, endY) {
  return {
    x: Math.min(startX, endX),
    y: Math.min(startY, endY),
    width: Math.abs(endX - startX),
    height: Math.abs(endY - startY)
  };
}

function parseInputValue(target) {
  if (target.type === "number" || target.type === "range") {
    return Number(target.value);
  }

  return target.value;
}

function toolLabel(toolId) {
  return TOOL_DEFINITIONS.find((tool) => tool.id === toolId)?.label || "Tool";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function buildFilterString(filters) {
  const parts = [
    `brightness(${filters.brightness}%)`,
    `contrast(${filters.contrast}%)`,
    `saturate(${filters.saturation}%)`,
    `blur(${filters.blur}px)`,
    `hue-rotate(${filters.hueRotate}deg)`
  ];

  const normalized = parts.join(" ");
  return normalized ===
    "brightness(100%) contrast(100%) saturate(100%) blur(0px) hue-rotate(0deg)"
    ? "none"
    : normalized;
}

function buildCanvasFilter(filters) {
  return buildFilterString(filters);
}

function drawRoundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function slugify(value) {
  return (
    String(value || "export")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "export"
  );
}

function formatTime(value) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function renderTextField(label, datasetName, field, value) {
  return `
    <label class="field">
      <span>${label}</span>
      <input type="text" data-${datasetName}="${field}" value="${escapeAttribute(value)}" />
    </label>
  `;
}

function renderTextAreaField(label, datasetName, field, value) {
  return `
    <label class="field">
      <span>${label}</span>
      <textarea rows="3" data-${datasetName}="${field}">${escapeHtml(value)}</textarea>
    </label>
  `;
}

function renderNumberField(label, datasetName, field, value, min, max, step) {
  return `
    <label class="field">
      <span>${label}</span>
      <input
        type="number"
        data-${datasetName}="${field}"
        value="${escapeAttribute(value)}"
        min="${min}"
        max="${max}"
        step="${step}"
      />
    </label>
  `;
}

function renderRangeField(label, datasetName, field, value, min, max, step) {
  return `
    <label class="field">
      <span>${label}<small>${value}</small></span>
      <input
        type="range"
        data-${datasetName}="${field}"
        value="${escapeAttribute(value)}"
        min="${min}"
        max="${max}"
        step="${step}"
      />
    </label>
  `;
}

function renderColorField(label, datasetName, field, value) {
  return `
    <label class="field">
      <span>${label}</span>
      <input type="color" data-${datasetName}="${field}" value="${escapeAttribute(value)}" />
    </label>
  `;
}

function renderSelectField(label, datasetName, field, options, value) {
  const optionMarkup = options
    .map((entry) => {
      if (typeof entry === "string") {
        return `<option value="${escapeAttribute(entry)}"${entry === value ? " selected" : ""}>${escapeHtml(entry)}</option>`;
      }

      return `<option value="${escapeAttribute(entry.value)}"${entry.value === value ? " selected" : ""}>${escapeHtml(entry.label)}</option>`;
    })
    .join("");

  return `
    <label class="field">
      <span>${label}</span>
      <select data-${datasetName}="${field}">
        ${optionMarkup}
      </select>
    </label>
  `;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
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

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
