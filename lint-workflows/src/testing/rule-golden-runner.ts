import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import type { Finding, LintOptions } from "../types.js";
import { parseWorkflow, type WorkflowFile } from "../workflow-document.js";

const DEFAULT_OPTIONS: LintOptions = { maxTimeoutMinutes: 60 };

type RuleFunction = (wf: WorkflowFile, options: LintOptions) => Finding[];

/**
 * Go の testdata 方式の golden テスト。
 * ルールディレクトリ直下の testdata/*.yml (.yaml) を入力として 1 ケースずつ実行し、
 * 検出結果を同名の <case>.expected.json と比較する。
 *   - expected の更新: pnpm run test -- -u
 *   - オプション上書き: <case>.options.json (LintOptions の partial)
 * ファイル名 (拡張子なし) がそのまま workflow 名の期待値になる点に注意
 * (workflow-name-matches-filename が対象のルールでなくても、入力の file 名として使われる)。
 */
export const runRuleGoldenTests = ({
  rule,
  testFileUrl,
}: {
  rule: RuleFunction;
  testFileUrl: string;
}): void => {
  const ruleDir = dirname(fileURLToPath(testFileUrl));
  const testdataDir = join(ruleDir, "testdata");
  const caseFiles = readdirSync(testdataDir)
    .filter((name) => /\.ya?ml$/.test(name))
    .sort();

  describe(`golden: ${basename(ruleDir)}`, () => {
    for (const caseFile of caseFiles) {
      it(caseFile, async () => {
        const source = readFileSync(join(testdataDir, caseFile), "utf8");

        const optionsPath = join(testdataDir, caseFile.replace(/\.ya?ml$/, ".options.json"));
        const options: LintOptions = existsSync(optionsPath)
          ? { ...DEFAULT_OPTIONS, ...(JSON.parse(readFileSync(optionsPath, "utf8")) as Partial<LintOptions>) }
          : DEFAULT_OPTIONS;

        const findings = rule(parseWorkflow(caseFile, source), options);

        await expect(JSON.stringify(findings, null, 2) + "\n").toMatchFileSnapshot(
          join(testdataDir, caseFile.replace(/\.ya?ml$/, ".expected.json")),
        );
      });
    }
  });
};
