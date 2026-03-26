const LIVE_CONFIG_KEY = "nullvault_live_config";
const LIVE_HISTORY_KEY = "nullvault_live_history";
const DEFAULT_SITE_NAME = "Local Network";
const EXAMPLE_COMMANDS = [
  "wifi audit",
  "scan network",
  "wireshark status",
  "wireshark interfaces",
  "wireshark capture iface=1 sec=10 packets=300"
];

const DISPLAY_HOSTNAME = "nullvault.local";
const PREFERENCES_KEY = "nullvault_preferences";
const DEFAULT_PREFERENCES = {
  version: 2,
  layout: "overview",
  auxView: "bytes",
  showPacketSeparator: true,
  showColumnMenu: true,
  showSelectedFrame: true,
  showLoadTime: false,
  timeDisplay: "seconds",
  showMainToolbar: true,
  showFilterToolbar: true,
  showStatusBar: true
};
const TIME_DISPLAY_LABELS = {
  dateTime: "Date and Time of Day",
  seconds: "Seconds Since Beginning Of Capture",
  sincePrevious: "Seconds Since Previous Displayed Packet",
  utcDateTime: "UTC Date and Time of Day"
};

const desktopBridge = window.nullvaultDesktop ?? null;
const isDesktopApp = Boolean(desktopBridge?.isDesktop);

let runtimeConfig = loadRuntimeConfig();
let securityState = { profile: { siteName: runtimeConfig.siteName } };
let currentAnalysis = null;
let selectedPacketId = null;
let isLoading = false;
let suggestionIndex = 0;
let commandHistory = loadCommandHistory();
let preferences = loadPreferences();
let activePreferencePanel = "appearance";
let modalSnapshot = null;
let activeMenuName = null;

const providerValue = document.getElementById("provider-value");
const serverValue = document.getElementById("server-value");
const siteValue = document.getElementById("site-value");
const modelBadge = document.getElementById("model-badge");
const captureSummary = document.getElementById("capture-summary");
const packetMeta = document.getElementById("packet-meta");
const detailMeta = document.getElementById("detail-meta");
const selectionText = document.getElementById("selection-text");
const selectionStatus = document.getElementById("selection-status");
const packetBody = document.getElementById("packet-body");
const detailTree = document.getElementById("detail-tree");
const lowerWorkspace = document.getElementById("lower-workspace");
const protocolMap = document.getElementById("protocol-map");
const byteView = document.getElementById("byte-view");
const summaryPanel = document.getElementById("summary-panel");
const historyPanel = document.getElementById("history-panel");
const auxPanelTitle = document.getElementById("aux-panel-title");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-btn");
const thinkingBar = document.getElementById("thinking-bar");
const statusText = document.getElementById("status-text");
const lastResponse = document.getElementById("last-response");
const tokenText = document.getElementById("token-text");
const tokenBar = document.getElementById("token-bar");
const statusLed = document.querySelector(".status-led");
const configModal = document.getElementById("config-modal");
const siteNameInput = document.getElementById("site-name-input");
const viewMenuButton = document.getElementById("view-menu-button");
const menuPopovers = document.getElementById("menu-popovers");
const viewMenu = document.getElementById("view-menu");
const menuToggleButtons = [...document.querySelectorAll("[data-menu-toggle]")];
const menuTimeButtons = [...document.querySelectorAll("[data-time-display]")];
const menuFocusButtons = [...document.querySelectorAll("[data-menu-focus]")];
const auxTabs = [...document.querySelectorAll(".panel-tab")];
const layoutInputs = [...document.querySelectorAll('input[name="pane-layout"]')];
const layoutCards = [...document.querySelectorAll(".layout-card")];
const prefNavItems = [...document.querySelectorAll(".prefs-nav-item")];
const prefPanes = [...document.querySelectorAll(".prefs-pane")];
const prefShowSeparator = document.getElementById("pref-show-separator");
const prefShowColumnMenu = document.getElementById("pref-show-column-menu");
const prefShowSelectedFrame = document.getElementById("pref-show-selected-frame");
const prefShowLoadTime = document.getElementById("pref-show-load-time");

function loadPreferences() {
  try {
    const raw = window.localStorage.getItem(PREFERENCES_KEY);

    if (!raw) {
      return { ...DEFAULT_PREFERENCES };
    }

    const parsed = JSON.parse(raw);
    const merged = { ...DEFAULT_PREFERENCES, ...parsed };

    if (!Object.prototype.hasOwnProperty.call(parsed, "timeDisplay")) {
      merged.auxView = DEFAULT_PREFERENCES.auxView;
    }

    return merged;
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

function savePreferences() {
  window.localStorage.setItem(
    PREFERENCES_KEY,
    JSON.stringify({ ...preferences, version: DEFAULT_PREFERENCES.version })
  );
}

function loadRuntimeConfig() {
  try {
    const raw = window.localStorage.getItem(LIVE_CONFIG_KEY);

    if (!raw) {
      return { siteName: DEFAULT_SITE_NAME };
    }

    const parsed = JSON.parse(raw);
    return {
      siteName:
        typeof parsed?.siteName === "string" && parsed.siteName.trim()
          ? parsed.siteName.trim()
          : DEFAULT_SITE_NAME
    };
  } catch {
    return { siteName: DEFAULT_SITE_NAME };
  }
}

function saveRuntimeConfig() {
  window.localStorage.setItem(LIVE_CONFIG_KEY, JSON.stringify(runtimeConfig));
}

function loadCommandHistory() {
  try {
    const raw = window.localStorage.getItem(LIVE_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((entry) => entry && typeof entry.command === "string")
      .slice(0, 8)
      .map((entry) => ({
        command: String(entry.command),
        note: String(entry.note ?? "Live analysis"),
        time: String(entry.time ?? formatClock())
      }));
  } catch {
    return [];
  }
}

function saveCommandHistory() {
  window.localStorage.setItem(LIVE_HISTORY_KEY, JSON.stringify(commandHistory.slice(0, 8)));
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatClock(date = new Date()) {
  return new Date(date).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function toClockFromIso(value) {
  if (!value) {
    return formatClock();
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatPacketTime(packet, packets = currentAnalysis?.packets ?? []) {
  const mode = preferences.timeDisplay;

  if (packet.timeLabel) {
    return packet.timeLabel;
  }

  if (packet.observedAt) {
    if (mode === "utcDateTime") {
      return new Date(packet.observedAt).toISOString().replace("T", " ").replace("Z", " UTC");
    }

    if (mode === "sincePrevious") {
      return "-";
    }

    return new Date(packet.observedAt).toLocaleTimeString([], {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  const packetIndex = packets.findIndex((item) => item.id === packet.id);

  if (mode === "dateTime") {
    return "summary";
  }

  if (mode === "utcDateTime") {
    return "summary";
  }

  if (mode === "sincePrevious") {
    if (packetIndex <= 0) {
      return "-";
    }

    const previous = packets[packetIndex - 1];
    if (!Number.isFinite(packet.timeValue) || !Number.isFinite(previous.timeValue)) {
      return "-";
    }

    return (packet.timeValue - previous.timeValue).toFixed(6);
  }

  return Number.isFinite(packet.timeValue) ? packet.timeValue.toFixed(6) : "summary";
}

function humanizeProtocol(protocol) {
  return String(protocol || "TCP").toUpperCase();
}

function toneForProtocol(protocol) {
  const value = humanizeProtocol(protocol);

  if (value.includes("ALERT")) {
    return "alert";
  }
  if (value.includes("ARP")) {
    return "arp";
  }
  if (value.includes("DNS")) {
    return "dns";
  }
  if (value.includes("UDP")) {
    return "udp";
  }
  if (value.includes("MQTT")) {
    return "mqtt";
  }
  if (value.includes("TLS") || value.includes("HTTPS")) {
    return "tls";
  }
  if (value.includes("TCP")) {
    return "tcp";
  }

  return "default";
}

function transportForProtocol(protocol) {
  const value = humanizeProtocol(protocol);

  if (value === "ARP") {
    return "Address Resolution Protocol";
  }
  if (value.includes("DNS")) {
    return "User Datagram Protocol";
  }
  if (value.includes("TLS")) {
    return "Transport Layer Security";
  }
  if (value.includes("MQTT")) {
    return "Transmission Control Protocol";
  }
  if (value.includes("UDP")) {
    return "User Datagram Protocol";
  }
  if (value.includes("ALERT")) {
    return "Sensor Event Stream";
  }

  return "Transmission Control Protocol";
}

function defaultPortsForProtocol(protocol) {
  const value = humanizeProtocol(protocol);

  if (value === "ARP" || value.includes("ALERT")) {
    return { sourcePort: "-", destinationPort: "-" };
  }
  if (value.includes("DNS")) {
    return { sourcePort: "54001", destinationPort: "53" };
  }
  if (value.includes("MQTT")) {
    return { sourcePort: "51322", destinationPort: "8883" };
  }
  if (value.includes("UDP")) {
    return { sourcePort: "53321", destinationPort: "3478" };
  }

  return { sourcePort: "51111", destinationPort: "443" };
}

function makePacket(index, overrides) {
  const ports = defaultPortsForProtocol(overrides.protocol);
  const time = overrides.time ?? `${index + 1}`;
  const parsedTime = Number.parseFloat(time);

  return {
    id: overrides.id ?? `pkt-${index + 1}-${Date.now()}`,
    no: overrides.no ?? index + 1,
    time,
    timeValue: Number.isFinite(parsedTime) ? parsedTime : 0,
    timeLabel: overrides.timeLabel ?? "",
    observedAt: overrides.observedAt ?? "",
    source: overrides.source ?? "Home Controller",
    destination: overrides.destination ?? "Security Gateway",
    protocol: overrides.protocol ?? "TCP",
    length: overrides.length ?? 74,
    info: overrides.info ?? "Packet observed",
    summary: overrides.summary ?? overrides.info ?? "Packet observed",
    sourceAddress: overrides.sourceAddress ?? overrides.source ?? "10.0.0.106",
    destinationAddress: overrides.destinationAddress ?? overrides.destination ?? "10.0.0.1",
    sourceMac: overrides.sourceMac ?? "90:de:80:a3:a4:01",
    destinationMac: overrides.destinationMac ?? "40:0f:c1:66:a6:b2",
    sourcePort: overrides.sourcePort ?? ports.sourcePort,
    destinationPort: overrides.destinationPort ?? ports.destinationPort,
    interfaceName: overrides.interfaceName ?? "Wi-Fi",
    networkLabel: overrides.networkLabel ?? "Internet Protocol Version 4",
    transportLabel: overrides.transportLabel ?? transportForProtocol(overrides.protocol),
    tone: overrides.tone ?? toneForProtocol(overrides.protocol),
    direction:
      overrides.direction ??
      `${overrides.source ?? "Home Controller"} -> ${overrides.destination ?? "Security Gateway"}`,
    extras: overrides.extras ?? []
  };
}

function buildLayers(packet) {
  const arrivalDisplay = formatPacketTime(packet);

  const summary = [
    {
      title: "Frame",
      cells: [
        ["Arrival Time", arrivalDisplay],
        ["Length", `${packet.length} bytes`],
        ["Interface", packet.interfaceName],
        ["Summary", packet.summary]
      ]
    },
    {
      title: "Ethernet",
      cells: [
        ["Source", packet.sourceMac],
        ["Destination", packet.destinationMac],
        ["Type", packet.networkLabel.includes("6") ? "IPv6" : "IPv4"],
        ["Direction", packet.direction]
      ]
    },
    {
      title: packet.networkLabel,
      cells: [
        ["Source Address", packet.sourceAddress],
        ["Destination Address", packet.destinationAddress],
        ["Protocol", humanizeProtocol(packet.protocol)],
        ["Info", packet.info]
      ]
    },
    {
      title: packet.transportLabel,
      cells: [
        ["Source Port", packet.sourcePort],
        ["Destination Port", packet.destinationPort],
        ["Flow", `${packet.source} -> ${packet.destination}`],
        ["Disposition", packet.tone === "alert" ? "Needs review" : "Observed"]
      ]
    }
  ];

  if (packet.extras.length > 0) {
    summary.push({
      title: "Analyzer Notes",
      cells: packet.extras.slice(0, 4).map((item, index) => [`Note ${index + 1}`, item])
    });
  }

  return summary;
}

function packetSeedString(packet) {
  return [
    packet.protocol,
    packet.sourceAddress,
    packet.destinationAddress,
    packet.sourcePort,
    packet.destinationPort,
    packet.info,
    packet.summary
  ].join("|");
}

function buildPacketBytes(packet) {
  const seed = packetSeedString(packet);
  const seedCodes = [...seed].map((character) => character.charCodeAt(0));
  const size = Math.max(64, Math.min(160, Math.ceil(seedCodes.length / 16) * 16));
  const bytes = new Uint8Array(size);

  for (let index = 0; index < size; index += 1) {
    const seedValue = seedCodes[index % seedCodes.length] ?? 0;
    const twist = (packet.no * 17 + index * 11 + packet.length) & 255;
    bytes[index] = seedValue ^ twist;
  }

  return bytes;
}

function renderByteView() {
  const packet = selectedPacket();

  if (!packet) {
    byteView.innerHTML = '<div class="byte-line"><span class="byte-offset">0000</span><span class="byte-hex">No frame selected.</span><span class="byte-ascii">........</span></div>';
    return;
  }

  if (!Array.isArray(packet.rawBytes) || packet.rawBytes.length === 0) {
    byteView.innerHTML = `
      <div class="byte-line">
        <span class="byte-offset">----</span>
        <span class="byte-hex">Raw bytes unavailable for this live telemetry row.</span>
        <span class="byte-ascii">summary-only</span>
      </div>
    `;
    return;
  }

  const bytes = packet.rawBytes;
  const rows = [];

  for (let offset = 0; offset < bytes.length; offset += 16) {
    const slice = [...bytes.slice(offset, offset + 16)];
    const hex = slice.map((value) => value.toString(16).padStart(2, "0")).join(" ");
    const ascii = slice
      .map((value) => (value >= 32 && value <= 126 ? String.fromCharCode(value) : "."))
      .join("");

    rows.push(`
      <div class="byte-line">
        <span class="byte-offset">${offset.toString(16).padStart(4, "0")}</span>
        <span class="byte-hex">${escapeHtml(hex.padEnd(47, " "))}</span>
        <span class="byte-ascii">${escapeHtml(ascii)}</span>
      </div>
    `);
  }

  byteView.innerHTML = rows.join("");
}

function buildDetailGroups(packet) {
  return buildLayers(packet).map((layer) => ({
    label: layer.title,
    entries: layer.cells.map(([key, value]) => `${key}: ${value}`)
  }));
}

function protocolMix(packets) {
  const counts = new Map();

  for (const packet of packets) {
    const label = humanizeProtocol(packet.protocol);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([label, count]) => ({ label, count }));
}

function buildWifiPackets(payload) {
  const report = payload.report ?? {};
  const connected = report.wifi?.connected ?? null;
  const arpEntries = report.arp?.entries ?? [];
  const topExternalRemotes = report.netstat?.topExternalRemotes ?? [];
  const localIp = arpEntries.find((entry) => entry.interfaceIp)?.interfaceIp ?? "Unknown host";
  const observedAt = report.generatedAt ?? "";
  const packets = [];

  if (connected) {
    packets.push(
      makePacket(packets.length, {
        source: connected.name || "Wi-Fi interface",
        destination: connected.ssid || "Connected network",
        protocol: "WIFI",
        length: 0,
        info: `${connected.authentication || "Unknown auth"} / ${connected.cipher || "Unknown cipher"}`,
        summary: `Signal ${connected.signalPercent ?? "n/a"}% on channel ${connected.channel || "unknown"}`,
        sourceAddress: connected.bssid || connected.name || "Wi-Fi",
        destinationAddress: connected.ssid || "Connected network",
        sourceMac: connected.bssid || "unknown",
        destinationMac: "access-point",
        sourcePort: "-",
        destinationPort: "-",
        networkLabel: "Windows WLAN Interface",
        transportLabel: "netsh wlan show interfaces",
        observedAt,
        extras: [
          `Radio ${connected.radioType || "unknown"}`,
          `Receive ${connected.rxMbps ?? "n/a"} Mbps`,
          `Transmit ${connected.txMbps ?? "n/a"} Mbps`
        ]
      })
    );
  }

  packets.push(
    makePacket(packets.length, {
      source: "Windows Profiles",
      destination: runtimeConfig.siteName,
      protocol: "CONFIG",
      length: 0,
      info: `${report.profiles?.count ?? 0} saved Wi-Fi profiles`,
      summary: "Saved WLAN profile inventory",
      sourceAddress: "netsh profiles",
      destinationAddress: runtimeConfig.siteName,
      sourcePort: "-",
      destinationPort: "-",
      networkLabel: "Windows WLAN Profiles",
      transportLabel: "netsh wlan show profiles",
      observedAt,
      extras: (report.profiles?.names ?? []).slice(0, 4)
    })
  );

  packets.push(
    makePacket(packets.length, {
      source: localIp,
      destination: "Local network",
      protocol: "ARP",
      length: 0,
      info: `${report.arp?.dynamicEntries ?? 0} dynamic / ${report.arp?.staticEntries ?? 0} static neighbors`,
      summary: `${report.arp?.totalEntries ?? 0} ARP cache entries observed`,
      sourceAddress: localIp,
      destinationAddress: "arp -a",
      sourcePort: "-",
      destinationPort: "-",
      networkLabel: "Windows ARP Cache",
      transportLabel: "arp -a",
      observedAt
    })
  );

  topExternalRemotes.slice(0, 10).forEach((entry, index) => {
    packets.push(
      makePacket(index + packets.length, {
        source: localIp,
        destination: entry.host,
        protocol: "TCP",
        length: 0,
        info: `${entry.connections} established connections`,
        summary: `Remote endpoint ${entry.host}`,
        sourceAddress: localIp,
        destinationAddress: entry.host,
        sourcePort: "-",
        destinationPort: "-",
        networkLabel: "Windows netstat",
        transportLabel: "netstat -ano",
        observedAt,
        extras: [
          `Remote host ${entry.host}`,
          `Established connections ${entry.connections}`
        ]
      })
    );
  });

  if (packets.length === 0) {
    packets.push(
      makePacket(0, {
        source: "Windows audit",
        destination: runtimeConfig.siteName,
        protocol: "SYSTEM",
        length: 0,
        info: "Audit completed without detailed rows",
        summary: "Local telemetry returned only high-level health data",
        sourcePort: "-",
        destinationPort: "-",
        networkLabel: "Windows host audit",
        transportLabel: "Built-in commands",
        observedAt
      })
    );
  }

  return packets;
}

function buildWifiAnalysis(payload, command, options = {}) {
  if (!payload.ok) {
    return {
      title: options.title ?? "Wi-Fi Audit Error",
      subtitle: payload.error || "Built-in network audit commands are unavailable.",
      statusLabel: "AUDIT BLOCKED",
      statusLevel: "danger",
      captureSummaryText: "0 records / blocked",
      packetMetaText: "No local command data was collected",
      packets: [
        makePacket(0, {
          source: "Analyzer",
          destination: "Windows host",
          protocol: "ALERT",
          length: 0,
          info: payload.error || "Audit unavailable",
          summary: "Local Windows commands could not be executed",
          sourcePort: "-",
          destinationPort: "-",
          timeLabel: "error"
        })
      ],
      metaRows: [
        ["Mode", "No-install audit"],
        ["Status", "Unavailable"]
      ],
      findings: [payload.error || "Local commands were unavailable."],
      recommendations: ["Run the desktop app locally and retry `wifi audit`."],
      notesSections: payload.details
        ? [
            {
              label: "Command Details",
              items: Object.entries(payload.details).map(([key, value]) => `${key}: ${value}`)
            }
          ]
        : [],
      unitLabel: "records",
      command,
      selectedPacketId: null
    };
  }

  const report = payload.report ?? {};
  const connected = report.wifi?.connected ?? null;
  const assessment = report.assessment ?? {};
  const packets = buildWifiPackets(payload);

  return {
    title: options.title ?? "Wi-Fi Audit Snapshot",
    subtitle:
      options.subtitle ??
      (connected
        ? `${connected.ssid} on channel ${connected.channel || "unknown"} with ${connected.authentication || "unknown"} protection.`
        : "Built-in audit completed without an active Wi-Fi interface."),
    statusLabel: options.statusLabel ?? "LOCAL AUDIT",
    statusLevel:
      options.statusLevel ??
      (assessment.riskLevel === "high"
        ? "danger"
        : assessment.riskLevel === "medium"
          ? "warn"
          : "good"),
    captureSummaryText: `${packets.length} records / risk ${assessment.score ?? "n/a"}`,
    packetMetaText: `${packets.length} factual records from Windows network telemetry`,
    packets,
    metaRows: [
      ["SSID", connected?.ssid ?? "Not connected"],
      ["Authentication", connected?.authentication ?? "Unknown"],
      ["Cipher", connected?.cipher ?? "Unknown"],
      ["Signal", connected?.signalPercent == null ? "n/a" : `${connected.signalPercent}%`],
      ["Saved Profiles", `${report.profiles?.count ?? 0}`],
      ["Established TCP", `${report.netstat?.tcpEstablished ?? 0}`]
    ],
    findings:
      assessment.findings?.map(
        (finding) => `[${String(finding.severity).toUpperCase()}] ${finding.title}: ${finding.detail}`
      ) ?? ["No findings returned."],
    recommendations: assessment.recommendations ?? ["Continue periodic local audits."],
    notesSections: [
      {
        label: "Top External Endpoints",
        items:
          report.netstat?.topExternalRemotes?.map(
            (entry) => `${entry.host}: ${entry.connections} established connections`
          ) ?? ["No external endpoints were recorded."]
      },
      {
        label: "Collection Notes",
        items:
          payload.warnings?.length
            ? payload.warnings
            : ["Built-in Windows networking tools responded normally."]
      }
    ],
    unitLabel: "records",
    command,
    selectedPacketId: packets[0]?.id ?? null
  };
}

function parseFlowLabel(flowLabel) {
  const match = String(flowLabel || "").match(/^(.+?) -> (.+?) \((.+)\)$/);

  if (!match) {
    return {
      source: "Capture Engine",
      destination: "Observed Flow",
      protocol: "TCP"
    };
  }

  return {
    source: match[1],
    destination: match[2],
    protocol: match[3]
  };
}

function buildCaptureSummaryAnalysis(data, title, command) {
  const summary = data.summary ?? {};
  const packets = [];

  (summary.topFlows ?? []).slice(0, 10).forEach((flowEntry, index) => {
    const parsed = parseFlowLabel(flowEntry.flow);
    packets.push(
      makePacket(index, {
        source: parsed.source,
        destination: parsed.destination,
        protocol: parsed.protocol,
        length: 0,
        info: `${flowEntry.packets} packets observed in summary`,
        summary: `Flow summary: ${flowEntry.flow}`,
        sourceAddress: parsed.source,
        destinationAddress: parsed.destination,
        sourcePort: "-",
        destinationPort: "-",
        networkLabel: "tshark aggregate summary",
        transportLabel: "capture-summary",
        timeLabel: "summary",
        extras: [`Packets ${flowEntry.packets}`, `Protocol ${parsed.protocol}`]
      })
    );
  });

  if (packets.length === 0) {
    (summary.topProtocols ?? []).slice(0, 8).forEach((entry, index) => {
      packets.push(
        makePacket(index, {
          source: "Capture Engine",
          destination: "Protocol Distribution",
          protocol: entry.protocol,
          length: 0,
          info: `${entry.protocol} accounted for ${entry.count} packets`,
          summary: `Protocol summary: ${entry.protocol}`,
          sourceAddress: "Capture Engine",
          destinationAddress: "Protocol Distribution",
          sourcePort: "-",
          destinationPort: "-",
          networkLabel: "tshark aggregate summary",
          transportLabel: "capture-summary",
          timeLabel: "summary"
        })
      );
    });
  }

  if (packets.length === 0) {
    packets.push(
      makePacket(0, {
        source: "Capture Engine",
        destination: "No packets",
        protocol: "TCP",
        length: 0,
        info: "Capture completed without decodable rows",
        summary: "No packet rows were returned",
        sourcePort: "-",
        destinationPort: "-",
        networkLabel: "tshark aggregate summary",
        transportLabel: "capture-summary",
        timeLabel: "summary"
      })
    );
  }

  return {
    title,
    subtitle: `${summary.packetCount ?? 0} packets analyzed with average length ${summary.averagePacketSize ?? 0} bytes.`,
    statusLabel: "CAPTURE SUMMARY",
    statusLevel: "good",
    captureSummaryText: `${summary.packetCount ?? 0} packets / avg ${summary.averagePacketSize ?? 0} bytes`,
    packetMetaText: `${packets.length} aggregate rows from tshark summary output`,
    packets,
    metaRows: [
      ["Packets Analyzed", `${summary.packetCount ?? 0}`],
      ["Average Length", `${summary.averagePacketSize ?? 0} bytes`],
      ["Top Protocols", `${summary.topProtocols?.length ?? 0}`],
      ["Top Hosts", `${summary.topHosts?.length ?? 0}`]
    ],
    findings: (summary.topProtocols ?? []).map((entry) => `${entry.protocol}: ${entry.count} packets`),
    recommendations: ["Use a tighter filter or save a PCAP for full packet-by-packet inspection."],
    notesSections: [
      {
        label: "Top Hosts",
        items:
          summary.topHosts?.map((entry) => `${entry.host}: ${entry.packets} packets`) ??
          ["No host summary available."]
      },
      {
        label: "Top Flows",
        items:
          summary.topFlows?.map((entry) => `${entry.flow}: ${entry.packets}`) ??
          ["No flow summary available."]
      }
    ],
    unitLabel: "rows",
    command,
    selectedPacketId: packets[0]?.id ?? null
  };
}

function shouldUseWifiFallback(message) {
  return /tshark|npcap|enoent|eperm|packet capture/i.test(String(message || ""));
}

async function analyzeWifiAudit(command, options = {}) {
  const response = await fetch("/api/wifi/no-install-audit");
  const payload = await response.json();
  return buildWifiAnalysis(payload, command, options);
}

async function analyzeWiresharkCommand(command) {
  const tokens = String(command).trim().split(/\s+/);
  const subcommand = tokens[1]?.toLowerCase() ?? "status";

  if (subcommand === "status" || subcommand === "interfaces") {
    const response = await fetch("/api/wireshark/status");
    const payload = await response.json();

    if (!payload.available) {
      return analyzeWifiAudit(command, {
        title: "Wireshark Status / Fallback Audit",
        subtitle: `Live packet capture is not available. ${payload.reason || payload.message || "tshark unavailable"}`,
        statusLabel: "FALLBACK AUDIT",
        statusLevel: "warn"
      });
    }

    const packets = (payload.interfaces ?? []).map((item, index) =>
      makePacket(index, {
        source: item.label,
        destination: "Capture Engine",
        protocol: "TCP",
        length: 0,
        info: `Interface ${item.id} is ready for capture`,
        summary: payload.version || "tshark detected",
        sourceAddress: item.label,
        destinationAddress: "Capture Engine",
        sourcePort: "-",
        destinationPort: "-",
        networkLabel: "Capture Interface",
        transportLabel: "Interface Enumeration",
        timeLabel: "status"
      })
    );

    return {
      title: subcommand === "interfaces" ? "Capture Interfaces" : "Wireshark Status",
      subtitle: payload.version || "tshark detected",
      statusLabel: "LIVE READY",
      statusLevel: "good",
      captureSummaryText: `${payload.interfaces?.length ?? 0} interfaces ready`,
      packetMetaText: `${payload.interfaces?.length ?? 0} capture interfaces reported by tshark`,
      packets,
      metaRows: [
        ["Version", payload.version || "Detected"],
        ["Interfaces", `${payload.interfaces?.length ?? 0}`]
      ],
      findings:
        payload.interfaces?.map((item) => `id=${item.id} ${item.label}`) ?? ["No interfaces found."],
      recommendations: [
        "Use `wireshark capture iface=1 sec=10 packets=300` to pull a live summary.",
        "Use `wireshark pcap path=\"C:\\captures\\home.pcapng\"` for saved captures."
      ],
      notesSections: [
        {
          label: "Interfaces",
          items:
            payload.interfaces?.map((item) => `id=${item.id} | ${item.label}`) ?? ["No interfaces found."]
        }
      ],
      unitLabel: "interfaces",
      command,
      selectedPacketId: packets[0]?.id ?? null
    };
  }

  if (subcommand === "capture") {
    const body = {
      interfaceId: /iface=([^\s]+)/i.exec(command)?.[1] ?? "1",
      durationSeconds: Number(/sec=([^\s]+)/i.exec(command)?.[1] ?? 10),
      packetCount: Number(/packets=([^\s]+)/i.exec(command)?.[1] ?? 300),
      displayFilter: /filter=(.+)$/i.exec(command)?.[1] ?? ""
    };

    const response = await fetch("/api/wireshark/capture-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json();

    if (!payload.ok && (!payload.available || shouldUseWifiFallback(payload.error))) {
      return analyzeWifiAudit(command, {
        title: "Wireshark Capture / Fallback Audit",
        subtitle: payload.error || "Capture tools are unavailable, showing built-in audit instead.",
        statusLabel: "FALLBACK AUDIT",
        statusLevel: "warn"
      });
    }

    if (!payload.ok) {
      return {
        title: "Wireshark Capture Error",
        subtitle: payload.error || "Capture failed.",
        statusLabel: "CAPTURE ERROR",
        statusLevel: "danger",
        captureSummaryText: "0 rows / error",
        packetMetaText: "Capture returned an error before rows were generated",
        packets: [
          makePacket(0, {
            source: "Capture Engine",
            destination: "Wireshark Runtime",
            protocol: "ALERT",
            length: 0,
            info: payload.error || "Capture failed",
            summary: "Live capture error",
            sourcePort: "-",
            destinationPort: "-",
            timeLabel: "error"
          })
        ],
        metaRows: [["Interface", String(body.interfaceId)]],
        findings: [payload.error || "Unknown capture failure."],
        recommendations: ["Run `wireshark status` to verify local capture support."],
        notesSections: [],
        unitLabel: "rows",
        command,
        selectedPacketId: null
      };
    }

    return buildCaptureSummaryAnalysis(payload, "Live Capture Summary", command);
  }

  if (subcommand === "pcap") {
    const pathMatch = command.match(/path="?(.+?)"?$/i);
    const body = {
      filePath: pathMatch?.[1] ?? "",
      packetCount: Number(/packets=([^\s]+)/i.exec(command)?.[1] ?? 600),
      displayFilter: /filter=(.+)$/i.exec(command)?.[1] ?? ""
    };

    const response = await fetch("/api/wireshark/pcap-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json();

    if (!payload.ok && shouldUseWifiFallback(payload.error)) {
      return analyzeWifiAudit(command, {
        title: "PCAP Summary / Fallback Audit",
        subtitle: payload.error || "Packet tooling unavailable, showing built-in audit instead.",
        statusLabel: "FALLBACK AUDIT",
        statusLevel: "warn"
      });
    }

    if (!payload.ok) {
      return {
        title: "PCAP Summary Error",
        subtitle: payload.error || "Unable to parse pcap file.",
        statusLabel: "PCAP ERROR",
        statusLevel: "danger",
        captureSummaryText: "0 rows / error",
        packetMetaText: "Saved capture could not be summarized",
        packets: [
          makePacket(0, {
            source: "PCAP Loader",
            destination: body.filePath || "Unknown file",
            protocol: "ALERT",
            length: 0,
            info: payload.error || "PCAP parse failed",
            summary: "Saved capture error",
            sourcePort: "-",
            destinationPort: "-",
            timeLabel: "error"
          })
        ],
        metaRows: [["Path", body.filePath || "Missing path"]],
        findings: [payload.error || "PCAP parsing failed."],
        recommendations: ["Verify the file path and try again."],
        notesSections: [],
        unitLabel: "rows",
        command,
        selectedPacketId: null
      };
    }

    return buildCaptureSummaryAnalysis(payload, `PCAP Summary (${body.filePath})`, command);
  }

  return {
    title: "Wireshark Command Help",
    subtitle: "Supported commands are status, interfaces, capture, and pcap.",
    statusLabel: "HELP",
    statusLevel: "good",
    captureSummaryText: "4 commands",
    packetMetaText: "Command reference",
    packets: [
      makePacket(0, {
        source: "Command Palette",
        destination: "NULLVAULT",
        protocol: "TCP",
        length: 0,
        info:
          "Use wireshark status, wireshark interfaces, wireshark capture, or wireshark pcap",
        summary: "Command guide",
        sourcePort: "-",
        destinationPort: "-",
        timeLabel: "help"
      })
    ],
    metaRows: [["Mode", "Help"]],
    findings: [
      "wireshark status",
      "wireshark interfaces",
      "wireshark capture iface=1 sec=10 packets=300",
      'wireshark pcap path="C:\\captures\\home.pcapng"'
    ],
    recommendations: ["Use `wifi audit` if tshark is not installed."],
    notesSections: [],
    unitLabel: "commands",
    command,
    selectedPacketId: null
  };
}

function buildErrorAnalysis(command, error) {
  return {
    title: "Analyzer Error",
    subtitle: error instanceof Error ? error.message : "Unknown command failure.",
    statusLabel: "ERROR",
    statusLevel: "danger",
    captureSummaryText: "0 records / error",
    packetMetaText: `Command failed: ${command}`,
    packets: [
      makePacket(0, {
        source: "NULLVAULT",
        destination: "Workspace",
        protocol: "ALERT",
        length: 0,
        info: error instanceof Error ? error.message : "Unknown command failure.",
        summary: "Execution error",
        sourcePort: "-",
        destinationPort: "-",
        timeLabel: "error"
      })
    ],
    metaRows: [["Command", command]],
    findings: [error instanceof Error ? error.message : "Unknown command failure."],
    recommendations: ["Try a simpler command such as `wifi audit` or `scan network`."],
    notesSections: [],
    unitLabel: "records",
    command,
    selectedPacketId: null
  };
}

function buildInitialHistory(state) {
  const items = [];
  const log = state.commandLog ?? [];

  for (let index = 0; index < log.length; index += 1) {
    const entry = log[index];
    if (entry.role !== "user") {
      continue;
    }

    const nextAssistant = log.slice(index + 1).find((item) => item.role === "assistant");
    items.push({
      command: entry.text,
      note: nextAssistant?.title ?? "Seeded simulation",
      time: toClockFromIso(entry.timestamp)
    });
  }

  return items.slice(-6).reverse();
}

function updateChrome() {
  siteValue.textContent = runtimeConfig.siteName;
  modelBadge.textContent = `${currentAnalysis?.statusLabel?.toLowerCase() || "live workspace"} | ${currentAnalysis?.packets?.length ?? 0} rows | ${TIME_DISPLAY_LABELS[preferences.timeDisplay]}`;
}

async function syncRuntimeChrome() {
  if (!isDesktopApp) {
    return;
  }

  document.body.classList.add("desktop-shell");

  try {
    const runtime = await desktopBridge.getRuntime();

    providerValue.textContent = "desktop shell";
    if (runtime?.serverLabel) {
      serverValue.textContent = runtime.serverLabel.replace(
        /^(127\.0\.0\.1|localhost)/,
        DISPLAY_HOSTNAME
      );
    }
  } catch {
    providerValue.textContent = "desktop shell";
  }
}

function renderMenuState() {
  menuToggleButtons.forEach((button) => {
    const key = button.dataset.menuToggle;
    button.classList.toggle("checked", Boolean(preferences[key]));
  });

  menuTimeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.timeDisplay === preferences.timeDisplay);
  });
}

function positionMenu(button, menu) {
  const rect = button.getBoundingClientRect();
  menu.style.left = `${rect.left}px`;
  menu.style.top = `${rect.bottom - 1}px`;
}

function openTopMenu(menuName) {
  activeMenuName = menuName;
  menuPopovers.classList.remove("hidden");
  menuPopovers.setAttribute("aria-hidden", "false");

  viewMenuButton.classList.toggle("active", menuName === "view");
  viewMenu.classList.toggle("hidden", menuName !== "view");

  if (menuName === "view") {
    renderMenuState();
    positionMenu(viewMenuButton, viewMenu);
  }
}

function closeTopMenu() {
  activeMenuName = null;
  viewMenuButton.classList.remove("active");
  viewMenu.classList.add("hidden");
  menuPopovers.classList.add("hidden");
  menuPopovers.setAttribute("aria-hidden", "true");
}

async function toggleFullscreenMode() {
  if (isDesktopApp) {
    await desktopBridge.toggleMaximize();
    return;
  }

  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }

  await document.documentElement.requestFullscreen();
}

function activatePreferencePanel(panelName) {
  activePreferencePanel = panelName;

  prefNavItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.prefPanel === panelName);
  });

  prefPanes.forEach((pane) => {
    pane.classList.toggle("active", pane.dataset.prefPanel === panelName);
  });
}

function setAuxView(view, shouldPersist = true) {
  preferences.auxView = view;

  if (shouldPersist) {
    savePreferences();
  }

  auxTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.auxView === view);
  });

  byteView.classList.toggle("hidden", view !== "bytes");
  summaryPanel.classList.toggle("hidden", view !== "analysis");
  historyPanel.classList.toggle("hidden", view !== "history");

  auxPanelTitle.textContent =
    view === "bytes" ? "Packet Bytes" : view === "history" ? "History" : "Analysis";
}

function applyPreferences() {
  lowerWorkspace.dataset.layout = preferences.layout;
  document.body.classList.toggle("hide-packet-separator", !preferences.showPacketSeparator);
  document.body.classList.toggle("hide-column-menu", !preferences.showColumnMenu);
  document.body.classList.toggle("hide-main-toolbar", !preferences.showMainToolbar);
  document.body.classList.toggle("hide-filter-toolbar", !preferences.showFilterToolbar);
  document.body.classList.toggle("hide-statusbar", !preferences.showStatusBar);

  layoutInputs.forEach((input) => {
    input.checked = input.value === preferences.layout;
  });

  layoutCards.forEach((card) => {
    card.classList.toggle("active", card.dataset.layoutOption === preferences.layout);
  });

  prefShowSeparator.checked = preferences.showPacketSeparator;
  prefShowColumnMenu.checked = preferences.showColumnMenu;
  prefShowSelectedFrame.checked = preferences.showSelectedFrame;
  prefShowLoadTime.checked = preferences.showLoadTime;

  setAuxView(preferences.auxView, false);
  renderMenuState();
}

function currentLoadTimeMs() {
  const packets = currentAnalysis?.packets?.length ?? 0;
  return 28 + packets * 3;
}

function updateStatusDetail() {
  const packet = selectedPacket();

  selectionStatus.classList.toggle("hidden", !preferences.showSelectedFrame);
  if (packet && preferences.showSelectedFrame) {
    selectionStatus.textContent = `Frame ${packet.no} selected`;
  } else {
    selectionStatus.textContent = "Frame tracking hidden";
  }

  const baseSubtitle = currentAnalysis?.subtitle ?? "Analyzer ready";
  lastResponse.textContent = preferences.showLoadTime
    ? `${baseSubtitle} | load ${currentLoadTimeMs()} ms`
    : baseSubtitle;
}

function openConfigModal(panelName = "appearance") {
  closeTopMenu();
  modalSnapshot = {
    preferences: { ...preferences },
    siteName: runtimeConfig.siteName
  };
  siteNameInput.value = runtimeConfig.siteName;
  activatePreferencePanel(panelName);
  applyPreferences();
  configModal.classList.remove("hidden");
}

function closeConfigModal({ restore = false } = {}) {
  if (restore && modalSnapshot) {
    preferences = { ...modalSnapshot.preferences };
    runtimeConfig = { siteName: modalSnapshot.siteName };
    securityState.profile.siteName = runtimeConfig.siteName;
    siteNameInput.value = runtimeConfig.siteName;
    applyPreferences();
    updateStatusDetail();
  }

  configModal.classList.add("hidden");
  modalSnapshot = null;
}

function saveModalSettings() {
  const nextName = siteNameInput.value.trim();

  if (nextName) {
    runtimeConfig = { siteName: nextName };
    securityState.profile.siteName = runtimeConfig.siteName;
    saveRuntimeConfig();
  }

  preferences = {
    ...preferences,
    layout: layoutInputs.find((input) => input.checked)?.value ?? DEFAULT_PREFERENCES.layout,
    showPacketSeparator: prefShowSeparator.checked,
    showColumnMenu: prefShowColumnMenu.checked,
    showSelectedFrame: prefShowSelectedFrame.checked,
    showLoadTime: prefShowLoadTime.checked
  };

  savePreferences();
  applyPreferences();
  updateChrome();
  updateStatusDetail();
  closeConfigModal();
}

function restoreDefaultPreferences() {
  preferences = { ...DEFAULT_PREFERENCES };
  applyPreferences();
  updateStatusDetail();
}

function toggleMenuPreference(key) {
  preferences = {
    ...preferences,
    [key]: !preferences[key]
  };
  savePreferences();
  applyPreferences();
  updateStatusDetail();
}

function setTimeDisplay(mode) {
  preferences = {
    ...preferences,
    timeDisplay: mode
  };
  savePreferences();
  renderCurrentAnalysis();
}

function focusWorkspacePanel(panelName) {
  if (panelName === "bytes") {
    preferences = {
      ...preferences,
      auxView: "bytes"
    };
  } else if (panelName === "diagram") {
    preferences = {
      ...preferences,
      layout: "focused"
    };
  } else {
    preferences = {
      ...preferences,
      layout: "overview"
    };
  }

  savePreferences();
  applyPreferences();
  renderCurrentAnalysis();
}

function setLoading(loading) {
  isLoading = loading;
  thinkingBar.classList.toggle("hidden", !loading);
  sendButton.disabled = loading;
  statusText.textContent = loading ? "ANALYZING" : currentAnalysis?.statusLabel || "READY";
}

function statusColor(level) {
  if (level === "danger") {
    return "#c54242";
  }
  if (level === "warn") {
    return "#d58b1a";
  }

  return "#52a84c";
}

function selectedPacket() {
  return (
    currentAnalysis?.packets.find((packet) => packet.id === selectedPacketId) ??
    currentAnalysis?.packets[0] ??
    null
  );
}

function renderPacketTable() {
  const packets = currentAnalysis?.packets ?? [];

  packetBody.innerHTML = packets
    .map(
      (packet) => `
        <tr class="row-${escapeHtml(packet.tone)} ${packet.id === selectedPacketId ? "selected" : ""}" data-packet-id="${escapeHtml(packet.id)}">
          <td>${packet.no}</td>
          <td>${escapeHtml(formatPacketTime(packet, packets))}</td>
          <td>${escapeHtml(packet.source)}</td>
          <td>${escapeHtml(packet.destination)}</td>
          <td>${escapeHtml(packet.protocol)}</td>
          <td>${escapeHtml(packet.length)}</td>
          <td>${escapeHtml(packet.info)}</td>
        </tr>
      `
    )
    .join("");

  packetBody.querySelectorAll("tr").forEach((row) => {
    row.addEventListener("click", () => {
      selectedPacketId = row.dataset.packetId;
      renderCurrentAnalysis();
    });
  });
}

function renderDetailTree() {
  const packet = selectedPacket();

  if (!packet) {
    detailTree.innerHTML = '<div class="tree-node"><strong>No frame selected.</strong></div>';
    detailMeta.textContent = "Layer tree";
    return;
  }

  detailMeta.textContent = `${packet.protocol} / ${packet.length} bytes`;

  detailTree.innerHTML = buildDetailGroups(packet)
    .map(
      (group) => `
        <div class="tree-node level-0"><strong>${escapeHtml(group.label)}</strong></div>
        ${group.entries
          .map((entry) => `<div class="tree-node level-1">${escapeHtml(entry)}</div>`)
          .join("")}
      `
    )
    .join("");
}

function renderProtocolMap() {
  const packet = selectedPacket();

  if (!packet) {
    protocolMap.innerHTML = "";
    selectionText.textContent = "No frame selected";
    return;
  }

  selectionText.textContent = `${packet.source} -> ${packet.destination} / ${packet.protocol}`;

  protocolMap.innerHTML = buildLayers(packet)
    .map(
      (layer) => `
        <div class="layer-block">
          <div class="layer-header">${escapeHtml(layer.title)}</div>
          <div class="layer-grid">
            ${layer.cells
              .map(
                ([key, value]) => `
                  <div class="layer-cell">
                    <span class="layer-key">${escapeHtml(key)}</span>
                    <span class="layer-value">${escapeHtml(value)}</span>
                  </div>
                `
              )
              .join("")}
          </div>
        </div>
      `
    )
    .join("");
}

function renderSummaryPanel() {
  if (!currentAnalysis) {
    summaryPanel.innerHTML = "";
    return;
  }

  const mix = protocolMix(currentAnalysis.packets ?? []);

  summaryPanel.innerHTML = `
    <div class="summary-title">${escapeHtml(currentAnalysis.title)}</div>
    <div class="summary-subtitle">${escapeHtml(currentAnalysis.subtitle)}</div>
    <div class="protocol-strip">
      ${mix
        .map((item) => `<span class="protocol-chip">${escapeHtml(item.label)} x${item.count}</span>`)
        .join("")}
    </div>
    <div class="summary-grid">
      ${currentAnalysis.metaRows
        .map(
          ([label, value]) => `
            <div class="summary-stat">
              <span class="summary-stat-label">${escapeHtml(label)}</span>
              <span class="summary-stat-value">${escapeHtml(value)}</span>
            </div>
          `
        )
        .join("")}
    </div>
    <div class="summary-section">
      <h3>Key Findings</h3>
      <ul>
        ${currentAnalysis.findings.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </div>
    <div class="summary-section">
      <h3>Recommendations</h3>
      <ul>
        ${currentAnalysis.recommendations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </div>
    ${currentAnalysis.notesSections
      .map(
        (section) => `
          <div class="summary-section">
            <h3>${escapeHtml(section.label)}</h3>
            <ul>
              ${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </div>
        `
      )
      .join("")}
  `;
}

function renderHistoryPanel() {
  historyPanel.innerHTML = `
    <div class="history-title">Command History</div>
    ${commandHistory.length === 0 ? '<div class="history-entry"><div class="history-command">No live commands yet.</div><span class="history-note">Run a local audit or capture command to populate history.</span></div>' : ""}
    ${commandHistory
      .map(
        (entry) => `
          <div class="history-entry">
            <div class="history-command">${escapeHtml(entry.command)}</div>
            <span class="history-note">${escapeHtml(entry.note)} | ${escapeHtml(entry.time)}</span>
          </div>
        `
      )
      .join("")}
  `;
}

function renderAuxView() {
  renderByteView();
  renderSummaryPanel();
  renderHistoryPanel();
  setAuxView(preferences.auxView, false);
}

function renderCurrentAnalysis() {
  if (!currentAnalysis) {
    return;
  }

  if (!selectedPacketId && currentAnalysis.selectedPacketId) {
    selectedPacketId = currentAnalysis.selectedPacketId;
  }

  if (!selectedPacketId && currentAnalysis.packets[0]) {
    selectedPacketId = currentAnalysis.packets[0].id;
  }

  renderPacketTable();
  renderDetailTree();
  renderProtocolMap();
  renderAuxView();

  captureSummary.textContent = currentAnalysis.captureSummaryText;
  packetMeta.textContent = `${currentAnalysis.packetMetaText} | ${TIME_DISPLAY_LABELS[preferences.timeDisplay]}`;
  statusText.textContent = currentAnalysis.statusLabel;
  tokenText.textContent = `${currentAnalysis.packets.length} ${currentAnalysis.unitLabel ?? "records"}`;
  tokenBar.style.width = `${Math.min(100, currentAnalysis.packets.length * 5)}%`;
  statusLed.style.background = statusColor(currentAnalysis.statusLevel);
  statusLed.style.boxShadow = `0 0 0 2px ${statusColor(currentAnalysis.statusLevel)}22`;
  updateChrome();
  updateStatusDetail();
}

function applyAnalysis(command, analysis) {
  currentAnalysis = analysis;
  selectedPacketId = analysis.selectedPacketId ?? analysis.packets[0]?.id ?? null;
  commandHistory.unshift({
    command,
    note: analysis.title,
    time: formatClock()
  });
  commandHistory = commandHistory.slice(0, 8);
  saveCommandHistory();
  renderCurrentAnalysis();
}

function buildUnsupportedLiveCommandAnalysis(command) {
  return {
    title: "Live-Only Workspace",
    subtitle: `The command "${command}" is not available because demo simulation commands are disabled.`,
    statusLabel: "LIVE ONLY",
    statusLevel: "warn",
    captureSummaryText: "0 records / blocked",
    packetMetaText: "Only real local audit and capture commands are enabled",
    packets: [
      makePacket(0, {
        source: "NULLVAULT",
        destination: "Local Runtime",
        protocol: "ALERT",
        length: 0,
        info: `Unsupported command: ${command}`,
        summary: "Simulation command blocked in live-only mode",
        networkLabel: "Live Workspace Policy",
        transportLabel: "Command Validation",
        sourcePort: "-",
        destinationPort: "-",
        timeLabel: "policy"
      })
    ],
    metaRows: [
      ["Mode", "Live only"],
      ["Command", command]
    ],
    findings: [
      "Home-security demo flows are disabled.",
      "Only commands backed by local machine telemetry or tshark are allowed."
    ],
    recommendations: [
      "Use `wifi audit` or `scan network` for built-in Windows telemetry.",
      "Use `wireshark status` or `wireshark interfaces` to inspect capture readiness.",
      "Use `wireshark capture iface=1 sec=10 packets=300` for live capture summaries."
    ],
    notesSections: [],
    unitLabel: "records",
    command,
    selectedPacketId: null
  };
}

async function loadStartupAnalysis() {
  const analysis = await analyzeWiresharkCommand("wireshark status");
  currentAnalysis = analysis;
  selectedPacketId = analysis.selectedPacketId ?? analysis.packets[0]?.id ?? null;
  renderCurrentAnalysis();
}

async function executeCommand(command) {
  const trimmed = String(command || "").trim();

  if (!trimmed || isLoading) {
    return;
  }

  messageInput.value = trimmed;
  setLoading(true);

  try {
    await new Promise((resolve) => setTimeout(resolve, 220));

    let analysis;

    if (/^wifi\b/i.test(trimmed)) {
      analysis = await analyzeWifiAudit(trimmed);
    } else if (/^scan network$/i.test(trimmed)) {
      analysis = await analyzeWifiAudit(trimmed, {
        title: "Network Scan / Local Audit",
        subtitle: "Built-in Windows telemetry collected from Wi-Fi, ARP, and active sessions."
      });
    } else if (/^wireshark\b/i.test(trimmed)) {
      analysis = await analyzeWiresharkCommand(trimmed);
    } else {
      analysis = buildUnsupportedLiveCommandAnalysis(trimmed);
    }

    applyAnalysis(trimmed, analysis);
  } catch (error) {
    applyAnalysis(trimmed, buildErrorAnalysis(trimmed, error));
  } finally {
    setLoading(false);
  }
}

async function resetWorkspace() {
  commandHistory = [];
  saveCommandHistory();
  await loadStartupAnalysis();
}

function cycleExampleCommand() {
  const allExamples = EXAMPLE_COMMANDS;
  messageInput.value = allExamples[suggestionIndex % allExamples.length];
  suggestionIndex += 1;
  messageInput.focus();
}

async function clearLiveSession() {
  commandHistory = [];
  saveCommandHistory();
  closeConfigModal();
  await loadStartupAnalysis();
}

document.getElementById("new-chat-btn").addEventListener("click", () => {
  void resetWorkspace();
});

document.getElementById("attach-btn").addEventListener("click", () => {
  void resetWorkspace();
});

document.getElementById("command-btn").addEventListener("click", cycleExampleCommand);

document.querySelectorAll("[data-command]").forEach((button) => {
  button.addEventListener("click", () => {
    executeCommand(button.dataset.command);
  });
});

document.getElementById("send-btn").addEventListener("click", () => {
  executeCommand(messageInput.value);
});

viewMenuButton.addEventListener("click", (event) => {
  event.stopPropagation();

  if (activeMenuName === "view") {
    closeTopMenu();
    return;
  }

  openTopMenu("view");
});

menuToggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    toggleMenuPreference(button.dataset.menuToggle);
    closeTopMenu();
  });
});

menuTimeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setTimeDisplay(button.dataset.timeDisplay);
    closeTopMenu();
  });
});

menuFocusButtons.forEach((button) => {
  button.addEventListener("click", () => {
    focusWorkspacePanel(button.dataset.menuFocus);
    closeTopMenu();
  });
});

document.getElementById("menu-fullscreen-btn").addEventListener("click", async () => {
  closeTopMenu();
  await toggleFullscreenMode();
});

document.getElementById("settings-btn").addEventListener("click", () => {
  openConfigModal("appearance");
});

document.getElementById("config-save-btn").addEventListener("click", saveModalSettings);
document.getElementById("config-reset-btn").addEventListener("click", () => {
  void clearLiveSession();
});
document.getElementById("config-defaults-btn").addEventListener("click", restoreDefaultPreferences);
document.getElementById("config-cancel-btn").addEventListener("click", () => {
  closeConfigModal({ restore: true });
});
document.getElementById("config-close-btn").addEventListener("click", () => {
  closeConfigModal({ restore: true });
});

siteValue.addEventListener("click", () => {
  openConfigModal("capture");
});

prefNavItems.forEach((item) => {
  item.addEventListener("click", () => {
    activatePreferencePanel(item.dataset.prefPanel);
  });
});

layoutInputs.forEach((input) => {
  input.addEventListener("change", () => {
    preferences.layout = input.value;
    applyPreferences();
  });
});

auxTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setAuxView(tab.dataset.auxView);
  });
});

document.getElementById("win-min").addEventListener("click", () => {
  if (isDesktopApp) {
    desktopBridge.minimize();
    return;
  }

  void resetWorkspace();
});

document.getElementById("win-max").addEventListener("click", async () => {
  await toggleFullscreenMode();
});

document.getElementById("win-close").addEventListener("click", async () => {
  if (isDesktopApp) {
    await desktopBridge.close();
    return;
  }

  window.close();
});

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    executeCommand(messageInput.value);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && activeMenuName) {
    closeTopMenu();
    return;
  }

  if (event.key === "Escape" && !configModal.classList.contains("hidden")) {
    closeConfigModal({ restore: true });
  }
});

document.addEventListener("click", (event) => {
  if (
    activeMenuName &&
    !event.target.closest("#menu-popovers") &&
    !event.target.closest("[data-menu]")
  ) {
    closeTopMenu();
  }
});

window.addEventListener("resize", () => {
  if (activeMenuName === "view") {
    positionMenu(viewMenuButton, viewMenu);
  }
});

configModal.addEventListener("click", (event) => {
  if (event.target === configModal) {
    closeConfigModal({ restore: true });
  }
});

async function init() {
  await syncRuntimeChrome();
  applyPreferences();
  activatePreferencePanel(activePreferencePanel);
  await loadStartupAnalysis();
}

init();
