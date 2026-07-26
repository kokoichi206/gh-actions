import { runRuleGoldenTests } from "../../testing/rule-golden-runner.js";
import { requireStepName } from "./rule.js";

runRuleGoldenTests({ rule: requireStepName, testFileUrl: import.meta.url });
