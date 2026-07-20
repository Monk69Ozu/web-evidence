import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

export type HostResolver = (hostname: string) => Promise<string[]>;

const defaultResolver: HostResolver = async (hostname) => {
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  return addresses.map((entry) => entry.address);
};

function isPrivateIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a = 0, b = 0, c = 0] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function isPrivateIpv6(address: string): boolean {
  const value = address.toLowerCase().split("%")[0] ?? "";
  if (value.startsWith("::ffff:")) {
    const mapped = value.slice("::ffff:".length);
    return isIP(mapped) === 4 ? isPrivateIpv4(mapped) : true;
  }

  return (
    value === "::" ||
    value === "::1" ||
    value.startsWith("fc") ||
    value.startsWith("fd") ||
    /^fe[89ab]/.test(value) ||
    value.startsWith("ff") ||
    value.startsWith("2001:db8:")
  );
}

export function isNonPublicIp(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return isPrivateIpv4(address);
  if (family === 6) return isPrivateIpv6(address);
  return true;
}

export async function assertPublicHttpUrl(
  input: string,
  resolver: HostResolver = defaultResolver,
): Promise<URL> {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("Target must be a valid absolute URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http:// and https:// targets are supported.");
  }
  if (url.username || url.password) {
    throw new Error("Credentials in target URLs are not allowed.");
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("Local targets are blocked by the SSRF guard.");
  }

  const literalFamily = isIP(hostname);
  const addresses = literalFamily ? [hostname] : await resolver(hostname);
  if (addresses.length === 0) {
    throw new Error(`Target host did not resolve: ${hostname}`);
  }
  if (addresses.some(isNonPublicIp)) {
    throw new Error(`Target resolves to a private or reserved address: ${hostname}`);
  }

  url.hash = "";
  return url;
}

export class PublicUrlGuard {
  readonly #cache = new Map<string, Promise<boolean>>();

  constructor(private readonly resolver: HostResolver = defaultResolver) {}

  async allows(input: string): Promise<boolean> {
    let url: URL;
    try {
      url = new URL(input);
    } catch {
      return false;
    }

    if (!["http:", "https:"].includes(url.protocol)) return true;
    const key = `${url.protocol}//${url.hostname.toLowerCase()}`;
    const cached = this.#cache.get(key);
    if (cached) return cached;

    const decision = assertPublicHttpUrl(url.origin, this.resolver)
      .then(() => true)
      .catch(() => false);
    this.#cache.set(key, decision);
    return decision;
  }
}
