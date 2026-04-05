import { clamp, createId } from "./id.js";

const SCENARIO_FACTORS = {
  nominal_operation: { load: 1, stress: 1, fault: 0, degradation: 0, controlLoss: 0, safetyDemand: 1, variability: 0.04 },
  boundary_conditions: { load: 1.05, stress: 1.1, fault: 0.04, degradation: 0.05, controlLoss: 0.02, safetyDemand: 1.05, variability: 0.08 },
  stress_overload: { load: 1.2, stress: 1.35, fault: 0.1, degradation: 0.12, controlLoss: 0.04, safetyDemand: 1.12, variability: 0.12 },
  fault_injection: { load: 0.96, stress: 1.16, fault: 0.28, degradation: 0.12, controlLoss: 0.08, safetyDemand: 1.2, variability: 0.09 },
  component_degradation: { load: 0.98, stress: 1.18, fault: 0.14, degradation: 0.28, controlLoss: 0.05, safetyDemand: 1.1, variability: 0.1 },
  parameter_sweep: { load: 1.08, stress: 1.12, fault: 0.05, degradation: 0.08, controlLoss: 0.03, safetyDemand: 1.05, variability: 0.16 },
  control_ablation: { load: 1.02, stress: 1.14, fault: 0.16, degradation: 0.08, controlLoss: 0.34, safetyDemand: 1.24, variability: 0.13 },
  safety_failover: { load: 0.92, stress: 1.08, fault: 0.2, degradation: 0.1, controlLoss: 0.08, safetyDemand: 1.34, variability: 0.08 }
};

function defineBuiltin(family, sector, solve) {
  return { family, sector, solve };
}

const builtinSolvers = {
  "architectural-surrogate": defineBuiltin("compute", "industry", architecturalSurrogate),
  "queueing-simulator": defineBuiltin("compute", "industry", queueingSimulator),
  "discrete-event-scheduler": defineBuiltin("compute_control", "industry", discreteEventScheduler),
  "state-space-control": defineBuiltin("control", "industry", stateSpaceControl),
  "multibody-surrogate": defineBuiltin("mechanical", "industry", multibodySurrogate),
  "ode-state-space": defineBuiltin("mechanical", "industry", odeStateSpace),
  "modal-analysis": defineBuiltin("mechanical", "industry", modalAnalysis),
  "spectral-monitor": defineBuiltin("mechanical", "industry", spectralMonitor),
  "thermal-network": defineBuiltin("thermal", "industry", thermalNetwork),
  "cfd-surrogate": defineBuiltin("thermal_fluid", "industry", cfdSurrogate),
  "fluid-network": defineBuiltin("fluidic", "industry", fluidNetwork),
  "cfd-lite": defineBuiltin("fluidic", "industry", cfdLite),
  "pump-curve-solver": defineBuiltin("fluidic", "industry", pumpCurveSolver),
  "rule-engine": defineBuiltin("logic", "industry", ruleEngine),
  "hydraulic-graph": defineBuiltin("fluidic", "industry", hydraulicGraph),
  "probabilistic-reliability": defineBuiltin("reliability", "industry", probabilisticReliability),
  "circuit-state-space": defineBuiltin("electrical", "industry", circuitStateSpace),
  "control-loop": defineBuiltin("electrical_control", "industry", controlLoop),
  "logic-simulation": defineBuiltin("logic", "industry", logicSimulation),
  "constraint-checker": defineBuiltin("verification", "industry", constraintChecker),
  "timeseries-evaluator": defineBuiltin("telemetry", "industry", timeseriesEvaluator),
  "powertrain-ode": defineBuiltin("vehicle", "industry", powertrainOde),
  "energy-flow-solver": defineBuiltin("vehicle", "industry", energyFlowSolver),
  "business-process-simulator": defineBuiltin("business_process", "private", businessProcessSimulator),
  "service-capacity-solver": defineBuiltin("service_operations", "private", serviceCapacitySolver),
  "security-policy-checker": defineBuiltin("security_compliance", "private", securityPolicyChecker),
  "compliance-workflow-solver": defineBuiltin("workflow_governance", "private", complianceWorkflowSolver),
  "battery-ecm-solver": defineBuiltin("battery", "personal", batteryEcmSolver),
  "wearable-thermal-solver": defineBuiltin("consumer_thermal", "personal", wearableThermalSolver),
  "home-energy-solver": defineBuiltin("home_energy", "personal", homeEnergySolver),
  "personal-mobility-solver": defineBuiltin("personal_mobility", "personal", personalMobilitySolver),
  "medical-device-control-solver": defineBuiltin("medical_control", "medical", medicalDeviceControlSolver),
  "biomechanics-reduced-order": defineBuiltin("biomechanics", "medical", biomechanicsReducedOrder),
  "clinical-workflow-checker": defineBuiltin("clinical_workflow", "medical", clinicalWorkflowChecker),
  "physiological-compartment-solver": defineBuiltin("physiology", "medical", physiologicalCompartmentSolver),
  "grid-load-flow-lite": defineBuiltin("grid", "public_infrastructure", gridLoadFlowLite),
  "water-network-solver": defineBuiltin("water_network", "public_infrastructure", waterNetworkSolver),
  "infrastructure-resilience-solver": defineBuiltin("resilience", "public_infrastructure", infrastructureResilienceSolver),
  "flight-envelope-solver": defineBuiltin("flight_dynamics", "aerospace_defense", flightEnvelopeSolver),
  "propulsion-cycle-solver": defineBuiltin("propulsion", "aerospace_defense", propulsionCycleSolver),
  "mission-reliability-solver": defineBuiltin("mission_assurance", "aerospace_defense", missionReliabilitySolver),
  "robot-kinematics-solver": defineBuiltin("robotics", "robotics_autonomy", robotKinematicsSolver),
  "autonomy-safety-solver": defineBuiltin("autonomy_safety", "robotics_autonomy", autonomySafetySolver),
  "sensor-fusion-solver": defineBuiltin("sensor_fusion", "robotics_autonomy", sensorFusionSolver),
  "monte-carlo-var-solver": defineBuiltin("risk", "finance_risk", monteCarloVarSolver),
  "stress-scenario-solver": defineBuiltin("risk", "finance_risk", stressScenarioSolver),
  "liquidity-contagion-solver": defineBuiltin("risk", "finance_risk", liquidityContagionSolver),
  "building-thermal-balance-solver": defineBuiltin("climate", "environment_climate", buildingThermalBalanceSolver),
  "energy-dispatch-solver": defineBuiltin("energy_dispatch", "environment_climate", energyDispatchSolver),
  "watershed-runoff-solver": defineBuiltin("hydrology", "environment_climate", watershedRunoffSolver),
  "reaction-kinetics-solver": defineBuiltin("materials_chemistry", "materials_chemistry", reactionKineticsSolver),
  "diffusion-barrier-solver": defineBuiltin("materials_transport", "materials_chemistry", diffusionBarrierSolver),
  "rheology-profile-solver": defineBuiltin("materials_rheology", "materials_chemistry", rheologyProfileSolver),
  "surface-adsorption-solver": defineBuiltin("surface_chemistry", "materials_chemistry", surfaceAdsorptionSolver),
  "skin-penetration-solver": defineBuiltin("cosmetic_transport", "cosmetic_science", skinPenetrationSolver),
  "cosmetic-stability-solver": defineBuiltin("cosmetic_stability", "cosmetic_science", cosmeticStabilitySolver),
  "preservative-efficacy-solver": defineBuiltin("cosmetic_preservation", "cosmetic_science", preservativeEfficacySolver),
  "sensory-profile-solver": defineBuiltin("cosmetic_sensory", "cosmetic_science", sensoryProfileSolver),
  "orbital-mechanics-solver": defineBuiltin("space_dynamics", "space_cosmology", orbitalMechanicsSolver),
  "observation-calibration-solver": defineBuiltin("observation_calibration", "space_cosmology", observationCalibrationSolver),
  "stellar-structure-lite-solver": defineBuiltin("stellar_screening", "space_cosmology", stellarStructureLiteSolver),
  "cosmology-parameter-fit-solver": defineBuiltin("cosmology_inference", "space_cosmology", cosmologyParameterFitSolver)
};

export function getBuiltinSolverNames() {
  return Object.keys(builtinSolvers).sort();
}

export function getBuiltinSolverCatalog() {
  return Object.fromEntries(
    Object.entries(builtinSolvers).map(([name, definition]) => [
      name,
      {
        family: definition.family,
        sector: definition.sector
      }
    ])
  );
}

export function hasBuiltinSolver(name) {
  return Boolean(builtinSolvers[name]);
}

export function executeBuiltinSolver({ binding, scenario, graph, project }) {
  const definition = builtinSolvers[binding.solver];

  if (!definition) {
    throw new Error(`Builtin solver "${binding.solver}" is not implemented.`);
  }

  const environment = createEnvironment({ binding, scenario, graph, project });
  const result = definition.solve(environment);

  if (!result?.metrics || !Object.keys(result.metrics).length) {
    throw new Error(`Builtin solver "${binding.solver}" returned no metrics.`);
  }

  return {
    executionId: createId("solver_exec"),
    bindingId: binding.id,
    adapterType: "builtin_solver",
    solver: binding.solver,
    metrics: normalizeMetrics(result.metrics),
    artifacts: [
      {
        id: createId("artifact"),
        kind: "builtin_solver_trace",
        path: null,
        label: `${binding.solver} execution trace`
      }
    ],
    metadata: {
      source: "builtin_solver",
      family: definition.family,
      sector: definition.sector,
      componentId: environment.component.id,
      componentName: environment.component.name,
      scenarioType: scenario.type,
      details: result.details || {}
    }
  };
}

function createEnvironment({ binding, scenario, graph, project }) {
  const component = graph.components.find((entry) => entry.id === binding.componentId);

  if (!component) {
    throw new Error(`Component ${binding.componentId} not found for binding ${binding.id}.`);
  }

  const graphParameters = Object.fromEntries(
    graph.parameters
      .filter((parameter) => parameter.componentId === component.id)
      .map((parameter) => [parameter.name, parameter.value])
  );
  const config = binding.configuration || {};
  const mergedParameters = {
    ...graphParameters,
    ...(config.parameters || {}),
    ...((config.scenarioParameters && config.scenarioParameters[scenario.type]) || {})
  };

  return {
    binding,
    scenario,
    graph,
    project,
    component,
    parameters: mergedParameters,
    factors: SCENARIO_FACTORS[scenario.type] || SCENARIO_FACTORS.nominal_operation,
    coefficients: config.coefficients || {}
  };
}

function architecturalSurrogate(env) {
  const throughputTarget = requireNumber(env, "throughput_target");
  const powerBudget = requireNumber(env, "power_budget_watts");
  const latencyBudget = requireNumber(env, "latency_budget_ms");
  const load = env.factors.load;
  const deliveredThroughput = throughputTarget / (1 + Math.max(0, load - 1) * 0.85);
  const estimatedLatency = latencyBudget * (1 + Math.max(0, load - 1) * 0.7 + env.factors.variability);
  const estimatedPower = powerBudget * (0.88 + load * 0.16 + env.factors.stress * 0.06);
  const thermalPenalty = clamp(1 - env.factors.stress * 0.08 - env.factors.fault * 0.12, 0, 1);

  return {
    metrics: {
      quality: scoreHigherBetter(deliveredThroughput, throughputTarget * 0.94) * thermalPenalty,
      efficiency: scoreLowerBetter(estimatedPower, powerBudget),
      latency: scoreLowerBetter(estimatedLatency, latencyBudget),
      reliability: clamp(0.92 - env.factors.fault * 0.25 - env.factors.degradation * 0.18, 0, 1)
    },
    details: {
      deliveredThroughput,
      estimatedLatency,
      estimatedPower
    }
  };
}

function queueingSimulator(env) {
  const throughputTarget = requireNumber(env, "throughput_target");
  const latencyBudget = requireNumber(env, "latency_budget_ms");
  const queueDepth = requireNumber(env, "queue_depth", { defaultValue: 16 });
  const arrivalIntervalMs = Math.max(1, 60000 / Math.max(throughputTarget * env.factors.load, 1));
  const serviceTimeMs = Math.max(0.5, latencyBudget * (0.48 + env.factors.variability + env.factors.controlLoss * 0.7));
  const queue = runQueueSimulation({
    jobs: 180,
    arrivalIntervalMs,
    serviceTimeMs,
    queueLimit: Math.max(1, Math.round(queueDepth))
  });

  return {
    metrics: {
      latency: scoreLowerBetter(queue.averageWaitMs + serviceTimeMs, latencyBudget),
      quality: scoreHigherBetter(queue.completionRate, 0.95),
      reliability: scoreHigherBetter(1 - queue.dropRate, 0.94)
    },
    details: queue
  };
}

function discreteEventScheduler(env) {
  const dispatchWindowMs = requireNumber(env, "dispatch_window_ms", { defaultValue: 5 });
  const queueDepth = requireNumber(env, "queue_depth", { defaultValue: 16 });
  const priorityPolicy = getText(env, "priority_policy", "fifo").toLowerCase();
  const policyFactor = priorityPolicy.includes("priority") ? 0.94 : priorityPolicy.includes("round") ? 1.02 : 1;
  const events = runQueueSimulation({
    jobs: 220,
    arrivalIntervalMs: dispatchWindowMs * (0.82 / env.factors.load),
    serviceTimeMs: dispatchWindowMs * (0.75 + env.factors.controlLoss * 0.9) * policyFactor,
    queueLimit: Math.max(2, Math.round(queueDepth))
  });

  return {
    metrics: {
      performance: scoreHigherBetter(events.completionRate, 0.96),
      latency: scoreLowerBetter(events.averageWaitMs + dispatchWindowMs, dispatchWindowMs * 2.4),
      reliability: scoreHigherBetter(1 - events.dropRate, 0.95)
    },
    details: {
      ...events,
      priorityPolicy
    }
  };
}

function stateSpaceControl(env) {
  const sampleTimeMs = requireNumber(env, "sample_time_ms", { defaultValue: 10 });
  const controlBandwidthHz = requireNumber(env, "control_bandwidth_hz", { defaultValue: 8 });
  const target = 1;
  const response = runSecondOrderResponse({
    target,
    dt: sampleTimeMs / 1000,
    steps: 240,
    naturalFrequency: controlBandwidthHz * (2 * Math.PI) / 6,
    dampingRatio: clamp(0.78 - env.factors.controlLoss * 0.45 - env.factors.stress * 0.06, 0.2, 1.2),
    disturbance: env.factors.fault * 0.3 + env.factors.degradation * 0.2
  });

  return {
    metrics: {
      performance: scoreHigherBetter(response.finalValue, target * 0.97),
      latency: scoreLowerBetter(response.settlingTimeMs, 1000 / Math.max(controlBandwidthHz, 0.1) * 4),
      safety: scoreLowerBetter(response.overshootRatio, 0.12),
      reliability: clamp(0.9 - env.factors.fault * 0.18 - env.factors.controlLoss * 0.2, 0, 1)
    },
    details: response
  };
}

function multibodySurrogate(env) {
  const massKg = requireNumber(env, "mass_kg");
  const torqueNm = requireNumber(env, "torque_nm");
  const rpmTarget = requireNumber(env, "rpm_target");
  const inertia = Math.max(0.1, massKg * 0.08);
  const dt = 0.02;
  const steps = 320;
  let omega = 0;
  let peakTorqueDemand = 0;

  for (let step = 0; step < steps; step += 1) {
    const damping = 0.04 + env.factors.stress * 0.03 + env.factors.degradation * 0.04;
    const driveTorque = torqueNm * (1 - env.factors.fault * 0.22);
    const acceleration = (driveTorque - damping * omega) / inertia;
    omega += acceleration * dt;
    peakTorqueDemand = Math.max(peakTorqueDemand, Math.abs(driveTorque));
  }

  const targetOmega = rpmTarget * (2 * Math.PI) / 60;
  const achievedRpm = omega * 60 / (2 * Math.PI);
  const imbalanceIndex = env.factors.variability + env.factors.degradation * 0.35 + massKg / 200;

  return {
    metrics: {
      performance: scoreHigherBetter(achievedRpm, rpmTarget * 0.96),
      reliability: scoreLowerBetter(peakTorqueDemand / Math.max(massKg, 1), 12),
      vibration: scoreLowerBetter(imbalanceIndex, 0.36)
    },
    details: {
      achievedRpm,
      targetOmega
    }
  };
}

function odeStateSpace(env) {
  const massKg = requireNumber(env, "mass_kg");
  const torqueNm = requireNumber(env, "torque_nm");
  const rpmTarget = requireNumber(env, "rpm_target");
  const response = runFirstOrderPlant({
    target: rpmTarget,
    dt: 0.05,
    steps: 180,
    gain: torqueNm / Math.max(massKg, 1),
    timeConstant: clamp(massKg / Math.max(torqueNm, 1), 0.2, 5),
    disturbance: env.factors.degradation * 0.2 + env.factors.fault * 0.12
  });

  return {
    metrics: {
      performance: scoreHigherBetter(response.finalValue, rpmTarget * 0.95),
      reliability: scoreLowerBetter(response.riseTime, 4),
      vibration: scoreLowerBetter(env.factors.variability + env.factors.stress * 0.08, 0.2)
    },
    details: response
  };
}

function modalAnalysis(env) {
  const vibrationLimit = requireNumber(env, "vibration_limit_mm_s");
  const resonanceBandHz = requireNumber(env, "resonance_band_hz");
  const excitationHz = resonanceBandHz * (0.7 + env.factors.load * 0.28);
  const separation = Math.abs(resonanceBandHz - excitationHz) / Math.max(resonanceBandHz, 0.1);
  const vibrationEstimate = vibrationLimit * (1 + Math.max(0, 0.22 - separation) * 3 + env.factors.degradation * 0.35);

  return {
    metrics: {
      vibration: scoreLowerBetter(vibrationEstimate, vibrationLimit),
      reliability: scoreHigherBetter(separation, 0.18)
    },
    details: {
      excitationHz,
      separation
    }
  };
}

function spectralMonitor(env) {
  const vibrationLimit = requireNumber(env, "vibration_limit_mm_s");
  const resonanceBandHz = requireNumber(env, "resonance_band_hz");
  const spectralEnergy = resonanceBandHz * env.factors.variability * 0.06 + env.factors.stress * 0.28 + env.factors.fault * 0.2;
  const estimatedVibration = vibrationLimit * (0.72 + spectralEnergy);

  return {
    metrics: {
      vibration: scoreLowerBetter(estimatedVibration, vibrationLimit),
      quality: scoreLowerBetter(spectralEnergy, 0.34)
    },
    details: {
      spectralEnergy
    }
  };
}

function thermalNetwork(env) {
  const thermalLimitC = requireNumber(env, "thermal_limit_c");
  const heatFluxW = requireNumber(env, "heat_flux_w");
  const cooldownWindowS = requireNumber(env, "cooldown_window_s");
  const thermal = runThermalRc({
    ambientC: 25,
    initialC: 28,
    thermalResistance: 0.22 + env.factors.stress * 0.04,
    thermalCapacitance: 90 + cooldownWindowS * 0.5,
    heatInputW: heatFluxW * env.factors.load,
    dt: 1,
    steps: Math.max(60, Math.round(cooldownWindowS))
  });

  return {
    metrics: {
      thermal: scoreLowerBetter(thermal.peakC, thermalLimitC),
      safety: scoreLowerBetter(thermal.peakC, thermalLimitC * 0.96),
      efficiency: scoreLowerBetter(thermal.settlingTimeS, cooldownWindowS * 1.1)
    },
    details: thermal
  };
}

function cfdSurrogate(env) {
  const thermalLimitC = requireNumber(env, "thermal_limit_c");
  const heatFluxW = requireNumber(env, "heat_flux_w");
  const coolingCapacity = (1 / (0.18 + env.factors.stress * 0.05)) * (1 - env.factors.fault * 0.12);
  const predictedPeak = 25 + heatFluxW / Math.max(coolingCapacity, 0.1);
  const thermalGradient = heatFluxW * (0.005 + env.factors.variability * 0.01);

  return {
    metrics: {
      thermal: scoreLowerBetter(predictedPeak, thermalLimitC),
      flow: scoreLowerBetter(thermalGradient, 3.5),
      pressure: scoreLowerBetter(thermalGradient * 0.18, 0.8)
    },
    details: {
      predictedPeak,
      thermalGradient
    }
  };
}

function fluidNetwork(env) {
  const flowTarget =
    optionalNumber(env, "flow_target_l_min") ??
    deriveFromAlternative(env, "network_volume_l", (value) => value * 2.4) ??
    deriveFromAlternative(env, "valve_response_ms", (value) => 900 / Math.max(value, 1));
  const pressureLimit =
    optionalNumber(env, "pressure_limit_bar") ??
    deriveFromAlternative(env, "pressure_drop_limit_bar", (value) => value * 1.8) ??
    deriveFromAlternative(env, "head_limit_m", (value) => value * 0.0981);

  if (!Number.isFinite(flowTarget) || !Number.isFinite(pressureLimit)) {
    throw new Error(`Builtin solver ${env.binding.solver} requires hydraulic flow and pressure inputs on binding ${env.binding.id}.`);
  }

  const valvePenalty = (optionalNumber(env, "valve_response_ms") || 0) / 500;
  const effectiveResistance = 1 + env.factors.stress * 0.35 + env.factors.degradation * 0.2 + valvePenalty;
  const deliveredFlow = flowTarget / effectiveResistance;
  const pressure = pressureLimit * (0.62 + env.factors.load * 0.28 + env.factors.fault * 0.2);

  return {
    metrics: {
      flow: scoreHigherBetter(deliveredFlow, flowTarget * 0.94),
      pressure: scoreLowerBetter(pressure, pressureLimit),
      reliability: clamp(0.9 - env.factors.fault * 0.18 - env.factors.degradation * 0.18, 0, 1)
    },
    details: {
      deliveredFlow,
      pressure
    }
  };
}

function cfdLite(env) {
  const flowTarget = requireNumber(env, "flow_target_l_min");
  const pressureLimit = requireNumber(env, "pressure_limit_bar");
  const reynoldsProxy = flowTarget * (1 + env.factors.load) * 120;
  const pressureDrop = Math.pow(flowTarget / 20, 2) * (0.08 + env.factors.stress * 0.04);

  return {
    metrics: {
      flow: scoreHigherBetter(reynoldsProxy, flowTarget * 200),
      pressure: scoreLowerBetter(pressureDrop, pressureLimit),
      thermal: scoreLowerBetter(pressureDrop * 3.2, 8)
    },
    details: {
      reynoldsProxy,
      pressureDrop
    }
  };
}

function pumpCurveSolver(env) {
  const headLimit = requireNumber(env, "head_limit_m");
  const flowTarget = requireNumber(env, "flow_target_l_min");
  const efficiencyTarget = requireNumber(env, "efficiency_target");
  const curveCoefficient = headLimit / Math.max(Math.pow(flowTarget / 60, 2), 0.0001);
  const operatingFlow = flowTarget * (0.92 - env.factors.stress * 0.08 - env.factors.fault * 0.1);
  const developedHead = headLimit - curveCoefficient * Math.pow(operatingFlow / 60, 2);
  const efficiency = efficiencyTarget * (0.96 - env.factors.degradation * 0.18);

  return {
    metrics: {
      flow: scoreHigherBetter(operatingFlow, flowTarget * 0.95),
      pressure: scoreHigherBetter(developedHead, headLimit * 0.7),
      efficiency: scoreHigherBetter(efficiency, efficiencyTarget * 0.92)
    },
    details: {
      operatingFlow,
      developedHead,
      efficiency
    }
  };
}

function ruleEngine(env) {
  const thresholds = Object.entries(env.parameters)
    .filter(([, value]) => Number.isFinite(toNumber(value)))
    .map(([key, value]) => ({ key, value: toNumber(value) }));
  const violations = thresholds.filter((threshold) =>
    threshold.key.includes("limit") || threshold.key.includes("threshold")
      ? env.factors.fault + env.factors.degradation > threshold.value / Math.max(threshold.value + 1, 1)
      : false
  );

  return {
    metrics: {
      safety: scoreLowerBetter(violations.length, 1),
      reliability: scoreLowerBetter(violations.length + env.factors.fault * 2, 1.4),
      quality: scoreHigherBetter(thresholds.length - violations.length, Math.max(1, thresholds.length))
    },
    details: {
      evaluatedRules: thresholds.length,
      violations: violations.map((entry) => entry.key)
    }
  };
}

function hydraulicGraph(env) {
  const pressureDropLimit = requireNumber(env, "pressure_drop_limit_bar");
  const networkVolume = requireNumber(env, "network_volume_l");
  const graphResistance = networkVolume * 0.015 + env.factors.stress * 0.12;
  const pressureDrop = graphResistance * (1 + env.factors.fault * 0.8);
  const flowBalance = clamp(1 - pressureDrop / Math.max(pressureDropLimit * 2, 0.1), 0, 1);

  return {
    metrics: {
      flow: flowBalance,
      pressure: scoreLowerBetter(pressureDrop, pressureDropLimit),
      reliability: scoreHigherBetter(flowBalance, 0.82)
    },
    details: {
      pressureDrop,
      graphResistance
    }
  };
}

function probabilisticReliability(env) {
  const leakThreshold = requireNumber(env, "leak_threshold_l_min");
  const detectionLatency = requireNumber(env, "detection_latency_s");
  const missionTime = 3600;
  const hazardRate = (env.factors.stress + env.factors.degradation + env.factors.fault * 2) / Math.max(leakThreshold * detectionLatency, 0.1);
  const survivalProbability = Math.exp(-hazardRate * missionTime * 0.001);
  const detectionCoverage = 1 - Math.exp(-missionTime / Math.max(detectionLatency * 30, 1));

  return {
    metrics: {
      reliability: clamp(survivalProbability, 0, 1),
      safety: clamp(survivalProbability * detectionCoverage, 0, 1)
    },
    details: {
      hazardRate,
      survivalProbability,
      detectionCoverage
    }
  };
}

function circuitStateSpace(env) {
  const voltage = requireNumber(env, "voltage_v");
  const currentLimit = requireNumber(env, "current_limit_a");
  const torque = requireNumber(env, "torque_nm");
  const dt = 0.001;
  const steps = 1400;
  let current = 0;
  let angularSpeed = 0;

  for (let step = 0; step < steps; step += 1) {
    const backEmf = angularSpeed * 0.08;
    const di = (voltage - backEmf - current * 0.5) / 0.02;
    current += di * dt;
    current = Math.min(current, currentLimit * (1 + env.factors.controlLoss * 0.3));
    angularSpeed += (torque * current / Math.max(currentLimit, 0.1) - angularSpeed * 0.04) * dt;
  }

  const electricalPower = voltage * current;
  const mechanicalPower = torque * angularSpeed;

  return {
    metrics: {
      performance: scoreHigherBetter(mechanicalPower, voltage * currentLimit * 0.22),
      efficiency: scoreHigherBetter(mechanicalPower / Math.max(electricalPower, 0.1), 0.72),
      thermal: scoreLowerBetter(electricalPower - mechanicalPower, voltage * currentLimit * 0.4)
    },
    details: {
      current,
      angularSpeed,
      electricalPower,
      mechanicalPower
    }
  };
}

function controlLoop(env) {
  const voltage = requireNumber(env, "voltage_v");
  const currentLimit = requireNumber(env, "current_limit_a");
  const torque = requireNumber(env, "torque_nm");
  const response = runPiControlLoop({
    target: torque,
    kp: 0.18,
    ki: 0.35,
    disturbance: env.factors.controlLoss * 0.24 + env.factors.fault * 0.12,
    saturation: currentLimit * voltage * 0.02,
    steps: 260
  });

  return {
    metrics: {
      performance: scoreHigherBetter(response.finalValue, torque * 0.94),
      safety: scoreLowerBetter(response.overshootRatio, 0.14),
      latency: scoreLowerBetter(response.settlingStep, 110)
    },
    details: response
  };
}

function logicSimulation(env) {
  const tripThreshold = requireNumber(env, "trip_threshold", { defaultValue: 1 });
  const interlockResponseMs = requireNumber(env, "interlock_response_ms");
  const demand = env.factors.safetyDemand + env.factors.fault;
  const tripActivated = demand >= tripThreshold;
  const responseMargin = interlockResponseMs / (20 + env.factors.fault * 25 + env.factors.controlLoss * 30);

  return {
    metrics: {
      safety: scoreLowerBetter(responseMargin, 1),
      reliability: scoreHigherBetter(tripActivated ? 1 : 0.85, 0.92)
    },
    details: {
      tripActivated,
      responseMargin
    }
  };
}

function constraintChecker(env) {
  const coverageTarget = requireNumber(env, "coverage_target", { defaultValue: 0.9 });
  const referenceBaseline = requireNumber(env, "reference_baseline", { defaultValue: 0.9 });
  const achievedCoverage = clamp(referenceBaseline - env.factors.variability * 0.25 - env.factors.fault * 0.12, 0, 1);

  return {
    metrics: {
      quality: scoreHigherBetter(achievedCoverage, coverageTarget),
      reliability: scoreHigherBetter(referenceBaseline, 0.88)
    },
    details: {
      achievedCoverage,
      coverageTarget
    }
  };
}

function timeseriesEvaluator(env) {
  const samplingRate = requireNumber(env, "sampling_rate_hz");
  const retentionWindow = requireNumber(env, "retention_window_s");
  const blindWindowMs = 1000 / Math.max(samplingRate, 0.1) * (1 + env.factors.variability * 0.8);
  const retentionScore = retentionWindow / (retentionWindow + env.factors.stress * 200 + env.factors.fault * 120);

  return {
    metrics: {
      quality: scoreLowerBetter(blindWindowMs, 40),
      reliability: scoreHigherBetter(retentionScore, 0.82)
    },
    details: {
      blindWindowMs,
      retentionScore
    }
  };
}

function powertrainOde(env) {
  const torque = requireNumber(env, "torque_nm");
  const efficiencyTarget = requireNumber(env, "efficiency_target");
  const rangeTarget = requireNumber(env, "range_target_km");
  const response = runFirstOrderPlant({
    target: torque,
    dt: 0.05,
    steps: 220,
    gain: torque / 180,
    timeConstant: 1.2 + env.factors.stress * 0.3,
    disturbance: env.factors.degradation * 0.22 + env.factors.fault * 0.16
  });
  const energyUseWhKm = 160 * (1 + env.factors.load * 0.14 + env.factors.stress * 0.08);
  const projectedRange = (rangeTarget * efficiencyTarget) / Math.max(energyUseWhKm / 180, 0.1);

  return {
    metrics: {
      performance: scoreHigherBetter(response.finalValue, torque * 0.94),
      efficiency: scoreHigherBetter(efficiencyTarget * 0.97 - env.factors.stress * 0.05, efficiencyTarget * 0.9),
      thermal: scoreLowerBetter(energyUseWhKm / 12, 18)
    },
    details: {
      projectedRange,
      energyUseWhKm
    }
  };
}

function energyFlowSolver(env) {
  const torque = requireNumber(env, "torque_nm");
  const efficiencyTarget = requireNumber(env, "efficiency_target");
  const rangeTarget = requireNumber(env, "range_target_km");
  const dragLoss = 0.16 + env.factors.load * 0.08 + env.factors.stress * 0.06;
  const netEfficiency = clamp(efficiencyTarget - dragLoss * 0.2, 0, 1);
  const achievedRange = rangeTarget * netEfficiency * (1 - env.factors.degradation * 0.16);

  return {
    metrics: {
      efficiency: scoreHigherBetter(netEfficiency, efficiencyTarget * 0.9),
      reliability: clamp(0.9 - env.factors.fault * 0.14 - env.factors.degradation * 0.18, 0, 1),
      performance: scoreHigherBetter(achievedRange, rangeTarget * 0.8 + torque * 0.01)
    },
    details: {
      achievedRange,
      netEfficiency
    }
  };
}

function businessProcessSimulator(env) {
  const arrivalRate = requireNumber(env, "arrival_rate_per_hour");
  const serviceRate = requireNumber(env, "service_rate_per_hour");
  const slaHours = requireNumber(env, "sla_hours");
  const reworkRate = requireNumber(env, "rework_rate");
  const effectiveArrival = arrivalRate * (1 + reworkRate + env.factors.variability);
  const utilization = effectiveArrival / Math.max(serviceRate, 0.1);
  const cycleTime = 1 / Math.max(serviceRate - effectiveArrival * 0.92, 0.01);

  return {
    metrics: {
      performance: scoreLowerBetter(cycleTime, slaHours),
      latency: scoreLowerBetter(cycleTime, slaHours * 0.9),
      reliability: scoreLowerBetter(utilization, 0.88)
    },
    details: { utilization, cycleTime }
  };
}

function serviceCapacitySolver(env) {
  const requestsPerSecond = requireNumber(env, "requests_per_second");
  const serviceTimeMs = requireNumber(env, "service_time_ms");
  const replicaCount = requireNumber(env, "replica_count");
  const latencySloMs = requireNumber(env, "latency_slo_ms");
  const capacityPerSecond = replicaCount * (1000 / Math.max(serviceTimeMs, 1));
  const utilization = requestsPerSecond * env.factors.load / Math.max(capacityPerSecond, 0.01);
  const latencyMs = serviceTimeMs * (1 + Math.max(0, utilization - 0.7) * 3.5);

  return {
    metrics: {
      performance: scoreLowerBetter(utilization, 0.85),
      latency: scoreLowerBetter(latencyMs, latencySloMs),
      reliability: scoreLowerBetter(utilization + env.factors.fault * 0.3, 0.92)
    },
    details: { utilization, latencyMs, capacityPerSecond }
  };
}

function securityPolicyChecker(env) {
  const policyCount = requireNumber(env, "policy_count");
  const controlCoverage = requireNumber(env, "control_coverage");
  const threatLevel = requireNumber(env, "threat_level");
  const violationTolerance = requireNumber(env, "violation_tolerance");
  const uncoveredRisk = clamp((1 - controlCoverage) + threatLevel * 0.35 + env.factors.fault * 0.2, 0, 1.5);
  const violations = uncoveredRisk * policyCount * 0.1;

  return {
    metrics: {
      safety: scoreLowerBetter(violations, violationTolerance + 0.5),
      reliability: scoreHigherBetter(controlCoverage - threatLevel * 0.1, 0.78),
      quality: scoreHigherBetter((policyCount - violations) / Math.max(policyCount, 1), 0.92)
    },
    details: { violations, uncoveredRisk }
  };
}

function complianceWorkflowSolver(env) {
  const stepCount = requireNumber(env, "step_count");
  const mandatoryControlCount = requireNumber(env, "mandatory_control_count");
  const evidenceCompletenessTarget = requireNumber(env, "evidence_completeness_target");
  const missingEvidence = stepCount * env.factors.variability * 0.2 + env.factors.controlLoss * 2;
  const completeness = clamp((mandatoryControlCount - missingEvidence) / Math.max(mandatoryControlCount, 1), 0, 1);

  return {
    metrics: {
      quality: scoreHigherBetter(completeness, evidenceCompletenessTarget),
      reliability: scoreHigherBetter(completeness, 0.9),
      safety: scoreLowerBetter(missingEvidence, 1.2)
    },
    details: { completeness, missingEvidence }
  };
}

function batteryEcmSolver(env) {
  const capacityAh = requireNumber(env, "battery_capacity_ah");
  const internalResistance = requireNumber(env, "internal_resistance_ohm");
  const loadCurrent = requireNumber(env, "load_current_a");
  const nominalVoltage = requireNumber(env, "voltage_nominal_v");
  const terminalVoltage = nominalVoltage - loadCurrent * internalResistance;
  const heatLoss = Math.pow(loadCurrent, 2) * internalResistance;
  const enduranceHours = capacityAh / Math.max(loadCurrent * env.factors.load, 0.1);

  return {
    metrics: {
      efficiency: scoreHigherBetter(terminalVoltage / Math.max(nominalVoltage, 0.1), 0.9),
      thermal: scoreLowerBetter(heatLoss, 18),
      reliability: scoreHigherBetter(enduranceHours, 1.4)
    },
    details: { terminalVoltage, heatLoss, enduranceHours }
  };
}

function wearableThermalSolver(env) {
  const skinLimit = requireNumber(env, "skin_limit_c");
  const devicePower = requireNumber(env, "device_power_w");
  const contactArea = requireNumber(env, "contact_area_cm2");
  const ambient = requireNumber(env, "ambient_temp_c", { defaultValue: 24 });
  const flux = devicePower / Math.max(contactArea, 0.1);
  const skinTemperature = ambient + flux * (3.2 + env.factors.stress * 0.6);

  return {
    metrics: {
      thermal: scoreLowerBetter(skinTemperature, skinLimit),
      safety: scoreLowerBetter(skinTemperature, skinLimit * 0.97),
      efficiency: scoreLowerBetter(devicePower, 4.5)
    },
    details: { skinTemperature, flux }
  };
}

function homeEnergySolver(env) {
  const baseLoadKw = requireNumber(env, "base_load_kw");
  const pvCapacityKw = requireNumber(env, "pv_capacity_kw");
  const storageCapacityKwh = requireNumber(env, "storage_capacity_kwh");
  const peakLimitKw = requireNumber(env, "peak_limit_kw");
  const netGridLoad = Math.max(0, baseLoadKw * env.factors.load - pvCapacityKw * 0.75 - storageCapacityKwh / 8);

  return {
    metrics: {
      efficiency: scoreLowerBetter(netGridLoad, peakLimitKw * 0.82),
      reliability: scoreLowerBetter(netGridLoad, peakLimitKw),
      performance: scoreHigherBetter((pvCapacityKw + storageCapacityKwh / 10) / Math.max(baseLoadKw, 0.1), 0.8)
    },
    details: { netGridLoad }
  };
}

function personalMobilitySolver(env) {
  const mass = requireNumber(env, "vehicle_mass_kg");
  const motorPower = requireNumber(env, "motor_power_kw");
  const rangeTarget = requireNumber(env, "range_target_km");
  const brakeResponse = requireNumber(env, "brake_response_ms");
  const accelerationProxy = motorPower * 1000 / Math.max(mass, 1);
  const effectiveRange = rangeTarget * (0.92 - env.factors.stress * 0.08);

  return {
    metrics: {
      performance: scoreHigherBetter(accelerationProxy, 35),
      efficiency: scoreHigherBetter(effectiveRange, rangeTarget * 0.85),
      safety: scoreLowerBetter(brakeResponse * (1 + env.factors.fault * 0.3), 180)
    },
    details: { accelerationProxy, effectiveRange }
  };
}

function medicalDeviceControlSolver(env) {
  const sampleTime = requireNumber(env, "sample_time_ms");
  const controlBandwidth = requireNumber(env, "control_bandwidth_hz");
  const alarmResponse = requireNumber(env, "alarm_response_ms");
  const riskThreshold = requireNumber(env, "risk_threshold");
  const response = runSecondOrderResponse({
    target: 1,
    dt: sampleTime / 1000,
    steps: 260,
    naturalFrequency: controlBandwidth,
    dampingRatio: clamp(0.82 - env.factors.controlLoss * 0.4, 0.3, 1.2),
    disturbance: env.factors.fault * 0.18
  });
  const riskIndex = env.factors.fault + env.factors.degradation + response.overshootRatio;

  return {
    metrics: {
      safety: scoreLowerBetter(Math.max(alarmResponse / 100, riskIndex), riskThreshold),
      reliability: scoreLowerBetter(riskIndex, 0.28),
      latency: scoreLowerBetter(alarmResponse + response.settlingTimeMs, 250)
    },
    details: { riskIndex, response }
  };
}

function biomechanicsReducedOrder(env) {
  const loadN = requireNumber(env, "load_n");
  const stiffness = requireNumber(env, "stiffness_n_mm");
  const displacementLimit = requireNumber(env, "displacement_limit_mm");
  const fatigueTarget = requireNumber(env, "fatigue_target_cycles");
  const displacement = loadN / Math.max(stiffness, 0.1);
  const fatigueReserve = fatigueTarget / Math.max(loadN * (1 + env.factors.stress), 1);

  return {
    metrics: {
      performance: scoreLowerBetter(displacement, displacementLimit),
      reliability: scoreHigherBetter(fatigueReserve, 150),
      safety: scoreLowerBetter(displacement * (1 + env.factors.fault * 0.2), displacementLimit * 0.95)
    },
    details: { displacement, fatigueReserve }
  };
}

function clinicalWorkflowChecker(env) {
  const stepCount = requireNumber(env, "step_count");
  const criticalStepCount = requireNumber(env, "critical_step_count");
  const handoffCount = requireNumber(env, "handoff_count");
  const maxDelay = requireNumber(env, "max_handoff_delay_min");
  const effectiveDelay = handoffCount * (0.6 + env.factors.variability * 0.8) + env.factors.controlLoss * 6;
  const missedCriticals = criticalStepCount * env.factors.fault * 0.2;

  return {
    metrics: {
      safety: scoreLowerBetter(effectiveDelay + missedCriticals * 3, maxDelay),
      reliability: scoreHigherBetter((stepCount - missedCriticals) / Math.max(stepCount, 1), 0.96),
      quality: scoreLowerBetter(handoffCount, stepCount * 0.4)
    },
    details: { effectiveDelay, missedCriticals }
  };
}

function physiologicalCompartmentSolver(env) {
  const volume = requireNumber(env, "compartment_volume_l");
  const clearance = requireNumber(env, "clearance_l_h");
  const dose = requireNumber(env, "dose_mg");
  const toxicityLimit = requireNumber(env, "toxicity_limit");
  const concentration0 = dose / Math.max(volume, 0.1);
  const concentrationAt1h = concentration0 * Math.exp(-clearance / Math.max(volume, 0.1));

  return {
    metrics: {
      safety: scoreLowerBetter(concentration0, toxicityLimit),
      reliability: scoreLowerBetter(concentrationAt1h, toxicityLimit * 0.8),
      performance: scoreHigherBetter(concentrationAt1h, toxicityLimit * 0.25)
    },
    details: { concentration0, concentrationAt1h }
  };
}

function gridLoadFlowLite(env) {
  const generationMw = requireNumber(env, "generation_mw");
  const demandMw = requireNumber(env, "demand_mw");
  const lineLimitMw = requireNumber(env, "line_limit_mw");
  const reserveMarginTarget = requireNumber(env, "reserve_margin_target");
  const flow = demandMw * env.factors.load;
  const reserveMargin = (generationMw - flow) / Math.max(flow, 0.1);

  return {
    metrics: {
      performance: scoreLowerBetter(flow, lineLimitMw),
      reliability: scoreHigherBetter(reserveMargin, reserveMarginTarget),
      safety: scoreLowerBetter(flow, lineLimitMw * 0.95)
    },
    details: { flow, reserveMargin }
  };
}

function waterNetworkSolver(env) {
  const demand = requireNumber(env, "demand_m3_h");
  const supply = requireNumber(env, "supply_m3_h");
  const pressureTarget = requireNumber(env, "pressure_target_bar");
  const leakageRatio = requireNumber(env, "leakage_ratio");
  const delivered = supply * (1 - leakageRatio) / Math.max(env.factors.load, 0.8);
  const pressure = pressureTarget * (supply / Math.max(demand, 0.1)) * (1 - leakageRatio * 0.6);

  return {
    metrics: {
      flow: scoreHigherBetter(delivered, demand * 0.95),
      pressure: scoreHigherBetter(pressure, pressureTarget * 0.92),
      reliability: scoreLowerBetter(leakageRatio + env.factors.fault * 0.08, 0.12)
    },
    details: { delivered, pressure }
  };
}

function infrastructureResilienceSolver(env) {
  const redundancy = requireNumber(env, "redundancy_level");
  const repairTime = requireNumber(env, "repair_time_h");
  const hazardRate = requireNumber(env, "hazard_rate");
  const serviceTarget = requireNumber(env, "service_level_target");
  const availability = redundancy / (redundancy + hazardRate * repairTime * (1 + env.factors.stress));

  return {
    metrics: {
      reliability: scoreHigherBetter(availability, serviceTarget),
      safety: scoreHigherBetter(availability, 0.9),
      performance: scoreLowerBetter(repairTime, 12)
    },
    details: { availability }
  };
}

function flightEnvelopeSolver(env) {
  const stallSpeed = requireNumber(env, "stall_speed_m_s");
  const maxSpeed = requireNumber(env, "max_speed_m_s");
  const loadFactorLimit = requireNumber(env, "load_factor_limit");
  const maneuverDemand = requireNumber(env, "maneuver_demand");
  const envelopeMargin = (loadFactorLimit - maneuverDemand * env.factors.load) / Math.max(loadFactorLimit, 0.1);
  const speedWindow = maxSpeed - stallSpeed;

  return {
    metrics: {
      safety: scoreHigherBetter(envelopeMargin, 0.18),
      performance: scoreHigherBetter(speedWindow, stallSpeed * 1.5),
      reliability: scoreLowerBetter(env.factors.fault + env.factors.stress * 0.4, 0.5)
    },
    details: { envelopeMargin, speedWindow }
  };
}

function propulsionCycleSolver(env) {
  const thrustTarget = requireNumber(env, "thrust_target_kn");
  const fuelFlow = requireNumber(env, "fuel_flow_kg_s");
  const temperatureLimit = requireNumber(env, "temperature_limit_c");
  const compressorRatio = requireNumber(env, "compressor_ratio");
  const thrust = thrustTarget * (compressorRatio / (compressorRatio + 6)) * (1 - env.factors.fault * 0.1);
  const turbineTemp = 420 + fuelFlow * 180 + compressorRatio * 12;

  return {
    metrics: {
      performance: scoreHigherBetter(thrust, thrustTarget * 0.9),
      efficiency: scoreHigherBetter(thrust / Math.max(fuelFlow, 0.1), thrustTarget / Math.max(fuelFlow * 1.3, 0.1)),
      thermal: scoreLowerBetter(turbineTemp, temperatureLimit)
    },
    details: { thrust, turbineTemp }
  };
}

function missionReliabilitySolver(env) {
  const missionDuration = requireNumber(env, "mission_duration_h");
  const subsystemCount = requireNumber(env, "subsystem_count");
  const failureRate = requireNumber(env, "failure_rate_per_h");
  const redundancy = requireNumber(env, "redundancy_level");
  const survival = Math.exp(-(failureRate * subsystemCount * missionDuration) / Math.max(redundancy + 1, 1));

  return {
    metrics: {
      reliability: survival,
      safety: scoreHigherBetter(survival, 0.9),
      performance: scoreLowerBetter(missionDuration * failureRate, 0.4)
    },
    details: { survival }
  };
}

function robotKinematicsSolver(env) {
  const payload = requireNumber(env, "payload_kg");
  const jointSpeed = requireNumber(env, "joint_speed_deg_s");
  const reach = requireNumber(env, "reach_m");
  const tolerance = requireNumber(env, "position_tolerance_mm");
  const placementRate = jointSpeed * reach / Math.max(payload + 1, 1);
  const errorMm = tolerance * (0.72 + env.factors.variability * 0.8 + payload / 60);

  return {
    metrics: {
      performance: scoreHigherBetter(placementRate, 12),
      reliability: scoreLowerBetter(errorMm, tolerance),
      latency: scoreLowerBetter(1000 / Math.max(jointSpeed, 1), 50)
    },
    details: { placementRate, errorMm }
  };
}

function autonomySafetySolver(env) {
  const sensorLatency = requireNumber(env, "sensor_latency_ms");
  const stoppingDistance = requireNumber(env, "stopping_distance_m");
  const hazardDensity = requireNumber(env, "hazard_density");
  const safetyThreshold = requireNumber(env, "safety_threshold");
  const risk = sensorLatency / 100 + stoppingDistance * hazardDensity * 0.4 + env.factors.fault * 0.25;

  return {
    metrics: {
      safety: scoreLowerBetter(risk, safetyThreshold),
      latency: scoreLowerBetter(sensorLatency, 80),
      reliability: scoreLowerBetter(risk, 0.8)
    },
    details: { risk }
  };
}

function sensorFusionSolver(env) {
  const sensorCount = requireNumber(env, "sensor_count");
  const samplingRate = requireNumber(env, "sampling_rate_hz");
  const dropoutRate = requireNumber(env, "dropout_rate");
  const alignmentError = requireNumber(env, "alignment_error_deg");
  const confidence = clamp((sensorCount / (sensorCount + 1)) * (1 - dropoutRate) * (1 - alignmentError / 30), 0, 1);

  return {
    metrics: {
      quality: scoreHigherBetter(confidence, 0.82),
      reliability: scoreLowerBetter(dropoutRate + env.factors.fault * 0.1, 0.12),
      latency: scoreLowerBetter(1000 / Math.max(samplingRate, 1), 40)
    },
    details: { confidence }
  };
}

function monteCarloVarSolver(env) {
  const portfolioValue = requireNumber(env, "portfolio_value");
  const volatility = requireNumber(env, "volatility");
  const confidenceLevel = requireNumber(env, "confidence_level");
  const horizonDays = requireNumber(env, "horizon_days");
  const z = 1 + confidenceLevel;
  const varLoss = portfolioValue * volatility * Math.sqrt(horizonDays / 252) * z * (1 + env.factors.stress * 0.2);

  return {
    metrics: {
      reliability: scoreLowerBetter(varLoss / Math.max(portfolioValue, 1), 0.08),
      quality: scoreHigherBetter(confidenceLevel, 0.95),
      performance: scoreLowerBetter(horizonDays * volatility, 4)
    },
    details: { varLoss }
  };
}

function stressScenarioSolver(env) {
  const portfolioValue = requireNumber(env, "portfolio_value");
  const stressLoss = requireNumber(env, "stress_loss_fraction");
  const liquidityBuffer = requireNumber(env, "liquidity_buffer");
  const capitalRatioTarget = requireNumber(env, "capital_ratio_target");
  const stressedCapitalRatio = (liquidityBuffer - portfolioValue * stressLoss) / Math.max(portfolioValue, 1);

  return {
    metrics: {
      reliability: scoreHigherBetter(stressedCapitalRatio, capitalRatioTarget),
      safety: scoreHigherBetter(stressedCapitalRatio, capitalRatioTarget * 0.9),
      quality: scoreLowerBetter(stressLoss + env.factors.stress * 0.1, 0.28)
    },
    details: { stressedCapitalRatio }
  };
}

function liquidityContagionSolver(env) {
  const counterpartyCount = requireNumber(env, "counterparty_count");
  const exposureRatio = requireNumber(env, "exposure_ratio");
  const liquidityBuffer = requireNumber(env, "liquidity_buffer");
  const settlementWindow = requireNumber(env, "settlement_window_days");
  const contagionIndex = counterpartyCount * exposureRatio / Math.max(liquidityBuffer, 0.1) * (1 + settlementWindow / 10);

  return {
    metrics: {
      reliability: scoreLowerBetter(contagionIndex, 1.4),
      safety: scoreLowerBetter(contagionIndex, 1.1),
      latency: scoreLowerBetter(settlementWindow, 4)
    },
    details: { contagionIndex }
  };
}

function buildingThermalBalanceSolver(env) {
  const heatLoss = requireNumber(env, "heat_loss_kw_k");
  const hvacCapacity = requireNumber(env, "hvac_capacity_kw");
  const targetTemp = requireNumber(env, "target_temp_c");
  const ambientTemp = requireNumber(env, "ambient_temp_c");
  const requiredHvac = heatLoss * Math.abs(targetTemp - ambientTemp);

  return {
    metrics: {
      thermal: scoreLowerBetter(requiredHvac, hvacCapacity),
      efficiency: scoreLowerBetter(requiredHvac / Math.max(hvacCapacity, 0.1), 0.85),
      reliability: scoreHigherBetter(hvacCapacity - requiredHvac + 1, 1)
    },
    details: { requiredHvac }
  };
}

function energyDispatchSolver(env) {
  const demand = requireNumber(env, "demand_mw");
  const renewable = requireNumber(env, "renewable_mw");
  const storage = requireNumber(env, "storage_mwh");
  const reserveTarget = requireNumber(env, "reserve_target_mw");
  const dispatchableGap = Math.max(0, demand * env.factors.load - renewable - storage / 4);
  const reserve = Math.max(0, renewable + storage / 6 - demand * 0.15);

  return {
    metrics: {
      performance: scoreLowerBetter(dispatchableGap, demand * 0.22),
      reliability: scoreHigherBetter(reserve, reserveTarget),
      efficiency: scoreHigherBetter(renewable / Math.max(demand, 0.1), 0.35)
    },
    details: { dispatchableGap, reserve }
  };
}

function watershedRunoffSolver(env) {
  const rainfall = requireNumber(env, "rainfall_mm");
  const catchment = requireNumber(env, "catchment_km2");
  const infiltration = requireNumber(env, "infiltration_ratio");
  const channelCapacity = requireNumber(env, "channel_capacity_m3_s");
  const runoffVolume = rainfall * catchment * (1 - infiltration) * 277.78 / 3600;

  return {
    metrics: {
      flow: scoreLowerBetter(runoffVolume, channelCapacity),
      safety: scoreLowerBetter(runoffVolume, channelCapacity * 0.9),
      reliability: scoreHigherBetter(infiltration, 0.25)
    },
    details: { runoffVolume }
  };
}

function reactionKineticsSolver(env) {
  const rateConstant = requireNumber(env, "reaction_rate_constant");
  const concentration = requireNumber(env, "reactant_concentration");
  const residenceTime = requireNumber(env, "residence_time_s");
  const targetConversion = requireNumber(env, "target_conversion");
  const effectiveRate =
    rateConstant *
    concentration *
    (1 - env.factors.fault * 0.12) *
    (1 - env.factors.degradation * 0.1) *
    (1 + env.factors.stress * 0.08);
  const conversion = clamp(1 - Math.exp(-effectiveRate * residenceTime * 0.01), 0, 1);
  const selectivity = clamp(0.9 - env.factors.stress * 0.1 - env.factors.degradation * 0.08, 0, 1);

  return {
    metrics: {
      performance: scoreHigherBetter(conversion, targetConversion),
      quality: scoreHigherBetter(selectivity, 0.84),
      reliability: scoreLowerBetter(1 - selectivity + env.factors.fault * 0.2, 0.35)
    },
    details: { effectiveRate, conversion, selectivity }
  };
}

function diffusionBarrierSolver(env) {
  const diffusionCoefficient = requireNumber(env, "diffusion_coefficient_m2_s");
  const barrierThicknessUm = requireNumber(env, "barrier_thickness_um");
  const exposureTimeHours = requireNumber(env, "exposure_time_h");
  const retentionTarget = requireNumber(env, "retention_target");
  const thicknessMeters = barrierThicknessUm * 1e-6;
  const exposureSeconds = exposureTimeHours * 3600;
  const transportIndex =
    diffusionCoefficient * exposureSeconds / Math.max(thicknessMeters * thicknessMeters, 1e-12) * 0.0008;
  const penetrationFraction = clamp(transportIndex * (1 + env.factors.stress * 0.15 + env.factors.fault * 0.12), 0, 1.5);
  const retention = clamp(1 - penetrationFraction * 0.65 - env.factors.degradation * 0.08, 0, 1);

  return {
    metrics: {
      quality: scoreHigherBetter(retention, retentionTarget),
      safety: scoreLowerBetter(penetrationFraction, 0.45),
      reliability: scoreLowerBetter(penetrationFraction + env.factors.variability * 0.2, 0.5)
    },
    details: { transportIndex, penetrationFraction, retention }
  };
}

function rheologyProfileSolver(env) {
  const shearRate = requireNumber(env, "shear_rate_s");
  const viscosity = requireNumber(env, "viscosity_pa_s");
  const elasticModulus = requireNumber(env, "elastic_modulus_kpa");
  const spreadabilityTarget = requireNumber(env, "spreadability_target");
  const apparentViscosity =
    viscosity / Math.max(1 + Math.log10(Math.max(shearRate, 1)) * 0.18 + env.factors.stress * 0.12, 0.2);
  const spreadability = shearRate / Math.max(apparentViscosity * 8, 0.1);
  const structuralRecovery = clamp(elasticModulus / Math.max(elasticModulus + shearRate * 0.04, 0.1), 0, 1);

  return {
    metrics: {
      performance: scoreHigherBetter(spreadability, spreadabilityTarget),
      quality: scoreHigherBetter(structuralRecovery, 0.7),
      reliability: scoreLowerBetter(env.factors.degradation + Math.abs(apparentViscosity - viscosity * 0.72) / Math.max(viscosity, 0.1), 0.45)
    },
    details: { apparentViscosity, spreadability, structuralRecovery }
  };
}

function surfaceAdsorptionSolver(env) {
  const adsorptionCapacity = requireNumber(env, "adsorption_capacity_mg_g");
  const surfaceArea = requireNumber(env, "surface_area_m2_g");
  const contaminantConcentration = requireNumber(env, "contaminant_concentration_mg_l");
  const uptake = adsorptionCapacity * surfaceArea / Math.max(surfaceArea + 140, 1);
  const loadingRatio = contaminantConcentration / Math.max(uptake, 0.1);
  const coverage = clamp(1 - loadingRatio * 0.08 - env.factors.degradation * 0.06, 0, 1);

  return {
    metrics: {
      quality: scoreHigherBetter(coverage, 0.82),
      safety: scoreLowerBetter(loadingRatio + env.factors.fault * 0.15, 0.75),
      reliability: scoreHigherBetter(uptake, adsorptionCapacity * 0.68)
    },
    details: { uptake, loadingRatio, coverage }
  };
}

function skinPenetrationSolver(env) {
  const diffusionCoefficient = requireNumber(env, "skin_diffusion_coeff_cm2_h");
  const partitionCoefficient = requireNumber(env, "partition_coefficient");
  const exposureDose = requireNumber(env, "exposure_dose_mg_cm2");
  const maxSystemicExposure = requireNumber(env, "max_systemic_exposure_mg");
  const absorbedDose =
    exposureDose *
    diffusionCoefficient *
    partitionCoefficient *
    (1 + env.factors.load * 0.08 + env.factors.stress * 0.12) *
    0.1;
  const localRetention = clamp(1 - absorbedDose / Math.max(exposureDose + maxSystemicExposure, 0.1), 0, 1);

  return {
    metrics: {
      safety: scoreLowerBetter(absorbedDose, maxSystemicExposure),
      efficacy: scoreHigherBetter(localRetention, 0.72),
      reliability: scoreLowerBetter(absorbedDose / Math.max(maxSystemicExposure, 0.01) + env.factors.variability * 0.2, 1.1)
    },
    details: { absorbedDose, localRetention }
  };
}

function cosmeticStabilitySolver(env) {
  const viscosity = requireNumber(env, "formulation_viscosity_pa_s");
  const cyclingRange = requireNumber(env, "temperature_cycling_range_c");
  const shelfLife = requireNumber(env, "shelf_life_months");
  const separationLimit = requireNumber(env, "separation_limit_fraction");
  const separationIndex =
    (cyclingRange / Math.max(viscosity * 4, 0.1)) *
    (1 + shelfLife / 36) *
    (1 + env.factors.degradation * 0.4 + env.factors.stress * 0.2);
  const viscosityRetention = clamp(1 - separationIndex * 0.28, 0, 1);

  return {
    metrics: {
      stability: scoreLowerBetter(separationIndex, separationLimit),
      quality: scoreHigherBetter(viscosityRetention, 0.82),
      reliability: scoreLowerBetter(separationIndex + env.factors.fault * 0.08, separationLimit * 1.1)
    },
    details: { separationIndex, viscosityRetention }
  };
}

function preservativeEfficacySolver(env) {
  const logReductionTarget = requireNumber(env, "preservative_log_reduction_target");
  const microbialLoad = requireNumber(env, "microbial_load_cfu_ml");
  const preservativeConcentration = requireNumber(env, "preservative_concentration_pct");
  const challengeTimeDays = requireNumber(env, "challenge_time_days");
  const logReduction =
    preservativeConcentration *
    challengeTimeDays *
    (1 - env.factors.fault * 0.08) *
    0.42 -
    Math.log10(Math.max(microbialLoad, 1)) * 0.18;
  const effectiveLogReduction = Math.max(0, logReduction);

  return {
    metrics: {
      safety: scoreHigherBetter(effectiveLogReduction, logReductionTarget),
      efficacy: scoreHigherBetter(effectiveLogReduction, logReductionTarget * 0.92),
      reliability: scoreLowerBetter(Math.max(logReductionTarget - effectiveLogReduction, 0) + env.factors.variability, 1.2)
    },
    details: { effectiveLogReduction }
  };
}

function sensoryProfileSolver(env) {
  const fragranceIntensityTarget = requireNumber(env, "fragrance_intensity_target");
  const textureUniformityTarget = requireNumber(env, "texture_uniformity_target");
  const panelVariability = requireNumber(env, "panel_variability");
  const fragranceScore = clamp(fragranceIntensityTarget * (1 - env.factors.variability * 0.18), 0, 1);
  const textureScore = clamp(textureUniformityTarget - panelVariability * 0.35 - env.factors.stress * 0.06, 0, 1);
  const consistency = clamp((fragranceScore + textureScore) / 2, 0, 1);

  return {
    metrics: {
      quality: scoreHigherBetter(consistency, 0.82),
      reliability: scoreLowerBetter(panelVariability + env.factors.variability * 0.08, 0.12),
      efficacy: scoreHigherBetter(textureScore, textureUniformityTarget * 0.9)
    },
    details: { fragranceScore, textureScore, consistency }
  };
}

function orbitalMechanicsSolver(env) {
  const semiMajorAxisKm = requireNumber(env, "semi_major_axis_km");
  const eccentricity = requireNumber(env, "eccentricity");
  const missionDuration = requireNumber(env, "mission_duration_h");
  const deltaVBudget = requireNumber(env, "delta_v_budget_m_s");
  const orbitalPeriodMinutes = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxisKm, 3) / 398600.4418) / 60;
  const geometryMargin =
    clamp(1 - eccentricity * 2.2 - missionDuration / Math.max(deltaVBudget * 0.4, 1), 0, 1);

  return {
    metrics: {
      performance: scoreLowerBetter(orbitalPeriodMinutes, 130),
      reliability: scoreHigherBetter(geometryMargin, 0.62),
      safety: scoreLowerBetter(eccentricity + env.factors.fault * 0.04, 0.12)
    },
    details: { orbitalPeriodMinutes, geometryMargin }
  };
}

function observationCalibrationSolver(env) {
  const sensorNoise = requireNumber(env, "sensor_noise_arcsec");
  const calibrationReferences = requireNumber(env, "calibration_reference_count");
  const exposureTime = requireNumber(env, "exposure_time_s");
  const signalToNoiseTarget = requireNumber(env, "signal_to_noise_target");
  const snr =
    Math.sqrt(Math.max(exposureTime, 1)) *
    Math.log1p(Math.max(calibrationReferences, 1)) /
    Math.max(sensorNoise * 4.5, 0.01);
  const residualBias = sensorNoise / Math.max(Math.sqrt(calibrationReferences), 1);

  return {
    metrics: {
      quality: scoreHigherBetter(snr, signalToNoiseTarget),
      reliability: scoreLowerBetter(residualBias + env.factors.variability * 0.04, 0.08),
      latency: scoreLowerBetter(exposureTime, 2400)
    },
    details: { snr, residualBias }
  };
}

function stellarStructureLiteSolver(env) {
  const stellarMass = requireNumber(env, "stellar_mass_solar");
  const metallicity = requireNumber(env, "metallicity_fraction");
  const luminosityTarget = requireNumber(env, "luminosity_target_lsun");
  const ageGyr = requireNumber(env, "age_gyr");
  const predictedLuminosity =
    Math.pow(Math.max(stellarMass, 0.1), 3.4) *
    (1 - metallicity * 0.4) *
    (1 - Math.min(ageGyr / 20, 0.35));
  const evolutionaryCoherence = clamp(1 - Math.abs(predictedLuminosity - luminosityTarget) / Math.max(luminosityTarget, 0.1), 0, 1);

  return {
    metrics: {
      efficacy: scoreHigherBetter(predictedLuminosity, luminosityTarget * 0.9),
      quality: scoreHigherBetter(evolutionaryCoherence, 0.8),
      reliability: scoreLowerBetter(Math.abs(predictedLuminosity - luminosityTarget), luminosityTarget * 0.25)
    },
    details: { predictedLuminosity, evolutionaryCoherence }
  };
}

function cosmologyParameterFitSolver(env) {
  const hubbleConstant = requireNumber(env, "hubble_constant_km_s_mpc");
  const omegaMatter = requireNumber(env, "matter_density_omega_m");
  const omegaLambda = requireNumber(env, "dark_energy_density_omega_lambda");
  const targetReducedChi2 = requireNumber(env, "target_reduced_chi2");
  const flatnessDeviation = Math.abs(omegaMatter + omegaLambda - 1);
  const reducedChi2 =
    targetReducedChi2 *
    (1 + flatnessDeviation * 1.8 + Math.abs(hubbleConstant - 70) / 90 + env.factors.variability * 0.2);

  return {
    metrics: {
      quality: scoreLowerBetter(reducedChi2, targetReducedChi2 * 1.15),
      reliability: scoreLowerBetter(flatnessDeviation + env.factors.fault * 0.02, 0.08),
      efficacy: scoreLowerBetter(Math.abs(hubbleConstant - 70), 8)
    },
    details: { reducedChi2, flatnessDeviation }
  };
}

function runQueueSimulation({ jobs, arrivalIntervalMs, serviceTimeMs, queueLimit }) {
  let time = 0;
  let nextArrival = 0;
  let serverFreeAt = 0;
  const queue = [];
  let completed = 0;
  let dropped = 0;
  let totalWaitMs = 0;
  let maxQueueLength = 0;

  while (completed + dropped < jobs) {
    const arrivalDue = nextArrival <= time;

    if (arrivalDue) {
      if (queue.length >= queueLimit) {
        dropped += 1;
      } else {
        queue.push(nextArrival);
        maxQueueLength = Math.max(maxQueueLength, queue.length);
      }

      nextArrival += arrivalIntervalMs;
      continue;
    }

    if (queue.length && serverFreeAt <= time) {
      const arrivalTime = queue.shift();
      totalWaitMs += time - arrivalTime;
      serverFreeAt = time + serviceTimeMs;
      completed += 1;
      continue;
    }

    time = Math.min(nextArrival, serverFreeAt > time ? serverFreeAt : nextArrival);
  }

  const completionRate = completed / Math.max(jobs, 1);
  const dropRate = dropped / Math.max(jobs, 1);

  return {
    completionRate,
    dropRate,
    averageWaitMs: totalWaitMs / Math.max(completed, 1),
    maxQueueLength
  };
}

function runSecondOrderResponse({ target, dt, steps, naturalFrequency, dampingRatio, disturbance }) {
  let x = 0;
  let xDot = 0;
  let peak = 0;
  let settlingTimeMs = steps * dt * 1000;

  for (let step = 0; step < steps; step += 1) {
    const xDDot =
      naturalFrequency * naturalFrequency * (target - x) -
      2 * dampingRatio * naturalFrequency * xDot -
      disturbance;
    xDot += xDDot * dt;
    x += xDot * dt;
    peak = Math.max(peak, x);

    if (Math.abs(target - x) <= target * 0.02 && settlingTimeMs === steps * dt * 1000) {
      settlingTimeMs = step * dt * 1000;
    }
  }

  return {
    finalValue: x,
    peakValue: peak,
    overshootRatio: Math.max(0, peak - target) / Math.max(target, 0.0001),
    settlingTimeMs
  };
}

function runFirstOrderPlant({ target, dt, steps, gain, timeConstant, disturbance }) {
  let x = 0;
  let riseTime = steps * dt;

  for (let step = 0; step < steps; step += 1) {
    const dx = (gain * target - x) / Math.max(timeConstant, 0.01) - disturbance;
    x += dx * dt;

    if (x >= target * 0.9 && riseTime === steps * dt) {
      riseTime = step * dt;
    }
  }

  return {
    finalValue: x,
    riseTime
  };
}

function runThermalRc({ ambientC, initialC, thermalResistance, thermalCapacitance, heatInputW, dt, steps }) {
  let temperature = initialC;
  let peakC = initialC;
  let settlingTimeS = steps * dt;

  for (let step = 0; step < steps; step += 1) {
    const dTdt = (heatInputW - (temperature - ambientC) / thermalResistance) / thermalCapacitance;
    temperature += dTdt * dt;
    peakC = Math.max(peakC, temperature);

    if (Math.abs(temperature - ambientC) <= 5 && settlingTimeS === steps * dt) {
      settlingTimeS = step * dt;
    }
  }

  return {
    peakC,
    finalC: temperature,
    settlingTimeS
  };
}

function runPiControlLoop({ target, kp, ki, disturbance, saturation, steps }) {
  let integral = 0;
  let output = 0;
  let peak = 0;
  let settlingStep = steps;

  for (let step = 0; step < steps; step += 1) {
    const error = target - output;
    integral += error * 0.01;
    const control = clamp(kp * error + ki * integral - disturbance, -saturation, saturation);
    output += (control - output * 0.05) * 0.08;
    peak = Math.max(peak, output);

    if (Math.abs(error) <= target * 0.03 && settlingStep === steps) {
      settlingStep = step;
    }
  }

  return {
    finalValue: output,
    overshootRatio: Math.max(0, peak - target) / Math.max(target, 0.0001),
    settlingStep
  };
}

function requireNumber(env, name, { defaultValue } = {}) {
  const value = toNumber(env.parameters[name]);

  if (Number.isFinite(value)) {
    return value;
  }

  if (Number.isFinite(defaultValue)) {
    return defaultValue;
  }

  throw new Error(`Builtin solver ${env.binding.solver} requires numeric parameter "${name}" on binding ${env.binding.id}.`);
}

function optionalNumber(env, name) {
  const value = toNumber(env.parameters[name]);
  return Number.isFinite(value) ? value : null;
}

function deriveFromAlternative(env, name, mapper) {
  const value = optionalNumber(env, name);
  return value === null ? null : mapper(value);
}

function getText(env, name, defaultValue = "") {
  const value = env.parameters[name];
  return typeof value === "string" && value.trim() ? value.trim() : defaultValue;
}

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const match = value.match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : Number.NaN;
  }

  return Number(value);
}

function scoreLowerBetter(actual, limit) {
  return clamp(limit / Math.max(actual, 1e-9), 0, 1);
}

function scoreHigherBetter(actual, target) {
  return clamp(actual / Math.max(target, 1e-9), 0, 1);
}

function normalizeMetrics(metrics) {
  return Object.fromEntries(
    Object.entries(metrics)
      .filter(([, value]) => Number.isFinite(value))
      .map(([key, value]) => [key, Number(clamp(value, 0, 1).toFixed(6))])
  );
}
