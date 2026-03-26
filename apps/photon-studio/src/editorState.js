export const TOOL_DEFINITIONS = [
  { id: "move", label: "Move", short: "V" },
  { id: "brush", label: "Brush", short: "B" },
  { id: "eraser", label: "Eraser", short: "E" },
  { id: "shape-rect", label: "Rectangle", short: "R" },
  { id: "shape-ellipse", label: "Ellipse", short: "O" },
  { id: "text", label: "Text", short: "T" }
];

export const BLEND_MODE_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "multiply", label: "Multiply" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "soft-light", label: "Soft Light" },
  { value: "darken", label: "Darken" },
  { value: "lighten", label: "Lighten" }
];

export const FONT_OPTIONS = [
  "Aptos",
  "Georgia",
  "Segoe UI",
  "Trebuchet MS",
  "Courier New"
];

const DEFAULT_DOCUMENT = {
  name: "Photon Studio Demo",
  width: 1280,
  height: 720,
  zoom: 0.72,
  background: "#ebe3d5",
  showGrid: false
};

const DEFAULT_SWATCHES = ["#f95b35", "#1d1d1d", "#f3ede2", "#f2bb16", "#2b6cb0", "#7d4cff"];

function createDefaultLayerFilters() {
  return {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    hueRotate: 0
  };
}

function createDefaultSettings() {
  return {
    brush: {
      size: 18,
      color: "#f95b35",
      opacity: 0.94
    },
    shape: {
      fill: "#f95b35",
      stroke: "#1d1d1d",
      strokeWidth: 2
    },
    text: {
      content: "Double click the story.",
      color: "#141312",
      fontSize: 42,
      fontFamily: "Georgia",
      weight: 700
    },
    globalAdjustments: createDefaultLayerFilters()
  };
}

function createAbstractPosterSvg() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 620" fill="none">
      <defs>
        <linearGradient id="sky" x1="44" y1="26" x2="504" y2="560" gradientUnits="userSpaceOnUse">
          <stop stop-color="#1C2636" />
          <stop offset="0.55" stop-color="#8D3E2F" />
          <stop offset="1" stop-color="#F39C62" />
        </linearGradient>
        <radialGradient id="sun" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(406 128) rotate(90) scale(154 154)">
          <stop stop-color="#FFF0B6" />
          <stop offset="1" stop-color="#FFF0B6" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="560" height="620" rx="40" fill="url(#sky)" />
      <rect x="0" y="446" width="560" height="174" fill="#1B1718" fill-opacity="0.9" />
      <circle cx="406" cy="128" r="154" fill="url(#sun)" />
      <path d="M0 620L144 360L280 620H0Z" fill="#5E261F" />
      <path d="M124 620L300 236L498 620H124Z" fill="#C85E38" />
      <path d="M262 620L430 282L560 620H262Z" fill="#11141B" />
      <path d="M0 496C88 468 124 472 206 496C284 520 332 524 428 492C492 470 526 470 560 484V620H0V496Z" fill="#2A2223" />
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function createId(prefix = "layer") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function toFiniteNumber(value, fallback) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function createLayerName(type, index) {
  switch (type) {
    case "image":
      return `Image ${index}`;
    case "shape":
      return `Shape ${index}`;
    case "text":
      return `Text ${index}`;
    case "raster":
      return `Pixel ${index}`;
    default:
      return `Layer ${index}`;
  }
}

function nextLayerName(state, type) {
  const count = state.layers.filter((layer) => layer.type === type).length + 1;
  return createLayerName(type, count);
}

function normalizeFilters(filters) {
  return {
    ...createDefaultLayerFilters(),
    ...(filters || {})
  };
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function measureTextLayerBox(text, fontSize) {
  const safeText = String(text || "Text");
  const safeFontSize = clamp(toFiniteNumber(fontSize, 42), 12, 200);
  const lines = safeText.split(/\r?\n/);
  const longestLine = lines.reduce((max, line) => Math.max(max, line.length), 1);

  return {
    width: Math.max(180, Math.round(longestLine * safeFontSize * 0.62)),
    height: Math.max(64, Math.round(lines.length * safeFontSize * 1.18 + 28))
  };
}

export function createLayer(type, overrides = {}) {
  const base = {
    id: overrides.id ?? createId(type),
    type,
    name: overrides.name ?? createLayerName(type, 1),
    visible: overrides.visible ?? true,
    locked: overrides.locked ?? false,
    opacity: clamp(toFiniteNumber(overrides.opacity, 1), 0, 1),
    blendMode: overrides.blendMode ?? "normal",
    rotation: clamp(toFiniteNumber(overrides.rotation, 0), -180, 180),
    x: toFiniteNumber(overrides.x, 0),
    y: toFiniteNumber(overrides.y, 0),
    width: Math.max(16, toFiniteNumber(overrides.width, 320)),
    height: Math.max(16, toFiniteNumber(overrides.height, 240)),
    filters: normalizeFilters(overrides.filters)
  };

  if (type === "shape") {
    return {
      ...base,
      shape: overrides.shape === "ellipse" ? "ellipse" : "rect",
      fill: overrides.fill ?? "#f95b35",
      stroke: overrides.stroke ?? "#1d1d1d",
      strokeWidth: Math.max(0, toFiniteNumber(overrides.strokeWidth, 0))
    };
  }

  if (type === "text") {
    const metrics = measureTextLayerBox(
      overrides.text ?? createDefaultSettings().text.content,
      overrides.fontSize ?? createDefaultSettings().text.fontSize
    );

    return {
      ...base,
      width: Math.max(64, toFiniteNumber(overrides.width, metrics.width)),
      height: Math.max(32, toFiniteNumber(overrides.height, metrics.height)),
      text: overrides.text ?? createDefaultSettings().text.content,
      color: overrides.color ?? "#141312",
      fontSize: clamp(toFiniteNumber(overrides.fontSize, 42), 12, 200),
      fontFamily: overrides.fontFamily ?? "Georgia",
      weight: clamp(toFiniteNumber(overrides.weight, 700), 300, 900)
    };
  }

  if (type === "image") {
    return {
      ...base,
      src: overrides.src ?? "",
      objectFit: overrides.objectFit ?? "cover"
    };
  }

  if (type === "raster") {
    return {
      ...base,
      x: 0,
      y: 0,
      dataUrl: overrides.dataUrl ?? null
    };
  }

  return base;
}

function createInitialLayers() {
  const art = createAbstractPosterSvg();

  return [
    createLayer("shape", {
      id: "paper-base",
      name: "Paper",
      locked: true,
      x: 0,
      y: 0,
      width: DEFAULT_DOCUMENT.width,
      height: DEFAULT_DOCUMENT.height,
      fill: "#ebe3d5",
      strokeWidth: 0,
      opacity: 1
    }),
    createLayer("image", {
      id: "poster-image",
      name: "Poster Plate",
      src: art,
      x: 614,
      y: 68,
      width: 432,
      height: 500,
      opacity: 0.96
    }),
    createLayer("shape", {
      id: "accent-ribbon",
      name: "Accent Ribbon",
      x: 132,
      y: 412,
      width: 322,
      height: 92,
      fill: "#f95b35",
      stroke: "#141312",
      strokeWidth: 0,
      opacity: 1
    }),
    createLayer("text", {
      id: "headline-copy",
      name: "Headline",
      x: 126,
      y: 126,
      width: 440,
      height: 220,
      text: "Photon\nStudio",
      color: "#181411",
      fontSize: 88,
      fontFamily: "Georgia",
      weight: 700
    }),
    createLayer("text", {
      id: "support-copy",
      name: "Support Copy",
      x: 140,
      y: 436,
      width: 286,
      height: 72,
      text: "Build posters, retouch images, paint on layers, and export clean comps.",
      color: "#f3ede2",
      fontSize: 25,
      fontFamily: "Aptos",
      weight: 700
    }),
    createLayer("raster", {
      id: "retouch-pass",
      name: "Retouch Pass",
      width: DEFAULT_DOCUMENT.width,
      height: DEFAULT_DOCUMENT.height,
      opacity: 1
    })
  ];
}

function normalizeLayer(layer, documentShape) {
  const normalized = createLayer(layer?.type ?? "shape", {
    ...layer,
    width:
      layer?.type === "raster"
        ? documentShape.width
        : toFiniteNumber(layer?.width, layer?.type === "text" ? measureTextLayerBox(layer?.text, layer?.fontSize).width : 320),
    height:
      layer?.type === "raster"
        ? documentShape.height
        : toFiniteNumber(layer?.height, layer?.type === "text" ? measureTextLayerBox(layer?.text, layer?.fontSize).height : 240)
  });

  if (normalized.type === "raster") {
    normalized.width = documentShape.width;
    normalized.height = documentShape.height;
  }

  return normalized;
}

export function createInitialState() {
  const layers = createInitialLayers();

  return {
    document: { ...DEFAULT_DOCUMENT },
    activeTool: "move",
    selectedLayerId: "headline-copy",
    swatches: [...DEFAULT_SWATCHES],
    settings: createDefaultSettings(),
    layers
  };
}

export function ensureStateShape(input) {
  const initial = createInitialState();

  if (!input || typeof input !== "object") {
    return initial;
  }

  const documentShape = {
    ...DEFAULT_DOCUMENT,
    ...(input.document || {})
  };

  documentShape.width = Math.max(480, toFiniteNumber(documentShape.width, DEFAULT_DOCUMENT.width));
  documentShape.height = Math.max(320, toFiniteNumber(documentShape.height, DEFAULT_DOCUMENT.height));
  documentShape.zoom = clamp(toFiniteNumber(documentShape.zoom, DEFAULT_DOCUMENT.zoom), 0.35, 1.4);
  documentShape.background = String(documentShape.background || DEFAULT_DOCUMENT.background);
  documentShape.name = String(documentShape.name || DEFAULT_DOCUMENT.name);
  documentShape.showGrid = Boolean(documentShape.showGrid);

  const layers = Array.isArray(input.layers) && input.layers.length
    ? input.layers.map((layer) => normalizeLayer(layer, documentShape))
    : createInitialLayers();

  const settings = {
    ...createDefaultSettings(),
    ...(input.settings || {}),
    brush: {
      ...createDefaultSettings().brush,
      ...(input.settings?.brush || {})
    },
    shape: {
      ...createDefaultSettings().shape,
      ...(input.settings?.shape || {})
    },
    text: {
      ...createDefaultSettings().text,
      ...(input.settings?.text || {})
    },
    globalAdjustments: {
      ...createDefaultSettings().globalAdjustments,
      ...(input.settings?.globalAdjustments || {})
    }
  };

  settings.brush.size = clamp(toFiniteNumber(settings.brush.size, 18), 2, 80);
  settings.brush.opacity = clamp(toFiniteNumber(settings.brush.opacity, 0.94), 0.1, 1);
  settings.shape.strokeWidth = Math.max(0, toFiniteNumber(settings.shape.strokeWidth, 2));
  settings.text.fontSize = clamp(toFiniteNumber(settings.text.fontSize, 42), 12, 200);
  settings.text.weight = clamp(toFiniteNumber(settings.text.weight, 700), 300, 900);

  const nextState = {
    document: documentShape,
    activeTool: TOOL_DEFINITIONS.some((tool) => tool.id === input.activeTool) ? input.activeTool : "move",
    selectedLayerId: String(input.selectedLayerId || ""),
    swatches:
      Array.isArray(input.swatches) && input.swatches.length
        ? input.swatches.map((swatch) => String(swatch))
        : [...DEFAULT_SWATCHES],
    settings,
    layers
  };

  const selectedLayerExists = layers.some((layer) => layer.id === nextState.selectedLayerId);
  if (!selectedLayerExists) {
    const fallback = layers.findLast((layer) => !layer.locked) || layers.at(-1);
    nextState.selectedLayerId = fallback?.id || "";
  }

  return nextState;
}

export function getSelectedLayer(state) {
  return state.layers.find((layer) => layer.id === state.selectedLayerId) ?? null;
}

export function selectLayer(state, layerId) {
  const exists = state.layers.some((layer) => layer.id === layerId);
  return exists ? { ...state, selectedLayerId: layerId } : state;
}

export function setTool(state, toolId) {
  if (!TOOL_DEFINITIONS.some((tool) => tool.id === toolId)) {
    return state;
  }

  return {
    ...state,
    activeTool: toolId
  };
}

export function updateDocument(state, patch) {
  const next = ensureStateShape({
    ...state,
    document: {
      ...state.document,
      ...patch
    }
  });

  return next;
}

export function updateSettings(state, group, patch) {
  if (!(group in state.settings)) {
    return state;
  }

  return ensureStateShape({
    ...state,
    settings: {
      ...state.settings,
      [group]: {
        ...state.settings[group],
        ...patch
      }
    }
  });
}

export function updateLayer(state, layerId, patch) {
  const layers = state.layers.map((layer) => {
    if (layer.id !== layerId) {
      return layer;
    }

    const merged = {
      ...layer,
      ...patch,
      filters: patch.filters ? { ...layer.filters, ...patch.filters } : layer.filters
    };

    if (layer.type === "text") {
      const nextText = patch.text ?? merged.text;
      const nextFontSize = patch.fontSize ?? merged.fontSize;

      if (patch.text !== undefined || patch.fontSize !== undefined || patch.fontFamily !== undefined || patch.weight !== undefined) {
        const metrics = measureTextLayerBox(nextText, nextFontSize);

        if (patch.width === undefined) {
          merged.width = metrics.width;
        }
        if (patch.height === undefined) {
          merged.height = metrics.height;
        }
      }
    }

    if (layer.type === "raster") {
      merged.x = 0;
      merged.y = 0;
      merged.width = state.document.width;
      merged.height = state.document.height;
    }

    return normalizeLayer(merged, state.document);
  });

  return ensureStateShape({
    ...state,
    layers
  });
}

export function addLayer(state, layerInput) {
  const layer = normalizeLayer(
    {
      ...layerInput,
      name: layerInput.name ?? nextLayerName(state, layerInput.type)
    },
    state.document
  );

  return ensureStateShape({
    ...state,
    layers: [...state.layers, layer],
    selectedLayerId: layer.id
  });
}

export function duplicateLayer(state, layerId) {
  const layer = state.layers.find((item) => item.id === layerId);

  if (!layer || layer.locked) {
    return state;
  }

  const copy = normalizeLayer(
    {
      ...layer,
      id: createId(layer.type),
      name: `${layer.name} Copy`,
      locked: false,
      x: layer.type === "raster" ? 0 : layer.x + 26,
      y: layer.type === "raster" ? 0 : layer.y + 26
    },
    state.document
  );

  return ensureStateShape({
    ...state,
    layers: [...state.layers, copy],
    selectedLayerId: copy.id
  });
}

export function removeLayer(state, layerId) {
  const layer = state.layers.find((item) => item.id === layerId);

  if (!layer || layer.locked) {
    return state;
  }

  const layers = state.layers.filter((item) => item.id !== layerId);
  const selectedLayerId = state.selectedLayerId === layerId
    ? (layers.findLast((item) => !item.locked) || layers.at(-1) || {}).id
    : state.selectedLayerId;

  return ensureStateShape({
    ...state,
    layers,
    selectedLayerId
  });
}

export function toggleLayerVisibility(state, layerId) {
  const layer = state.layers.find((item) => item.id === layerId);
  if (!layer) {
    return state;
  }

  return ensureStateShape({
    ...state,
    layers: state.layers.map((item) =>
      item.id === layerId ? { ...item, visible: !item.visible } : item
    )
  });
}

export function renameLayer(state, layerId, name) {
  return updateLayer(state, layerId, { name: String(name || "").trim() || "Untitled Layer" });
}

export function reorderLayer(state, layerId, direction) {
  const currentIndex = state.layers.findIndex((layer) => layer.id === layerId);

  if (currentIndex === -1) {
    return state;
  }

  let nextIndex = currentIndex;
  if (direction === "up") {
    nextIndex = Math.min(state.layers.length - 1, currentIndex + 1);
  } else if (direction === "down") {
    nextIndex = Math.max(0, currentIndex - 1);
  } else if (direction === "top") {
    nextIndex = state.layers.length - 1;
  } else if (direction === "bottom") {
    nextIndex = 0;
  }

  if (nextIndex === currentIndex) {
    return state;
  }

  const layers = [...state.layers];
  const [layer] = layers.splice(currentIndex, 1);
  layers.splice(nextIndex, 0, layer);

  return ensureStateShape({
    ...state,
    layers
  });
}

export function moveLayerBy(state, layerId, deltaX, deltaY) {
  const layer = state.layers.find((item) => item.id === layerId);
  if (!layer || layer.locked || layer.type === "raster") {
    return state;
  }

  return updateLayer(state, layerId, {
    x: layer.x + toFiniteNumber(deltaX, 0),
    y: layer.y + toFiniteNumber(deltaY, 0)
  });
}

export function resizeLayer(state, layerId, width, height) {
  const layer = state.layers.find((item) => item.id === layerId);
  if (!layer || layer.locked || layer.type === "raster") {
    return state;
  }

  return updateLayer(state, layerId, {
    width: Math.max(24, toFiniteNumber(width, layer.width)),
    height: Math.max(24, toFiniteNumber(height, layer.height))
  });
}
