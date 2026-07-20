# Contributing

Thank you for helping make web diagnostics more transparent and reproducible.

## Principles

Contributions must preserve these project boundaries:

1. Technical evidence is kept separate from legal conclusions.
2. Data collection is minimized by default.
3. Consent is never accepted automatically.
4. Private-network access remains blocked for all browser requests.
5. A new detector needs fixtures or tests that demonstrate both matches and non-matches.

## Development setup

```bash
npm install
npx playwright install chromium
npm run check
```

## Pull requests

- Keep each pull request focused.
- Explain the observable signal and its false-positive boundary.
- Add tests for security, classification, redaction, or output changes.
- Do not add real customer reports, session data, cookie values, credentials, or private URLs as fixtures.
- Use synthetic `.test` domains and invented data in examples.

## Adding tracker definitions

Tracker definitions are intentionally transparent and live in `src/analysis/trackers.ts`. A new entry should:

- use an exact registrable domain or a documented service subdomain;
- include a non-match test for lookalike domains;
- describe a service, not claim a legal violation;
- avoid path-only matches when a domain boundary is available.

## Reporting security issues

Do not open a public issue for a vulnerability. Follow [SECURITY.md](SECURITY.md).
