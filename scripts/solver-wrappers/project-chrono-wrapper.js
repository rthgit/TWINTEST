import { runConfiguredWrapper } from "./common.js";

await runConfiguredWrapper({
  solverName: "Project Chrono",
  defaultResultFormat: "json_stdout",
  defaultMetricMap: {
    trajectory_error: "trajectory_error",
    peak_acceleration: "peak_acceleration",
    stability_margin: "stability_margin",
    stopping_distance_m: "stopping_distance_m"
  }
});
