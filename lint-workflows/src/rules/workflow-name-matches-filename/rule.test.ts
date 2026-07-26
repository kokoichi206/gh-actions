import { runRuleGoldenTests } from "../../testing/rule-golden-runner.js";
import { workflowNameMatchesFilename } from "./rule.js";

runRuleGoldenTests({ rule: workflowNameMatchesFilename, testFileUrl: import.meta.url });
