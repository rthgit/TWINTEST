import { average, clamp, hashString, pseudoRandom } from "./id.js";

const SCENARIO_SCALE = {
  nominal_operation: { load: 1, stress: 1, fault: 0, safety: 1 },
  boundary_conditions: { load: 1.05, stress: 1.08, fault: 0.03, safety: 1.02 },
  stress_overload: { load: 1.22, stress: 1.3, fault: 0.08, safety: 1.1 },
  fault_injection: { load: 0.96, stress: 1.18, fault: 0.26, safety: 1.18 },
  component_degradation: { load: 0.98, stress: 1.14, fault: 0.14, safety: 1.08 },
  parameter_sweep: { load: 1.06, stress: 1.1, fault: 0.04, safety: 1.03 },
  control_ablation: { load: 1.02, stress: 1.12, fault: 0.16, safety: 1.2 },
  safety_failover: { load: 0.92, stress: 1.05, fault: 0.2, safety: 1.28 }
};

const localExternalDrivers = {
  sundials: {
    driverId: "sundials",
    solver: "SUNDIALS",
    outputMode: "json_stdout",
    metricKeys: ["tracking_error", "settling_time_ms", "peak_error", "stability_margin"],
    run: runSundialsDriver
  },
  openmodelica: {
    driverId: "openmodelica",
    solver: "OpenModelica",
    outputMode: "json_stdout",
    metricKeys: ["thermal_margin", "efficiency", "energy_consumption", "control_error"],
    run: runOpenModelicaDriver
  },
  nuxmv: {
    driverId: "nuxmv",
    solver: "nuXmv",
    outputMode: "json_stdout",
    metricKeys: ["property_pass_rate", "counterexample_count", "proof_depth", "failover_coverage"],
    run: runNuXmvDriver
  },
  gem5: {
    driverId: "gem5",
    solver: "gem5",
    outputMode: "key_value_file",
    metricKeys: ["ipc", "latency_ms", "throughput", "cache_miss_rate"],
    run: runGem5Driver
  },
  openturns: {
    driverId: "openturns",
    solver: "OpenTURNS",
    outputMode: "json_stdout",
    metricKeys: ["failure_probability", "value_at_risk", "expected_shortfall", "sobol_index"],
    run: runOpenTurnsDriver
  },
  "project-chrono": {
    driverId: "project-chrono",
    solver: "Project Chrono",
    outputMode: "json_stdout",
    metricKeys: ["trajectory_error", "peak_acceleration", "stability_margin", "stopping_distance_m"],
    run: runProjectChronoDriver
  },
  calculix: {
    driverId: "calculix",
    solver: "CalculiX",
    outputMode: "json_stdout",
    metricKeys: ["max_stress", "max_displacement", "safety_factor", "modal_frequency_hz"],
    run: runCalculiXDriver
  },
  openfoam: {
    driverId: "openfoam",
    solver: "OpenFOAM",
    outputMode: "json_stdout",
    metricKeys: ["pressure_drop", "flow_uniformity", "temperature_rise", "cavitation_margin"],
    run: runOpenFoamDriver
  },
  xyce: {
    driverId: "xyce",
    solver: "Xyce",
    outputMode: "json_stdout",
    metricKeys: ["ripple", "switching_loss", "peak_current", "efficiency"],
    run: runXyceDriver
  },
  "materials-chemistry": {
    driverId: "materials-chemistry",
    solver: "Chemical Transport Backend",
    outputMode: "json_stdout",
    metricKeys: ["conversion", "transport_margin", "rheology_stability", "surface_coverage"],
    run: runMaterialsChemistryDriver
  },
  "cosmetic-transport": {
    driverId: "cosmetic-transport",
    solver: "Dermal and Formulation Backend",
    outputMode: "json_stdout",
    metricKeys: ["dermal_margin", "stability_score", "local_retention", "separation_index"],
    run: runCosmeticTransportDriver
  },
  "space-orbital": {
    driverId: "space-orbital",
    solver: "Orbital Mechanics Backend",
    outputMode: "json_stdout",
    metricKeys: ["orbital_margin", "period_minutes", "delta_v_reserve", "tracking_quality"],
    run: runSpaceOrbitalDriver
  },
  "space-inference": {
    driverId: "space-inference",
    solver: "Scientific Inference Backend",
    outputMode: "json_stdout",
    metricKeys: ["reduced_chi2", "fit_confidence", "flatness_margin", "observation_consistency"],
    run: runSpaceInferenceDriver
  }
};

export function listLocalExternalDrivers() {
  return Object.values(localExternalDrivers).map((driver) => ({
    driverId: driver.driverId,
    solver: driver.solver,
    outputMode: driver.outputMode,
    metricKeys: [...driver.metricKeys]
  }));
}

export function getLocalExternalDriverCatalog() {
  return Object.fromEntries(
    Object.entries(localExternalDrivers).map(([driverId, driver]) => [
      driverId,
      {
        driverId: driver.driverId,
        solver: driver.solver,
        outputMode: driver.outputMode,
        metricKeys: [...driver.metricKeys]
      }
    ])
  );
}

export function runLocalExternalDriver({ driverId, payload = {} }) {
  const driver = localExternalDrivers[driverId];

  if (!driver) {
    throw new Error(`Unknown local external driver "${driverId}".`);
  }

  const environment = buildEnvironment(payload);
  const result = driver.run(environment);

  if (!result?.metrics || !Object.keys(result.metrics).length) {
    throw new Error(`Local external driver "${driverId}" returned no metrics.`);
  }

  return {
    solver: driver.solver,
    outputMode: driver.outputMode,
    metrics: normalizeMetrics(result.metrics)
  };
}

function buildEnvironment(payload) {
  const binding = payload.binding || {};
  const scenario = payload.scenario || { id: "scenario_local", type: "nominal_operation" };
  const graph = payload.graph || {};
  const params = {
    ...(binding.configuration?.parameters || {}),
    ...(graph.parameters || {}),
    ...(payload.parameters || {})
  };
  const scale = SCENARIO_SCALE[scenario.type] || SCENARIO_SCALE.nominal_operation;
  const seed = hashString(JSON.stringify({
    scenarioId: scenario.id,
    scenarioType: scenario.type,
    solver: binding.solver || payload.solver || "local_driver",
    parameters: params
  }));

  return {
    payload,
    binding,
    scenario,
    graph,
    params,
    scale,
    seed,
    random: (name) => pseudoRandom(`${seed}:${name}`)
  };
}

function runSundialsDriver(environment) {
  const gain = numberParam(environment.params, "control_gain", 1.2);
  const damping = numberParam(environment.params, "damping_ratio", 0.24);
  const initialError = numberParam(environment.params, "initial_error", 1.0) * environment.scale.load;
  const steps = 240;
  const dt = 0.01;
  let error = initialError;
  let peakError = error;
  let settlingStep = steps;

  for (let step = 0; step < steps; step += 1) {
    const deriv = -(gain * error) - damping * Math.sign(error || 1) * Math.sqrt(Math.abs(error));
    const k1 = deriv;
    const k2 = -(gain * (error + 0.5 * dt * k1)) - damping * Math.sign(error || 1) * Math.sqrt(Math.abs(error + 0.5 * dt * k1));
    const k3 = -(gain * (error + 0.5 * dt * k2)) - damping * Math.sign(error || 1) * Math.sqrt(Math.abs(error + 0.5 * dt * k2));
    const k4 = -(gain * (error + dt * k3)) - damping * Math.sign(error || 1) * Math.sqrt(Math.abs(error + dt * k3));
    error += (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    peakError = Math.max(peakError, Math.abs(error));

    if (Math.abs(error) <= 0.02 && settlingStep === steps) {
      settlingStep = step;
    }
  }

  return {
    metrics: {
      tracking_error: clamp(Math.abs(error) + environment.scale.fault * 0.08, 0, 1),
      settling_time_ms: clamp((settlingStep * dt * 1000) / 1000, 0, 1),
      peak_error: clamp(peakError / Math.max(initialError, 1), 0, 1),
      stability_margin: clamp(1 - damping * environment.scale.stress * 0.4 - environment.scale.fault * 0.3, 0, 1)
    }
  };
}

function runOpenModelicaDriver(environment) {
  const ambient = numberParam(environment.params, "ambient_temp_c", 24);
  const target = numberParam(environment.params, "target_temp_c", 21);
  const hvacCapacity = numberParam(environment.params, "hvac_capacity_kw", 18);
  const heatLoss = numberParam(environment.params, "heat_loss_kw_k", 0.42) * environment.scale.stress;
  const solarGain = numberParam(environment.params, "pv_capacity_kw", 4.2) * 0.18;
  const initialTemp = ambient + environment.scale.load * 2.2;
  let temperature = initialTemp;

  for (let step = 0; step < 180; step += 1) {
    const hvacEffect = (target - temperature) * Math.min(1.2, hvacCapacity / 25);
    const envelopeLoss = (ambient - temperature) * heatLoss * 0.018;
    const solarEffect = solarGain * 0.012;
    temperature += hvacEffect * 0.08 + envelopeLoss + solarEffect;
  }

  const thermalMargin = clamp(1 - Math.abs(temperature - target) / 20, 0, 1);
  const deliveredLoad = Math.max(0.1, hvacCapacity - heatLoss);

  return {
    metrics: {
      thermal_margin: thermalMargin,
      efficiency: clamp(deliveredLoad / Math.max(1, hvacCapacity + solarGain), 0, 1),
      energy_consumption: clamp((hvacCapacity * environment.scale.load) / 40, 0, 1),
      control_error: clamp(Math.abs(temperature - target) / 15, 0, 1)
    }
  };
}

function runNuXmvDriver(environment) {
  const propertyCount = numberParam(environment.params, "property_count", 14);
  const interlockResponseMs = numberParam(environment.params, "interlock_response_ms", 30);
  const failoverCoverageBase = numberParam(environment.params, "control_coverage", 0.92);
  const safetyPressure = environment.scale.safety + environment.scale.fault;
  const proofDepth = Math.max(1, Math.round(propertyCount * (1 + environment.scale.stress * 0.2)));
  const failedProperties = Math.min(
    propertyCount,
    Math.round(propertyCount * clamp((interlockResponseMs - 18) / 180 + environment.scale.fault * 0.5, 0, 0.85))
  );

  return {
    metrics: {
      property_pass_rate: clamp((propertyCount - failedProperties) / Math.max(propertyCount, 1), 0, 1),
      counterexample_count: clamp(failedProperties / Math.max(propertyCount, 1), 0, 1),
      proof_depth: clamp(proofDepth / Math.max(propertyCount * 2, 1), 0, 1),
      failover_coverage: clamp(failoverCoverageBase - safetyPressure * 0.08, 0, 1)
    }
  };
}

function runGem5Driver(environment) {
  const throughputTarget = numberParam(environment.params, "throughput_target", 120000);
  const latencyBudget = numberParam(environment.params, "latency_budget_ms", 4);
  const queueDepth = numberParam(environment.params, "queue_depth", 32);
  const powerBudget = numberParam(environment.params, "power_budget_watts", 420);
  const workPressure = environment.scale.load * (1 + environment.scale.stress * 0.12);
  const ipc = clamp((throughputTarget / 180000) * (queueDepth / 32) / workPressure, 0, 3.5);
  const latencyMs = Math.max(0.1, latencyBudget * workPressure * (1 + queueDepth / 120));
  const throughput = Math.max(1, throughputTarget / workPressure);
  const cacheMissRate = clamp(0.03 + queueDepth / 800 + environment.scale.fault * 0.14 + powerBudget / 20000, 0, 1);

  return {
    metrics: {
      ipc: Number(ipc.toFixed(6)),
      latency_ms: Number(latencyMs.toFixed(6)),
      throughput: Number(throughput.toFixed(6)),
      cache_miss_rate: Number(cacheMissRate.toFixed(6))
    }
  };
}

function runOpenTurnsDriver(environment) {
  const confidence = numberParam(environment.params, "confidence_level", 0.99);
  const volatility = numberParam(environment.params, "volatility", 0.18);
  const horizonDays = numberParam(environment.params, "horizon_days", 10);
  const lossFraction = numberParam(environment.params, "stress_loss_fraction", 0.14);
  const samples = 96;
  const sampleLosses = [];

  for (let index = 0; index < samples; index += 1) {
    const noise = (environment.random(`uq:${index}`) - 0.5) * volatility * environment.scale.stress;
    const syntheticLoss = clamp(lossFraction + noise + environment.scale.fault * 0.08, 0, 1);
    sampleLosses.push(syntheticLoss);
  }

  const ordered = [...sampleLosses].sort((left, right) => left - right);
  const varIndex = Math.min(ordered.length - 1, Math.floor(confidence * ordered.length) - 1);
  const varLoss = ordered[Math.max(varIndex, 0)];
  const tail = ordered.slice(Math.max(varIndex, 0));
  const sobolIndex = clamp(volatility * 1.6 + environment.scale.fault * 0.12, 0, 1);

  return {
    metrics: {
      failure_probability: clamp(average(sampleLosses) * environment.scale.safety, 0, 1),
      value_at_risk: clamp(varLoss * Math.sqrt(horizonDays / 10), 0, 1),
      expected_shortfall: clamp(average(tail), 0, 1),
      sobol_index: sobolIndex
    }
  };
}

function runProjectChronoDriver(environment) {
  const mass = numberParam(environment.params, "vehicle_mass_kg", numberParam(environment.params, "mass_kg", 180));
  const brakeResponseMs = numberParam(environment.params, "brake_response_ms", 140);
  const reach = numberParam(environment.params, "reach_m", 1.4);
  const jointSpeed = numberParam(environment.params, "joint_speed_deg_s", 180);
  const peakAcceleration = (jointSpeed / 60) * environment.scale.load;

  return {
    metrics: {
      trajectory_error: clamp((reach * environment.scale.fault + environment.scale.stress * 0.08) / 2.2, 0, 1),
      peak_acceleration: clamp(peakAcceleration / 6.5, 0, 1),
      stability_margin: clamp(1 - mass / 2500 - environment.scale.stress * 0.08, 0, 1),
      stopping_distance_m: clamp((brakeResponseMs / 200 + environment.scale.load * 0.4) / 4, 0, 1)
    }
  };
}

function runCalculiXDriver(environment) {
  const load = numberParam(environment.params, "load_n", 1800) * environment.scale.load;
  const stiffness = numberParam(environment.params, "stiffness_n_mm", 450);
  const areaMm2 = numberParam(environment.params, "cross_section_mm2", 220);
  const densityFactor = numberParam(environment.params, "material_factor", 1);
  const stress = load / Math.max(areaMm2 * densityFactor, 1);
  const displacement = load / Math.max(stiffness, 1);
  const safetyFactor = clamp(numberParam(environment.params, "allowable_stress_mpa", 18) / Math.max(stress, 0.001), 0, 3);
  const modalFrequency = Math.sqrt(Math.max(stiffness, 1) / Math.max(numberParam(environment.params, "mass_kg", 38), 0.1));

  return {
    metrics: {
      max_stress: clamp(stress / 18, 0, 1),
      max_displacement: clamp(displacement / 8, 0, 1),
      safety_factor: clamp(safetyFactor / 3, 0, 1),
      modal_frequency_hz: clamp(modalFrequency / 12, 0, 1)
    }
  };
}

function runOpenFoamDriver(environment) {
  const flowTarget = numberParam(environment.params, "flow_target_l_min", 34) * environment.scale.load;
  const pressureLimit = numberParam(environment.params, "pressure_limit_bar", 6.5);
  const temperatureLimit = numberParam(environment.params, "thermal_limit_c", 96);
  const cavitationHead = numberParam(environment.params, "head_limit_m", 26);
  const pressureDrop = flowTarget / Math.max(cavitationHead * 3.5, 1) * environment.scale.stress;
  const flowUniformity = clamp(1 - environment.scale.fault * 0.22 - environment.scale.stress * 0.12, 0, 1);
  const temperatureRise = clamp((flowTarget / Math.max(temperatureLimit, 1)) * 0.7, 0, 1);
  const cavitationMargin = clamp(1 - pressureDrop / Math.max(pressureLimit, 0.1), 0, 1);

  return {
    metrics: {
      pressure_drop: clamp(pressureDrop / Math.max(pressureLimit, 1), 0, 1),
      flow_uniformity: flowUniformity,
      temperature_rise: temperatureRise,
      cavitation_margin: cavitationMargin
    }
  };
}

function runXyceDriver(environment) {
  const voltage = numberParam(environment.params, "voltage_v", 230);
  const currentLimit = numberParam(environment.params, "current_limit_a", 16);
  const switchingFrequency = numberParam(environment.params, "switching_frequency_khz", 24);
  const powerFactor = numberParam(environment.params, "power_factor", 0.92);
  const ripple = clamp((environment.scale.stress * 0.08 + switchingFrequency / 500) / 1.2, 0, 1);
  const switchingLoss = clamp((voltage * currentLimit) / 12000 * (1 - powerFactor + environment.scale.fault * 0.12), 0, 1);
  const peakCurrent = clamp((currentLimit * environment.scale.load) / 24, 0, 1);
  const efficiency = clamp(powerFactor - ripple * 0.18 - switchingLoss * 0.12, 0, 1);

  return {
    metrics: {
      ripple,
      switching_loss: switchingLoss,
      peak_current: peakCurrent,
      efficiency
    }
  };
}

function runMaterialsChemistryDriver(environment) {
  const rateConstant = numberParam(environment.params, "reaction_rate_constant", 0.0045);
  const concentration = numberParam(environment.params, "reactant_concentration", 1.8);
  const residenceTime = numberParam(environment.params, "residence_time_s", 420);
  const diffusionCoefficient = numberParam(environment.params, "diffusion_coefficient_m2_s", 1.2e-10);
  const barrierThicknessUm = numberParam(environment.params, "barrier_thickness_um", 35);
  const shearRate = numberParam(environment.params, "shear_rate_s", 120);
  const viscosity = numberParam(environment.params, "viscosity_pa_s", 18);
  const adsorptionCapacity = numberParam(environment.params, "adsorption_capacity_mg_g", 14);
  const surfaceArea = numberParam(environment.params, "surface_area_m2_g", 180);

  const conversion = clamp(1 - Math.exp(-rateConstant * concentration * residenceTime * 0.01), 0, 1);
  const transportMargin = clamp(
    1 - (diffusionCoefficient * 1e11 * environment.scale.stress) / Math.max(barrierThicknessUm, 1),
    0,
    1
  );
  const rheologyStability = clamp(
    1 - Math.abs(Math.log1p(shearRate) / Math.max(viscosity, 1)) - environment.scale.fault * 0.08,
    0,
    1
  );
  const surfaceCoverage = clamp(
    adsorptionCapacity * surfaceArea / Math.max(surfaceArea * 16, 1) - environment.scale.fault * 0.06,
    0,
    1
  );

  return {
    metrics: {
      conversion,
      transport_margin: transportMargin,
      rheology_stability: rheologyStability,
      surface_coverage: surfaceCoverage
    }
  };
}

function runCosmeticTransportDriver(environment) {
  const skinDiffusion = numberParam(environment.params, "skin_diffusion_coeff_cm2_h", 0.0021);
  const partition = numberParam(environment.params, "partition_coefficient", 2.6);
  const exposureDose = numberParam(environment.params, "exposure_dose_mg_cm2", 1.8);
  const maxExposure = numberParam(environment.params, "max_systemic_exposure_mg", 0.6);
  const formulationViscosity = numberParam(environment.params, "formulation_viscosity_pa_s", 22);
  const temperatureRange = numberParam(environment.params, "temperature_cycling_range_c", 28);
  const shelfLife = numberParam(environment.params, "shelf_life_months", 18);
  const separationLimit = numberParam(environment.params, "separation_limit_fraction", 0.08);

  const absorbedDose = exposureDose * skinDiffusion * partition * 0.1 * environment.scale.load;
  const dermalMargin = clamp(1 - absorbedDose / Math.max(maxExposure, 0.01), 0, 1);
  const localRetention = clamp(1 - absorbedDose / Math.max(exposureDose + maxExposure, 0.1), 0, 1);
  const separationIndex = clamp(
    (temperatureRange / Math.max(formulationViscosity * 4, 0.1)) * (1 + shelfLife / 24) * environment.scale.stress,
    0,
    1
  );
  const stabilityScore = clamp(1 - separationIndex / Math.max(separationLimit * 4, 0.1), 0, 1);

  return {
    metrics: {
      dermal_margin: dermalMargin,
      stability_score: stabilityScore,
      local_retention: localRetention,
      separation_index: separationIndex
    }
  };
}

function runSpaceOrbitalDriver(environment) {
  const semiMajorAxisKm = numberParam(environment.params, "semi_major_axis_km", 7050);
  const eccentricity = numberParam(environment.params, "eccentricity", 0.012);
  const deltaVBudget = numberParam(environment.params, "delta_v_budget_m_s", 420);
  const missionDuration = numberParam(environment.params, "mission_duration_h", 12);
  const sensorNoise = numberParam(environment.params, "sensor_noise_arcsec", 0.18);

  const orbitalPeriodMinutes = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxisKm, 3) / 398600.4418) / 60;
  const orbitalMargin = clamp(1 - eccentricity * 2.4 - environment.scale.fault * 0.08, 0, 1);
  const deltaVReserve = clamp(1 - missionDuration / Math.max(deltaVBudget * 0.05, 1), 0, 1);
  const trackingQuality = clamp(1 - sensorNoise * 1.8 - environment.scale.stress * 0.06, 0, 1);

  return {
    metrics: {
      orbital_margin: orbitalMargin,
      period_minutes: clamp(orbitalPeriodMinutes / 180, 0, 1),
      delta_v_reserve: deltaVReserve,
      tracking_quality: trackingQuality
    }
  };
}

function runSpaceInferenceDriver(environment) {
  const stellarMass = numberParam(environment.params, "stellar_mass_solar", 1.1);
  const luminosityTarget = numberParam(environment.params, "luminosity_target_lsun", 1.45);
  const hubbleConstant = numberParam(environment.params, "hubble_constant_km_s_mpc", 67.8);
  const omegaMatter = numberParam(environment.params, "matter_density_omega_m", 0.31);
  const omegaLambda = numberParam(environment.params, "dark_energy_density_omega_lambda", 0.69);
  const targetReducedChi2 = numberParam(environment.params, "target_reduced_chi2", 1.1);
  const observationTarget = numberParam(environment.params, "signal_to_noise_target", 24);

  const predictedLuminosity = Math.pow(Math.max(stellarMass, 0.1), 3.4);
  const luminosityResidual = Math.abs(predictedLuminosity - luminosityTarget) / Math.max(luminosityTarget, 0.1);
  const flatnessDeviation = Math.abs(omegaMatter + omegaLambda - 1);
  const reducedChi2 = clamp(
    targetReducedChi2 * (1 + luminosityResidual * 0.4 + flatnessDeviation * 2 + Math.abs(hubbleConstant - 70) / 100),
    0,
    2
  );
  const fitConfidence = clamp(1 - reducedChi2 / Math.max(targetReducedChi2 * 1.4, 0.1), 0, 1);
  const observationConsistency = clamp(1 - (luminosityResidual + 1 / Math.max(observationTarget, 1)) * 0.6, 0, 1);

  return {
    metrics: {
      reduced_chi2: clamp(reducedChi2 / 2, 0, 1),
      fit_confidence: fitConfidence,
      flatness_margin: clamp(1 - flatnessDeviation * 5, 0, 1),
      observation_consistency: observationConsistency
    }
  };
}

function numberParam(parameters, key, fallback) {
  const numericValue = Number(parameters?.[key]);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizeMetrics(metrics) {
  return Object.fromEntries(
    Object.entries(metrics).map(([key, value]) => [key, Number(value.toFixed(6))])
  );
}
