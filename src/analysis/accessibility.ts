import axe, { type AxeResults } from "axe-core";
import type { Page } from "playwright";
import type { AccessibilitySummary } from "../types.js";

export async function analyzeAccessibility(page: Page): Promise<AccessibilitySummary> {
  await page.addScriptTag({ content: axe.source });
  const result = await page.evaluate(async () => {
    const axeRuntime = (window as typeof window & { axe: typeof axe }).axe;
    return axeRuntime.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
    });
  }) as AxeResults;

  const byImpact: Record<string, number> = {};
  for (const violation of result.violations) {
    const key = violation.impact ?? "unknown";
    byImpact[key] = (byImpact[key] ?? 0) + violation.nodes.length;
  }

  return {
    engine: "axe-core",
    engineVersion: axe.version,
    violationCount: result.violations.length,
    affectedNodeCount: result.violations.reduce((sum, violation) => sum + violation.nodes.length, 0),
    byImpact,
    violations: result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact ?? null,
      help: violation.help,
      helpUrl: violation.helpUrl,
      affectedNodes: violation.nodes.length,
      targets: violation.nodes.flatMap((node) => node.target.map(String)).slice(0, 20),
    })),
  };
}
