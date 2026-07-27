import { runRuleGoldenTests } from "../../testing/golden-runner.js";
import { requireBlankLineBetweenSteps } from "./rule.js";

runRuleGoldenTests({ rule: requireBlankLineBetweenSteps, testFileUrl: import.meta.url });
