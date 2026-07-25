import { isSeq } from "yaml";

import type { Finding } from "../types.js";
import { jobEntries, type WorkflowFile } from "../workflow-document.js";

type RangedNode = { range?: [number, number, number] | null };

/**
 * 可読性の規約: 連続する step の間に空行を 1 行以上入れる。
 * 判定は「前の step の最終コンテンツ行と次の step の開始行の間に空行があるか」。
 * step 間のコメント行は空行の代わりにはならない (bash 版と同じ扱い)。
 */
export function requireBlankLineBetweenSteps(wf: WorkflowFile): Finding[] {
  const findings: Finding[] = [];
  for (const job of jobEntries(wf)) {
    const stepsNode = job.map.get("steps");
    if (!isSeq(stepsNode)) continue;

    for (let i = 1; i < stepsNode.items.length; i++) {
      const prevRange = (stepsNode.items[i - 1] as RangedNode).range;
      const curRange = (stepsNode.items[i] as RangedNode).range;
      if (!prevRange || !curRange) continue;

      const prevEndLine = wf.lineOfOffset(Math.max(prevRange[2] - 1, prevRange[0]));
      const curStartLine = wf.lineOfOffset(curRange[0]);

      const linesBetween = wf.lines.slice(prevEndLine, curStartLine - 1);
      if (linesBetween.some((line) => line.trim() === "")) continue;

      findings.push({
        file: wf.file,
        line: curStartLine,
        rule: "require-blank-line-between-steps",
        message: "step の間に空行がありません",
      });
    }
  }
  return findings;
}
