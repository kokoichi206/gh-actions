import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { lintWorkflowSource } from "../lint.js";
import type { Finding, LintOptions } from "../types.js";
import { parseWorkflow, type WorkflowFile } from "../workflow-document.js";

const DEFAULT_OPTIONS: LintOptions = { maxTimeoutMinutes: 60 };

type RuleFunction = (wf: WorkflowFile, options: LintOptions) => Finding[];
type LintFunction = (file: string, source: string, options: LintOptions) => Finding[];

/**
 * Go の testdata 方式の golden テスト。
 * テストファイルと同階層の testdata/*.yml (.yaml) を入力として 1 ケースずつ実行し、
 * 検出結果を同名の <case>.expected.json と比較する。
 *   - expected の更新: pnpm run test -- -u
 *   - オプション上書き: <case>.options.json (LintOptions の partial)
 * ケースのファイル名 (拡張子なし) がそのまま workflow-name-matches-filename の
 * 期待値になる点に注意。
 */
const runGoldenCases = (testFileUrl: string, lint: LintFunction): void => {
  const testDir = dirname(fileURLToPath(testFileUrl));
  const testdataDir = join(testDir, "testdata");
  const caseFiles = readdirSync(testdataDir)
    .filter((name) => /\.ya?ml$/.test(name))
    .sort();

  describe(`golden: ${basename(testDir)}`, () => {
    for (const caseFile of caseFiles) {
      it(caseFile, async () => {
        const source = readFileSync(join(testdataDir, caseFile), "utf8");

        const optionsPath = join(testdataDir, caseFile.replace(/\.ya?ml$/, ".options.json"));
        const options: LintOptions = existsSync(optionsPath)
          ? { ...DEFAULT_OPTIONS, ...(JSON.parse(readFileSync(optionsPath, "utf8")) as Partial<LintOptions>) }
          : DEFAULT_OPTIONS;

        const findings = lint(caseFile, source, options);

        await expect(JSON.stringify(findings, null, 2) + "\n").toMatchFileSnapshot(
          join(testdataDir, caseFile.replace(/\.ya?ml$/, ".expected.json")),
        );
      });
    }
  });
};

/** 単一ルールの golden テスト (src/rules/<rule>/rule.test.ts 用)。 */
export const runRuleGoldenTests = ({
  rule,
  testFileUrl,
}: {
  rule: RuleFunction;
  testFileUrl: string;
}): void => {
  runGoldenCases(testFileUrl, (file, source, options) =>
    rule(parseWorkflow(file, source), options),
  );
};

/** 全ルールを束ねた lintWorkflowSource の golden テスト (tests/lint.test.ts 用)。 */
export const runLintGoldenTests = ({ testFileUrl }: { testFileUrl: string }): void => {
  runGoldenCases(testFileUrl, lintWorkflowSource);
};
