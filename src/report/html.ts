import type { ScanReport, Severity } from "../types.js";
import { shortHash } from "../redaction.js";

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function severityRank(severity: Severity): number {
  return { critical: 5, high: 4, medium: 3, low: 2, info: 1 }[severity];
}

export function renderHtmlReport(report: ScanReport): string {
  const findings = [...report.findings].sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  const trackers = report.network.filter((entry) => entry.tracker);
  const uniqueTrackers = new Map(trackers.map((entry) => [entry.tracker?.id, entry.tracker]));
  const initialTrackers = trackers.filter((entry) => entry.phase === "initial").length;
  const severeA11y = report.accessibility?.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  ).length ?? 0;
  const evidenceId = `WE-${shortHash(`${report.scan.target}|${report.scan.finishedAt}|${report.scan.durationMs}`).toUpperCase()}`;

  const findingRows = findings.length
    ? findings
        .map(
          (finding) => `
            <article class="finding">
              <div class="finding-head">
                <span class="severity severity-${escapeHtml(finding.severity)}">${escapeHtml(finding.severity)}</span>
                <strong>${escapeHtml(finding.title)}</strong>
                <span class="count">${finding.evidenceCount} signal${finding.evidenceCount === 1 ? "" : "s"}</span>
              </div>
              <p>${escapeHtml(finding.summary)}</p>
            </article>`,
        )
        .join("")
    : '<div class="empty">No automated technical findings were produced.</div>';

  const trackerRows = [...uniqueTrackers.values()]
    .filter((tracker): tracker is NonNullable<typeof tracker> => Boolean(tracker))
    .map(
      (tracker) => `<tr><td>${escapeHtml(tracker.name)}</td><td>${escapeHtml(tracker.category)}</td><td>${
        trackers.filter((entry) => entry.tracker?.id === tracker.id && entry.phase === "initial").length
      }</td><td>${trackers.filter((entry) => entry.tracker?.id === tracker.id && entry.phase === "after_reject").length}</td></tr>`,
    )
    .join("");

  const a11yRows = (report.accessibility?.violations ?? [])
    .slice(0, 20)
    .map(
      (violation) => `<tr><td><a href="${escapeHtml(violation.helpUrl)}">${escapeHtml(violation.id)}</a></td><td>${escapeHtml(
        violation.impact ?? "unknown",
      )}</td><td>${escapeHtml(violation.help)}</td><td>${violation.affectedNodes}</td></tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Web Evidence report</title>
  <style>
    :root{color-scheme:light;--ink:#10231d;--muted:#62716b;--line:#d6e1db;--paper:#f2f5f3;--card:#fff;--accent:#087853;--accent-dark:#12372b;--amber:#a86200;--high:#b42318;--medium:#b54708;--low:#175cd3;--info:#475467}
    *{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
    main{max-width:1120px;margin:0 auto;padding:52px 28px 88px}.masthead{display:grid;grid-template-columns:1fr 310px;gap:46px;align-items:end;margin-bottom:28px}
    h1{font-size:clamp(38px,6vw,68px);line-height:.94;margin:10px 0 18px;letter-spacing:-.055em;font-weight:760}h2{font-size:19px;margin:0 0 18px;letter-spacing:-.015em}.eyebrow{font:700 11px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}
    .target{color:var(--muted);overflow-wrap:anywhere;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:13px}.audit-stamp{background:var(--accent-dark);color:#eef8f3;padding:20px 22px;border-left:5px solid #42d59d;box-shadow:0 14px 36px rgba(16,35,29,.12)}
    .audit-stamp>span,.audit-stamp dt{display:block;color:#a9c8bc;font:700 10px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.12em;text-transform:uppercase}.audit-stamp>strong{display:block;margin:7px 0 17px;font:700 21px/1 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.04em}.audit-stamp dl{margin:0;display:grid;grid-template-columns:1fr 1fr;gap:12px}.audit-stamp dd{margin:4px 0 0;font:600 12px/1.3 ui-monospace,SFMono-Regular,Consolas,monospace}
    .summary-strip{display:grid;grid-template-columns:repeat(4,1fr);background:var(--card);border-block:1px solid var(--line);margin:34px 0 18px}.metric{padding:20px 22px;border-right:1px solid var(--line)}.metric:last-child{border-right:0}.metric strong{display:block;font:700 30px/1 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:-.05em}.metric span{display:block;margin-top:8px;color:var(--muted);font-size:12px}
    .phase-line{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid var(--line);margin-bottom:30px}.phase{position:relative;padding:14px 18px 18px 30px;color:var(--muted);font-size:12px}.phase::before{content:"";position:absolute;left:0;top:19px;width:18px;height:2px;background:var(--line)}.phase.active::before{background:var(--accent)}.phase strong{display:block;color:var(--ink);font:700 11px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}.phase.muted strong{color:var(--muted)}
    .report-grid{display:grid;grid-template-columns:260px minmax(0,1fr);gap:28px;align-items:start}.evidence-rail{border-top:3px solid var(--accent);background:#e9f0ec;padding:20px}.rail-section+.rail-section{border-top:1px solid #cbd9d1;margin-top:20px;padding-top:20px}.rail-title{margin:0 0 14px;font:700 10px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}
    .panel{background:var(--card);border-top:1px solid var(--line);padding:24px 26px;margin-bottom:14px;box-shadow:0 8px 24px rgba(16,35,29,.035)}.finding{border-left:3px solid var(--line);padding:15px 16px;margin:10px 0;background:#f8faf9}.finding-head{display:flex;align-items:center;gap:10px}.finding p{margin:8px 0 0;color:var(--muted)}.count{margin-left:auto;color:var(--muted);font:600 11px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:nowrap}
    .severity{font-size:10px;text-transform:uppercase;letter-spacing:.08em;padding:4px 7px;border-radius:999px;color:white;font-weight:800}.severity-critical,.severity-high{background:var(--high)}.severity-medium{background:var(--medium)}.severity-low{background:var(--low)}.severity-info{background:var(--info)}
    .table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;min-width:560px}th,td{text-align:left;padding:10px 8px;border-bottom:1px solid var(--line);vertical-align:top}th{font:700 10px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}td{font-size:13px}a{color:var(--accent);text-underline-offset:3px}
    .facts{display:grid;gap:0}.fact{padding:10px 0;border-bottom:1px solid #cbd9d1}.fact span{display:block;color:var(--muted);font-size:11px}.fact strong{font:700 13px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace}.empty,.notice{padding:15px 16px;background:#edf3f0;color:var(--muted)}.notice{margin-top:14px;border-left:4px solid var(--accent)}
    .policy-list{list-style:none;margin:0;padding:0}.policy-list li{padding:7px 0;color:var(--muted);font-size:12px}.policy-list li::before{content:"✓";color:var(--accent);font-weight:800;margin-right:7px}
    footer{margin-top:30px;padding-top:16px;border-top:1px solid var(--line);color:var(--muted);font:500 11px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace}@media(max-width:800px){main{padding:34px 24px 64px}.masthead{grid-template-columns:1fr;gap:24px}.audit-stamp{max-width:none}.summary-strip{grid-template-columns:1fr 1fr}.metric:nth-child(2){border-right:0}.metric:nth-child(-n+2){border-bottom:1px solid var(--line)}.phase-line{grid-template-columns:1fr}.phase{padding-block:10px}.report-grid{grid-template-columns:1fr}.evidence-rail{order:0}.content{order:1}.finding-head{align-items:flex-start;flex-wrap:wrap}.count{width:100%;margin:0}}@media(max-width:430px){main{padding-inline:20px}h1{font-size:44px}.summary-strip{margin-top:28px}.metric{padding:17px 15px}.metric strong{font-size:25px}.panel{padding:21px 19px}.audit-stamp dl{grid-template-columns:1fr}.phase-line{margin-bottom:22px}}
  </style>
</head>
<body>
<main>
  <header class="masthead">
    <div><div class="eyebrow">Evidence-first web diagnostics</div><h1>Web Evidence</h1><div class="target">${escapeHtml(
      report.scan.target,
    )}</div></div>
    <div class="audit-stamp"><span>Evidence ID</span><strong>${escapeHtml(evidenceId)}</strong><dl><div><dt>Schema</dt><dd>${escapeHtml(report.schemaVersion)}</dd></div><div><dt>Runtime</dt><dd>${report.scan.durationMs} ms</dd></div><div><dt>Completed</dt><dd>${escapeHtml(report.scan.finishedAt.slice(0,10))}</dd></div><div><dt>Mode</dt><dd>${report.consent.rejectAttempted ? "Reject check" : "Observe only"}</dd></div></dl></div>
  </header>
  <section class="summary-strip" aria-label="Summary">
    <div class="metric"><strong>${findings.length}</strong><span>technical findings</span></div>
    <div class="metric"><strong>${initialTrackers}</strong><span>initial tracker requests</span></div>
    <div class="metric"><strong>${severeA11y}</strong><span>serious accessibility rules</span></div>
    <div class="metric"><strong>${report.cookies.length}</strong><span>cookie metadata records</span></div>
  </section>
  <section class="phase-line" aria-label="Evidence phases"><div class="phase active"><strong>01 · Untouched load</strong>Initial browser evidence captured</div><div class="phase ${report.consent.rejectAttempted ? "active" : "muted"}"><strong>02 · Reject state</strong>${report.consent.rejectAttempted ? (report.consent.rejectTriggered ? "Reject control triggered" : "No supported control triggered") : "Not requested"}</div><div class="phase active"><strong>03 · Human review</strong>Required before any conclusion</div></section>
  <div class="report-grid">
    <aside class="evidence-rail">
      <section class="rail-section"><h2 class="rail-title">Consent signals</h2><div class="facts">
        <div class="fact"><span>Surface detected</span><strong>${report.consent.bannerDetected ? "Yes" : "No"}</strong></div>
        <div class="fact"><span>Reject control</span><strong>${report.consent.rejectControlDetected ? "Yes" : "No"}</strong></div>
        <div class="fact"><span>Reject triggered</span><strong>${report.consent.rejectTriggered ? "Yes" : "No"}</strong></div>
      </div></section>
      <section class="rail-section"><h2 class="rail-title">Document signals</h2><div class="facts">
        <div class="fact"><span>Language</span><strong>${escapeHtml(report.document.language ?? "Not declared")}</strong></div>
        <div class="fact"><span>Privacy link</span><strong>${report.document.privacyLinkDetected ? "Yes" : "No"}</strong></div>
        <div class="fact"><span>Legal notice</span><strong>${report.document.legalNoticeLinkDetected ? "Yes" : "No"}</strong></div>
      </div></section>
      <section class="rail-section"><h2 class="rail-title">Data boundary</h2><ul class="policy-list"><li>No response bodies</li><li>No cookie values</li><li>${report.dataPolicy.queryStringsStored ? "Queries retained by request" : "Queries removed"}</li><li>No legal verdict</li></ul></section>
    </aside>
    <div class="content">
      <section class="panel"><h2>Technical findings</h2>${findingRows}</section>
      <section class="panel"><h2>Known tracker endpoints</h2>${trackerRows ? `<div class="table-wrap"><table><thead><tr><th>Service</th><th>Category</th><th>Initial</th><th>After reject</th></tr></thead><tbody>${trackerRows}</tbody></table></div>` : '<div class="empty">No catalogued tracker endpoint was observed.</div>'}</section>
      <section class="panel"><h2>Accessibility rules</h2>${a11yRows ? `<div class="table-wrap"><table><thead><tr><th>Rule</th><th>Impact</th><th>Help</th><th>Nodes</th></tr></thead><tbody>${a11yRows}</tbody></table></div>` : '<div class="empty">No axe-core violation was reported, or accessibility analysis was unavailable.</div>'}</section>
      <div class="notice"><strong>Technical evidence, not a legal conclusion.</strong><br>Automated observations can be incomplete or incorrect. Validate findings manually and obtain qualified advice where required.</div>
    </div>
  </div>
  <footer>Generated by web-evidence ${escapeHtml(report.scanner.version)}. Response bodies and cookie values were not stored.</footer>
</main>
</body>
</html>`;
}
