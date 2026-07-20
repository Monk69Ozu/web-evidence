# Design Review - Web Evidence report

## Brief
- Subject: A forensic, evidence-first technical web scan report.
- Audience: Maintainers, agencies, researchers, accessibility reviewers, and privacy engineers.
- Primary job: Establish trust in the capture boundary, expose inspectable observations, and make the next human review step obvious.

## Reference Benchmark
- Reference 1: [Lighthouse overview](https://developer.chrome.com/docs/lighthouse/overview/) - clear category hierarchy and an explicit path from summary to individual audits.
- Reference 2: [SecurityHeaders.com](https://securityheaders.com/) - a dominant scan identity with compact, inspectable evidence below it.
- Reference 3: [axe-core API documentation](https://www.deque.com/axe/core-documentation/api-documentation/) - rule-level evidence and impact language without hiding the underlying signal.
- Principles translated: Put identity and provenance first; separate scan phases; keep evidence denser than decoration; use severity sparingly; never turn a technical observation into an opaque legal score.

## Design DNA
- Target feeling: Forensic, calm, rigorous, independent.
- Anti-goals: SaaS dashboard chrome, black-and-neon cyber styling, rainbow score gauges, legal-certification language, or a generic wall of rounded cards.
- Palette: Lab Paper `#F2F5F3`, Deep Ink `#10231D`, Evidence Green `#087853`, Dark Evidence `#12372B`, Review Amber `#A86200`, Signal Red `#B42318`.
- Type roles: Strong system sans for the report title and findings; neutral system sans for reading; UI monospace for evidence IDs, phases, metadata, and generated provenance.
- Layout thesis: An asymmetric evidence ledger: masthead and audit stamp, a flat scan summary, a three-phase evidence line, then a narrow capture-boundary rail beside the main findings.
- Signature element: A deterministic `WE-...` evidence stamp paired with the `Untouched load / Reject state / Human review` phase rail.

## Screenshots
- Desktop: `web-evidence-report-desktop-v2.png` (local review artifact; 1440 x 1000 viewport, full page)
- Mobile: `web-evidence-report-mobile-v2.png` (local review artifact; 390 x 844 viewport, full page)

## Scorecard
| Category | Score | Evidence | Revision |
|---|---:|---|---|
| brief fit | 5 | Evidence and capture limits are the first-class content; no legal verdict is implied. | Replaced generic summary cards with a forensic report ledger. |
| composition | 4 | Asymmetric masthead and 260px evidence rail give the page a deliberate reading path. | Introduced masthead/audit-stamp tension and a two-column evidence body. |
| hierarchy | 5 | Identity, counts, phases, capture boundary, and findings are ordered by review priority. | Added a flat summary strip and explicit three-phase rail. |
| typography | 4 | Display, reading, and evidence-data roles remain distinct without external font dependencies. | Added mono metadata and stronger title scale. |
| spacing | 4 | Desktop density is controlled; mobile sections stack with consistent 20px gutters. | Reduced card padding and converted the side rail into one continuous surface. |
| color | 5 | A restrained laboratory palette uses green as evidence provenance, not decoration. | Removed interchangeable dashboard colors and limited severity colors to findings. |
| signature | 5 | Deterministic evidence stamp and capture-phase rail make the report recognizable. | Added `WE-...` identifier, schema/runtime metadata, and three-stage scan narrative. |
| copy | 5 | Labels distinguish observation from conclusion and state exactly what was not stored. | Rewrote empty states and added the technical-evidence disclaimer. |
| mobile | 4 | Audit stamp, counts, phases, data boundary, and findings retain their order at 390px. | Changed summary to 2x2, phases to vertical, and evidence rail to full width. |
| interaction | 5 | The artifact is intentionally static and fully readable without hover, script, or input. | Kept the report self-contained and interaction-free for durable sharing. |

## Revision 1
- Changed: Replaced a symmetrical card dashboard with an evidence ledger, audit stamp, phase rail, continuous capture-boundary column, flatter findings, and mono provenance details.
- Why: The first render was clean but visually generic; the new structure better communicates chain-of-custody, scan limits, and mandatory human review.
- Screenshot rechecked: Yes. Desktop and 390px mobile were rerendered after the revision; no clipping, horizontal overflow, broken hierarchy, or unreadable evidence text was found.

## Remaining visual risk

Very long real-world URLs and unusually verbose rule descriptions were checked by CSS wrapping rules but not visually exercised in this zero-finding smoke report.
