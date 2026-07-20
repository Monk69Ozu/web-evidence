import type { Page } from "playwright";
import type { DocumentSignals } from "../types.js";
import { sanitizeText } from "../redaction.js";

export async function analyzeDocument(page: Page): Promise<DocumentSignals> {
  const raw = await page.evaluate(() => {
    const controls = Array.from(
      document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        "input:not([type='hidden']), select, textarea",
      ),
    );
    const isLabeled = (control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean => {
      return Boolean(
        control.labels?.length ||
          control.getAttribute("aria-label") ||
          control.getAttribute("aria-labelledby") ||
          control.getAttribute("title"),
      );
    };
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"));
    const linkMatches = (pattern: RegExp): boolean =>
      links.some((link) => pattern.test(`${link.textContent ?? ""} ${link.getAttribute("href") ?? ""}`));

    return {
      title: document.title,
      language: document.documentElement.getAttribute("lang"),
      h1Count: document.querySelectorAll("h1").length,
      imageCount: document.querySelectorAll("img").length,
      imagesMissingAlt: Array.from(document.querySelectorAll<HTMLImageElement>("img")).filter(
        (image) => !image.hasAttribute("alt"),
      ).length,
      formControlCount: controls.length,
      unlabeledFormControls: controls.filter((control) => !isLabeled(control)).length,
      privacyLinkDetected: linkMatches(/datenschutz|privacy|privacidad|confidentialit[eé]|privacy-policy/i),
      legalNoticeLinkDetected: linkMatches(/impressum|legal[-\s]?notice|mentions[-\s]?l[eé]gales/i),
    };
  });

  return {
    ...raw,
    title: sanitizeText(raw.title, 200),
    language: raw.language ? sanitizeText(raw.language, 32) : null,
  };
}
