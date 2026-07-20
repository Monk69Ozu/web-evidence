import { describe, expect, it } from "vitest";
import { sanitizeText, sanitizeUrl, shortHash } from "../src/redaction.js";

describe("redaction", () => {
  it("drops credentials, fragments, and query strings by default", () => {
    expect(sanitizeUrl("https://user:pass@example.com/path?token=secret#part", false, false)).toBe(
      "https://example.com/path",
    );
  });

  it("can hash hostnames deterministically", () => {
    const result = sanitizeUrl("https://example.com/private", false, true);
    expect(result).toBe(`https://host-${shortHash("example.com")}/private`);
    expect(result).not.toContain("example.com");
  });

  it("normalizes and truncates text", () => {
    expect(sanitizeText("  hello \n world  ", 20)).toBe("hello world");
  });
});
