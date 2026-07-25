import { isScalar } from "yaml";

import type { Finding } from "../types.js";
import { findPair, topLevelMap, type WorkflowFile } from "../workflow-document.js";

/**
 * Actions UI や gh run list の表示名から対象ファイルを一意に辿れるようにするため、
 * トップレベル name はファイル名 (拡張子なし) と一致させる。
 */
export const workflowNameMatchesFilename = (wf: WorkflowFile): Finding[] => {
  const base = wf.file.replace(/^.*\//, "").replace(/\.ya?ml$/, "");

  const top = topLevelMap(wf);
  const namePair = top ? findPair(top, "name") : undefined;
  if (!namePair) {
    return [
      {
        file: wf.file,
        line: 1,
        rule: "workflow-name-matches-filename",
        message: `トップレベル name がありません (name: ${base} を追加してください)`,
      },
    ];
  }

  const nameNode = namePair.value;
  const name = isScalar(nameNode) ? String(nameNode.value) : null;
  if (name === base) return [];

  return [
    {
      file: wf.file,
      line: wf.lineOfNode(namePair.key),
      rule: "workflow-name-matches-filename",
      message: `name '${name ?? "(スカラー以外)"}' がファイル名 '${base}' と一致しません`,
    },
  ];
};
