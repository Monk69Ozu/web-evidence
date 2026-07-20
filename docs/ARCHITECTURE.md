# Architecture

Web Evidence is a single-process command-line application with four explicit trust boundaries.

## 1. Input boundary

The target URL is untrusted. `assertPublicHttpUrl` accepts only absolute HTTP(S) URLs without embedded credentials. DNS results are checked before browser launch, and private, loopback, link-local, documentation, multicast, and reserved address ranges are rejected.

## 2. Browser boundary

Every scan uses a new Chromium context:

- no stored browser profile;
- no imported cookies or local storage;
- service workers blocked;
- all requests routed through `PublicUrlGuard`;
- no response bodies persisted;
- consent interaction disabled unless explicitly requested.

The request-level guard matters because a public URL can redirect to a private host or load private-network subresources after the first navigation check.

## 3. Evidence boundary

Raw browser state is reduced to a versioned evidence model:

- sanitized network URLs;
- cookie metadata without values;
- bounded accessibility selectors;
- boolean document and consent signals;
- warnings for incomplete analysis.

Query strings are removed by default, and optional host redaction uses a short SHA-256-derived identifier.

## 4. Presentation boundary

The JSON report is the canonical record. The HTML report is deterministic presentation generated from that record. All dynamic values are HTML-escaped, and the report has no external scripts, fonts, trackers, or network dependencies.

## Module map

| Module | Responsibility |
| --- | --- |
| `security/url-guard.ts` | URL validation, DNS resolution, and request blocking |
| `analysis/trackers.ts` | Transparent domain-boundary classification |
| `analysis/consent.ts` | Conservative consent-surface and reject-control detection |
| `analysis/document.ts` | Basic document structure signals |
| `analysis/accessibility.ts` | axe-core execution and bounded result mapping |
| `scanner.ts` | Browser lifecycle, evidence phases, and data minimization |
| `findings.ts` | Technical summaries with `legalConclusion: false` |
| `report/html.ts` | Self-contained escaped HTML rendering |

## Extension points

Future checks should produce evidence first and findings second. A detector should never write directly to the report renderer or make a legal claim. This separation keeps the raw observation available when policies and interpretations change.
