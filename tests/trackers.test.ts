import { describe, expect, it } from "vitest";
import { classifyTracker, isRelatedHost } from "../src/analysis/trackers.js";

describe("tracker classification", () => {
  it("classifies known tracker subdomains", () => {
    expect(classifyTracker("https://www.google-analytics.com/g/collect")?.id).toBe("google-analytics");
    expect(classifyTracker("https://connect.facebook.net/en_US/fbevents.js")?.id).toBe("meta-pixel");
  });

  it("does not match domain lookalikes", () => {
    expect(classifyTracker("https://google-analytics.com.attacker.example/script.js")).toBeNull();
  });

  it("treats parent and child hosts as related", () => {
    expect(isRelatedHost("example.com", "cdn.example.com")).toBe(true);
    expect(isRelatedHost("example.com", "example.org")).toBe(false);
  });
});
