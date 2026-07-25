import type { Finding } from "./types.js";

// workflow command の仕様に従ってエスケープする
// (https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands)
export function escapeMessage(value: string): string {
  return value.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");
}

export function escapeProperty(value: string): string {
  return escapeMessage(value).replaceAll(":", "%3A").replaceAll(",", "%2C");
}

export function formatErrorCommand(finding: Finding): string {
  return `::error file=${escapeProperty(finding.file)},line=${finding.line}::[${finding.rule}] ${escapeMessage(finding.message)}`;
}
