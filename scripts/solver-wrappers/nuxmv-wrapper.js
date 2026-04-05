import { runConfiguredWrapper } from "./common.js";

await runConfiguredWrapper({
  solverName: "nuXmv",
  defaultResultFormat: "json_stdout",
  defaultMetricMap: {
    property_pass_rate: "property_pass_rate",
    counterexample_count: "counterexample_count",
    proof_depth: "proof_depth",
    failover_coverage: "failover_coverage"
  }
});
