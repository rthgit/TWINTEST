import { runConfiguredWrapper } from "./common.js";

await runConfiguredWrapper({
  solverName: "OpenModelica",
  defaultResultFormat: "json_stdout",
  defaultMetricMap: {
    thermal_margin: "thermal_margin",
    efficiency: "efficiency",
    energy_consumption: "energy_consumption",
    control_error: "control_error"
  }
});
