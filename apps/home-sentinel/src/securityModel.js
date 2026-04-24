export const SECURITY_MODES = {
  HOME: "Home",
  AWAY: "Away",
  NIGHT: "Night",
  DISARMED: "Disarmed",
  LOCKDOWN: "Lockdown"
};

export const ROOM_PROFILE_OPTIONS = ["Armed", "Watch", "Maintenance"];

export const COMMAND_SUGGESTIONS = [
  "assess posture",
  "harden gateway",
  "isolate cameras",
  "review access",
  "verify backups",
  "lockdown",
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
    id: "identity",
    name: "Identity",
    zone: "Accounts",
    coverage: "Password manager, MFA, recovery contacts",
    narrative: "Critical accounts should use unique passwords, authenticator MFA, and current recovery channels.",
    defaultProfile: "Armed"
  },
  {
    id: "gateway",
    name: "Gateway",
    zone: "Network",
    coverage: "Router admin, DNS, UPnP, guest network",
    narrative: "The router is the first protective boundary: admin access, exposed services, and update posture matter most.",
    defaultProfile: "Watch"
  },
  {
    id: "cameras",
    name: "Cameras",
    zone: "IoT",
    coverage: "Doorbells, indoor cameras, NVR/cloud accounts",
    narrative: "Camera accounts and IoT network isolation reduce the blast radius of a vendor or password compromise.",
    defaultProfile: "Armed"
  },
  {
    id: "endpoints",
    name: "Endpoints",
    zone: "Devices",
    coverage: "Windows, phones, browser profiles, security updates",
    narrative: "Protected devices should be patched, encrypted, screen-locked, and free of stale admin accounts.",
    defaultProfile: "Armed"
  },
  {
    id: "backup",
    name: "Backup",
    zone: "Recovery",
    coverage: "Cloud backup, local backup, restore test",
    narrative: "Recovery is protective only when a recent restore has been tested, not just when files appear synced.",
    defaultProfile: "Watch"
  },
  {
    id: "response",
    name: "Response",
    zone: "Incident Plan",
    coverage: "Lockdown steps, contact list, evidence capture",
    narrative: "A response plan turns alerts into concrete actions: preserve evidence, isolate risk, rotate access, and recover.",
    defaultProfile: "Watch"
  }
];

const DEVICE_BLUEPRINTS = [
  {
    id: "password-manager",
    name: "Password Manager",
    roomId: "identity",
    type: "Account Control",
    signal: "Strong",
    firmware: "MFA enabled",
    battery: null
  },
  {
    id: "email-recovery",
    name: "Email Recovery",
    roomId: "identity",
    type: "Recovery Control",
    signal: "Strong",
    firmware: "Review due",
    battery: null
  },
  {
    id: "router-admin",
    name: "Router Admin Surface",
    roomId: "gateway",
    type: "Network Control",
    signal: "Review",
    firmware: "UPnP unknown",
    battery: null
  },
  {
    id: "dns-filter",
    name: "Protective DNS",
    roomId: "gateway",
    type: "Network Control",
    signal: "Strong",
    firmware: "Configured",
    battery: null
  },
  {
    id: "camera-vlan",
    name: "Camera Isolation",
    roomId: "cameras",
    type: "Segmentation Control",
    signal: "Review",
    firmware: "Shared LAN",
    battery: null
  },
  {
    id: "camera-account",
    name: "Camera Cloud Account",
    roomId: "cameras",
    type: "Account Control",
    signal: "Strong",
    firmware: "MFA enabled",
    battery: null
  },
  {
    id: "windows-patching",
    name: "Windows Patch Level",
    roomId: "endpoints",
    type: "Endpoint Control",
    signal: "Strong",
    firmware: "Current",
    battery: null
  },
  {
    id: "browser-extensions",
    name: "Browser Extensions",
    roomId: "endpoints",
    type: "Endpoint Control",
    signal: "Review",
    firmware: "Audit due",
    battery: null
  },
  {
    id: "cloud-backup",
    name: "Cloud Backup",
    roomId: "backup",
    type: "Recovery Control",
    signal: "Strong",
    firmware: "Running",
    battery: null
  },
  {
    id: "restore-test",
    name: "Restore Test",
    roomId: "backup",
    type: "Recovery Control",
    signal: "Review",
    firmware: "Never tested",
    battery: null
  },
  {
    id: "incident-contacts",
    name: "Incident Contacts",
    roomId: "response",
    type: "Response Control",
    signal: "Strong",
    firmware: "Current",
    battery: null
  },
  {
    id: "evidence-folder",
    name: "Evidence Folder",
    roomId: "response",
    type: "Response Control",
    signal: "Strong",
    firmware: "Prepared",
    battery: null
  }
];

const PLAYBOOK_BLUEPRINTS = [
  {
    id: "weekly-posture",
    name: "Weekly posture review",
    trigger: "Every Sunday",
    coverage: "Accounts, endpoints, router exposure",
    armedModes: [SECURITY_MODES.NIGHT, SECURITY_MODES.AWAY, SECURITY_MODES.LOCKDOWN],
    defaultState: "Active"
  },
  {
    id: "camera-isolation",
    name: "Camera isolation",
    trigger: "On vendor/account risk",
    coverage: "Camera VLAN, cloud account, local admin passwords",
    armedModes: [SECURITY_MODES.AWAY, SECURITY_MODES.LOCKDOWN],
    defaultState: "Standby"
  },
  {
    id: "account-lockdown",
    name: "Account lockdown",
    trigger: "On suspicious login or password reuse",
    coverage: "Email, password manager, recovery channels",
    armedModes: [SECURITY_MODES.HOME, SECURITY_MODES.AWAY],
    defaultState: "Active"
  },
  {
    id: "recovery-check",
    name: "Recovery check",
    trigger: "After backup changes or device replacement",
    coverage: "Cloud backup, local backup, restore test",
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
      siteName: "Local Protection Plan",
      mode: SECURITY_MODES.HOME,
      riskScore: RISK_BASE[SECURITY_MODES.HOME],
      quietHours: "Review weekly",
      responseWindow: "15 min",
      networkName: "Home network"
    },
    rooms: ROOM_BLUEPRINTS.map((room) => ({
      ...room,
      profile: room.defaultProfile,
      status: "stable",
      lastSweepAt: ""
    })),
    devices: DEVICE_BLUEPRINTS.map((device) => ({
      ...device,
      status: device.signal === "Review" ? "warning" : "online",
      lastSeenAt: ""
    })),
    alerts: [
      {
        id: "camera-isolation-needed",
        severity: "high",
        roomId: "cameras",
        title: "Camera devices need isolation review",
        detail:
          "Cameras and doorbells should be kept away from personal laptops, phones, and file shares on a separate IoT segment.",
        recommendation:
          "Run `isolate cameras`, then move cameras and recorders to a guest/IoT segment with no inbound access to personal devices.",
        command: "isolate cameras",
        observedAt: "",
        resolved: false
      },
      {
        id: "router-upnp-review",
        severity: "medium",
        roomId: "gateway",
        title: "Router exposure review needed",
        detail:
          "Confirm UPnP is disabled, router admin is not reachable from WAN, and vendor firmware is current.",
        recommendation:
          "Run `harden gateway`, then verify the router admin password and firmware from the router UI.",
        command: "harden gateway",
        observedAt: "",
        resolved: false
      },
      {
        id: "restore-test-due",
        severity: "medium",
        roomId: "backup",
        title: "Backup restore test is due",
        detail:
          "Backups are not protective until a recent file restore has been tested and documented.",
        recommendation:
          "Run `verify backups`, restore one file from cloud and one from local backup, then record the result.",
        command: "verify backups",
        observedAt: "",
        resolved: false
      }
    ],
    playbooks: PLAYBOOK_BLUEPRINTS.map((playbook) => ({
      ...playbook,
      state: playbook.defaultState
    })),
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

  state.rooms.find((room) => room.id === "identity").lastSweepAt = minutesAgo(3);
  state.rooms.find((room) => room.id === "gateway").lastSweepAt = minutesAgo(14);
  state.rooms.find((room) => room.id === "cameras").lastSweepAt = minutesAgo(8);
  state.rooms.find((room) => room.id === "endpoints").lastSweepAt = minutesAgo(10);
  state.rooms.find((room) => room.id === "backup").lastSweepAt = minutesAgo(17);
  state.rooms.find((room) => room.id === "response").lastSweepAt = minutesAgo(21);

  for (const device of state.devices) {
    setDeviceState(state, device.id, {
      status: device.signal === "Review" ? "warning" : "online",
      lastSeenAt: minutesAgo(5)
    });
  }

  state.alerts = [
    {
      id: "camera-isolation-needed",
      severity: "high",
      roomId: "cameras",
      title: "Camera devices share the main LAN",
      detail:
        "Camera devices appear to sit on the same trusted LAN as laptops and phones, increasing blast radius if a camera account or firmware is compromised.",
      recommendation:
        "Run `isolate cameras`, then move cameras and recorders to a guest/IoT segment with no inbound access to personal devices.",
      command: "isolate cameras",
      observedAt: minutesAgo(12),
      resolved: false
    },
    {
      id: "restore-test-due",
      severity: "medium",
      roomId: "backup",
      title: "Backup restore test is due",
      detail:
        "Cloud and local backup jobs are configured, but a file restore has not been tested recently.",
      recommendation: "Run `verify backups`, then restore one file from each backup path and record the result.",
      observedAt: minutesAgo(34),
      resolved: false
    },
    {
      id: "account-review",
      severity: "info",
      roomId: "identity",
      title: "Quarterly account review queued",
      detail: "Review shared accounts, recovery emails, and stale devices before the next travel window.",
      recommendation: "Run `review access` and remove any sessions or recovery channels you no longer recognize.",
      observedAt: minutesAgo(94),
      resolved: true
    }
  ];

  state.commandLog = [
    {
      id: "seed-user-1",
      role: "user",
      text: "assess posture",
      timestamp: minutesAgo(9)
    },
    {
      id: "seed-assistant-1",
      role: "assistant",
      title: "Protection Posture / Local Protection Plan",
      summary:
        "Core protective controls are present, but camera segmentation and backup restore testing still need follow-up.",
      severity: "medium",
      sections: [
        {
          label: "Controls Checked",
          items: [
            "Identity controls use unique credentials and authenticator MFA.",
            "Router admin and UPnP status still need a direct settings review.",
            "Camera devices should be isolated from personal laptops and phones."
          ]
        },
        {
          label: "Key Findings",
          items: [
            "Camera devices share the main LAN.",
            "Backup restore test has not been completed recently."
          ]
        },
        {
          label: "Recommended Actions",
          items: [
            "Run `isolate cameras` before adding more IoT devices.",
            "Run `verify backups` before relying on backup coverage."
          ]
        }
      ],
      timestamp: minutesAgo(8)
    },
    {
      id: "seed-user-2",
      role: "user",
      text: "harden gateway",
      timestamp: minutesAgo(4)
    },
    {
      id: "seed-assistant-2",
      role: "assistant",
      title: "Gateway Hardening Plan",
      summary:
        "Router hardening should focus on admin exposure, UPnP, firmware, DNS filtering, and guest network boundaries.",
      severity: "low",
      sections: [
        {
          label: "Checks",
          items: [
            "Confirm router admin is not reachable from the internet.",
            "Disable UPnP unless a specific known service requires it.",
            "Apply firmware updates from the vendor UI."
          ]
        },
        {
          label: "Protective Actions",
          items: [
            "Use a separate guest/IoT SSID for cameras and smart devices.",
            "Keep DNS filtering enabled for known malware and phishing domains."
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

  if (alertId === "camera-isolation-needed") {
    setDeviceState(state, "camera-vlan", {
      status: "online",
      signal: "Isolated",
      lastSeenAt: timestamp
    });
  }

  if (alertId === "restore-test-due") {
    setDeviceState(state, "restore-test", {
      status: "online",
      firmware: "Tested",
      lastSeenAt: timestamp
    });
  }

  if (alertId === "router-upnp-review") {
    setDeviceState(state, "router-admin", {
      status: "online",
      signal: "Hardened",
      firmware: "UPnP disabled",
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

function buildPostureReport(state, timestamp) {
  setRoomSweep(state, ["identity", "gateway", "cameras", "endpoints", "backup", "response"], timestamp);

  const findings = unresolvedAlerts(state).map((alert) => `${alert.title}: ${alert.detail}`);

  const recommendations = findings.length
    ? unresolvedAlerts(state).map((alert) => alert.recommendation)
    : ["No protective exceptions are open right now."];

  return createReport(
    `Protection Posture / ${state.profile.siteName}`,
    findings.length
      ? "Protective controls are mapped, but open exceptions still need owner action."
      : "Core protective controls are mapped and no open exceptions remain.",
    findings.some((item) => item.toLowerCase().includes("camera"))
      ? "medium"
      : "low",
    [
      {
        label: "Control Review",
        items: state.rooms.map((room) => `${room.name}: ${room.narrative}`)
      },
      {
        label: "Key Findings",
        items: findings.length ? findings : ["No unresolved protective findings."]
      },
      {
        label: "Recommended Actions",
        items: recommendations
      }
    ]
  );
}

function buildGatewayHardeningReport(state, timestamp) {
  setRoomSweep(state, ["gateway"], timestamp);
  const resolved = resolveAlertMutably(state, "router-upnp-review", timestamp);

  return createReport(
    resolved ? "Gateway Hardening Applied" : "Gateway Hardening Review",
    resolved
      ? "Router exposure review is marked complete. Keep the vendor UI check as the source of truth for firmware and WAN admin exposure."
      : "Gateway controls are already marked reviewed. Re-check after router firmware or ISP equipment changes.",
    "low",
    [
      {
        label: "Protective Checks",
        items: [
          "Disable UPnP unless a specific known service requires it.",
          "Confirm router admin is not reachable from WAN.",
          "Use a strong router admin password stored in the password manager.",
          "Keep protective DNS filtering enabled for malware and phishing domains."
        ]
      },
      {
        label: "Next Manual Verification",
        items: [
          "Open the router UI and verify firmware status.",
          "Confirm the guest/IoT SSID cannot reach personal laptops or phones."
        ]
      }
    ]
  );
}

function buildCameraIsolationReport(state, timestamp) {
  setRoomSweep(state, ["cameras", "gateway"], timestamp);
  const resolved = resolveAlertMutably(state, "camera-isolation-needed", timestamp);

  return createReport(
    resolved ? "Camera Isolation Plan Applied" : "Camera Isolation Review",
    resolved
      ? "Camera segmentation exception is resolved in the plan. Move devices to the IoT segment before treating this as physically complete."
      : "Camera isolation is already marked handled. Re-check after adding a new camera, doorbell, NVR, or smart display.",
    "low",
    [
      {
        label: "Isolation Rules",
        items: [
          "Place cameras, doorbells, and NVRs on a guest/IoT network.",
          "Block IoT-to-LAN access unless a specific local viewer requires it.",
          "Keep camera cloud accounts behind authenticator MFA.",
          "Rotate default or shared camera admin passwords."
        ]
      },
      {
        label: "Why This Helps",
        items: [
          "A compromised camera should not be able to browse laptops, phones, or file shares.",
          "Vendor account risk stays separated from the trusted home network."
        ]
      }
    ]
  );
}

function buildAccessReviewReport(state, timestamp) {
  setRoomSweep(state, ["identity", "endpoints"], timestamp);
  ensureAlert(state, {
    id: "stale-session-review",
    severity: "medium",
    roomId: "identity",
    title: "Account session review queued",
    detail:
      "Shared accounts, recovery emails, and signed-in devices should be reviewed before travel or after any suspicious login.",
    recommendation:
      "Open each critical account, remove stale sessions, and confirm recovery email and phone numbers are current.",
    observedAt: timestamp,
    resolved: false
  });
  setDeviceState(state, "email-recovery", {
    status: "warning",
    lastSeenAt: timestamp
  });

  return createReport(
    "Access Review Started",
    "The console queued a focused account review for sessions, recovery channels, MFA, and shared access.",
    "medium",
    [
      {
        label: "Review Scope",
        items: [
          "Email, password manager, banking, cloud storage, GitHub, and device accounts.",
          "Recovery emails, recovery phone numbers, and authenticator enrollment.",
          "Logged-in devices and third-party app connections."
        ]
      },
      {
        label: "Protective Actions",
        items: [
          "Remove sessions you do not recognize.",
          "Rotate any reused or shared passwords.",
          "Confirm MFA is authenticator-based, not SMS-only where alternatives exist."
        ]
      }
    ]
  );
}

function buildBackupVerificationReport(state, timestamp) {
  setRoomSweep(state, ["backup"], timestamp);
  const resolved = resolveAlertMutably(state, "restore-test-due", timestamp);

  return createReport(
    resolved ? "Backup Verification Recorded" : "Backup Verification Review",
    resolved
      ? "Restore-test exception is resolved. Keep a dated note of what was restored and from which backup path."
      : "Restore testing was already marked complete. Re-run it after backup provider, device, or folder changes.",
    "low",
    [
      {
        label: "Restore Test",
        items: [
          "Restore one recent document from cloud backup.",
          "Restore one important file from local/offline backup.",
          "Confirm photos, password manager emergency kit, and recovery codes are covered."
        ]
      },
      {
        label: "Recovery Notes",
        items: [
          "A sync folder is not a full backup if deletes sync everywhere.",
          "A backup is only trusted after a successful restore."
        ]
      }
    ]
  );
}

function buildArmReport(state, mode) {
  const hasHighAlert = unresolvedAlerts(state).some((alert) => alert.severity === "high");
  const unresolvedCount = unresolvedAlerts(state).length;

  return createReport(
    mode === SECURITY_MODES.DISARMED ? "Protection Monitoring Paused" : `${mode} Protection Mode Set`,
    mode === SECURITY_MODES.DISARMED
      ? "Protective tasks remain visible, but escalation posture is relaxed until you choose a stronger mode."
      : hasHighAlert
        ? `${mode} mode is active, but a high-priority protective exception still needs owner action.`
        : `${mode} mode is active and the protective playbooks are aligned with the current posture.`,
    mode === SECURITY_MODES.DISARMED ? "medium" : hasHighAlert ? "medium" : "low",
    [
      {
        label: "Protective Actions",
        items: [
          `${mode === SECURITY_MODES.DISARMED ? "Relaxed" : "Raised"} escalation posture for mapped controls.`,
          "Updated response playbooks to match the selected posture.",
          `Current unresolved incident count: ${unresolvedCount}.`
        ]
      },
      {
        label: "Recommendations",
        items: hasHighAlert
          ? ["Resolve high-priority exceptions before relying on this posture."]
          : ["No immediate exception blocks this posture change."]
      }
    ]
  );
}

function buildLockdownReport(state, timestamp) {
  state.profile.mode = SECURITY_MODES.LOCKDOWN;
  applyModeProfiles(state, SECURITY_MODES.LOCKDOWN);
  setRoomSweep(state, ["identity", "gateway", "cameras", "endpoints", "response"], timestamp);
  ensureAlert(state, {
    id: "lockdown-followup",
    severity: "medium",
    roomId: "response",
    title: "Lockdown follow-up required",
    detail:
      "Lockdown is a containment posture. Manual follow-up is still needed for password rotation, session removal, and evidence notes.",
    recommendation:
      "Capture what happened, rotate critical account passwords, remove stale sessions, then return to Home mode when stable.",
    observedAt: timestamp,
    resolved: false
  });

  return createReport(
    "Lockdown Containment Started",
    "The protection plan is now in Lockdown posture. This is for containment and evidence preservation, not routine monitoring.",
    "medium",
    [
      {
        label: "Immediate Actions",
        items: [
          "Stop adding new devices or accounts until the issue is understood.",
          "Rotate passwords for email, password manager, banking, cloud, and router admin if compromise is suspected.",
          "Remove unfamiliar sessions and connected apps from critical accounts.",
          "Preserve screenshots, timestamps, emails, logs, and account alerts."
        ]
      },
      {
        label: "Return Criteria",
        items: [
          "No unknown sessions remain.",
          "Critical passwords and MFA have been verified.",
          "Gateway and camera isolation have been reviewed.",
          "Backups are verified before cleanup or rebuild work."
        ]
      }
    ]
  );
}

function buildHelpReport() {
  return createReport(
    "Command Library",
    "Use the console as a protective operations checklist. It does not capture packets; NULLVAULT handles local network capture.",
    "low",
    [
      {
        label: "Available Commands",
        items: [
          "assess posture",
          "harden gateway",
          "isolate cameras",
          "review access",
          "verify backups",
          "lockdown"
        ]
      }
    ]
  );
}

function buildUnknownReport(command) {
  return createReport(
    "Command Not Recognized",
    `The console does not understand "${command}" yet, but posture, gateway, camera, access, backup, and lockdown workflows are supported.`,
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
    "Protection Plan Not Configured",
    command
      ? `Ignored "${command}" because no protection controls are configured yet.`
      : "No protection controls are configured yet.",
    "low",
    [
      {
        label: "Current State",
        items: [
          "No control domains are mapped.",
          "No protective actions are available.",
          "No exceptions or response workflows are configured."
        ]
      },
      {
        label: "Next Step",
        items: [
          "Restore the default protection plan or add real control domains before running workflows."
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

  if (normalized === "assess posture" || normalized === "scan perimeter") {
    report = buildPostureReport(next, timestamp);
  } else if (normalized === "harden gateway" || normalized === "scan network") {
    report = buildGatewayHardeningReport(next, timestamp);
  } else if (normalized === "isolate cameras") {
    report = buildCameraIsolationReport(next, timestamp);
  } else if (normalized === "review access" || normalized === "review front door") {
    report = buildAccessReviewReport(next, timestamp);
  } else if (normalized === "verify backups") {
    report = buildBackupVerificationReport(next, timestamp);
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
    report = buildLockdownReport(next, timestamp);
  } else if (normalized === "secure garage") {
    report = buildCameraIsolationReport(next, timestamp);
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
