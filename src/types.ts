export type ScanPhase = "initial" | "after_reject";
export type Severity = "info" | "low" | "medium" | "high" | "critical";

export interface ScanOptions {
  rejectConsent: boolean;
  timeoutMs: number;
  settleMs: number;
  includeQuery: boolean;
  redactHost: boolean;
  headed: boolean;
}

export interface TrackerMatch {
  id: string;
  name: string;
  category: "analytics" | "advertising" | "session-replay" | "social" | "support";
}

export interface NetworkEvidence {
  phase: ScanPhase;
  method: string;
  resourceType: string;
  url: string;
  host: string;
  thirdParty: boolean;
  tracker: TrackerMatch | null;
}

export interface CookieEvidence {
  phase: ScanPhase;
  name: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: string;
  session: boolean;
}

export interface ConsentEvidence {
  bannerDetected: boolean;
  rejectControlDetected: boolean;
  rejectAttempted: boolean;
  rejectTriggered: boolean;
  controlLabel: string | null;
  note: string;
}

export interface DocumentSignals {
  title: string;
  language: string | null;
  h1Count: number;
  imageCount: number;
  imagesMissingAlt: number;
  formControlCount: number;
  unlabeledFormControls: number;
  privacyLinkDetected: boolean;
  legalNoticeLinkDetected: boolean;
}

export interface AccessibilityViolation {
  id: string;
  impact: string | null;
  help: string;
  helpUrl: string;
  affectedNodes: number;
  targets: string[];
}

export interface AccessibilitySummary {
  engine: "axe-core";
  engineVersion: string;
  violationCount: number;
  affectedNodeCount: number;
  byImpact: Record<string, number>;
  violations: AccessibilityViolation[];
}

export interface TechnicalFinding {
  id: string;
  title: string;
  severity: Severity;
  summary: string;
  evidenceCount: number;
  legalConclusion: false;
}

export interface ScanReport {
  schemaVersion: "1.0.0";
  scanner: {
    name: "web-evidence";
    version: string;
  };
  scan: {
    target: string;
    startedAt: string;
    finishedAt: string;
    durationMs: number;
    options: Omit<ScanOptions, "headed">;
  };
  consent: ConsentEvidence;
  document: DocumentSignals;
  accessibility: AccessibilitySummary | null;
  network: NetworkEvidence[];
  cookies: CookieEvidence[];
  findings: TechnicalFinding[];
  warnings: string[];
  dataPolicy: {
    responseBodiesStored: false;
    cookieValuesStored: false;
    queryStringsStored: boolean;
    legalAdvice: false;
  };
}
