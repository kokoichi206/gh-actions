import { maxJobTimeout } from "./rules/max-job-timeout.js";
import { pullRequestRequiresConcurrency } from "./rules/pull-request-requires-concurrency.js";
import { requireBlankLineBetweenSteps } from "./rules/require-blank-line-between-steps.js";
import { requireJobTimeout } from "./rules/require-job-timeout.js";
import { requireStepName } from "./rules/require-step-name.js";
import { scheduleRequiresWorkflowDispatch } from "./rules/schedule-requires-workflow-dispatch.js";
import { workflowNameMatchesFilename } from "./rules/workflow-name-matches-filename.js";
import type { Finding, LintOptions } from "./types.js";
import { parseWorkflow } from "./workflow-document.js";

export const lintWorkflowSource = (
  file: string,
  source: string,
  options: LintOptions,
): Finding[] => {
  const wf = parseWorkflow(file, source);

  if (wf.doc.errors.length > 0) {
    return wf.doc.errors.map((error) => ({
      file,
      line: error.linePos?.[0]?.line ?? 1,
      rule: "yaml-parse-error",
      message: `YAML の解析に失敗しました: ${error.message.split("\n")[0] ?? error.code}`,
    }));
  }

  return [
    ...requireJobTimeout(wf),
    ...maxJobTimeout(wf, options),
    ...workflowNameMatchesFilename(wf),
    ...requireStepName(wf),
    ...requireBlankLineBetweenSteps(wf),
    ...scheduleRequiresWorkflowDispatch(wf),
    ...pullRequestRequiresConcurrency(wf),
  ];
};
