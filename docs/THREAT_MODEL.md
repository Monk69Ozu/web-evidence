# Threat Model

## Assets

- the operator's workstation and local network;
- secrets available to the parent process;
- confidentiality of assessed URLs and report data;
- integrity of technical evidence;
- availability of the scanner process.

## Untrusted parties

- the target website and every resource it loads;
- DNS responses and redirects;
- third-party scripts executing in the isolated page;
- evidence values rendered into reports.

## Primary threats and controls

| Threat | Control |
| --- | --- |
| SSRF to loopback, cloud metadata, or internal services | Preflight DNS validation plus request-level blocking for redirects and subresources |
| Secret leakage from a browser profile | Fresh, non-persistent context with no imported storage state |
| Sensitive data retained in reports | No bodies or cookie values; queries removed by default; host redaction option |
| HTML injection through observed values | Context-independent HTML escaping and no report scripts |
| Lookalike tracker domains | Exact host or subdomain-boundary matching with negative tests |
| Accidental consent | Observation-only default; optional interaction matches reject labels only |
| Excessive evidence growth | Network evidence capped at 2,000 unique records with a warning |
| False compliance claims | Findings describe technical signals and always set `legalConclusion: false` |

## Residual risk

- DNS rebinding can occur between resolution and connection. The browser request guard reduces but cannot eliminate every network-layer race without an isolated network sandbox.
- Browser and axe-core dependencies process hostile content and must be kept updated.
- A custom consent interface can be missed or misidentified.
- Paths can contain identifiers even when query strings are removed.
- Automated observations require manual verification.
