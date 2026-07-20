import type { TrackerMatch } from "../types.js";

interface TrackerDefinition extends TrackerMatch {
  domains: string[];
}

const TRACKERS: TrackerDefinition[] = [
  { id: "google-analytics", name: "Google Analytics", category: "analytics", domains: ["google-analytics.com", "googletagmanager.com"] },
  { id: "google-ads", name: "Google Ads", category: "advertising", domains: ["googleadservices.com", "doubleclick.net"] },
  { id: "meta-pixel", name: "Meta Pixel", category: "advertising", domains: ["connect.facebook.net", "facebook.com"] },
  { id: "linkedin-insight", name: "LinkedIn Insight", category: "advertising", domains: ["snap.licdn.com", "linkedin.com"] },
  { id: "microsoft-clarity", name: "Microsoft Clarity", category: "session-replay", domains: ["clarity.ms"] },
  { id: "hotjar", name: "Hotjar", category: "session-replay", domains: ["hotjar.com", "hotjar.io"] },
  { id: "tiktok-pixel", name: "TikTok Pixel", category: "advertising", domains: ["analytics.tiktok.com"] },
  { id: "pinterest-tag", name: "Pinterest Tag", category: "advertising", domains: ["pinimg.com", "pinterest.com"] },
  { id: "x-pixel", name: "X Pixel", category: "advertising", domains: ["ads-twitter.com", "analytics.twitter.com"] },
  { id: "hubspot", name: "HubSpot", category: "analytics", domains: ["hs-analytics.net", "hs-scripts.com", "hubspot.com"] },
  { id: "intercom", name: "Intercom", category: "support", domains: ["intercom.io", "intercomcdn.com"] },
];

function matchesDomain(host: string, candidate: string): boolean {
  return host === candidate || host.endsWith(`.${candidate}`);
}

export function classifyTracker(input: string): TrackerMatch | null {
  let host: string;
  try {
    host = new URL(input).hostname.toLowerCase();
  } catch {
    return null;
  }

  const match = TRACKERS.find((tracker) => tracker.domains.some((domain) => matchesDomain(host, domain)));
  if (!match) return null;
  return { id: match.id, name: match.name, category: match.category };
}

export function isRelatedHost(left: string, right: string): boolean {
  const a = left.toLowerCase();
  const b = right.toLowerCase();
  return a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`);
}
