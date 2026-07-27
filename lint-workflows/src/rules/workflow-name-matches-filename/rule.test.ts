import { runRuleGoldenTests } from "../../testing/golden-runner.js";
import { workflowNameMatchesFilename } from "./rule.js";

runRuleGoldenTests({ rule: workflowNameMatchesFilename, testFileUrl: import.meta.url });
