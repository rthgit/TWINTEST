import { runConfiguredWrapper } from "./common.js";

await runConfiguredWrapper({
  solverName: "SUNDIALS",
  defaultResultFormat: "json_stdout",
  defaultMetricMap: {
    tracking_error: "tracking_error",
    settling_time_ms: "settling_time_ms",
    peak_error: "peak_error",
    stability_margin: "stability_margin"
  }
});
