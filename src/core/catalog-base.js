export const scenarioProfiles = [
  { type: "nominal_operation", label: "Nominal Operation", baselineScore: 0.91, threshold: 0.8, priority: "critical", operatingMode: "nominal" },
  { type: "boundary_conditions", label: "Boundary Conditions", baselineScore: 0.85, threshold: 0.76, priority: "high", operatingMode: "boundary" },
  { type: "stress_overload", label: "Stress and Overload", baselineScore: 0.78, threshold: 0.72, priority: "high", operatingMode: "stress" },
  { type: "fault_injection", label: "Fault Injection", baselineScore: 0.74, threshold: 0.68, priority: "critical", operatingMode: "fault_recovery" },
  { type: "component_degradation", label: "Component Degradation", baselineScore: 0.76, threshold: 0.69, priority: "high", operatingMode: "degraded" },
  { type: "parameter_sweep", label: "Parameter Sweep", baselineScore: 0.82, threshold: 0.73, priority: "medium", operatingMode: "nominal" },
  { type: "control_ablation", label: "Control Ablation", baselineScore: 0.71, threshold: 0.66, priority: "high", operatingMode: "fallback" },
  { type: "safety_failover", label: "Safety and Failover", baselineScore: 0.79, threshold: 0.75, priority: "critical", operatingMode: "failover" }
];

export const operatingModeCatalog = [
  { key: "nominal", name: "Nominal", description: "Standard operating envelope." },
  { key: "boundary", name: "Boundary", description: "Envelope edge and limit conditions." },
  { key: "stress", name: "Stress", description: "Overload and sustained stress conditions." },
  { key: "degraded", name: "Degraded", description: "Reduced health or partial performance mode." },
  { key: "fault_recovery", name: "Fault Recovery", description: "System under injected faults and recovery attempts." },
  { key: "fallback", name: "Fallback", description: "Reduced control layer or ablated supervision." },
  { key: "failover", name: "Failover", description: "Safety path and redundancy engagement." }
];

export const templateLibrary = [
  {
    id: "tmpl.compute.tile",
    name: "Compute Tile Agent",
    category: "compute",
    role: "compute_tile_agent",
    compatibleSolvers: ["architectural-surrogate", "queueing-simulator"],
    requiredParameters: ["throughput_target", "power_budget_watts", "latency_budget_ms"],
    observableFailureModes: ["tile_fault", "thermal_throttle", "latency_regression"],
    confidenceFloor: 0.72
  },
  {
    id: "tmpl.compute.scheduler",
    name: "Scheduler and Runtime Agent",
    category: "compute",
    role: "scheduler_runtime_agent",
    compatibleSolvers: ["discrete-event-scheduler", "state-space-control"],
    requiredParameters: ["dispatch_window_ms", "queue_depth", "priority_policy"],
    observableFailureModes: ["starvation", "runtime_backpressure", "deadlock_risk"],
    confidenceFloor: 0.74
  },
  {
    id: "tmpl.mechanical.component",
    name: "Mechanical Component Agent",
    category: "mechanical",
    role: "mechanical_component_agent",
    compatibleSolvers: ["multibody-surrogate", "ode-state-space"],
    requiredParameters: ["mass_kg", "torque_nm", "rpm_target"],
    observableFailureModes: ["wear", "imbalance", "shaft_slip"],
    confidenceFloor: 0.71
  },
  {
    id: "tmpl.mechanical.vibration",
    name: "Vibration and Wear Agent",
    category: "mechanical",
    role: "vibration_wear_agent",
    compatibleSolvers: ["modal-analysis", "spectral-monitor"],
    requiredParameters: ["vibration_limit_mm_s", "resonance_band_hz"],
    observableFailureModes: ["resonance", "bearing_wear", "noise_spike"],
    confidenceFloor: 0.76
  },
  {
    id: "tmpl.thermal",
    name: "Thermal Agent",
    category: "thermal",
    role: "thermal_agent",
    compatibleSolvers: ["thermal-network", "cfd-surrogate"],
    requiredParameters: ["thermal_limit_c", "heat_flux_w", "cooldown_window_s"],
    observableFailureModes: ["overtemperature", "thermal_runaway", "cooling_loss"],
    confidenceFloor: 0.75
  },
  {
    id: "tmpl.fluidic.loop",
    name: "Fluidic Loop Agent",
    category: "fluidic",
    role: "fluidic_agent",
    compatibleSolvers: ["fluid-network", "cfd-lite"],
    requiredParameters: ["flow_target_l_min", "pressure_limit_bar"],
    observableFailureModes: ["cavitation", "flow_instability", "blockage"],
    confidenceFloor: 0.73
  },
  {
    id: "tmpl.fluidic.pump",
    name: "Pump Agent",
    category: "fluidic",
    role: "pump_agent",
    compatibleSolvers: ["pump-curve-solver", "fluid-network"],
    requiredParameters: ["head_limit_m", "flow_target_l_min", "efficiency_target"],
    observableFailureModes: ["cavitation", "seal_failure", "under_delivery"],
    confidenceFloor: 0.74
  },
  {
    id: "tmpl.fluidic.valve",
    name: "Valve Agent",
    category: "fluidic",
    role: "valve_agent",
    compatibleSolvers: ["fluid-network", "rule-engine"],
    requiredParameters: ["valve_response_ms", "pressure_limit_bar"],
    observableFailureModes: ["stiction", "leakage", "stuck_open"],
    confidenceFloor: 0.75
  },
  {
    id: "tmpl.fluidic.network",
    name: "Pipe Network Agent",
    category: "fluidic",
    role: "pipe_network_agent",
    compatibleSolvers: ["fluid-network", "hydraulic-graph"],
    requiredParameters: ["pressure_drop_limit_bar", "network_volume_l"],
    observableFailureModes: ["leak", "pressure_loss", "air_ingress"],
    confidenceFloor: 0.73
  },
  {
    id: "tmpl.fluidic.leak",
    name: "Leak and Failure Agent",
    category: "fluidic",
    role: "leak_failure_agent",
    compatibleSolvers: ["probabilistic-reliability", "rule-engine"],
    requiredParameters: ["leak_threshold_l_min", "detection_latency_s"],
    observableFailureModes: ["micro_leak", "burst", "sensor_blind_spot"],
    confidenceFloor: 0.77
  },
  {
    id: "tmpl.electrical.drive",
    name: "Electrical Drive Agent",
    category: "electrical",
    role: "electrical_drive_agent",
    compatibleSolvers: ["circuit-state-space", "control-loop"],
    requiredParameters: ["voltage_v", "current_limit_a", "torque_nm"],
    observableFailureModes: ["overcurrent", "stall", "brownout"],
    confidenceFloor: 0.74
  },
  {
    id: "tmpl.control.system",
    name: "Control System Agent",
    category: "control",
    role: "control_system_agent",
    compatibleSolvers: ["state-space-control", "logic-simulation"],
    requiredParameters: ["sample_time_ms", "control_bandwidth_hz"],
    observableFailureModes: ["instability", "overshoot", "recovery_delay"],
    confidenceFloor: 0.76
  },
  {
    id: "tmpl.control.safety",
    name: "Safety and Interlock Agent",
    category: "control",
    role: "safety_interlock_agent",
    compatibleSolvers: ["logic-simulation", "rule-engine"],
    requiredParameters: ["trip_threshold", "interlock_response_ms"],
    observableFailureModes: ["unsafe_state", "trip_failure", "failover_gap"],
    confidenceFloor: 0.81
  },
  {
    id: "tmpl.verification.reference",
    name: "Verification Reference Agent",
    category: "verification",
    role: "verification_reference_agent",
    compatibleSolvers: ["rule-engine", "constraint-checker"],
    requiredParameters: ["coverage_target", "reference_baseline"],
    observableFailureModes: ["coverage_gap", "oracle_mismatch", "audit_hole"],
    confidenceFloor: 0.83
  },
  {
    id: "tmpl.telemetry",
    name: "Telemetry Agent",
    category: "telemetry",
    role: "telemetry_agent",
    compatibleSolvers: ["timeseries-evaluator", "discrete-event-scheduler"],
    requiredParameters: ["sampling_rate_hz", "retention_window_s"],
    observableFailureModes: ["telemetry_drop", "timestamp_drift", "blind_window"],
    confidenceFloor: 0.78
  },
  {
    id: "tmpl.vehicle.powertrain",
    name: "Vehicle Powertrain Agent",
    category: "vehicle",
    role: "vehicle_powertrain_agent",
    compatibleSolvers: ["powertrain-ode", "energy-flow-solver"],
    requiredParameters: ["torque_nm", "efficiency_target", "range_target_km"],
    observableFailureModes: ["torque_drop", "thermal_limit", "regen_loss"],
    confidenceFloor: 0.75
  },
  {
    id: "tmpl.business.workflow",
    name: "Workflow Orchestration Agent",
    category: "business_process",
    role: "workflow_orchestration_agent",
    compatibleSolvers: ["business-process-simulator", "compliance-workflow-solver"],
    requiredParameters: ["arrival_rate_per_hour", "service_rate_per_hour", "sla_hours", "rework_rate"],
    observableFailureModes: ["cycle_time_breach", "handoff_delay", "workflow_drift"],
    confidenceFloor: 0.73
  },
  {
    id: "tmpl.business.service",
    name: "Service Runtime Agent",
    category: "service_operations",
    role: "service_runtime_agent",
    compatibleSolvers: ["service-capacity-solver", "security-policy-checker"],
    requiredParameters: ["requests_per_second", "service_time_ms", "replica_count", "latency_slo_ms"],
    observableFailureModes: ["latency_spike", "capacity_exhaustion", "availability_drop"],
    confidenceFloor: 0.74
  },
  {
    id: "tmpl.business.policy",
    name: "Policy and Guardrail Agent",
    category: "security_compliance",
    role: "policy_guardrail_agent",
    compatibleSolvers: ["security-policy-checker", "compliance-workflow-solver"],
    requiredParameters: ["policy_count", "control_coverage", "threat_level", "violation_tolerance"],
    observableFailureModes: ["policy_gap", "threat_exposure", "compliance_drift"],
    confidenceFloor: 0.77
  },
  {
    id: "tmpl.chemistry.reaction",
    name: "Reaction and Transport Agent",
    category: "materials_chemistry",
    role: "reaction_transport_agent",
    compatibleSolvers: ["reaction-kinetics-solver", "diffusion-barrier-solver"],
    requiredParameters: ["reaction_rate_constant", "reactant_concentration", "residence_time_s", "target_conversion"],
    observableFailureModes: ["under_conversion", "transport_bottleneck", "residence_time_loss"],
    confidenceFloor: 0.74
  },
  {
    id: "tmpl.chemistry.formulation",
    name: "Formulation and Surface Agent",
    category: "materials_chemistry",
    role: "formulation_surface_agent",
    compatibleSolvers: ["rheology-profile-solver", "surface-adsorption-solver"],
    requiredParameters: ["shear_rate_s", "viscosity_pa_s", "elastic_modulus_kpa", "surface_area_m2_g"],
    observableFailureModes: ["phase_instability", "surface_saturation", "viscosity_drift"],
    confidenceFloor: 0.75
  },
  {
    id: "tmpl.cosmetic.dermal",
    name: "Dermal Exposure Agent",
    category: "cosmetic_science",
    role: "dermal_exposure_agent",
    compatibleSolvers: ["skin-penetration-solver", "cosmetic-stability-solver"],
    requiredParameters: ["skin_diffusion_coeff_cm2_h", "partition_coefficient", "exposure_dose_mg_cm2", "max_systemic_exposure_mg"],
    observableFailureModes: ["over_exposure", "barrier_breakthrough", "stability_loss"],
    confidenceFloor: 0.77
  },
  {
    id: "tmpl.cosmetic.quality",
    name: "Cosmetic Quality Agent",
    category: "cosmetic_science",
    role: "cosmetic_quality_agent",
    compatibleSolvers: ["preservative-efficacy-solver", "sensory-profile-solver"],
    requiredParameters: ["preservative_log_reduction_target", "preservative_concentration_pct", "texture_uniformity_target", "panel_variability"],
    observableFailureModes: ["microbial_escape", "texture_inconsistency", "panel_rejection"],
    confidenceFloor: 0.78
  },
  {
    id: "tmpl.space.orbit",
    name: "Orbital Dynamics Agent",
    category: "space_cosmology",
    role: "orbital_dynamics_agent",
    compatibleSolvers: ["orbital-mechanics-solver", "observation-calibration-solver"],
    requiredParameters: ["semi_major_axis_km", "eccentricity", "delta_v_budget_m_s", "signal_to_noise_target"],
    observableFailureModes: ["geometry_margin_loss", "tracking_bias", "calibration_drift"],
    confidenceFloor: 0.76
  },
  {
    id: "tmpl.space.inference",
    name: "Astrophysical Inference Agent",
    category: "space_cosmology",
    role: "astrophysical_inference_agent",
    compatibleSolvers: ["stellar-structure-lite-solver", "cosmology-parameter-fit-solver"],
    requiredParameters: ["stellar_mass_solar", "luminosity_target_lsun", "hubble_constant_km_s_mpc", "target_reduced_chi2"],
    observableFailureModes: ["fit_divergence", "model_mismatch", "inference_bias"],
    confidenceFloor: 0.74
  }
];
