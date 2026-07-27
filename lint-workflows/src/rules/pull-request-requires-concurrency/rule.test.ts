import { runRuleGoldenTests } from "../../testing/golden-runner.js";
import { pullRequestRequiresConcurrency } from "./rule.js";

runRuleGoldenTests({ rule: pullRequestRequiresConcurrency, testFileUrl: import.meta.url });
