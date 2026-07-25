import { isMap, isSeq } from "yaml";

import type { Finding } from "../types.js";
import { deref, jobEntries, scalarValueOf, type WorkflowFile } from "../workflow-document.js";

/** 失敗時のログ・annotation で step を特定できるよう、全 step に空でない name を必須とする。 */
export const requireStepName = (wf: WorkflowFile): Finding[] => {
  const findings: Finding[] = [];
  for (const job of jobEntries(wf)) {
    const stepsNode = deref(wf, job.map.get("steps"));
    if (!isSeq(stepsNode)) continue;

    for (const step of stepsNode.items) {
      const stepNode = deref(wf, step);
      if (!isMap(stepNode)) continue;
      const name = scalarValueOf(wf, stepNode.get("name", true));
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
};
