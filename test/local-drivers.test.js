import assert from "node:assert/strict";
import test from "node:test";
import { listExternalSolverManifests } from "../src/core/external-solver-manifests.js";
import {
  getLocalExternalDriverCatalog,
  listLocalExternalDrivers,
  runLocalExternalDriver
} from "../src/core/local-external-drivers.js";

test("TwinTest local external drivers cover every wrapper-backed manifest", () => {
  const manifests = listExternalSolverManifests()
    .filter((manifest) => manifest.adapterType === "external_process_json");
  const driverCatalog = getLocalExternalDriverCatalog();

  for (const manifest of manifests) {
    const driverId = manifest.bindingTemplate.configuration.localDriverId;
    assert.ok(driverCatalog[driverId]);
    assert.equal(manifest.status, "runtime_ready_local_driver");
    assert.equal(manifest.bindingTemplate.configuration.localDriverId, driverId);
    assert.equal(manifest.bindingTemplate.configuration.solverBinary, "");
    assert.deepEqual(manifest.bindingTemplate.configuration.solverArgs, []);
    assert.equal(manifest.bindingTemplate.configuration.forwardInputAsJson, true);
  }
});

test("TwinTest local external drivers execute real numeric computations for every solver family", () => {
  const drivers = listLocalExternalDrivers();
  const payload = {
    scenario: {
      id: "scenario_driver",
      type: "stress_overload"
    },
    binding: {
      solver: "driver",
      configuration: {
        parameters: {
          throughput_target: 145000,
          latency_budget_ms: 3.8,
          queue_depth: 40,
          power_budget_watts: 390,
          target_temp_c: 21,
          ambient_temp_c: 27,
          hvac_capacity_kw: 16,
          load_n: 2100,
          stiffness_n_mm: 520,
          vehicle_mass_kg: 160,
          brake_response_ms: 120,
          flow_target_l_min: 38,
          pressure_limit_bar: 6.2,
          voltage_v: 230,
          current_limit_a: 15
        }
      }
    }
  };

  for (const driver of drivers) {
    const result = runLocalExternalDriver({
      driverId: driver.driverId,
      payload
    });

    assert.equal(result.solver, driver.solver);
    assert.equal(result.outputMode, driver.outputMode);
    assert.deepEqual(Object.keys(result.metrics).sort(), [...driver.metricKeys].sort());
    assert.ok(Object.values(result.metrics).every((value) => Number.isFinite(value)));
  }
});
