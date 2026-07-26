import { isScalar } from "yaml";

import type { Finding, LintOptions } from "../../types.js";
import { deref, jobEntries, type WorkflowFile } from "../../workflow-document.js";

/**
 * timeout-minutes はキーの存在だけでは課金の上限にならないため、値にも上限を課す。
 * 式 (`${{ ... }}`) など数値以外の値は評価できないので対象外。
 */
export const maxJobTimeout = (wf: WorkflowFile, options: LintOptions): Finding[] => {
  const findings: Finding[] = [];
  for (const job of jobEntries(wf)) {
    const timeoutNode = deref(wf, job.map.get("timeout-minutes", true));
    if (!isScalar(timeoutNode) || typeof timeoutNode.value !== "number") continue;
    if (timeoutNode.value <= options.maxTimeoutMinutes) continue;

    findings.push({
      file: wf.file,
      line: wf.lineOfNode(timeoutNode),
      rule: "max-job-timeout",
      message: `job '${job.key}' の timeout-minutes (${timeoutNode.value}) が上限 ${options.maxTimeoutMinutes} を超えています (上限は action input max-timeout-minutes で調整可能)`,
    });
  }
  return findings;
};
