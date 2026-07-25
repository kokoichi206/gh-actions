import type { Finding } from "../types.js";
import { jobEntries, type WorkflowFile } from "../workflow-document.js";

/**
 * デフォルトの job timeout は非常に長く、ハングした job (特に LLM 実行系) が
 * runner 課金を垂れ流すため、全 job に timeout-minutes の明示を必須とする。
 * reusable workflow を呼ぶ job (`uses:`) は仕様上 timeout-minutes を設定できないため
 * 対象外 (呼び出し先 workflow の job で設定する)。
 */
export const requireJobTimeout = (wf: WorkflowFile): Finding[] => {
  const findings: Finding[] = [];
  for (const job of jobEntries(wf)) {
    if (job.callsReusableWorkflow) continue;
    if (job.map.has("timeout-minutes")) continue;

    findings.push({
      file: wf.file,
      line: job.keyLine,
      rule: "require-job-timeout",
      message: `job '${job.key}' に timeout-minutes がありません`,
    });
  }
  return findings;
};
