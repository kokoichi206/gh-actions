import type { Finding } from "../../types.js";
import { findPair, triggerMap, type WorkflowFile } from "../../workflow-document.js";

/**
 * cron 専用 workflow は手動実行できず、動作確認が「次の cron を待つ」になるため、
 * schedule には workflow_dispatch の併記を必須とする。
 */
export const scheduleRequiresWorkflowDispatch = (wf: WorkflowFile): Finding[] => {
  const on = triggerMap(wf);
  if (!on) return [];

  const schedulePair = findPair(on, "schedule");
  if (!schedulePair || on.has("workflow_dispatch")) return [];

  return [
    {
      file: wf.file,
      line: wf.lineOfNode(schedulePair.key),
      rule: "schedule-requires-workflow-dispatch",
      message: "schedule トリガーには workflow_dispatch を併記してください (手動実行での動作確認を可能にするため)",
    },
  ];
};
