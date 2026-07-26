import { runRuleGoldenTests } from "../../testing/rule-golden-runner.js";
import { pullRequestRequiresConcurrency } from "./rule.js";

runRuleGoldenTests({ rule: pullRequestRequiresConcurrency, testFileUrl: import.meta.url });
