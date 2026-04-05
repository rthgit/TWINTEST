import { runConfiguredWrapper } from "./common.js";

await runConfiguredWrapper({
  solverName: "Scientific Inference Backend",
  defaultResultFormat: "json_stdout",
  defaultMetricMap: {
    reduced_chi2: "reduced_chi2",
    fit_confidence: "fit_confidence",
    flatness_margin: "flatness_margin",
    observation_consistency: "observation_consistency"
  }
});
