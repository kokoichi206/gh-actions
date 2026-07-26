import { runRuleGoldenTests } from "../../testing/golden-runner.js";
import { requireStepName } from "./rule.js";

runRuleGoldenTests({ rule: requireStepName, testFileUrl: import.meta.url });
