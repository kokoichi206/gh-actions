import { runRuleGoldenTests } from "../../testing/golden-runner.js";
import { maxJobTimeout } from "./rule.js";

runRuleGoldenTests({ rule: maxJobTimeout, testFileUrl: import.meta.url });
