import { runConfiguredWrapper } from "./common.js";

await runConfiguredWrapper({
  solverName: "gem5",
  defaultResultFormat: "key_value_file",
  defaultMetricMap: {
    ipc: "ipc",
    latency_ms: "latency_ms",
    throughput: "throughput",
    cache_miss_rate: "cache_miss_rate"
  }
});
