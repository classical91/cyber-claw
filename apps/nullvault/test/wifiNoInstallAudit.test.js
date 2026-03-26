import test from "node:test";
import assert from "node:assert/strict";

import {
  buildNoInstallAudit,
  parseArpEntries,
  parseNetshInterfaces,
  parseNetstatSummary,
  parseWlanProfiles
} from "../src/wifiNoInstallAudit.js";

test("parseNetshInterfaces captures connected wireless details", () => {
  const parsed = parseNetshInterfaces(
    [
      "    Name                   : Wi-Fi",
      "    State                  : connected",
      "    SSID                   : SentinelMesh",
      "    BSSID                  : aa:bb:cc:dd:ee:ff",
      "    Radio type             : 802.11ax",
      "    Authentication         : WPA2-Personal",
      "    Cipher                 : CCMP",
      "    Channel                : 149",
      "    Receive rate (Mbps)    : 1200",
      "    Transmit rate (Mbps)   : 960",
      "    Signal                 : 82%"
    ].join("\n")
  );

  assert.equal(parsed.interfaces.length, 1);
  assert.equal(parsed.connected?.ssid, "SentinelMesh");
  assert.equal(parsed.connected?.authentication, "WPA2-Personal");
  assert.equal(parsed.connected?.signalPercent, 82);
});

test("parseArpEntries and parseNetstatSummary produce LAN and session totals", () => {
  const arp = parseArpEntries(
    [
      "Interface: 192.168.1.25 --- 0x10",
      "  Internet Address      Physical Address      Type",
      "  192.168.1.1           a0-b1-c2-d3-e4-f5     dynamic",
      "  192.168.1.44          00-11-22-33-44-55     dynamic",
      "  192.168.1.60          66-77-88-99-aa-bb     static"
    ].join("\n")
  );

  const netstat = parseNetstatSummary(
    [
      "  TCP    192.168.1.25:50122     142.250.72.78:443     ESTABLISHED     12000",
      "  TCP    192.168.1.25:50123     142.250.72.78:443     ESTABLISHED     12000",
      "  TCP    192.168.1.25:53111     192.168.1.1:53        ESTABLISHED     5100",
      "  TCP    0.0.0.0:445            0.0.0.0:0             LISTENING       4",
      "  UDP    0.0.0.0:5353           *:*                                    2040"
    ].join("\n")
  );

  assert.equal(arp.totalEntries, 3);
  assert.equal(arp.dynamicEntries, 2);
  assert.equal(arp.staticEntries, 1);

  assert.equal(netstat.tcpTotal, 4);
  assert.equal(netstat.tcpEstablished, 3);
  assert.equal(netstat.tcpListening, 1);
  assert.equal(netstat.udpTotal, 1);
  assert.equal(netstat.topExternalRemotes[0].host, "142.250.72.78");
  assert.equal(netstat.topExternalRemotes[0].connections, 2);
});

test("buildNoInstallAudit returns score, findings, and recommendations", () => {
  const report = buildNoInstallAudit({
    netshInterfaces: [
      "    Name                   : Wi-Fi",
      "    State                  : connected",
      "    SSID                   : HomeTest",
      "    Authentication         : Open",
      "    Cipher                 : None",
      "    Signal                 : 33%"
    ].join("\n"),
    netshProfiles: [
      "    All User Profile     : HomeTest",
      "    All User Profile     : CoffeeShop",
      "    All User Profile     : OfficeGuest"
    ].join("\n"),
    arpTable: [
      "Interface: 192.168.1.25 --- 0x10",
      "  Internet Address      Physical Address      Type",
      "  192.168.1.1           a0-b1-c2-d3-e4-f5     dynamic"
    ].join("\n"),
    netstat: [
      "  TCP    192.168.1.25:50122     142.250.72.78:443     ESTABLISHED     12000",
      "  TCP    0.0.0.0:445            0.0.0.0:0             LISTENING       4"
    ].join("\n")
  });

  assert.equal(report.mode, "no-install");
  assert.equal(report.profiles.count, 3);
  assert.equal(report.assessment.findings.length > 0, true);
  assert.equal(report.assessment.recommendations.length > 0, true);
  assert.equal(["medium", "high"].includes(report.assessment.riskLevel), true);
  assert.equal(report.assessment.score <= 79, true);
});

test("parseWlanProfiles deduplicates profile names", () => {
  const profiles = parseWlanProfiles(
    [
      "    All User Profile     : SentinelMesh",
      "    All User Profile     : SentinelMesh",
      "    All User Profile     : MobileHotspot"
    ].join("\n")
  );

  assert.equal(profiles.count, 2);
  assert.deepEqual(profiles.names, ["SentinelMesh", "MobileHotspot"]);
});
