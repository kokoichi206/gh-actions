import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { lintWorkflowSource } from "./lint.js";
import type { Finding } from "./types.js";
import { formatErrorCommand } from "./workflow-commands.js";

const DEFAULT_MAX_TIMEOUT_MINUTES = 60;

function fail(message: string): never {
  console.log(`::error::${message}`);
  process.exit(1);
}

function resolveMaxTimeoutMinutes(): number {
  const raw = (process.env["INPUT_MAX-TIMEOUT-MINUTES"] ?? "").trim();
  if (raw === "") return DEFAULT_MAX_TIMEOUT_MINUTES;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    fail(`input max-timeout-minutes は正の整数で指定してください (指定値: '${raw}')`);
  }
  return parsed;
}

const root = process.env["GITHUB_WORKSPACE"] ?? process.cwd();
const workflowsDir = join(root, ".github", "workflows");

let filenames: string[];
try {
  filenames = readdirSync(workflowsDir)
    .filter((name) => /\.ya?ml$/.test(name))
    .sort();
} catch {
  fail(`workflows ディレクトリが見つかりません: ${workflowsDir}`);
}

const options = { maxTimeoutMinutes: resolveMaxTimeoutMinutes() };

const findings: Finding[] = [];
for (const filename of filenames) {
  const file = `.github/workflows/${filename}`;
  const source = readFileSync(join(workflowsDir, filename), "utf8");
  findings.push(...lintWorkflowSource(file, source, options));
}

for (const finding of findings) {
  console.log(formatErrorCommand(finding));
}

if (findings.length > 0) {
  console.log(`NG: ${filenames.length} ファイル中 ${findings.length} 件の違反があります`);
  process.exitCode = 1;
} else {
  console.log(`OK: ${filenames.length} ファイルを検査し、違反はありませんでした`);
}
