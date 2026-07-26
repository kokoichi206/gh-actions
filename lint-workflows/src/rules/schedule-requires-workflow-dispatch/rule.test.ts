import { runRuleGoldenTests } from "../../testing/rule-golden-runner.js";
import { scheduleRequiresWorkflowDispatch } from "./rule.js";

runRuleGoldenTests({ rule: scheduleRequiresWorkflowDispatch, testFileUrl: import.meta.url });
