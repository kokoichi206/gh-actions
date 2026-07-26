import { runRuleGoldenTests } from "../../testing/rule-golden-runner.js";
import { requireJobTimeout } from "./rule.js";

runRuleGoldenTests({ rule: requireJobTimeout, testFileUrl: import.meta.url });
