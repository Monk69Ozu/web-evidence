# Data Policy

Web Evidence is designed to minimize stored data.

## Stored by default

- target and request URLs without fragments or query strings;
- request method, resource type, host relationship, and evidence phase;
- transparent tracker-catalog matches;
- cookie names and security attributes;
- basic document counts and booleans;
- bounded axe-core rule IDs, help links, counts, and selectors;
- timestamps, duration, options, warnings, and technical findings.

## Never stored by the scanner

- response bodies or rendered HTML;
- request bodies;
- cookie values;
- browser profile data;
- authentication state;
- screenshots;
- form contents;
- local storage or session storage values.

## Optional higher-exposure modes

`--include-query` retains query strings. Queries can contain identifiers or tokens, so this option should be used only when necessary and reports should be handled accordingly.

`--reject` interacts with a supported visible reject control. It may cause the target to set preference cookies. Values remain excluded from the report.

## Redaction

`--redact-host` replaces hostnames with deterministic short hashes. This is useful for sharing a report without naming the assessed site. It does not anonymize unique paths or third-party service names embedded in findings; review reports before publication.

## Retention

The CLI writes reports only to the selected local output directory. It has no telemetry, cloud upload, account system, or background service. The operator controls retention and deletion.
