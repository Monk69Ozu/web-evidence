import { chromium, type BrowserContext, type Request } from "playwright";
import { analyzeAccessibility } from "./analysis/accessibility.js";
import { inspectConsent } from "./analysis/consent.js";
import { analyzeDocument } from "./analysis/document.js";
import { classifyTracker, isRelatedHost } from "./analysis/trackers.js";
import { buildFindings } from "./findings.js";
import { sanitizeUrl, shortHash } from "./redaction.js";
import { assertPublicHttpUrl, PublicUrlGuard } from "./security/url-guard.js";
import type { CookieEvidence, NetworkEvidence, ScanOptions, ScanPhase, ScanReport } from "./types.js";

export const VERSION = "0.1.0";
const MAX_NETWORK_RECORDS = 2_000;

function displayHost(host: string, redact: boolean): string {
  return redact ? `host-${shortHash(host.replace(/^\./, ""))}` : host;
}

function cookieEvidence(
  cookies: Awaited<ReturnType<BrowserContext["cookies"]>>,
  phase: ScanPhase,
  redactHost: boolean,
): CookieEvidence[] {
  return cookies.map((cookie) => ({
    phase,
    name: cookie.name,
    domain: displayHost(cookie.domain, redactHost),
    path: cookie.path,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
    session: cookie.expires <= 0,
  }));
}

function deduplicateCookies(cookies: CookieEvidence[]): CookieEvidence[] {
  const seen = new Set<string>();
  return cookies.filter((cookie) => {
    const key = `${cookie.phase}|${cookie.name}|${cookie.domain}|${cookie.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function scan(target: string, options: ScanOptions): Promise<ScanReport> {
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  const validatedTarget = await assertPublicHttpUrl(target);
  const targetHost = validatedTarget.hostname;
  const warnings: string[] = [];
  const network: NetworkEvidence[] = [];
  const networkKeys = new Set<string>();
  const allCookies: CookieEvidence[] = [];
  let phase: ScanPhase = "initial";
  let networkLimitReached = false;

  const browser = await chromium.launch({ headless: !options.headed });
  try {
    const context = await browser.newContext({
      ignoreHTTPSErrors: false,
      serviceWorkers: "block",
      userAgent: `web-evidence/${VERSION} (+https://github.com/Monk69Ozu/web-evidence)`,
    });
    const guard = new PublicUrlGuard();
    await context.route("**/*", async (route) => {
      const allowed = await guard.allows(route.request().url());
      if (allowed) await route.continue();
      else await route.abort("blockedbyclient");
    });

    const page = await context.newPage();
    page.on("request", (request: Request) => {
      if (network.length >= MAX_NETWORK_RECORDS) {
        networkLimitReached = true;
        return;
      }
      let requestUrl: URL;
      try {
        requestUrl = new URL(request.url());
      } catch {
        return;
      }
      if (!["http:", "https:"].includes(requestUrl.protocol)) return;

      const sanitized = sanitizeUrl(request.url(), options.includeQuery, options.redactHost);
      const key = `${phase}|${request.method()}|${request.resourceType()}|${sanitized}`;
      if (networkKeys.has(key)) return;
      networkKeys.add(key);
      network.push({
        phase,
        method: request.method(),
        resourceType: request.resourceType(),
        url: sanitized,
        host: displayHost(requestUrl.hostname, options.redactHost),
        thirdParty: !isRelatedHost(targetHost, requestUrl.hostname),
        tracker: classifyTracker(request.url()),
      });
    });

    await page.goto(validatedTarget.toString(), {
      waitUntil: "domcontentloaded",
      timeout: options.timeoutMs,
    });
    await page.waitForTimeout(options.settleMs);

    const document = await analyzeDocument(page);
    let accessibility = null;
    try {
      accessibility = await analyzeAccessibility(page);
    } catch (error) {
      warnings.push(`Accessibility analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    allCookies.push(...cookieEvidence(await context.cookies(), "initial", options.redactHost));

    if (options.rejectConsent) phase = "after_reject";
    const consent = await inspectConsent(page, options.rejectConsent);
    if (consent.rejectTriggered) {
      await page.waitForTimeout(options.settleMs);
      allCookies.push(...cookieEvidence(await context.cookies(), "after_reject", options.redactHost));
    }
    if (networkLimitReached) {
      warnings.push(`Network evidence was capped at ${MAX_NETWORK_RECORDS} unique records.`);
    }

    const cookies = deduplicateCookies(allCookies);
    const findings = buildFindings({ consent, document, accessibility, network, cookies });
    const finished = Date.now();
    return {
      schemaVersion: "1.0.0",
      scanner: { name: "web-evidence", version: VERSION },
      scan: {
        target: sanitizeUrl(validatedTarget.toString(), options.includeQuery, options.redactHost),
        startedAt,
        finishedAt: new Date(finished).toISOString(),
        durationMs: finished - started,
        options: {
          rejectConsent: options.rejectConsent,
          timeoutMs: options.timeoutMs,
          settleMs: options.settleMs,
          includeQuery: options.includeQuery,
          redactHost: options.redactHost,
        },
      },
      consent,
      document,
      accessibility,
      network,
      cookies,
      findings,
      warnings,
      dataPolicy: {
        responseBodiesStored: false,
        cookieValuesStored: false,
        queryStringsStored: options.includeQuery,
        legalAdvice: false,
      },
    };
  } finally {
    await browser.close();
  }
}
