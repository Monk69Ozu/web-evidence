# Security Policy

## Supported versions

Security fixes are applied to the latest release and the `main` branch.

## Reporting a vulnerability

Use GitHub's **Private vulnerability reporting** feature for this repository. Include:

- affected version or commit;
- minimal reproduction steps using synthetic data;
- expected and observed behaviour;
- potential impact;
- a suggested fix, if available.

Do not include credentials, personal data, customer reports, or private target URLs. Please allow reasonable time for triage before public disclosure.

## Security boundaries

The highest-risk areas are:

- URL parsing, DNS resolution, redirects, and private-network blocking;
- browser interactions with untrusted pages;
- accidental storage of query strings, response bodies, or cookie values;
- unsafe rendering of evidence into HTML reports;
- tracker definitions that match lookalike domains.

Changes in these areas require tests and explicit review.
