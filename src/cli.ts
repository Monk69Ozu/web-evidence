#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Command, InvalidArgumentError } from "commander";
import { renderHtmlReport } from "./report/html.js";
import { scan, VERSION } from "./scanner.js";

function integer(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new InvalidArgumentError("Expected a positive integer.");
  return parsed;
}

const program = new Command()
  .name("web-evidence")
  .description("Collect privacy, consent, accessibility, and document signals without making legal conclusions.")
  .version(VERSION)
  .argument("<url>", "Public http(s) URL to scan")
  .option("-o, --output <directory>", "Output directory", "web-evidence-report")
  .option("--reject", "Trigger a supported visible reject-consent control; never accepts consent", false)
  .option("--include-query", "Retain query strings in network evidence", false)
  .option("--redact-host", "Hash all hostnames in stored evidence", false)
  .option("--headed", "Show the Chromium window", false)
  .option("--timeout <milliseconds>", "Navigation timeout", integer, 30_000)
  .option("--settle <milliseconds>", "Wait after load and consent actions", integer, 1_500)
  .action(async (url: string, flags) => {
    const output = resolve(flags.output as string);
    const report = await scan(url, {
      rejectConsent: Boolean(flags.reject),
      includeQuery: Boolean(flags.includeQuery),
      redactHost: Boolean(flags.redactHost),
      headed: Boolean(flags.headed),
      timeoutMs: flags.timeout as number,
      settleMs: flags.settle as number,
    });
    await mkdir(output, { recursive: true });
    await Promise.all([
      writeFile(resolve(output, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8"),
      writeFile(resolve(output, "report.html"), renderHtmlReport(report), "utf8"),
    ]);
    process.stdout.write(`Web Evidence report written to ${output}\n`);
    process.stdout.write(`${report.findings.length} technical finding(s); no legal conclusion was made.\n`);
  });

program.parseAsync().catch((error: unknown) => {
  process.stderr.write(`Scan failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
