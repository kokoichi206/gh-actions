import { isMap, isSeq } from "yaml";

import type { Finding } from "../types.js";
import { jobEntries, type WorkflowFile } from "../workflow-document.js";

/** 失敗時のログ・annotation で step を特定できるよう、全 step に空でない name を必須とする。 */
export function requireStepName(wf: WorkflowFile): Finding[] {
  const findings: Finding[] = [];
  for (const job of jobEntries(wf)) {
    const stepsNode = job.map.get("steps");
    if (!isSeq(stepsNode)) continue;

    for (const step of stepsNode.items) {
      if (!isMap(step)) continue;
      const name = step.get("name");
      if (typeof name === "string" && name !== "") continue;

      findings.push({
        file: wf.file,
        line: wf.lineOfNode(step),
        rule: "require-step-name",
        message: "name の無い step があります (空文字も不可)",
      });
    }
  }
  return findings;
}
