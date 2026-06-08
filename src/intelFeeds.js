import https from "node:https";
import http from "node:http";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let _cache = null;
let _cacheTime = 0;

function fetchJson(urlStr, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const mod = url.protocol === "https:" ? https : http;
    const req = mod.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: url.pathname + url.search,
        method: "GET",
        headers: {
          "User-Agent": "CyberClaw-IntelRadar/1.0 (defensive-security-tool)",
          Accept: "application/json",
          ...extraHeaders
        }
      },
      (res) => {
        if (res.statusCode >= 301 && res.statusCode <= 303 && res.headers.location) {
          fetchJson(res.headers.location, extraHeaders).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode} from ${urlStr}`));
          res.resume();
          return;
        }
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (c) => { raw += c; });
        res.on("end", () => {
          try { resolve(JSON.parse(raw)); }
          catch { reject(new Error(`Non-JSON response from ${urlStr}`)); }
        });
      }
    );
    req.setTimeout(12000, () => { req.destroy(new Error(`Timeout fetching ${urlStr}`)); });
    req.on("error", reject);
    req.end();
  });
}

function severityFromScore(score) {
  if (score == null) return "unknown";
  if (score >= 9.0) return "critical";
  if (score >= 7.0) return "high";
  if (score >= 4.0) return "medium";
  return "low";
}

async function fetchCisa() {
  const data = await fetchJson(
    "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
  );
  const vulns = data.vulnerabilities || [];
  return vulns.slice(-30).reverse().map((v) => ({
    source: "CISA",
    id: v.cveID || "",
    title: v.vulnerabilityName || v.cveID || "Unknown",
    severity: "high",
    affected: [v.vendorProject, v.product].filter(Boolean).join(" ").trim() || "Unknown",
    published: v.dateAdded || "",
    url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
    action: v.requiredAction || "Apply vendor patch.",
    description: v.shortDescription || ""
  }));
}

async function fetchNvd() {
  const data = await fetchJson(
    "https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=20"
  );
  return (data.vulnerabilities || []).map((entry) => {
    const cve = entry.cve || {};
    const desc = (cve.descriptions || []).find((d) => d.lang === "en")?.value || "";
    const metrics = cve.metrics || {};
    const cvss31 = (metrics.cvssMetricV31 || [])[0]?.cvssData;
    const cvss30 = (metrics.cvssMetricV30 || [])[0]?.cvssData;
    const cvss2 = (metrics.cvssMetricV2 || [])[0]?.cvssData;
    const cvss = cvss31 || cvss30;
    const score = cvss?.baseScore ?? cvss2?.baseScore;
    const sev = cvss?.baseSeverity?.toLowerCase() || severityFromScore(score);
    return {
      source: "NVD",
      id: cve.id || "",
      title: cve.id || "Unknown CVE",
      severity: sev || "unknown",
      affected: "See NVD",
      published: (cve.published || "").slice(0, 10),
      url: cve.id ? `https://nvd.nist.gov/vuln/detail/${cve.id}` : "https://nvd.nist.gov/vuln",
      action: "Review and apply applicable vendor patches.",
      description: desc
    };
  });
}

async function fetchGitHub() {
  const data = await fetchJson(
    "https://api.github.com/advisories?per_page=20&type=reviewed",
    { "X-GitHub-Api-Version": "2022-11-28" }
  );
  if (!Array.isArray(data)) return [];
  return data.map((a) => ({
    source: "GitHub",
    id: a.cve_id || a.ghsa_id || "",
    title: a.summary || a.ghsa_id || "Unknown advisory",
    severity: (a.severity || "unknown").toLowerCase(),
    affected: (a.vulnerabilities || [])
      .map((v) => `${v.package?.ecosystem || ""}/${v.package?.name || ""}`)
      .filter(Boolean)
      .slice(0, 2)
      .join(", ") || "See advisory",
    published: (a.published_at || "").slice(0, 10),
    url: a.html_url || `https://github.com/advisories/${a.ghsa_id}`,
    action: "Update affected packages to patched versions.",
    description: a.description || a.summary || ""
  }));
}

async function fetchMsrc() {
  const data = await fetchJson(
    "https://api.msrc.microsoft.com/cvrf/v2.0/updates",
    { Accept: "application/json" }
  );
  return (data.value || []).slice(0, 10).map((u) => ({
    source: "MSRC",
    id: u.ID || u.Alias || "",
    title: u.DocumentTitle || `Microsoft Security Update ${u.ID}`,
    severity: "high",
    affected: "Microsoft products",
    published: (u.InitialReleaseDate || "").slice(0, 10),
    url: u.CvrfUrl || "https://msrc.microsoft.com/update-guide/",
    action: "Apply updates via Windows Update or WSUS.",
    description: `Security advisory batch for ${u.ID || "current cycle"}.`
  }));
}

export async function fetchAllFeeds() {
  const now = Date.now();
  if (_cache && now - _cacheTime < CACHE_TTL_MS) {
    return _cache;
  }

  const results = await Promise.allSettled([
    fetchCisa(),
    fetchNvd(),
    fetchGitHub(),
    fetchMsrc()
  ]);

  const feeds = [];
  const errors = [];

  for (const r of results) {
    if (r.status === "fulfilled") {
      feeds.push(...r.value);
    } else {
      errors.push(r.reason?.message || "Unknown feed error");
    }
  }

  feeds.sort((a, b) => (b.published || "").localeCompare(a.published || ""));

  _cache = { feeds, fetchedAt: new Date().toISOString(), errors };
  _cacheTime = now;
  return _cache;
}
