// ルール単体の挙動は各 src/rules/<rule>/testdata/ の golden テストで検証する。
// ここでは全ルールを束ねた lintWorkflowSource の横断的な挙動
// (全ルール通過・reusable call job の除外・YAML parse エラー) を testdata/ で検証する。
import { runLintGoldenTests } from "../src/testing/golden-runner.js";

runLintGoldenTests({ testFileUrl: import.meta.url });
