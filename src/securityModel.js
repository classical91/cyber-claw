export const SECURITY_MODES = {
  HOME: "Home",
  AWAY: "Away",
  NIGHT: "Night",
  DISARMED: "Disarmed",
  LOCKDOWN: "Lockdown"
};

export const ROOM_PROFILE_OPTIONS = ["Armed", "Watch", "Maintenance"];

export const COMMAND_SUGGESTIONS = [
  "scan perimeter",
  "scan network",
  "review front door",
  "arm away",
  "arm night",
  "disarm",
  "secure garage",
  "help"
];

const RISK_BASE = {
  [SECURITY_MODES.HOME]: 18,
  [SECURITY_MODES.AWAY]: 12,
  [SECURITY_MODES.NIGHT]: 10,
  [SECURITY_MODES.DISARMED]: 34,
  [SECURITY_MODES.LOCKDOWN]: 8
};

const SEVERITY_SCORES = {
  high: 10,
  medium: 6,
  low: 3,
  info: 0
};

const ROOM_BLUEPRINTS = [
  {
    id: "front-entry",
    name: "Front Entry",
    zone: "Perimeter",
    coverage: "Doorbell cam, smart lock, contact sensor",
    narrative: "Porch line is quiet and the lock is reporting normally.",
    defaultProfile: "Armed"
  },
  {
    id: "living-room",
    name: "Living Room",
    zone: "Interior",
    coverage: "Motion detector, glass-break, siren relay",
    narrative: "Interior motion is quiet with no unexpected movement after sunset.",
    defaultProfile: "Watch"
  },
  {
    id: "garage",
    name: "Garage",
    zone: "Perimeter",
    coverage: "Window vibration sensor, camera, contact strip",
    narrative: "Garage shell is armed, but one side-window sensor is drifting.",
    defaultProfile: "Armed"
  },
  {
    id: "backyard",
    name: "Backyard",
    zone: "Perimeter",
    coverage: "Gate contact, patio flood, yard camera",
    narrative: "Fence line is covered, though the gate battery is nearing swap time.",
    defaultProfile: "Armed"
  },
  {
    id: "upstairs",
    name: "Upstairs Hall",
    zone: "Interior",
    coverage: "Hall cam, stair motion, bedroom door contacts",
    narrative: "Night routing is clean and upstairs contacts are stable.",
    defaultProfile: "Watch"
  },
  {
    id: "utility-room",
    name: "Utility Room",
    zone: "Core Systems",
    coverage: "Router, mesh repeater, backup power monitor",
    narrative: "Core network stays isolated here so cameras and locks stay segmented.",
    defaultProfile: "Watch"
  }
];

const DEVICE_BLUEPRINTS = [
  {
    id: "front-door-cam",
    name: "Front Door Camera",
    roomId: "front-entry",
    type: "Camera",
    signal: "Strong",
    firmware: "v3.1.4",
    battery: null
  },
  {
    id: "front-door-lock",
    name: "Front Door Lock",
    roomId: "front-entry",
    type: "Smart Lock",
    signal: "Strong",
    firmware: "v2.8.1",
    battery: 88
  },
  {
    id: "porch-motion",
    name: "Porch Motion Sensor",
    roomId: "front-entry",
    type: "Motion Sensor",
    signal: "Strong",
    firmware: "v1.8.0",
    battery: 72
  },
  {
    id: "living-glass",
    name: "Living Room Glass Break",
    roomId: "living-room",
    type: "Acoustic Sensor",
    signal: "Strong",
    firmware: "v1.4.3",
    battery: 81
  },
  {
    id: "living-siren",
    name: "Interior Siren",
    roomId: "living-room",
    type: "Siren Relay",
    signal: "Strong",
    firmware: "v2.0.1",
    battery: null
  },
  {
    id: "garage-glass",
    name: "Garage Side Window Sensor",
    roomId: "garage",
    type: "Vibration Sensor",
    signal: "Intermittent",
    firmware: "v1.2.8",
    battery: 62
  },
  {
    id: "garage-cam",
    name: "Garage Camera",
    roomId: "garage",
    type: "Camera",
    signal: "Strong",
    firmware: "v3.0.9",
    battery: null
  },
  {
    id: "back-gate-contact",
    name: "Back Gate Contact",
    roomId: "backyard",
    type: "Contact Sensor",
    signal: "Strong",
    firmware: "v1.5.2",
    battery: 14
  },
  {
    id: "yard-cam",
    name: "Backyard Camera",
    roomId: "backyard",
    type: "Camera",
    signal: "Strong",
    firmware: "v3.1.0",
    battery: null
  },
  {
    id: "upstairs-cam",
    name: "Upstairs Hall Camera",
    roomId: "upstairs",
    type: "Camera",
    signal: "Strong",
    firmware: "v3.0.8",
    battery: null
  },
  {
    id: "utility-router",
    name: "Security Gateway",
    roomId: "utility-room",
    type: "Router",
    signal: "Strong",
    firmware: "v1.0.8",
    battery: null
  },
  {
    id: "mesh-repeater",
    name: "Garage Mesh Repeater",
    roomId: "utility-room",
    type: "Mesh Repeater",
    signal: "Good",
    firmware: "v2.2.6",
    battery: null
  }
];

const PLAYBOOK_BLUEPRINTS = [
  {
    id: "night-lock",
    name: "Night lock sweep",
    trigger: "11:00 PM daily",
    coverage: "Front door, patio slider, backyard gate",
    armedModes: [SECURITY_MODES.NIGHT, SECURITY_MODES.AWAY, SECURITY_MODES.LOCKDOWN],
    defaultState: "Standby"
  },
  {
    id: "garage-isolation",
    name: "Garage isolation",
    trigger: "On missed heartbeat or glass event",
    coverage: "Garage camera, floodlight, siren relay",
    armedModes: [SECURITY_MODES.AWAY, SECURITY_MODES.LOCKDOWN],
    defaultState: "Standby"
  },
  {
    id: "delivery-watch",
    name: "Delivery watch",
    trigger: "Front door person detection 8:00 AM - 8:00 PM",
    coverage: "Doorbell camera, porch light, package labels",
    armedModes: [SECURITY_MODES.HOME, SECURITY_MODES.AWAY],
    defaultState: "Active"
  },
  {
    id: "network-failsafe",
    name: "Network failsafe",
    trigger: "Gateway patch drift or repeater loss",
    coverage: "Gateway isolation, phone alert, backup LTE route",
    armedModes: [
      SECURITY_MODES.HOME,
      SECURITY_MODES.NIGHT,
      SECURITY_MODES.AWAY,
      SECURITY_MODES.LOCKDOWN
    ],
    defaultState: "Active"
  }
];

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function createBlankState() {
  return {
    profile: {
      siteName: "Unconfigured Site",
      mode: SECURITY_MODES.DISARMED,
      riskScore: 0,
      quietHours: "Not configured",
      responseWindow: "Not configured",
      networkName: "Not connected"
    },
    rooms: [],
    devices: [],
    alerts: [],
    playbooks: [],
    commandLog: [],
    updatedAt: ""
  };
}

function setDeviceState(state, deviceId, updates) {
  const device = state.devices.find((item) => item.id === deviceId);
  if (device) {
    Object.assign(device, updates);
  }
}

function createSampleState() {
  const state = createBlankState();

  state.rooms.find((room) => room.id === "front-entry").lastSweepAt = minutesAgo(3);
  state.rooms.find((room) => room.id === "garage").lastSweepAt = minutesAgo(14);
  state.rooms.find((room) => room.id === "backyard").lastSweepAt = minutesAgo(8);
  state.rooms.find((room) => room.id === "living-room").lastSweepAt = minutesAgo(10);
  state.rooms.find((room) => room.id === "upstairs").lastSweepAt = minutesAgo(17);
  state.rooms.find((room) => room.id === "utility-room").lastSweepAt = minutesAgo(21);

  setDeviceState(state, "front-door-cam", {
    status: "online",
    lastSeenAt: minutesAgo(1)
  });
  setDeviceState(state, "front-door-lock", {
    status: "online",
    lastSeenAt: minutesAgo(2)
  });
  setDeviceState(state, "porch-motion", {
    status: "online",
    lastSeenAt: minutesAgo(2)
  });
  setDeviceState(state, "living-glass", {
    status: "online",
    lastSeenAt: minutesAgo(5)
  });
  setDeviceState(state, "living-siren", {
    status: "online",
    lastSeenAt: minutesAgo(5)
  });
  setDeviceState(state, "garage-glass", {
    status: "warning",
    lastSeenAt: minutesAgo(12)
  });
  setDeviceState(state, "garage-cam", {
    status: "online",
    lastSeenAt: minutesAgo(3)
  });
  setDeviceState(state, "back-gate-contact", {
    status: "low-battery",
    lastSeenAt: minutesAgo(6)
  });
  setDeviceState(state, "yard-cam", {
    status: "online",
    lastSeenAt: minutesAgo(4)
  });
  setDeviceState(state, "upstairs-cam", {
    status: "online",
    lastSeenAt: minutesAgo(7)
  });
  setDeviceState(state, "utility-router", {
    status: "online",
    lastSeenAt: minutesAgo(1)
  });
  setDeviceState(state, "mesh-repeater", {
    status: "warning",
    lastSeenAt: minutesAgo(11)
  });

  state.alerts = [
    {
      id: "garage-heartbeat",
      severity: "high",
      roomId: "garage",
      title: "Garage side window missed heartbeat",
      detail:
        "The vibration sensor has been silent for 12 minutes while the garage shell remains armed.",
      recommendation:
        "Inspect the side window contact, then verify the mesh repeater has power and a stable signal.",
      command: "secure garage",
      observedAt: minutesAgo(12),
      resolved: false
    },
    {
      id: "back-gate-battery",
      severity: "medium",
      roomId: "backyard",
      title: "Back gate contact battery low",
      detail:
        "Battery estimate is down to 14%. Reporting still works, but the failure margin is thin.",
      recommendation: "Swap the cell within the next 24 hours before the overnight window.",
      observedAt: minutesAgo(34),
      resolved: false
    },
    {
      id: "front-delivery",
      severity: "info",
      roomId: "front-entry",
      title: "Front door delivery tagged",
      detail: "Doorbell camera recorded a courier stop and auto-tagged it as a package drop.",
      recommendation: "No action required.",
      observedAt: minutesAgo(94),
      resolved: true
    }
  ];

  state.commandLog = [
    {
      id: "seed-user-1",
      role: "user",
      text: "scan perimeter",
      timestamp: minutesAgo(9)
    },
    {
      id: "seed-assistant-1",
      role: "assistant",
      title: "Perimeter Sweep / Jason Residence",
      summary:
        "Exterior shell is intact. The garage sensor heartbeat and backyard battery drift still need follow-up.",
      severity: "medium",
      sections: [
        {
          label: "Zones Checked",
          items: [
            "Front entry contacts are closed and the smart lock is reporting normally.",
            "Patio and backyard camera coverage are online with no motion holdovers.",
            "Garage camera remains online even though the side-window sensor missed heartbeats."
          ]
        },
        {
          label: "Key Findings",
          items: [
            "Garage side window sensor missed two reporting intervals.",
            "Back gate contact battery is nearing end-of-life at 14%."
          ]
        },
        {
          label: "Recommended Actions",
          items: [
            "Run `secure garage` before leaving the house in Away mode.",
            "Replace the back gate battery during the next daylight check."
          ]
        }
      ],
      timestamp: minutesAgo(8)
    },
    {
      id: "seed-user-2",
      role: "user",
      text: "review front door",
      timestamp: minutesAgo(4)
    },
    {
      id: "seed-assistant-2",
      role: "assistant",
      title: "Front Entry Review",
      summary:
        "Front door activity looks routine: one courier stop, two recognized resident events, and no loitering pattern.",
      severity: "low",
      sections: [
        {
          label: "Recent Activity",
          items: [
            "Courier delivery tagged at 1:22 PM.",
            "Known resident unlock at 6:14 PM.",
            "Porch motion cleared automatically with no repeat event."
          ]
        },
        {
          label: "Sensor Health",
          items: [
            "Doorbell camera is live with strong upstream signal.",
            "Front door lock battery remains healthy at 88%."
          ]
        }
      ],
      timestamp: minutesAgo(3)
    }
  ];

  state.updatedAt = minutesAgo(1);
  return syncState(state);
}

function mergeState(template, incoming) {
  if (Array.isArray(template)) {
    if (!Array.isArray(incoming)) {
      return cloneValue(template);
    }

    if (template.length === 0) {
      return cloneValue(incoming);
    }

    const hasIdentifiers = template.every((item) => item && typeof item === "object" && "id" in item);
    if (!hasIdentifiers) {
      return cloneValue(incoming);
    }

    return template.map((templateItem) => {
      const incomingItem = incoming.find((item) => item?.id === templateItem.id);
      return incomingItem ? mergeState(templateItem, incomingItem) : cloneValue(templateItem);
    });
  }

  if (template && typeof template === "object") {
    const next = {};
    const keys = new Set([...Object.keys(template), ...Object.keys(incoming ?? {})]);

    for (const key of keys) {
      if (!(key in template)) {
        next[key] = cloneValue(incoming[key]);
        continue;
      }

      next[key] = mergeState(template[key], incoming?.[key]);
    }

    return next;
  }

  return incoming ?? template;
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function unresolvedAlerts(state) {
  return state.alerts.filter((alert) => !alert.resolved);
}

function hasConfiguredSite(state) {
  return state.rooms.length > 0 || state.devices.length > 0 || state.playbooks.length > 0;
}

function setRoomSweep(state, roomIds, timestamp) {
  for (const roomId of roomIds) {
    const room = state.rooms.find((item) => item.id === roomId);
    if (room) {
      room.lastSweepAt = timestamp;
    }
  }
}

function ensureAlert(state, nextAlert) {
  const existing = state.alerts.find((alert) => alert.id === nextAlert.id);

  if (existing) {
    Object.assign(existing, nextAlert, { resolved: false, observedAt: nextAlert.observedAt });
    return existing;
  }

  state.alerts.unshift(nextAlert);
  return nextAlert;
}

function resolveAlertMutably(state, alertId, timestamp) {
  const alert = state.alerts.find((item) => item.id === alertId);

  if (!alert) {
    return false;
  }

  alert.resolved = true;
  alert.resolvedAt = timestamp;

  if (alertId === "garage-heartbeat") {
    setDeviceState(state, "garage-glass", {
      status: "online",
      signal: "Strong",
      lastSeenAt: timestamp
    });
    setDeviceState(state, "mesh-repeater", {
      status: "online",
      signal: "Strong",
      lastSeenAt: timestamp
    });
  }

  if (alertId === "back-gate-battery") {
    setDeviceState(state, "back-gate-contact", {
      status: "online",
      battery: 96,
      lastSeenAt: timestamp
    });
  }

  if (alertId === "router-firmware") {
    setDeviceState(state, "utility-router", {
      status: "online",
      firmware: "v1.0.9",
      lastSeenAt: timestamp
    });
  }

  return true;
}

function applyModeProfiles(state, mode) {
  for (const room of state.rooms) {
    if (room.profile === "Maintenance") {
      continue;
    }

    if (mode === SECURITY_MODES.DISARMED) {
      room.profile = "Watch";
      continue;
    }

    if (mode === SECURITY_MODES.AWAY || mode === SECURITY_MODES.NIGHT || mode === SECURITY_MODES.LOCKDOWN) {
      room.profile = room.zone === "Core Systems" ? "Watch" : "Armed";
      continue;
    }

    room.profile = room.zone === "Perimeter" ? "Armed" : "Watch";
  }
}

function getRoomStatus(state, roomId) {
  const roomAlerts = unresolvedAlerts(state).filter((alert) => alert.roomId === roomId);
  const roomDevices = state.devices.filter((device) => device.roomId === roomId);

  if (roomAlerts.some((alert) => alert.severity === "high")) {
    return "alert";
  }

  if (
    roomAlerts.length > 0 ||
    roomDevices.some((device) => ["warning", "low-battery", "offline"].includes(device.status))
  ) {
    return "watch";
  }

  return "stable";
}

function calculateRiskScore(state) {
  if (!hasConfiguredSite(state)) {
    return 0;
  }

  const alertRisk = unresolvedAlerts(state).reduce(
    (total, alert) => total + (SEVERITY_SCORES[alert.severity] ?? 0),
    0
  );
  const deviceRisk = state.devices.reduce((total, device) => {
    if (device.status === "offline") {
      return total + 6;
    }

    if (device.status === "warning" || device.status === "low-battery") {
      return total + 2;
    }

    return total;
  }, 0);
  const maintenanceRisk = state.rooms.filter((room) => room.profile === "Maintenance").length * 4;

  return Math.max(
    8,
    Math.min(96, (RISK_BASE[state.profile.mode] ?? RISK_BASE[SECURITY_MODES.HOME]) + alertRisk + deviceRisk + maintenanceRisk)
  );
}

function syncState(state) {
  for (const room of state.rooms) {
    room.status = getRoomStatus(state, room.id);
  }

  for (const playbook of state.playbooks) {
    playbook.state = playbook.armedModes.includes(state.profile.mode) ? "Active" : playbook.defaultState;
  }

  state.profile.riskScore = calculateRiskScore(state);
  return state;
}

function addCommandLog(state, command, report, timestamp) {
  state.commandLog.push(
    {
      id: createId("command"),
      role: "user",
      text: command,
      timestamp
    },
    {
      id: createId("report"),
      role: "assistant",
      ...report,
      timestamp
    }
  );

  if (state.commandLog.length > 18) {
    state.commandLog = state.commandLog.slice(-18);
  }
}

function createReport(title, summary, severity, sections) {
  return {
    title,
    summary,
    severity,
    sections
  };
}

function buildPerimeterReport(state, timestamp) {
  setRoomSweep(state, ["front-entry", "garage", "backyard"], timestamp);

  const perimeterRooms = state.rooms.filter((room) =>
    ["front-entry", "garage", "backyard"].includes(room.id)
  );
  const findings = unresolvedAlerts(state)
    .filter((alert) => ["front-entry", "garage", "backyard"].includes(alert.roomId))
    .map((alert) => `${alert.title}: ${alert.detail}`);

  const recommendations = findings.length
    ? unresolvedAlerts(state)
        .filter((alert) => ["front-entry", "garage", "backyard"].includes(alert.roomId))
        .map((alert) => alert.recommendation)
    : ["No perimeter remediation is required right now."];

  return createReport(
    `Perimeter Sweep / ${state.profile.siteName}`,
    findings.length
      ? "Exterior shell is sealed, but two follow-ups remain in the garage and backyard."
      : "Exterior shell is sealed and all perimeter telemetry is clean.",
    findings.some((item) => item.toLowerCase().includes("missed heartbeat"))
      ? "medium"
      : "low",
    [
      {
        label: "Zone Review",
        items: perimeterRooms.map((room) => `${room.name}: ${room.narrative}`)
      },
      {
        label: "Key Findings",
        items: findings.length ? findings : ["No unresolved perimeter findings."]
      },
      {
        label: "Recommended Actions",
        items: recommendations
      }
    ]
  );
}

function buildNetworkReport(state, timestamp) {
  setRoomSweep(state, ["utility-room"], timestamp);
  ensureAlert(state, {
    id: "router-firmware",
    severity: "medium",
    roomId: "utility-room",
    title: "Security gateway one patch behind",
    detail:
      "Gateway is running v1.0.8 while the latest security patch level is v1.0.9 for UPnP hardening.",
    recommendation:
      "Patch the gateway during a quiet window, then re-run a network scan to confirm segmentation stayed intact.",
    observedAt: timestamp,
    resolved: false
  });
  setDeviceState(state, "utility-router", {
    status: "warning",
    lastSeenAt: timestamp
  });

  return createReport(
    "Network Segment Review",
    "Camera and lock segments remain isolated, but the security gateway should be patched before the next Away window.",
    "medium",
    [
      {
        label: "Network Edges",
        items: [
          "12 home-security endpoints observed on the protected mesh.",
          "Cameras remain isolated from entertainment devices.",
          "Guest network is active for non-security clients."
        ]
      },
      {
        label: "Key Findings",
        items: [
          "Security gateway is one vendor patch behind on firmware.",
          "Garage repeater recently recovered from an intermittent signal dip."
        ]
      },
      {
        label: "Recommended Actions",
        items: [
          "Schedule the router patch while someone is home.",
          "After patching, run `scan network` again to confirm isolation and repeater stability."
        ]
      }
    ]
  );
}

function buildFrontDoorReview(state, timestamp) {
  setRoomSweep(state, ["front-entry"], timestamp);

  return createReport(
    "Front Entry Review",
    "Front door activity looks routine with recognized residents, one tagged delivery, and no loitering pattern.",
    "low",
    [
      {
        label: "Recent Activity",
        items: [
          "Courier delivery tagged at 1:22 PM and auto-classified as package motion.",
          "Known resident unlock detected at 6:14 PM.",
          "No motion clip exceeded the loiter threshold."
        ]
      },
      {
        label: "Sensor Health",
        items: [
          "Doorbell camera upstream remains strong.",
          "Front door lock battery is healthy at 88%.",
          "Porch motion sensor cleared its last event normally."
        ]
      }
    ]
  );
}

function buildArmReport(state, mode) {
  const hasHighAlert = unresolvedAlerts(state).some((alert) => alert.severity === "high");
  const unresolvedCount = unresolvedAlerts(state).length;

  return createReport(
    mode === SECURITY_MODES.DISARMED ? "System Disarmed" : `${mode} Mode Engaged`,
    mode === SECURITY_MODES.DISARMED
      ? "Perimeter sensors remain visible, but active alarm escalation is paused until you arm the house again."
      : hasHighAlert
        ? `${mode} mode is active, but one high-priority incident still needs attention before you rely on a clean perimeter.`
        : `${mode} mode is active and the protective playbooks are aligned with the current posture.`,
    mode === SECURITY_MODES.DISARMED ? "medium" : hasHighAlert ? "medium" : "low",
    [
      {
        label: "System Actions",
        items: [
          `${mode === SECURITY_MODES.DISARMED ? "Paused" : "Enabled"} lock, motion, and siren escalation for the configured rooms.`,
          "Updated automation playbooks to match the new protection mode.",
          `Current unresolved incident count: ${unresolvedCount}.`
        ]
      },
      {
        label: "Recommendations",
        items: hasHighAlert
          ? ["Run `secure garage` before leaving for an extended period."]
          : ["No immediate exception blocks this posture change."]
      }
    ]
  );
}

function buildGarageSecureReport(state, timestamp) {
  const resolved = resolveAlertMutably(state, "garage-heartbeat", timestamp);
  setRoomSweep(state, ["garage", "utility-room"], timestamp);

  return createReport(
    resolved ? "Garage Channel Stabilized" : "Garage Already Stable",
    resolved
      ? "Garage side-window telemetry is back online and the repeater path is reporting cleanly."
      : "No open garage heartbeat issue was found. The current state is already stable.",
    "low",
    [
      {
        label: "Actions Applied",
        items: resolved
          ? [
              "Marked the garage heartbeat incident as resolved.",
              "Restored garage sensor and repeater health to online."
            ]
          : ["No active garage remediation was needed."]
      },
      {
        label: "Current Status",
        items: [
          "Garage camera remains online.",
          "Garage side-window sensor is now reporting on schedule.",
          "Perimeter risk score recalculated after the fix."
        ]
      }
    ]
  );
}

function buildHelpReport() {
  return createReport(
    "Command Library",
    "Use the console like an operator surface. These commands are currently wired into Home Sentinel.",
    "low",
    [
      {
        label: "Available Commands",
        items: [
          "scan perimeter",
          "scan network",
          "review front door",
          "arm away",
          "arm night",
          "disarm",
          "secure garage"
        ]
      }
    ]
  );
}

function buildUnknownReport(command) {
  return createReport(
    "Command Not Recognized",
    `The console does not understand "${command}" yet, but perimeter, network, front-door, and arm-state workflows are supported.`,
    "medium",
    [
      {
        label: "Try One Of These",
        items: COMMAND_SUGGESTIONS.filter((item) => item !== "help").slice(0, 6)
      }
    ]
  );
}

function buildUnconfiguredReport(command = "") {
  return createReport(
    "Site Not Configured",
    command
      ? `Ignored "${command}" because Home Sentinel is running without demo data and without a real site configuration.`
      : "Home Sentinel is running without demo data and without a real site configuration.",
    "low",
    [
      {
        label: "Current State",
        items: [
          "No rooms are configured.",
          "No devices are registered.",
          "No alerts or historical incidents are preloaded."
        ]
      },
      {
        label: "Next Step",
        items: [
          "Connect a real data source or add a real site configuration before running scans or reviews."
        ]
      }
    ]
  );
}

export function createState(options = {}) {
  const seed = options.seed ?? "blank";
  return seed === "sample" ? createSampleState() : syncState(createBlankState());
}

export function hydrateState(incoming) {
  return syncState(mergeState(createBlankState(), incoming ?? {}));
}

export function getDashboardMetrics(state) {
  const next = hydrateState(state);
  const unresolved = unresolvedAlerts(next);

  return {
    activeAlerts: unresolved.length,
    attentionRooms: next.rooms.filter((room) => room.status !== "stable").length,
    deviceIssues: next.devices.filter((device) => device.status !== "online").length,
    activePlaybooks: next.playbooks.filter((playbook) => playbook.state === "Active").length,
    roomsCovered: next.rooms.filter((room) => room.profile !== "Maintenance").length,
    riskScore: next.profile.riskScore,
    lastSweepAt:
      next.commandLog
        .filter((entry) => entry.role === "assistant")
        .map((entry) => entry.timestamp)
        .sort()
        .at(-1) ?? next.updatedAt
  };
}

export function getLatestAssistantEntry(state) {
  return [...hydrateState(state).commandLog].reverse().find((entry) => entry.role === "assistant") ?? null;
}

export function resolveAlert(state, alertId) {
  const next = hydrateState(state);
  resolveAlertMutably(next, alertId, new Date().toISOString());
  next.updatedAt = new Date().toISOString();
  return syncState(next);
}

export function setRoomProfile(state, roomId, profile) {
  const next = hydrateState(state);
  const room = next.rooms.find((item) => item.id === roomId);

  if (room && ROOM_PROFILE_OPTIONS.includes(profile)) {
    room.profile = profile;
    next.updatedAt = new Date().toISOString();
  }

  return syncState(next);
}

export function runConsoleCommand(state, rawCommand) {
  const command = String(rawCommand ?? "").trim();
  const next = hydrateState(state);

  if (!command) {
    return {
      state: next,
      response: hasConfiguredSite(next) ? buildHelpReport() : buildUnconfiguredReport()
    };
  }

  const normalized = command.toLowerCase();
  const timestamp = new Date().toISOString();
  let report;

  if (!hasConfiguredSite(next)) {
    report = buildUnconfiguredReport(command);
    next.updatedAt = timestamp;
    syncState(next);
    addCommandLog(next, command, report, timestamp);

    return {
      state: next,
      response: report
    };
  }

  if (normalized === "scan perimeter") {
    report = buildPerimeterReport(next, timestamp);
  } else if (normalized === "scan network") {
    report = buildNetworkReport(next, timestamp);
  } else if (normalized === "review front door") {
    report = buildFrontDoorReview(next, timestamp);
  } else if (normalized === "arm away") {
    next.profile.mode = SECURITY_MODES.AWAY;
    applyModeProfiles(next, SECURITY_MODES.AWAY);
    report = buildArmReport(next, SECURITY_MODES.AWAY);
  } else if (normalized === "arm night") {
    next.profile.mode = SECURITY_MODES.NIGHT;
    applyModeProfiles(next, SECURITY_MODES.NIGHT);
    report = buildArmReport(next, SECURITY_MODES.NIGHT);
  } else if (normalized === "arm home") {
    next.profile.mode = SECURITY_MODES.HOME;
    applyModeProfiles(next, SECURITY_MODES.HOME);
    report = buildArmReport(next, SECURITY_MODES.HOME);
  } else if (normalized === "disarm") {
    next.profile.mode = SECURITY_MODES.DISARMED;
    applyModeProfiles(next, SECURITY_MODES.DISARMED);
    report = buildArmReport(next, SECURITY_MODES.DISARMED);
  } else if (normalized === "lockdown") {
    next.profile.mode = SECURITY_MODES.LOCKDOWN;
    applyModeProfiles(next, SECURITY_MODES.LOCKDOWN);
    report = buildArmReport(next, SECURITY_MODES.LOCKDOWN);
  } else if (normalized === "secure garage") {
    report = buildGarageSecureReport(next, timestamp);
  } else if (normalized === "help") {
    report = buildHelpReport();
  } else {
    report = buildUnknownReport(command);
  }

  next.updatedAt = timestamp;
  syncState(next);
  addCommandLog(next, command, report, timestamp);

  return {
    state: next,
    response: report
  };
}
