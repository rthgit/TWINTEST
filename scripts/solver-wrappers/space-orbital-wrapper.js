import { runConfiguredWrapper } from "./common.js";

await runConfiguredWrapper({
  solverName: "Orbital Mechanics Backend",
  defaultResultFormat: "json_stdout",
  defaultMetricMap: {
    orbital_margin: "orbital_margin",
    period_minutes: "period_minutes",
    delta_v_reserve: "delta_v_reserve",
    tracking_quality: "tracking_quality"
  }
});
