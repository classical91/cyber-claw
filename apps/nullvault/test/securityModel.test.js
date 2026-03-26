import test from "node:test";
import assert from "node:assert/strict";

import {
  SECURITY_MODES,
  createState,
  getDashboardMetrics,
  hydrateState,
  resolveAlert,
  runConsoleCommand,
  setRoomProfile
} from "../src/securityModel.js";

test("hydrateState restores missing nested security structure", () => {
  const hydrated = hydrateState({
    profile: {
      siteName: "Lake House"
    },
    rooms: [
      {
        id: "garage",
        narrative: "Custom garage note."
      }
    ]
  });

  assert.equal(hydrated.profile.siteName, "Lake House");
  assert.equal(hydrated.profile.mode, SECURITY_MODES.HOME);
  assert.equal(hydrated.rooms.find((room) => room.id === "garage").narrative, "Custom garage note.");
  assert.ok(Array.isArray(hydrated.devices));
});

test("getDashboardMetrics counts unresolved alerts and device issues", () => {
  const state = createState({ seed: "sample" });
  const metrics = getDashboardMetrics(state);

  assert.equal(metrics.activeAlerts, 2);
  assert.equal(metrics.deviceIssues, 3);
  assert.ok(metrics.riskScore > 0);
});

test("runConsoleCommand arms away mode and appends console log entries", () => {
  const state = createState({ seed: "sample" });
  const result = runConsoleCommand(state, "arm away");

  assert.equal(result.state.profile.mode, SECURITY_MODES.AWAY);
  assert.equal(result.response.title, "Away Mode Engaged");
  assert.equal(result.state.commandLog.at(-1).role, "assistant");
});

test("secure garage resolves the garage heartbeat alert", () => {
  const state = createState({ seed: "sample" });
  const result = runConsoleCommand(state, "secure garage");

  assert.equal(result.response.title, "Garage Channel Stabilized");
  assert.equal(result.state.alerts.find((alert) => alert.id === "garage-heartbeat").resolved, true);
  assert.equal(result.state.devices.find((device) => device.id === "garage-glass").status, "online");
});

test("setRoomProfile updates a room profile without mutating other rooms", () => {
  const state = createState({ seed: "sample" });
  const next = setRoomProfile(state, "utility-room", "Maintenance");

  assert.equal(next.rooms.find((room) => room.id === "utility-room").profile, "Maintenance");
  assert.equal(next.rooms.find((room) => room.id === "garage").profile, "Armed");
});

test("resolveAlert updates device remediation details", () => {
  const state = createState({ seed: "sample" });
  const next = resolveAlert(state, "back-gate-battery");

  assert.equal(next.alerts.find((alert) => alert.id === "back-gate-battery").resolved, true);
  assert.equal(next.devices.find((device) => device.id === "back-gate-contact").battery, 96);
});
