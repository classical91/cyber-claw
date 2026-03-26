function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function cleanField(value) {
  return String(value ?? "").trim();
}

function parseCsvLine(line) {
  return String(line).split(",");
}

export function parseInterfaceList(stdout) {
  const lines = String(stdout ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const match = line.match(/^(\d+)\.\s+(.+)$/);
    if (!match) {
      return {
        id: line,
        label: line
      };
    }

    return {
      id: match[1],
      label: match[2]
    };
  });
}

export function summarizePacketCsv(csvOutput) {
  const lines = String(csvOutput ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const protocolCounts = new Map();
  const hostCounts = new Map();
  const flowCounts = new Map();
  const packetSizes = [];

  for (const line of lines) {
    const fields = parseCsvLine(line);
    const sourceIp = cleanField(fields[1]);
    const destinationIp = cleanField(fields[2]);
    const protocol = cleanField(fields[7] || "UNKNOWN").toUpperCase();
    const size = safeNumber(fields[8], 0);

    packetSizes.push(size);

    protocolCounts.set(protocol, (protocolCounts.get(protocol) ?? 0) + 1);

    const talker = sourceIp || destinationIp;
    if (talker) {
      hostCounts.set(talker, (hostCounts.get(talker) ?? 0) + 1);
    }

    const flowKey = `${sourceIp || "unknown"} -> ${destinationIp || "unknown"} (${protocol})`;
    flowCounts.set(flowKey, (flowCounts.get(flowKey) ?? 0) + 1);
  }

  const averagePacketSize =
    packetSizes.length === 0
      ? 0
      : Math.round(packetSizes.reduce((sum, value) => sum + value, 0) / packetSizes.length);

  const topProtocols = [...protocolCounts.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }
      return left[0].localeCompare(right[0]);
    })
    .slice(0, 6)
    .map(([protocol, count]) => ({ protocol, count }));

  const topHosts = [...hostCounts.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }
      return left[0].localeCompare(right[0]);
    })
    .slice(0, 8)
    .map(([host, packets]) => ({ host, packets }));

  const topFlows = [...flowCounts.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }
      return left[0].localeCompare(right[0]);
    })
    .slice(0, 8)
    .map(([flow, packets]) => ({ flow, packets }));

  return {
    packetCount: lines.length,
    averagePacketSize,
    topProtocols,
    topHosts,
    topFlows
  };
}
