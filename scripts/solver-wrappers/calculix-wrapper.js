import { runConfiguredWrapper } from "./common.js";

await runConfiguredWrapper({
  solverName: "CalculiX",
  defaultResultFormat: "json_stdout",
  defaultMetricMap: {
    max_stress: "max_stress",
    max_displacement: "max_displacement",
    safety_factor: "safety_factor",
    modal_frequency_hz: "modal_frequency_hz"
  }
});
