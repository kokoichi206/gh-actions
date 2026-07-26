// ルール単体の挙動は各 src/rules/<rule>/testdata/ の golden テストで検証する。
// ここでは全ルールを束ねた lintWorkflowSource の横断的な挙動のみ検証する。
import { describe, expect, it } from "vitest";

import { lintWorkflowSource } from "../src/lint.js";
import type { Finding, LintOptions } from "../src/types.js";

const DEFAULT_OPTIONS: LintOptions = { maxTimeoutMinutes: 60 };

const lintLines = (
  file: string,
  lines: string[],
  options: LintOptions = DEFAULT_OPTIONS,
): Finding[] => lintWorkflowSource(file, lines.join("\n") + "\n", options);

describe("違反のない workflow", () => {
  it("全ルールを通過する", () => {
    const findings = lintLines("ci.yml", [
      "name: ci",
      "",
      "on:",
      "  pull_request:",
      "  schedule:",
      '    - cron: "0 0 * * *"',
      "  workflow_dispatch:",
      "",
      "concurrency:",
      "  group: ci-${{ github.ref }}",
      "  cancel-in-progress: true",
      "",
      "jobs:",
      "  test:",
      "    runs-on: ubuntu-latest",
      "    timeout-minutes: 60",
      "    steps:",
      "      - name: Checkout",
      "        uses: actions/checkout@abc123",
      "",
      "      - name: Run tests",
      "        run: echo ok",
    ]);
    expect(findings).toEqual([]);
  });
});

describe("reusable workflow を呼ぶ job", () => {
  it("timeout / steps 系ルールの対象にならない", () => {
    const findings = lintLines("wf.yml", [
      "name: wf",
      "jobs:",
      "  call:",
      "    uses: owner/repo/.github/workflows/x.yml@main",
      "    with:",
      "      foo: bar",
    ]);
    expect(findings).toEqual([]);
  });
});

describe("YAML として不正なファイル", () => {
  it("yaml-parse-error として報告する", () => {
    const findings = lintLines("wf.yml", ["jobs: [", "  broken"]);
    expect(findings.map((finding) => finding.rule)).toContain("yaml-parse-error");
  });
});
