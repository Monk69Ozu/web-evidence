import { describe, expect, it } from "vitest";
import { buildFindings } from "../src/findings.js";

describe("technical findings", () => {
  it("reports tracker evidence without making a legal conclusion", () => {
    const findings = buildFindings({
      consent: {
        bannerDetected: false,
        rejectControlDetected: false,
        rejectAttempted: false,
        rejectTriggered: false,
        controlLabel: null,
        note: "Observation only.",
      },
      document: {
        title: "Example",
        language: "en",
        h1Count: 1,
        imageCount: 0,
        imagesMissingAlt: 0,
        formControlCount: 0,
        unlabeledFormControls: 0,
        privacyLinkDetected: true,
        legalNoticeLinkDetected: true,
      },
      accessibility: null,
      network: [
        {
          phase: "initial",
          method: "GET",
          resourceType: "script",
          url: "https://www.google-analytics.com/g/collect",
          host: "www.google-analytics.com",
          thirdParty: true,
          tracker: { id: "google-analytics", name: "Google Analytics", category: "analytics" },
        },
      ],
      cookies: [],
    });

    expect(findings.map((finding) => finding.id)).toEqual([
      "tracker-before-choice",
      "tracker-without-detected-banner",
    ]);
    expect(findings.every((finding) => finding.legalConclusion === false)).toBe(true);
  });
});
