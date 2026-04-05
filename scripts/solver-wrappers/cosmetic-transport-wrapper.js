import { runConfiguredWrapper } from "./common.js";

await runConfiguredWrapper({
  solverName: "Dermal and Formulation Backend",
  defaultResultFormat: "json_stdout",
  defaultMetricMap: {
    dermal_margin: "dermal_margin",
    stability_score: "stability_score",
    local_retention: "local_retention",
    separation_index: "separation_index"
  }
});
