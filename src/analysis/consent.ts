import type { Page } from "playwright";
import type { ConsentEvidence } from "../types.js";

const REJECT_LABELS = [
  "reject all",
  "reject",
  "decline all",
  "decline",
  "deny all",
  "only necessary",
  "necessary only",
  "continue without accepting",
  "alle ablehnen",
  "ablehnen",
  "nur notwendige",
  "nur erforderliche",
  "ohne zustimmung fortfahren",
  "tout refuser",
  "refuser",
  "rechazar todo",
  "rifiuta tutto",
];

interface ConsentDomResult {
  bannerDetected: boolean;
  rejectControlDetected: boolean;
  controlLabel: string | null;
}

async function inspectConsentDom(page: Page, clickReject: boolean): Promise<ConsentDomResult & { clicked: boolean }> {
  return page.evaluate(
    ({ labels, shouldClick }) => {
      const visible = (element: Element): element is HTMLElement => {
        if (!(element instanceof HTMLElement)) return false;
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      };
      const normalize = (value: string): string => value.replace(/\s+/g, " ").trim().toLowerCase();
      const bannerPattern = /cookie|consent|datenschutz|privacy|tracking|privacidad|confidentialit[eé]/i;
      const bannerSelectors = [
        "[role='dialog']",
        "[aria-modal='true']",
        "[id*='cookie' i]",
        "[class*='cookie' i]",
        "[id*='consent' i]",
        "[class*='consent' i]",
        "[data-testid*='consent' i]",
        "[data-testid*='cookie' i]",
      ].join(",");
      const banners = Array.from(document.querySelectorAll(bannerSelectors)).filter(
        (element) => visible(element) && bannerPattern.test(element.textContent ?? ""),
      );
      const roots: ParentNode[] = banners.length > 0 ? banners : [document];
      const controls = roots.flatMap((root) =>
        Array.from(root.querySelectorAll("button, [role='button'], a[href], input[type='button']")),
      );
      const rejectControl = controls.find((element) => {
        if (!visible(element)) return false;
        const label = normalize(
          element.getAttribute("aria-label") ??
            (element instanceof HTMLInputElement ? element.value : element.textContent ?? ""),
        );
        return labels.some((candidate) => label === candidate || label.startsWith(`${candidate} `));
      });
      const controlLabel = rejectControl
        ? normalize(
            rejectControl.getAttribute("aria-label") ??
              (rejectControl instanceof HTMLInputElement ? rejectControl.value : rejectControl.textContent ?? ""),
          ).slice(0, 80)
        : null;

      let clicked = false;
      if (shouldClick && rejectControl instanceof HTMLElement) {
        rejectControl.click();
        clicked = true;
      }
      return {
        bannerDetected: banners.length > 0,
        rejectControlDetected: Boolean(rejectControl),
        controlLabel,
        clicked,
      };
    },
    { labels: REJECT_LABELS, shouldClick: clickReject },
  );
}

export async function inspectConsent(page: Page, rejectConsent: boolean): Promise<ConsentEvidence> {
  const result = await inspectConsentDom(page, rejectConsent);
  if (!rejectConsent) {
    return {
      bannerDetected: result.bannerDetected,
      rejectControlDetected: result.rejectControlDetected,
      rejectAttempted: false,
      rejectTriggered: false,
      controlLabel: result.controlLabel,
      note: "Observation only. No consent control was activated.",
    };
  }

  return {
    bannerDetected: result.bannerDetected,
    rejectControlDetected: result.rejectControlDetected,
    rejectAttempted: true,
    rejectTriggered: result.clicked,
    controlLabel: result.controlLabel,
    note: result.clicked
      ? "A visible reject control was triggered. The scanner never accepts consent."
      : "No supported visible reject control was found; no consent action was taken.",
  };
}
