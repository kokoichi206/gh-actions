export type Finding = {
  file: string;
  line: number;
  rule: string;
  message: string;
};

export type LintOptions = {
  maxTimeoutMinutes: number;
};
