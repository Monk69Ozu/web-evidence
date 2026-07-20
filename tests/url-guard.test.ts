import { describe, expect, it } from "vitest";
import { assertPublicHttpUrl, isNonPublicIp, PublicUrlGuard } from "../src/security/url-guard.js";

describe("isNonPublicIp", () => {
  it.each(["127.0.0.1", "10.2.3.4", "172.20.0.1", "192.168.1.1", "169.254.10.2", "::1", "fd00::1", "fe80::1"])(
    "blocks %s",
    (address) => expect(isNonPublicIp(address)).toBe(true),
  );

  it.each(["1.1.1.1", "8.8.8.8", "93.184.216.34", "2606:4700:4700::1111"])("allows %s", (address) =>
    expect(isNonPublicIp(address)).toBe(false),
  );
});

describe("assertPublicHttpUrl", () => {
  it("normalizes a public URL and removes fragments", async () => {
    const result = await assertPublicHttpUrl("https://Example.com/path#secret", async () => ["93.184.216.34"]);
    expect(result.toString()).toBe("https://example.com/path");
  });

  it("rejects credentials", async () => {
    await expect(assertPublicHttpUrl("https://user:pass@example.com", async () => ["93.184.216.34"])).rejects.toThrow(
      "Credentials",
    );
  });

  it("rejects a public-looking host that resolves privately", async () => {
    await expect(assertPublicHttpUrl("https://example.com", async () => ["127.0.0.1"])).rejects.toThrow(
      "private or reserved",
    );
  });
});

describe("PublicUrlGuard", () => {
  it("allows non-network schemes and blocks private subresources", async () => {
    const guard = new PublicUrlGuard(async (hostname) => (hostname === "safe.example" ? ["1.1.1.1"] : ["10.0.0.4"]));
    await expect(guard.allows("data:text/plain,ok")).resolves.toBe(true);
    await expect(guard.allows("https://safe.example/app.js")).resolves.toBe(true);
    await expect(guard.allows("https://internal.example/admin")).resolves.toBe(false);
  });
});
