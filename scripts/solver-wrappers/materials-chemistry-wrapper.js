import { runConfiguredWrapper } from "./common.js";

await runConfiguredWrapper({
  solverName: "Chemical Transport Backend",
  defaultResultFormat: "json_stdout",
  defaultMetricMap: {
    conversion: "conversion",
    transport_margin: "transport_margin",
    rheology_stability: "rheology_stability",
    surface_coverage: "surface_coverage"
  }
});
