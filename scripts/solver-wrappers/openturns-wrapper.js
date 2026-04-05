import { runConfiguredWrapper } from "./common.js";

await runConfiguredWrapper({
  solverName: "OpenTURNS",
  defaultResultFormat: "json_stdout",
  defaultMetricMap: {
    failure_probability: "failure_probability",
    value_at_risk: "value_at_risk",
    expected_shortfall: "expected_shortfall",
    sobol_index: "sobol_index"
  }
});
