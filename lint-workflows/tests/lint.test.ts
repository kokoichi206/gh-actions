import { describe, expect, it } from "vitest";

import { lintWorkflowSource } from "../src/lint.js";
import type { Finding, LintOptions } from "../src/types.js";

const DEFAULT_OPTIONS: LintOptions = { maxTimeoutMinutes: 60 };

const lintLines = (
  file: string,
  lines: string[],
  options: LintOptions = DEFAULT_OPTIONS,
): Finding[] => lintWorkflowSource(file, lines.join("\n") + "\n", options);

const rulesOf = (findings: Finding[]): string[] =>
  findings.map((finding) => finding.rule);

const byRule = (findings: Finding[], rule: string): Finding[] =>
  findings.filter((finding) => finding.rule === rule);

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

describe("require-job-timeout", () => {
  it("timeout-minutes の無い job を job キーの行で報告する", () => {
    const findings = lintLines("wf.yml", [
      "name: wf",
      "jobs:",
      "  build:",
      "    runs-on: ubuntu-latest",
      "    steps:",
      "      - name: Run",
      "        run: echo ok",
    ]);
    expect(byRule(findings, "require-job-timeout")).toEqual([
      expect.objectContaining({ file: "wf.yml", line: 3 }),
    ]);
  });

  it("reusable workflow を呼ぶ job (uses:) は対象外", () => {
    const findings = lintLines("wf.yml", [
      "name: wf",
      "jobs:",
      "  call:",
      "    uses: owner/repo/.github/workflows/x.yml@main",
    ]);
    expect(byRule(findings, "require-job-timeout")).toEqual([]);
  });
});

describe("max-job-timeout", () => {
  const lines = [
    "name: wf",
    "jobs:",
    "  build:",
    "    runs-on: ubuntu-latest",
    "    timeout-minutes: 90",
    "    steps:",
    "      - name: Run",
    "        run: echo ok",
  ];

  it("上限を超える timeout-minutes を値の行で報告する", () => {
    expect(byRule(lintLines("wf.yml", lines), "max-job-timeout")).toEqual([
      expect.objectContaining({ file: "wf.yml", line: 5 }),
    ]);
  });

  it("上限ちょうどは許容する", () => {
    const findings = lintLines("wf.yml", lines, { maxTimeoutMinutes: 90 });
    expect(byRule(findings, "max-job-timeout")).toEqual([]);
  });
});

describe("workflow-name-matches-filename", () => {
  it("name が無ければ 1 行目で報告する", () => {
    const findings = lintLines("wf.yml", ["jobs: {}"]);
    expect(byRule(findings, "workflow-name-matches-filename")).toEqual([
      expect.objectContaining({ line: 1, message: expect.stringContaining("name: wf") }),
    ]);
  });

  it("先頭にコメントブロックがあっても name の実ファイル行番号で報告する", () => {
    const findings = lintLines(".github/workflows/deploy.yml", [
      "# ============================",
      "# 説明コメント",
      "# ============================",
      "name: something-else",
      "jobs: {}",
    ]);
    expect(byRule(findings, "workflow-name-matches-filename")).toEqual([
      expect.objectContaining({ line: 4, message: expect.stringContaining("deploy") }),
    ]);
  });

  it("拡張子 .yaml も ファイル名比較から除外する", () => {
    const findings = lintLines("wf.yaml", ["name: wf", "jobs: {}"]);
    expect(byRule(findings, "workflow-name-matches-filename")).toEqual([]);
  });
});

describe("require-step-name", () => {
  it("name の無い step と空文字 name の step を報告する", () => {
    const findings = lintLines("wf.yml", [
      "name: wf",
      "jobs:",
      "  build:",
      "    runs-on: ubuntu-latest",
      "    timeout-minutes: 5",
      "    steps:",
      "      - run: echo no-name",
      "",
      '      - name: ""',
      "        run: echo empty-name",
    ]);
    expect(byRule(findings, "require-step-name")).toEqual([
      expect.objectContaining({ line: 7 }),
      expect.objectContaining({ line: 9 }),
    ]);
  });
});

describe("require-blank-line-between-steps", () => {
  it("空行の無い連続 step を 2 個目の step の行で報告する", () => {
    const findings = lintLines("wf.yml", [
      "name: wf",
      "jobs:",
      "  build:",
      "    runs-on: ubuntu-latest",
      "    timeout-minutes: 5",
      "    steps:",
      "      - name: One",
      "        run: echo one",
      "      - name: Two",
      "        run: echo two",
    ]);
    expect(byRule(findings, "require-blank-line-between-steps")).toEqual([
      expect.objectContaining({ line: 9 }),
    ]);
  });

  it("コメント行は空行の代わりにならない", () => {
    const findings = lintLines("wf.yml", [
      "name: wf",
      "jobs:",
      "  build:",
      "    runs-on: ubuntu-latest",
      "    timeout-minutes: 5",
      "    steps:",
      "      - name: One",
      "        run: echo one",
      "      # コメントだけでは区切りにならない",
      "      - name: Two",
      "        run: echo two",
    ]);
    expect(byRule(findings, "require-blank-line-between-steps")).toEqual([
      expect.objectContaining({ line: 10 }),
    ]);
  });

  it("空行 + コメントの組み合わせは許容する", () => {
    const findings = lintLines("wf.yml", [
      "name: wf",
      "jobs:",
      "  build:",
      "    runs-on: ubuntu-latest",
      "    timeout-minutes: 5",
      "    steps:",
      "      - name: One",
      "        run: echo one",
      "",
      "      # 次の step の説明",
      "      - name: Two",
      "        run: echo two",
    ]);
    expect(byRule(findings, "require-blank-line-between-steps")).toEqual([]);
  });

  it("block scalar 内の空行は区切りとして扱わないが、末尾の空行は区切りになる", () => {
    const findings = lintLines("wf.yml", [
      "name: wf",
      "jobs:",
      "  build:",
      "    runs-on: ubuntu-latest",
      "    timeout-minutes: 5",
      "    steps:",
      "      - name: One",
      "        run: |",
      "          echo first",
      "",
      "          echo after-internal-blank",
      "      - name: Two",
      "        run: echo two",
      "",
      "      - name: Three",
      "        run: |",
      "          echo body",
      "",
      "      - name: Four",
      "        run: echo four",
    ]);
    expect(byRule(findings, "require-blank-line-between-steps")).toEqual([
      expect.objectContaining({ line: 12 }),
    ]);
  });
});

describe("schedule-requires-workflow-dispatch", () => {
  it("workflow_dispatch の無い schedule を schedule キーの行で報告する", () => {
    const findings = lintLines("wf.yml", [
      "name: wf",
      "on:",
      "  schedule:",
      '    - cron: "0 0 * * *"',
      "jobs: {}",
    ]);
    expect(byRule(findings, "schedule-requires-workflow-dispatch")).toEqual([
      expect.objectContaining({ line: 3 }),
    ]);
  });

  it("workflow_dispatch が併記されていれば許容する", () => {
    const findings = lintLines("wf.yml", [
      "name: wf",
      "on:",
      "  schedule:",
      '    - cron: "0 0 * * *"',
      "  workflow_dispatch:",
      "jobs: {}",
    ]);
    expect(byRule(findings, "schedule-requires-workflow-dispatch")).toEqual([]);
  });
});

describe("pull-request-requires-concurrency", () => {
  it("concurrency の無い pull_request workflow を on の行で報告する", () => {
    const findings = lintLines("wf.yml", [
      "name: wf",
      "on:",
      "  pull_request:",
      "jobs: {}",
    ]);
    expect(byRule(findings, "pull-request-requires-concurrency")).toEqual([
      expect.objectContaining({ line: 2 }),
    ]);
  });

  it("sequence 形式 (on: [push, pull_request]) でも検出する", () => {
    const findings = lintLines("wf.yml", [
      "name: wf",
      "on: [push, pull_request]",
      "jobs: {}",
    ]);
    expect(rulesOf(findings)).toContain("pull-request-requires-concurrency");
  });

  it("scalar 形式 (on: pull_request) でも検出する", () => {
    const findings = lintLines("wf.yml", ["name: wf", "on: pull_request", "jobs: {}"]);
    expect(rulesOf(findings)).toContain("pull-request-requires-concurrency");
  });

  it("cancel-in-progress の無い concurrency を concurrency の行で報告する", () => {
    const findings = lintLines("wf.yml", [
      "name: wf",
      "on:",
      "  pull_request:",
      "concurrency:",
      "  group: g-${{ github.ref }}",
      "jobs: {}",
    ]);
    expect(byRule(findings, "pull-request-requires-concurrency")).toEqual([
      expect.objectContaining({ line: 4 }),
    ]);
  });

  it("cancel-in-progress: false は違反", () => {
    const findings = lintLines("wf.yml", [
      "name: wf",
      "on:",
      "  pull_request:",
      "concurrency:",
      "  group: g",
      "  cancel-in-progress: false",
      "jobs: {}",
    ]);
    expect(rulesOf(findings)).toContain("pull-request-requires-concurrency");
  });

  it("cancel-in-progress が式なら許容する", () => {
    const findings = lintLines("wf.yml", [
      "name: wf",
      "on:",
      "  pull_request:",
      "concurrency:",
      "  group: g-${{ github.ref }}",
      "  cancel-in-progress: ${{ github.event_name == 'pull_request' }}",
      "jobs: {}",
    ]);
    expect(byRule(findings, "pull-request-requires-concurrency")).toEqual([]);
  });

  it("pull_request トリガーが無ければ対象外", () => {
    const findings = lintLines("wf.yml", [
      "name: wf",
      "on:",
      "  push:",
      "    branches: [main]",
      "jobs: {}",
    ]);
    expect(byRule(findings, "pull-request-requires-concurrency")).toEqual([]);
  });
});

describe("YAML として不正なファイル", () => {
  it("yaml-parse-error として報告する", () => {
    const findings = lintLines("wf.yml", ["jobs: [", "  broken"]);
    expect(rulesOf(findings)).toContain("yaml-parse-error");
  });
});

describe("reusable workflow を呼ぶ job", () => {
  it("steps 系ルールの対象にならない", () => {
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
