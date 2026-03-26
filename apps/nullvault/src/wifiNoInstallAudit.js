function toNumber(value) {
  const parsed = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeKey(key) {
  return String(key).trim().toLowerCase();
}

function sortByCountThenLabel(left, right) {
  if (right.count !== left.count) {
    return right.count - left.count;
  }
  return left.label.localeCompare(right.label);
}

function isPrivateIp(host) {
  const value = String(host || "").toLowerCase();
  if (!value || value === "*" || value === "0.0.0.0" || value === "::") {
    return true;
  }

  if (value === "::1" || value.startsWith("fe80:") || value.startsWith("fc") || value.startsWith("fd")) {
    return true;
  }

  if (value.startsWith("127.") || value.startsWith("10.") || value.startsWith("192.168.") || value.startsWith("169.254.")) {
    return true;
  }

  const match = value.match(/^172\.(\d+)\./);
  if (match) {
    const secondOctet = Number(match[1]);
    if (secondOctet >= 16 && secondOctet <= 31) {
      return true;
    }
  }

  return false;
}

function parseAddressHost(address) {
  const value = String(address || "").trim();
  if (!value) {
    return "";
  }

  const bracketed = value.match(/^\[([^\]]+)\]:(\d+|\*)$/);
  if (bracketed) {
    return bracketed[1].toLowerCase();
  }

  const ipv4 = value.match(/^(\d{1,3}(?:\.\d{1,3}){3}):(\d+|\*)$/);
  if (ipv4) {
    return ipv4[1].toLowerCase();
  }

  const plain = value.match(/^([^:]+):(\d+|\*)$/);
  if (plain) {
    return plain[1].toLowerCase();
  }

  return value.toLowerCase();
}

export function parseNetshInterfaces(stdout) {
  const interfaces = [];
  let current = null;

  const lines = String(stdout ?? "").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([^:]+)\s*:\s*(.+)\s*$/);
    if (!match) {
      continue;
    }

    const key = normalizeKey(match[1]);
    const rawValue = String(match[2]).trim();

    if (key === "name") {
      if (current) {
        interfaces.push(current);
      }

      current = {
        name: rawValue,
        state: "",
        ssid: "",
        bssid: "",
        authentication: "",
        cipher: "",
        signalPercent: null,
        channel: "",
        radioType: "",
        rxMbps: null,
        txMbps: null
      };
      continue;
    }

    if (!current) {
      continue;
    }

    if (key === "state") {
      current.state = rawValue;
      continue;
    }

    if (key === "ssid") {
      current.ssid = rawValue;
      continue;
    }

    if (key === "bssid" || key === "ap bssid") {
      current.bssid = rawValue;
      continue;
    }

    if (key === "authentication") {
      current.authentication = rawValue;
      continue;
    }

    if (key === "cipher") {
      current.cipher = rawValue;
      continue;
    }

    if (key === "signal") {
      current.signalPercent = toNumber(rawValue);
      continue;
    }

    if (key === "channel") {
      current.channel = rawValue;
      continue;
    }

    if (key === "radio type") {
      current.radioType = rawValue;
      continue;
    }

    if (key === "receive rate (mbps)") {
      current.rxMbps = toNumber(rawValue);
      continue;
    }

    if (key === "transmit rate (mbps)") {
      current.txMbps = toNumber(rawValue);
      continue;
    }
  }

  if (current) {
    interfaces.push(current);
  }

  const connected =
    interfaces.find((entry) => /connected/i.test(entry.state)) ??
    interfaces.find((entry) => entry.ssid) ??
    null;

  return { interfaces, connected };
}

export function parseWlanProfiles(stdout) {
  const names = [];
  const lines = String(stdout ?? "").split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/All User Profile\s*:\s*(.+)$/i);
    if (match) {
      names.push(match[1].trim());
    }
  }

  const unique = [...new Set(names)];
  return {
    count: unique.length,
    names: unique
  };
}

export function parseArpEntries(stdout) {
  const entries = [];
  let interfaceIp = "";
  const lines = String(stdout ?? "").split(/\r?\n/);

  for (const line of lines) {
    const interfaceMatch = line.match(/^Interface:\s+([0-9.]+)\s+---/i);
    if (interfaceMatch) {
      interfaceIp = interfaceMatch[1];
      continue;
    }

    const entryMatch = line.match(
      /^\s*(\d{1,3}(?:\.\d{1,3}){3})\s+([0-9a-f-]{17}|ff-ff-ff-ff-ff-ff)\s+(\w+)\s*$/i
    );
    if (!entryMatch) {
      continue;
    }

    entries.push({
      interfaceIp,
      ip: entryMatch[1],
      mac: entryMatch[2].toLowerCase(),
      type: entryMatch[3].toLowerCase()
    });
  }

  const dynamicEntries = entries.filter((entry) => entry.type === "dynamic");
  const staticEntries = entries.filter((entry) => entry.type === "static");

  return {
    totalEntries: entries.length,
    dynamicEntries: dynamicEntries.length,
    staticEntries: staticEntries.length,
    entries
  };
}

export function parseNetstatSummary(stdout) {
  const externalRemoteCounts = new Map();
  let tcpTotal = 0;
  let tcpEstablished = 0;
  let tcpListening = 0;
  let udpTotal = 0;

  const lines = String(stdout ?? "").split(/\r?\n/);
  for (const line of lines) {
    const tcpMatch = line.match(/^\s*TCP\s+(\S+)\s+(\S+)\s+(\S+)\s+(\d+)\s*$/i);
    if (tcpMatch) {
      tcpTotal += 1;
      const remoteHost = parseAddressHost(tcpMatch[2]).replace(/^::ffff:/, "");
      const state = tcpMatch[3].toUpperCase();

      if (state === "ESTABLISHED") {
        tcpEstablished += 1;
        if (remoteHost && !isPrivateIp(remoteHost)) {
          externalRemoteCounts.set(remoteHost, (externalRemoteCounts.get(remoteHost) ?? 0) + 1);
        }
      } else if (state === "LISTENING") {
        tcpListening += 1;
      }
      continue;
    }

    const udpMatch = line.match(/^\s*UDP\s+(\S+)\s+(\S+)\s+(\d+)\s*$/i);
    if (udpMatch) {
      udpTotal += 1;
    }
  }

  const topExternalRemotes = [...externalRemoteCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort(sortByCountThenLabel)
    .slice(0, 8)
    .map((entry) => ({ host: entry.label, connections: entry.count }));

  return {
    tcpTotal,
    tcpEstablished,
    tcpListening,
    udpTotal,
    topExternalRemotes
  };
}

function buildAssessment(wifi, arp, netstat, profiles) {
  const findings = [];
  const recommendations = [];
  let score = 100;

  function addFinding(severity, title, detail) {
    findings.push({ severity, title, detail });
    if (severity === "high") {
      score -= 24;
    } else if (severity === "medium") {
      score -= 12;
    } else if (severity === "low") {
      score -= 6;
    }
  }

  if (!wifi.connected) {
    addFinding(
      "medium",
      "No connected Wi-Fi interface detected",
      "Audit is still useful, but Wi-Fi encryption and signal checks are limited until a wireless interface is connected."
    );
  } else {
    const auth = String(wifi.connected.authentication || "");
    const cipher = String(wifi.connected.cipher || "");
    const signal = wifi.connected.signalPercent;

    if (/open|none/i.test(auth)) {
      addFinding(
        "high",
        "Open Wi-Fi authentication detected",
        "This network appears to allow unauthenticated access."
      );
      recommendations.push("Set router security to WPA2-PSK (AES) or WPA3-Personal.");
    } else if (/wep/i.test(auth)) {
      addFinding(
        "high",
        "WEP authentication detected",
        "WEP is obsolete and can be cracked quickly."
      );
      recommendations.push("Replace WEP with WPA2-PSK (AES) or WPA3-Personal.");
    } else if (/wpa2|wpa3/i.test(auth)) {
      addFinding(
        "low",
        "Modern Wi-Fi authentication detected",
        `Current authentication: ${auth}.`
      );
    } else {
      addFinding(
        "medium",
        "Unrecognized Wi-Fi authentication mode",
        `Observed authentication value: ${auth || "unknown"}.`
      );
    }

    if (/tkip/i.test(cipher)) {
      addFinding(
        "medium",
        "Legacy cipher detected",
        `Current cipher: ${cipher}. TKIP is outdated.`
      );
      recommendations.push("Use AES/CCMP ciphers and disable TKIP if possible.");
    }

    if (Number.isFinite(signal) && signal < 40) {
      addFinding(
        "medium",
        "Weak Wi-Fi signal",
        `Signal is ${signal}%, which can cause unstable telemetry and roaming issues.`
      );
      recommendations.push("Move the AP or add mesh coverage to improve signal in weak areas.");
    }
  }

  if (arp.dynamicEntries > 35) {
    addFinding(
      "medium",
      "High dynamic LAN device count",
      `${arp.dynamicEntries} dynamic ARP entries were detected.`
    );
    recommendations.push("Review your router client list and move IoT devices to a guest VLAN/SSID.");
  }

  if (netstat.tcpEstablished > 120) {
    addFinding(
      "medium",
      "High number of established TCP sessions",
      `${netstat.tcpEstablished} established sessions are open right now.`
    );
    recommendations.push("Review high-connection apps and verify no unexpected background services are running.");
  }

  if (profiles.count > 20) {
    addFinding(
      "low",
      "Large saved Wi-Fi profile list",
      `${profiles.count} saved Wi-Fi profiles were found on this host.`
    );
    recommendations.push("Remove stale Wi-Fi profiles you no longer trust or use.");
  }

  score = Math.max(0, Math.min(100, score));
  const riskLevel = score >= 80 ? "low" : score >= 60 ? "medium" : "high";

  if (recommendations.length === 0) {
    recommendations.push("Keep firmware current and rotate Wi-Fi credentials on a regular schedule.");
    recommendations.push("Continue periodic local audits with `wifi audit`.");
  }

  return {
    score,
    riskLevel,
    findings,
    recommendations
  };
}

export function buildNoInstallAudit(raw) {
  const wifi = parseNetshInterfaces(raw.netshInterfaces ?? "");
  const arp = parseArpEntries(raw.arpTable ?? "");
  const netstat = parseNetstatSummary(raw.netstat ?? "");
  const profiles = parseWlanProfiles(raw.netshProfiles ?? "");
  const assessment = buildAssessment(wifi, arp, netstat, profiles);

  return {
    mode: "no-install",
    generatedAt: new Date().toISOString(),
    wifi,
    arp,
    netstat,
    profiles,
    assessment
  };
}
