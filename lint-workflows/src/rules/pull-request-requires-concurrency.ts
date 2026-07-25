import { isMap } from "yaml";

import type { Finding } from "../types.js";
import { findPair, topLevelMap, triggerNames, type WorkflowFile } from "../workflow-document.js";

/**
 * PR へ push するたびに旧 run が回り続けると runner 課金が無駄になるため、
 * pull_request トリガーを持つ workflow には cancel-in-progress: true の
 * concurrency を必須とする。値が式 (`${{ ... }}`) の場合は動的制御とみなし許容する。
 * push 起点のデプロイ系 workflow は cancel でなく queue が正しいため対象外。
 */
export const pullRequestRequiresConcurrency = (wf: WorkflowFile): Finding[] => {
  if (!triggerNames(wf).includes("pull_request")) return [];

  const top = topLevelMap(wf);
  if (!top) return [];

  const concurrencyPair = findPair(top, "concurrency");
  if (!concurrencyPair) {
    const onPair = findPair(top, "on");
    return [
      {
        file: wf.file,
        line: onPair ? wf.lineOfNode(onPair.key) : 1,
        rule: "pull-request-requires-concurrency",
        message:
          "pull_request トリガーには concurrency (cancel-in-progress: true) を設定してください",
      },
    ];
  }

  const concurrencyNode = concurrencyPair.value;
  if (isMap(concurrencyNode)) {
    const cancelInProgress = concurrencyNode.get("cancel-in-progress");
    const isExpression =
      typeof cancelInProgress === "string" && cancelInProgress.includes("${{");
    if (cancelInProgress === true || isExpression) return [];
  }

  return [
    {
      file: wf.file,
      line: wf.lineOfNode(concurrencyPair.key),
      rule: "pull-request-requires-concurrency",
      message: "pull_request トリガーの workflow の concurrency には cancel-in-progress: true が必要です",
    },
  ];
};
