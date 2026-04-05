import { runConfiguredWrapper } from "./common.js";

await runConfiguredWrapper({
  solverName: "OpenFOAM",
  defaultResultFormat: "json_stdout",
  defaultMetricMap: {
    pressure_drop: "pressure_drop",
    flow_uniformity: "flow_uniformity",
    temperature_rise: "temperature_rise",
    cavitation_margin: "cavitation_margin"
  }
});
