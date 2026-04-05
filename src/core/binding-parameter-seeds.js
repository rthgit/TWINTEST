export const defaultBindingParameters = {
  throughput_target: 120000,
  power_budget_watts: 420,
  latency_budget_ms: 4,
  dispatch_window_ms: 3,
  queue_depth: 32,
  priority_policy: "priority_weighted",
  mass_kg: 38,
  torque_nm: 52,
  rpm_target: 1400,
  vibration_limit_mm_s: 6.5,
  resonance_band_hz: 170,
  thermal_limit_c: 96,
  heat_flux_w: 320,
  cooldown_window_s: 220,
  flow_target_l_min: 34,
  pressure_limit_bar: 6.5,
  head_limit_m: 26,
  efficiency_target: 0.9,
  valve_response_ms: 40,
  pressure_drop_limit_bar: 1.6,
  network_volume_l: 12,
  leak_threshold_l_min: 0.45,
  detection_latency_s: 4,
  voltage_v: 230,
  current_limit_a: 16,
  sample_time_ms: 10,
  control_bandwidth_hz: 10,
  trip_threshold: 1,
  interlock_response_ms: 28,
  coverage_target: 0.95,
  reference_baseline: 0.93,
  sampling_rate_hz: 250,
  retention_window_s: 3600,
  range_target_km: 420,
  arrival_rate_per_hour: 120,
  service_rate_per_hour: 160,
  sla_hours: 4,
  rework_rate: 0.08,
  requests_per_second: 850,
  service_time_ms: 22,
  replica_count: 12,
  latency_slo_ms: 65,
  policy_count: 120,
  control_coverage: 0.93,
  threat_level: 0.35,
  violation_tolerance: 3,
  step_count: 24,
  mandatory_control_count: 18,
  evidence_completeness_target: 0.95,
  battery_capacity_ah: 18,
  internal_resistance_ohm: 0.045,
  load_current_a: 8,
  voltage_nominal_v: 14.8,
  skin_limit_c: 39,
  device_power_w: 2.8,
  contact_area_cm2: 28,
  ambient_temp_c: 24,
  base_load_kw: 3.2,
  pv_capacity_kw: 5.5,
  storage_capacity_kwh: 10,
  peak_limit_kw: 6,
  vehicle_mass_kg: 125,
  motor_power_kw: 9,
  brake_response_ms: 140,
  alarm_response_ms: 110,
  risk_threshold: 0.85,
  load_n: 1800,
  stiffness_n_mm: 450,
  displacement_limit_mm: 6,
  fatigue_target_cycles: 150000,
  critical_step_count: 8,
  handoff_count: 5,
  max_handoff_delay_min: 18,
  compartment_volume_l: 5,
  clearance_l_h: 0.9,
  dose_mg: 220,
  toxicity_limit: 70,
  generation_mw: 180,
  demand_mw: 150,
  line_limit_mw: 210,
  reserve_margin_target: 0.14,
  demand_m3_h: 260,
  supply_m3_h: 310,
  pressure_target_bar: 4.8,
  leakage_ratio: 0.06,
  redundancy_level: 3,
  repair_time_h: 6,
  hazard_rate: 0.018,
  service_level_target: 0.92,
  stall_speed_m_s: 58,
  max_speed_m_s: 245,
  load_factor_limit: 4.8,
  maneuver_demand: 2.4,
  thrust_target_kn: 84,
  fuel_flow_kg_s: 1.9,
  temperature_limit_c: 1320,
  compressor_ratio: 18,
  mission_duration_h: 12,
  subsystem_count: 14,
  failure_rate_per_h: 0.0015,
  payload_kg: 12,
  joint_speed_deg_s: 180,
  reach_m: 1.4,
  position_tolerance_mm: 2.5,
  sensor_latency_ms: 38,
  stopping_distance_m: 2.8,
  hazard_density: 0.22,
  safety_threshold: 0.82,
  sensor_count: 6,
  dropout_rate: 0.03,
  alignment_error_deg: 1.2,
  portfolio_value: 100000000,
  volatility: 0.18,
  confidence_level: 0.99,
  horizon_days: 10,
  stress_loss_fraction: 0.14,
  liquidity_buffer: 18000000,
  capital_ratio_target: 0.12,
  counterparty_count: 22,
  exposure_ratio: 0.06,
  settlement_window_days: 2,
  heat_loss_kw_k: 0.42,
  hvac_capacity_kw: 18,
  target_temp_c: 21,
  renewable_mw: 62,
  storage_mwh: 110,
  reserve_target_mw: 20,
  rainfall_mm: 44,
  catchment_km2: 18,
  infiltration_ratio: 0.38,
  channel_capacity_m3_s: 95
};

export function buildBindingParameterSeed({
  graph,
  componentId,
  requiredParameters = [],
  overrides = {}
}) {
  const componentParameters = Object.fromEntries(
    (graph.parameters || [])
      .filter((parameter) => parameter.componentId === componentId)
      .map((parameter) => [parameter.name, coerceParameterValue(parameter.value)])
      .filter(([, value]) => value !== null)
  );
  const mergedDefaults = {
    ...defaultBindingParameters,
    ...componentParameters,
    ...overrides
  };

  return Object.fromEntries(
    requiredParameters.map((parameterName) => [parameterName, mergedDefaults[parameterName]])
  );
}

function coerceParameterValue(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return value;
  }

  const numericMatch = value.match(/-?\d+(?:\.\d+)?/);

  if (!numericMatch) {
    return value;
  }

  const numericValue = Number(numericMatch[0]);
  return Number.isFinite(numericValue) ? numericValue : value;
}
