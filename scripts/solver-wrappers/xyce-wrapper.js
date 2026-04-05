import { runConfiguredWrapper } from "./common.js";

await runConfiguredWrapper({
  solverName: "Xyce",
  defaultResultFormat: "json_stdout",
  defaultMetricMap: {
    ripple: "ripple",
    switching_loss: "switching_loss",
    peak_current: "peak_current",
    efficiency: "efficiency"
  }
});
