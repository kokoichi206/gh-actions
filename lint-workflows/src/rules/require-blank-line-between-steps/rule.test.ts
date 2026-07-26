import { runRuleGoldenTests } from "../../testing/rule-golden-runner.js";
import { requireBlankLineBetweenSteps } from "./rule.js";

runRuleGoldenTests({ rule: requireBlankLineBetweenSteps, testFileUrl: import.meta.url });
