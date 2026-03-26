import test from "node:test";
import assert from "node:assert/strict";

import {
  addLayer,
  createInitialState,
  createLayer,
  duplicateLayer,
  ensureStateShape,
  getSelectedLayer,
  moveLayerBy,
  removeLayer,
  reorderLayer,
  resizeLayer,
  toggleLayerVisibility,
  updateLayer,
  updateSettings
} from "../src/editorState.js";

test("initial state seeds a layered demo composition", () => {
  const state = createInitialState();

  assert.equal(state.document.name, "Photon Studio Demo");
  assert.ok(state.layers.length >= 5);
  assert.equal(getSelectedLayer(state)?.name, "Headline");
});

test("adding and duplicating layers selects the newest editable layer", () => {
  const base = createInitialState();
  const withShape = addLayer(
    base,
    createLayer("shape", {
      name: "Test Shape",
      x: 120,
      y: 80,
      width: 140,
      height: 90
    })
  );

  const duplicated = duplicateLayer(withShape, withShape.selectedLayerId);
  const selected = getSelectedLayer(duplicated);

  assert.equal(selected?.name, "Test Shape Copy");
  assert.equal(selected?.x, 146);
  assert.equal(selected?.y, 106);
});

test("reordering respects the bottom-to-top layer stack", () => {
  const base = createInitialState();
  const movedUp = reorderLayer(base, "accent-ribbon", "up");
  const movedDown = reorderLayer(movedUp, "accent-ribbon", "down");

  assert.equal(movedUp.layers[3]?.id, "accent-ribbon");
  assert.equal(movedDown.layers.findIndex((layer) => layer.id === "accent-ribbon"), 2);
});

test("locked layers are protected from deletion and movement", () => {
  const base = createInitialState();
  const afterDelete = removeLayer(base, "paper-base");
  const afterMove = moveLayerBy(base, "paper-base", 40, 40);

  assert.equal(afterDelete.layers.length, base.layers.length);
  assert.equal(afterMove.layers[0].x, 0);
  assert.equal(afterMove.layers[0].y, 0);
});

test("text edits refresh the measured box and visibility toggles stay serializable", () => {
  const base = createInitialState();
  const updatedText = updateLayer(base, "support-copy", {
    text: "Longer copy for a wider inspection field.",
    fontSize: 34
  });
  const toggled = toggleLayerVisibility(updatedText, "support-copy");
  const layer = toggled.layers.find((item) => item.id === "support-copy");

  assert.ok(layer.width > base.layers.find((item) => item.id === "support-copy").width);
  assert.equal(layer.visible, false);
});

test("settings and malformed state inputs normalize back to safe defaults", () => {
  const base = createInitialState();
  const updated = updateSettings(base, "brush", {
    size: 64,
    opacity: 0.42
  });
  const repaired = ensureStateShape({
    document: {
      width: 0,
      height: "bad",
      zoom: 99
    },
    layers: [
      {
        id: "broken-text",
        type: "text",
        text: "Hello",
        fontSize: "40"
      }
    ],
    settings: updated.settings
  });

  assert.equal(updated.settings.brush.size, 64);
  assert.equal(updated.settings.brush.opacity, 0.42);
  assert.equal(repaired.document.width, 480);
  assert.equal(repaired.document.height, 720);
  assert.equal(repaired.document.zoom, 1.4);
});

test("resize keeps editable layers above minimum bounds", () => {
  const base = createInitialState();
  const resized = resizeLayer(base, "poster-image", 4, 8);
  const layer = resized.layers.find((item) => item.id === "poster-image");

  assert.equal(layer.width, 24);
  assert.equal(layer.height, 24);
});
