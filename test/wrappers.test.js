import assert from "node:assert/strict";
import { access, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { listExternalSolverManifests } from "../src/core/external-solver-manifests.js";
import { normalizeWrapperOutput } from "../scripts/solver-wrappers/common.js";

test("TwinTest wrapper script files exist for every external process manifest", async () => {
  const manifests = listExternalSolverManifests()
    .filter((manifest) => manifest.adapterType === "external_process_json");

  for (const manifest of manifests) {
    const wrapperPath = path.join(process.cwd(), manifest.bindingTemplate.configuration.args[0]);
    await access(wrapperPath);
  }
});

test("TwinTest wrapper normalization handles JSON stdout contracts", async () => {
  const manifests = listExternalSolverManifests()
    .filter((manifest) => manifest.adapterType === "external_process_json");
  const expectedMetrics = {
    performance: 0.91,
    efficiency: 0.87,
    safety: 0.95
  };

  for (const manifest of manifests) {
    const result = await normalizeWrapperOutput({
      resultFormat: "json_stdout",
      stdout: JSON.stringify({ metrics: expectedMetrics })
    });

    assert.deepEqual(result.metrics, expectedMetrics);
    assert.deepEqual(result.artifacts, []);
    assert.ok(manifest.solver);
  }
});

test("TwinTest gem5 wrapper normalization handles key-value output files", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `wrapper-kv-${Date.now()}`);
  const statsPath = path.join(tempDir, "gem5-stats.txt");
  await mkdir(tempDir, { recursive: true });
  await writeFile(statsPath, "ipc 1.42\nlatency_ms 3.5\nthroughput 220\ncache_miss_rate 0.08\n");

  try {
    const result = await normalizeWrapperOutput({
      resultFormat: "key_value_file",
      rawOutputPath: statsPath
    }, {
      solverCwd: tempDir,
      metricMap: {
        ipc: "ipc",
        latency_ms: "latency_ms",
        throughput: "throughput",
        cache_miss_rate: "cache_miss_rate"
      }
    });

    assert.equal(result.metrics.ipc, 1.42);
    assert.equal(result.metrics.latency_ms, 3.5);
    assert.equal(result.metrics.throughput, 220);
    assert.equal(result.metrics.cache_miss_rate, 0.08);
    assert.ok(result.artifacts.some((artifact) => artifact.path === statsPath));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
