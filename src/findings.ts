import type {
  AccessibilitySummary,
  ConsentEvidence,
  CookieEvidence,
  DocumentSignals,
  NetworkEvidence,
  TechnicalFinding,
} from "./types.js";

interface FindingInput {
  consent: ConsentEvidence;
  document: DocumentSignals;
  accessibility: AccessibilitySummary | null;
  network: NetworkEvidence[];
  cookies: CookieEvidence[];
}

export function buildFindings(input: FindingInput): TechnicalFinding[] {
  const findings: TechnicalFinding[] = [];
  const initialTrackers = input.network.filter((entry) => entry.phase === "initial" && entry.tracker);
  const postRejectTrackers = input.network.filter((entry) => entry.phase === "after_reject" && entry.tracker);
  const initialCookies = input.cookies.filter((entry) => entry.phase === "initial");

  if (initialTrackers.length > 0) {
    findings.push({
      id: "tracker-before-choice",
      title: "Known tracker endpoints observed before a consent action",
      severity: "high",
      summary: "Technical network evidence was recorded during the initial, untouched page load.",
      evidenceCount: initialTrackers.length,
      legalConclusion: false,
    });
  }
  if (!input.consent.bannerDetected && initialTrackers.length > 0) {
    findings.push({
      id: "tracker-without-detected-banner",
      title: "Tracker traffic observed without a detected consent surface",
      severity: "medium",
      summary: "Banner detection is heuristic. Review the screenshot and DOM before drawing conclusions.",
      evidenceCount: initialTrackers.length,
      legalConclusion: false,
    });
  }
  if (input.consent.rejectTriggered && postRejectTrackers.length > 0) {
    findings.push({
      id: "tracker-after-reject",
      title: "Known tracker endpoints observed after a reject action",
      severity: "high",
      summary: "Requests were recorded after the scanner triggered a visible reject control.",
      evidenceCount: postRejectTrackers.length,
      legalConclusion: false,
    });
  }
  if (initialCookies.length > 0) {
    findings.push({
      id: "cookies-on-initial-load",
      title: "Cookies present after the initial page load",
      severity: "info",
      summary: "Only cookie metadata is retained; values are never stored.",
      evidenceCount: initialCookies.length,
      legalConclusion: false,
    });
  }

  const severeA11y = input.accessibility?.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  ) ?? [];
  if (severeA11y.length > 0) {
    findings.push({
      id: "accessibility-serious",
      title: "Serious or critical accessibility rules failed",
      severity: "high",
      summary: "Automated axe-core results require manual validation and do not constitute certification.",
      evidenceCount: severeA11y.reduce((sum, violation) => sum + violation.affectedNodes, 0),
      legalConclusion: false,
    });
  }
  if (input.document.imagesMissingAlt > 0) {
    findings.push({
      id: "images-without-alt",
      title: "Images without an alt attribute",
      severity: "medium",
      summary: "Decorative images may use an empty alt attribute; missing attributes should be reviewed.",
      evidenceCount: input.document.imagesMissingAlt,
      legalConclusion: false,
    });
  }
  if (input.document.unlabeledFormControls > 0) {
    findings.push({
      id: "unlabeled-controls",
      title: "Form controls without a detectable label",
      severity: "medium",
      summary: "Controls were checked for native labels and common accessible-name attributes.",
      evidenceCount: input.document.unlabeledFormControls,
      legalConclusion: false,
    });
  }
  if (!input.document.language) {
    findings.push({
      id: "document-language-missing",
      title: "Document language is not declared",
      severity: "low",
      summary: "The root html element has no lang attribute.",
      evidenceCount: 1,
      legalConclusion: false,
    });
  }

  return findings;
}
