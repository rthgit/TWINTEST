const SUPPORTED_ADAPTER_TYPES = new Set([
  "artifact_metrics_json",
  "external_process_json"
]);

const SUPPORTED_PRIORITIES = new Set(["p0", "p1", "p2"]);
const SUPPORTED_STATUSES = new Set([
  "contract_ready",
  "runtime_ready_local_driver",
  "dataset_pipeline_ready"
]);
const WRAPPER_CONFIGURATION_FIELDS = [
  "command",
  "args",
  "cwd",
  "timeoutMs",
  "env",
  "localDriverId",
  "solverBinary",
  "solverArgs",
  "solverCwd",
  "solverTimeoutMs",
  "solverEnv",
  "resultFormat",
  "forwardInputAsJson"
];

function externalTemplate(wrapperPath, driverId, options = {}) {
  const configuration = {
    command: "node",
    args: [wrapperPath],
    cwd: ".",
    timeoutMs: 120000,
    env: {},
    localDriverId: driverId,
    solverBinary: "",
    solverArgs: [],
    solverCwd: ".",
    solverTimeoutMs: 120000,
    solverEnv: {},
    resultFormat: options.resultFormat || "json_stdout",
    forwardInputAsJson: true
  };

  if (options.rawOutputPath) {
    configuration.rawOutputPath = options.rawOutputPath;
  }

  return {
    adapterType: "external_process_json",
    configuration
  };
}

function artifactTemplate(pathHint, label) {
  return {
    adapterType: "artifact_metrics_json",
    configuration: {
      path: pathHint,
      selector: "scenarioType",
      label
    }
  };
}

const rawManifests = [
  {
    id: "sundials-cli-json",
    solver: "SUNDIALS",
    label: "SUNDIALS CLI JSON Wrapper",
    adapterType: "external_process_json",
    priority: "p0",
    status: "runtime_ready_local_driver",
    invocationMode: "cli_wrapper",
    categories: [
      "continuous_time_dynamics",
      "differential_algebraic_systems",
      "physiological_compartment_modeling"
    ],
    configurationFields: WRAPPER_CONFIGURATION_FIELDS,
    expectedMetrics: [
      "tracking_error",
      "settling_time_ms",
      "peak_error",
      "stability_margin"
    ],
    bindingTemplate: externalTemplate("scripts/solver-wrappers/sundials-wrapper.js", "sundials"),
    notes: "Wrapper must accept TwinTest JSON on stdin and emit metrics/artifacts JSON on stdout."
  },
  {
    id: "openmodelica-cli-json",
    solver: "OpenModelica",
    label: "OpenModelica CLI JSON Wrapper",
    adapterType: "external_process_json",
    priority: "p0",
    status: "runtime_ready_local_driver",
    invocationMode: "cli_wrapper",
    categories: [
      "thermal_rc_networks",
      "wearable_thermal_comfort",
      "home_energy_optimization",
      "medical_device_control",
      "distributed_energy_dispatch"
    ],
    configurationFields: WRAPPER_CONFIGURATION_FIELDS,
    expectedMetrics: [
      "thermal_margin",
      "efficiency",
      "energy_consumption",
      "control_error"
    ],
    bindingTemplate: externalTemplate("scripts/solver-wrappers/openmodelica-wrapper.js", "openmodelica"),
    notes: "Use this wrapper when the source model already exists in Modelica or FMU-compatible form."
  },
  {
    id: "nuxmv-cli-json",
    solver: "nuXmv",
    label: "nuXmv CLI JSON Wrapper",
    adapterType: "external_process_json",
    priority: "p0",
    status: "runtime_ready_local_driver",
    invocationMode: "cli_wrapper",
    categories: [
      "formal_logic_verification",
      "industrial_safety_interlocks",
      "clinical_workflow_safety",
      "autonomy_safety_envelope",
      "avionics_failover_validation"
    ],
    configurationFields: WRAPPER_CONFIGURATION_FIELDS,
    expectedMetrics: [
      "property_pass_rate",
      "counterexample_count",
      "proof_depth",
      "failover_coverage"
    ],
    bindingTemplate: externalTemplate("scripts/solver-wrappers/nuxmv-wrapper.js", "nuxmv"),
    notes: "Formal wrappers should translate requirements or automata models into machine-checkable nuXmv runs."
  },
  {
    id: "gem5-cli-json",
    solver: "gem5",
    label: "gem5 CLI JSON Wrapper",
    adapterType: "external_process_json",
    priority: "p0",
    status: "runtime_ready_local_driver",
    invocationMode: "cli_wrapper",
    categories: [
      "computer_architecture_performance",
      "scheduler_runtime_analysis"
    ],
    configurationFields: WRAPPER_CONFIGURATION_FIELDS,
    expectedMetrics: [
      "ipc",
      "latency_ms",
      "throughput",
      "cache_miss_rate"
    ],
    bindingTemplate: externalTemplate("scripts/solver-wrappers/gem5-wrapper.js", "gem5", {
      resultFormat: "key_value_file",
      rawOutputPath: "./outputs/gem5-stats.txt"
    }),
    notes: "Wrapper should normalize gem5 stats into TwinTest metrics and preserve raw stats as artifacts."
  },
  {
    id: "gem5-trace-artifact-bundle",
    solver: "gem5 trace bundle",
    label: "gem5 Trace Artifact Bundle",
    adapterType: "artifact_metrics_json",
    priority: "p0",
    status: "dataset_pipeline_ready",
    invocationMode: "artifact_bundle",
    categories: [
      "chip_power_thermal_coanalysis"
    ],
    configurationFields: [
      "path",
      "selector",
      "label"
    ],
    expectedMetrics: [
      "power_proxy",
      "thermal_hotspot_margin",
      "queue_pressure",
      "memory_latency"
    ],
    bindingTemplate: artifactTemplate("./artifacts/gem5-trace-bundle.json", "gem5 trace bundle"),
    notes: "Trace-driven co-analysis should start from governed artifact bundles before moving to coupled online execution."
  },
  {
    id: "openturns-cli-json",
    solver: "OpenTURNS",
    label: "OpenTURNS CLI JSON Wrapper",
    adapterType: "external_process_json",
    priority: "p0",
    status: "runtime_ready_local_driver",
    invocationMode: "cli_wrapper",
    categories: [
      "probabilistic_reliability",
      "uncertainty_quantification",
      "market_risk_var",
      "stress_scenario_analysis",
      "mission_assurance_reliability"
    ],
    configurationFields: WRAPPER_CONFIGURATION_FIELDS,
    expectedMetrics: [
      "failure_probability",
      "value_at_risk",
      "expected_shortfall",
      "sobol_index"
    ],
    bindingTemplate: externalTemplate("scripts/solver-wrappers/openturns-wrapper.js", "openturns"),
    notes: "Use this wrapper for Monte Carlo, FORM/SORM, stress and sensitivity workflows."
  },
  {
    id: "project-chrono-cli-json",
    solver: "Project Chrono",
    label: "Project Chrono CLI JSON Wrapper",
    adapterType: "external_process_json",
    priority: "p1",
    status: "runtime_ready_local_driver",
    invocationMode: "cli_wrapper",
    categories: [
      "multibody_dynamics",
      "vehicle_powertrain_dynamics",
      "personal_mobility_safety",
      "robot_kinematics_and_reachability"
    ],
    configurationFields: WRAPPER_CONFIGURATION_FIELDS,
    expectedMetrics: [
      "trajectory_error",
      "peak_acceleration",
      "stability_margin",
      "stopping_distance_m"
    ],
    bindingTemplate: externalTemplate("scripts/solver-wrappers/project-chrono-wrapper.js", "project-chrono"),
    notes: "Chrono should be the default multibody path for vehicle and robotics dynamics when wrappers are available."
  },
  {
    id: "calculix-cli-json",
    solver: "CalculiX",
    label: "CalculiX CLI JSON Wrapper",
    adapterType: "external_process_json",
    priority: "p1",
    status: "runtime_ready_local_driver",
    invocationMode: "cli_wrapper",
    categories: [
      "structural_static_fem",
      "nonlinear_structural_fem",
      "modal_vibration_analysis",
      "biomechanics_reduced_order"
    ],
    configurationFields: WRAPPER_CONFIGURATION_FIELDS,
    expectedMetrics: [
      "max_stress",
      "max_displacement",
      "safety_factor",
      "modal_frequency_hz"
    ],
    bindingTemplate: externalTemplate("scripts/solver-wrappers/calculix-wrapper.js", "calculix"),
    notes: "CalculiX wrappers should emit compact metrics plus mesh/result artifacts."
  },
  {
    id: "openfoam-cli-json",
    solver: "OpenFOAM",
    label: "OpenFOAM CLI JSON Wrapper",
    adapterType: "external_process_json",
    priority: "p1",
    status: "runtime_ready_local_driver",
    invocationMode: "cli_wrapper",
    categories: [
      "thermofluidic_cfd",
      "fluid_network_simulation",
      "water_network_resilience"
    ],
    configurationFields: WRAPPER_CONFIGURATION_FIELDS,
    expectedMetrics: [
      "pressure_drop",
      "flow_uniformity",
      "temperature_rise",
      "cavitation_margin"
    ],
    bindingTemplate: externalTemplate("scripts/solver-wrappers/openfoam-wrapper.js", "openfoam"),
    notes: "OpenFOAM integrations should standardize post-processing into scenario-scoped JSON metrics."
  },
  {
    id: "xyce-cli-json",
    solver: "Xyce",
    label: "Xyce CLI JSON Wrapper",
    adapterType: "external_process_json",
    priority: "p1",
    status: "runtime_ready_local_driver",
    invocationMode: "cli_wrapper",
    categories: [
      "electrical_circuit_transient",
      "mixed_signal_drive_control",
      "power_electronics_switching",
      "battery_pack_models"
    ],
    configurationFields: WRAPPER_CONFIGURATION_FIELDS,
    expectedMetrics: [
      "ripple",
      "switching_loss",
      "peak_current",
      "efficiency"
    ],
    bindingTemplate: externalTemplate("scripts/solver-wrappers/xyce-wrapper.js", "xyce"),
    notes: "Circuit wrappers should preserve raw transient outputs as artifacts for later audit."
  },
  {
    id: "materials-chemistry-cli-json",
    solver: "Chemical Transport Backend",
    label: "Materials and Chemistry CLI JSON Wrapper",
    adapterType: "external_process_json",
    priority: "p1",
    status: "runtime_ready_local_driver",
    invocationMode: "cli_wrapper",
    categories: [
      "reaction_kinetics_modeling",
      "diffusion_and_barrier_transport",
      "rheology_and_viscoelasticity",
      "surface_interaction_and_adsorption"
    ],
    configurationFields: WRAPPER_CONFIGURATION_FIELDS,
    expectedMetrics: [
      "conversion",
      "transport_margin",
      "rheology_stability",
      "surface_coverage"
    ],
    bindingTemplate: externalTemplate("scripts/solver-wrappers/materials-chemistry-wrapper.js", "materials-chemistry"),
    notes: "Materials and chemistry wrappers should normalize kinetics, barrier and surface screening outputs."
  },
  {
    id: "cosmetic-transport-cli-json",
    solver: "Dermal and Formulation Backend",
    label: "Cosmetic Transport CLI JSON Wrapper",
    adapterType: "external_process_json",
    priority: "p1",
    status: "runtime_ready_local_driver",
    invocationMode: "cli_wrapper",
    categories: [
      "skin_penetration_and_retention",
      "formulation_stability_screening"
    ],
    configurationFields: WRAPPER_CONFIGURATION_FIELDS,
    expectedMetrics: [
      "dermal_margin",
      "stability_score",
      "local_retention",
      "separation_index"
    ],
    bindingTemplate: externalTemplate("scripts/solver-wrappers/cosmetic-transport-wrapper.js", "cosmetic-transport"),
    notes: "Use this wrapper for dermal transport and formulation stability screening paths."
  },
  {
    id: "cosmetic-evidence-artifact-bundle",
    solver: "Cosmetic Lab Evidence Bundle",
    label: "Cosmetic Lab Evidence Artifact Bundle",
    adapterType: "artifact_metrics_json",
    priority: "p1",
    status: "dataset_pipeline_ready",
    invocationMode: "artifact_bundle",
    categories: [
      "preservative_efficacy_validation",
      "sensory_profile_consistency"
    ],
    configurationFields: [
      "path",
      "selector",
      "label"
    ],
    expectedMetrics: [
      "preservative_margin",
      "sensory_consistency",
      "microbial_control",
      "panel_variance"
    ],
    bindingTemplate: artifactTemplate("./artifacts/cosmetic-lab-evidence-bundle.json", "cosmetic lab evidence bundle"),
    notes: "Challenge test and sensory panel validation should start from governed artifact bundles."
  },
  {
    id: "space-orbital-cli-json",
    solver: "Orbital Mechanics Backend",
    label: "Space Orbital CLI JSON Wrapper",
    adapterType: "external_process_json",
    priority: "p1",
    status: "runtime_ready_local_driver",
    invocationMode: "cli_wrapper",
    categories: [
      "orbital_dynamics_and_mission_geometry"
    ],
    configurationFields: WRAPPER_CONFIGURATION_FIELDS,
    expectedMetrics: [
      "orbital_margin",
      "period_minutes",
      "delta_v_reserve",
      "tracking_quality"
    ],
    bindingTemplate: externalTemplate("scripts/solver-wrappers/space-orbital-wrapper.js", "space-orbital"),
    notes: "Orbital wrappers should preserve mission geometry metrics and downstream tracking quality."
  },
  {
    id: "space-observation-artifact-bundle",
    solver: "Observation Calibration Bundle",
    label: "Observation Calibration Artifact Bundle",
    adapterType: "artifact_metrics_json",
    priority: "p1",
    status: "dataset_pipeline_ready",
    invocationMode: "artifact_bundle",
    categories: [
      "observation_pipeline_calibration"
    ],
    configurationFields: [
      "path",
      "selector",
      "label"
    ],
    expectedMetrics: [
      "snr",
      "residual_bias",
      "calibration_margin",
      "observation_quality"
    ],
    bindingTemplate: artifactTemplate("./artifacts/space-observation-bundle.json", "space observation bundle"),
    notes: "Observation and calibration should remain dataset-first until heavier reduction backends are integrated."
  },
  {
    id: "space-inference-cli-json",
    solver: "Scientific Inference Backend",
    label: "Space Inference CLI JSON Wrapper",
    adapterType: "external_process_json",
    priority: "p2",
    status: "runtime_ready_local_driver",
    invocationMode: "cli_wrapper",
    categories: [
      "stellar_structure_and_evolution_screening",
      "cosmology_parameter_inference"
    ],
    configurationFields: WRAPPER_CONFIGURATION_FIELDS,
    expectedMetrics: [
      "reduced_chi2",
      "fit_confidence",
      "flatness_margin",
      "observation_consistency"
    ],
    bindingTemplate: externalTemplate("scripts/solver-wrappers/space-inference-wrapper.js", "space-inference"),
    notes: "Scientific inference wrappers should normalize fit quality and cosmology consistency into compact metrics."
  }
];

const manifestItems = buildManifestItems();
const manifestCatalog = Object.fromEntries(
  manifestItems.map((manifest) => [manifest.id, manifest])
);

export function listExternalSolverManifests() {
  return structuredClone(manifestItems);
}

export function getExternalSolverManifestCatalog() {
  return structuredClone(manifestCatalog);
}

export function getExternalSolverManifestSummary() {
  return structuredClone({
    totalManifests: manifestItems.length,
    runtimeReadyLocalDrivers: manifestItems.filter((manifest) => manifest.status === "runtime_ready_local_driver").length,
    artifactPipelineReady: manifestItems.filter((manifest) => manifest.status === "dataset_pipeline_ready").length,
    byPriority: countBy(manifestItems, (manifest) => manifest.priority),
    byAdapterType: countBy(manifestItems, (manifest) => manifest.adapterType),
    byStatus: countBy(manifestItems, (manifest) => manifest.status),
    byInvocationMode: countBy(manifestItems, (manifest) => manifest.invocationMode)
  });
}

function buildManifestItems() {
  validateManifests(rawManifests);
  return rawManifests.map((manifest) => structuredClone(manifest));
}

function validateManifests(manifests) {
  const seenIds = new Set();

  for (const manifest of manifests) {
    if (!manifest.id?.trim()) {
      throw new Error("External solver manifest requires a non-empty id.");
    }

    if (seenIds.has(manifest.id)) {
      throw new Error(`Duplicate external solver manifest "${manifest.id}".`);
    }

    seenIds.add(manifest.id);

    if (!SUPPORTED_ADAPTER_TYPES.has(manifest.adapterType)) {
      throw new Error(`Manifest "${manifest.id}" uses unsupported adapter type "${manifest.adapterType}".`);
    }

    if (!SUPPORTED_PRIORITIES.has(manifest.priority)) {
      throw new Error(`Manifest "${manifest.id}" uses unsupported priority "${manifest.priority}".`);
    }

    if (!SUPPORTED_STATUSES.has(manifest.status)) {
      throw new Error(`Manifest "${manifest.id}" uses unsupported status "${manifest.status}".`);
    }

    if (!Array.isArray(manifest.categories) || !manifest.categories.length) {
      throw new Error(`Manifest "${manifest.id}" requires at least one category.`);
    }

    if (!Array.isArray(manifest.configurationFields) || !manifest.configurationFields.length) {
      throw new Error(`Manifest "${manifest.id}" requires configuration field documentation.`);
    }

    if (!Array.isArray(manifest.expectedMetrics) || !manifest.expectedMetrics.length) {
      throw new Error(`Manifest "${manifest.id}" requires expected metrics.`);
    }

    if (!manifest.bindingTemplate?.adapterType || !manifest.bindingTemplate?.configuration) {
      throw new Error(`Manifest "${manifest.id}" requires a binding template.`);
    }
  }
}

function countBy(items, selectKey) {
  return items.reduce((accumulator, item) => {
    const key = selectKey(item);
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
}
