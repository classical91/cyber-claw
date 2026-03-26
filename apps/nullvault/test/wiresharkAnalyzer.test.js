import test from "node:test";
import assert from "node:assert/strict";

import { parseInterfaceList, summarizePacketCsv } from "../src/wiresharkAnalyzer.js";

test("parseInterfaceList extracts numeric ids and labels", () => {
  const parsed = parseInterfaceList(
    [
      "1. \\Device\\NPF_{1111} (Intel Wi-Fi 6E AX210)",
      "2. \\Device\\NPF_{2222} (Ethernet)",
      "Loopback"
    ].join("\n")
  );

  assert.equal(parsed[0].id, "1");
  assert.match(parsed[0].label, /Intel Wi-Fi 6E AX210/);
  assert.equal(parsed[2].id, "Loopback");
});

test("summarizePacketCsv reports protocols, hosts, and flow totals", () => {
  const summary = summarizePacketCsv(
    [
      "1700000000,192.168.1.15,1.1.1.1,51544,443,,,TLS,122",
      "1700000001,1.1.1.1,192.168.1.15,443,51544,,,TLS,98",
      "1700000002,192.168.1.20,8.8.8.8,,,53122,53,DNS,86",
      "1700000003,192.168.1.20,8.8.8.8,,,53122,53,DNS,86"
    ].join("\n")
  );

  assert.equal(summary.packetCount, 4);
  assert.equal(summary.topProtocols[0].protocol, "DNS");
  assert.equal(summary.topProtocols[0].count, 2);
  assert.equal(summary.topHosts[0].host, "192.168.1.20");
  assert.equal(summary.topHosts[0].packets, 2);
  assert.equal(summary.averagePacketSize, 98);
  assert.ok(summary.topFlows.length > 0);
});
