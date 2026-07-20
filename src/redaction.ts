import { createHash } from "node:crypto";

export function shortHash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

export function sanitizeUrl(input: string, includeQuery: boolean, redactHost: boolean): string {
  const url = new URL(input);
  url.username = "";
  url.password = "";
  url.hash = "";
  if (!includeQuery) url.search = "";
  if (redactHost) url.hostname = `host-${shortHash(url.hostname)}`;
  return url.toString();
}

export function sanitizeText(value: string, maxLength = 160): string {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}
