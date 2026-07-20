import { describe, expect, it } from "vitest";
import { renderHtmlReport } from "../src/report/html.js";
import type { ScanReport } from "../src/types.js";

const report: ScanReport = {
  schemaVersion: "1.0.0",
  scanner: { name: "web-evidence", version: "0.1.0" },
  scan: {
    target: "https://example.test/",
    startedAt: "2026-01-01T00:00:00.000Z",
    finishedAt: "2026-01-01T00:00:01.000Z",
    durationMs: 1000,
    options: { rejectConsent: false, timeoutMs: 30000, settleMs: 1500, includeQuery: false, redactHost: false },
  },
  consent: {
    bannerDetected: false,
    rejectControlDetected: false,
    rejectAttempted: false,
    rejectTriggered: false,
    controlLabel: null,
    note: "Observation only.",
  },
  document: {
    title: "Example <script>",
    language: "en",
    h1Count: 1,
    imageCount: 0,
    imagesMissingAlt: 0,
    formControlCount: 0,
    unlabeledFormControls: 0,
    privacyLinkDetected: true,
    legalNoticeLinkDetected: false,
  },
  accessibility: null,
  network: [],
  cookies: [],
  findings: [],
  warnings: [],
  dataPolicy: { responseBodiesStored: false, cookieValuesStored: false, queryStringsStored: false, legalAdvice: false },
};

describe("HTML report", () => {
  it("renders a standalone, escaped report", () => {
    const html = renderHtmlReport(report);
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Technical evidence, not a legal conclusion");
    expect(html).not.toContain("Example <script>");
  });
});
