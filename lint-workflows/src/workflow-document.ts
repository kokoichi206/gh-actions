import {
  Document,
  LineCounter,
  Pair,
  YAMLMap,
  isMap,
  isScalar,
  isSeq,
  parseDocument,
} from "yaml";

export type WorkflowFile = {
  file: string;
  source: string;
  lines: string[];
  doc: Document;
  lineOfNode: (node: unknown) => number;
  lineOfOffset: (offset: number) => number;
};

export type JobEntry = {
  key: string;
  keyLine: number;
  map: YAMLMap;
  callsReusableWorkflow: boolean;
};

type RangedNode = { range?: [number, number, number] | null };

export const parseWorkflow = (file: string, source: string): WorkflowFile => {
  const lineCounter = new LineCounter();
  const doc = parseDocument(source, { lineCounter });

  const lineOfOffset = (offset: number): number => lineCounter.linePos(offset).line;

  const lineOfNode = (node: unknown): number => {
    const range = (node as RangedNode | null)?.range;
    if (!range) return 1;
    return lineOfOffset(range[0]);
  };

  return {
    file,
    source,
    lines: source.split(/\r?\n/),
    doc,
    lineOfNode,
    lineOfOffset,
  };
};

export const topLevelMap = (wf: WorkflowFile): YAMLMap | null =>
  isMap(wf.doc.contents) ? wf.doc.contents : null;

export const findPair = (map: YAMLMap, key: string): Pair | undefined =>
  map.items.find((pair) => isScalar(pair.key) && pair.key.value === key);

export const jobEntries = (wf: WorkflowFile): JobEntry[] => {
  const top = topLevelMap(wf);
  if (!top) return [];

  const jobsNode = findPair(top, "jobs")?.value;
  if (!isMap(jobsNode)) return [];

  const entries: JobEntry[] = [];
  for (const pair of jobsNode.items) {
    if (!isScalar(pair.key) || !isMap(pair.value)) continue;
    entries.push({
      key: String(pair.key.value),
      keyLine: wf.lineOfNode(pair.key),
      map: pair.value,
      callsReusableWorkflow: pair.value.has("uses"),
    });
  }
  return entries;
};

/** `on:` の scalar / sequence / mapping 全形式からトリガー名を取り出す。 */
export const triggerNames = (wf: WorkflowFile): string[] => {
  const top = topLevelMap(wf);
  if (!top) return [];

  const onNode = findPair(top, "on")?.value;
  if (isScalar(onNode)) return [String(onNode.value)];
  if (isSeq(onNode)) {
    return onNode.items.filter(isScalar).map((item) => String(item.value));
  }
  if (isMap(onNode)) {
    return onNode.items
      .filter((pair) => isScalar(pair.key))
      .map((pair) => String((pair.key as { value: unknown }).value));
  }
  return [];
};

/** `on:` が mapping 形式のときのみ、その mapping を返す。 */
export const triggerMap = (wf: WorkflowFile): YAMLMap | null => {
  const top = topLevelMap(wf);
  if (!top) return null;

  const onNode = findPair(top, "on")?.value;
  return isMap(onNode) ? onNode : null;
};
