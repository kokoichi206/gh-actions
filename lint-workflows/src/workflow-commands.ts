import type { Finding } from "./types.js";

// workflow command の仕様に従ってエスケープする
// (https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands)
export const escapeMessage = (value: string): string =>
  value.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");

export const escapeProperty = (value: string): string =>
  escapeMessage(value).replaceAll(":", "%3A").replaceAll(",", "%2C");

export const formatErrorCommand = (finding: Finding): string =>
  `::error file=${escapeProperty(finding.file)},line=${finding.line}::[${finding.rule}] ${escapeMessage(finding.message)}`;
