export const domainBlueprintsB = {
  fluidic_energy: {
    id: "fluidic_energy",
    label: "Fluidic and Energy Systems",
    keywords: ["turbine", "hydraulic", "pump", "valve", "pipe", "pressure", "flow", "thermal", "fluid", "energy", "leak"],
    subsystems: [
      { key: "generation", name: "Generation", description: "Primary energy transfer and pump/turbine action." },
      { key: "distribution", name: "Distribution", description: "Pipe network and valve bank." },
      { key: "thermal", name: "Thermal Management", description: "Thermal exchange and heat containment." },
      { key: "control", name: "Control and Interlock", description: "Supervisory control and interlock logic." },
      { key: "reliability", name: "Reliability", description: "Leak detection and failure monitoring." }
    ],
    components: [
      {
        key: "pump_train",
        subsystemKey: "generation",
        name: "Pump or Turbine Train",
        templateId: "tmpl.fluidic.pump",
        parameters: ["head_limit_m", "flow_target_l_min", "efficiency_target"],
        stateVariables: ["shaft_speed_rpm", "head_margin", "efficiency_ratio"],
        failureModes: ["cavitation", "seal_failure", "under_delivery"]
      },
      {
        key: "valve_bank",
        subsystemKey: "distribution",
        name: "Valve Bank",
        templateId: "tmpl.fluidic.valve",
        parameters: ["valve_response_ms", "pressure_limit_bar"],
        stateVariables: ["opening_ratio", "response_latency_ms", "stiction_score"],
        failureModes: ["stiction", "leakage", "stuck_open"]
      },
      {
        key: "pipe_network",
        subsystemKey: "distribution",
        name: "Pipe Network",
        templateId: "tmpl.fluidic.network",
        parameters: ["pressure_drop_limit_bar", "network_volume_l"],
        stateVariables: ["pressure_drop_bar", "flow_balance", "entrained_air_ratio"],
        failureModes: ["pressure_loss", "leak", "air_ingress"]
      },
      {
        key: "thermal_exchanger",
        subsystemKey: "thermal",
        name: "Thermal Exchanger",
        templateId: "tmpl.thermal",
        parameters: ["thermal_limit_c", "heat_flux_w", "cooldown_window_s"],
        stateVariables: ["delta_t_c", "cooling_margin", "exchange_efficiency"],
        failureModes: ["overtemperature", "cooling_loss", "thermal_runaway"]
      },
      {
        key: "control_interlock",
        subsystemKey: "control",
        name: "Control and Interlock",
        templateId: "tmpl.control.system",
        parameters: ["sample_time_ms", "control_bandwidth_hz"],
        stateVariables: ["control_error", "setpoint_tracking", "fail_safe_state"],
        failureModes: ["instability", "overshoot", "recovery_delay"]
      },
      {
        key: "leak_monitor",
        subsystemKey: "reliability",
        name: "Leak and Failure Monitor",
        templateId: "tmpl.fluidic.leak",
        parameters: ["leak_threshold_l_min", "detection_latency_s"],
        stateVariables: ["leak_probability", "coverage_ratio", "alarm_latency_s"],
        failureModes: ["micro_leak", "burst", "sensor_blind_spot"]
      }
    ],
    interfaces: [
      { name: "flow_command", from: "control_interlock", to: "pump_train", kind: "control" },
      { name: "flow_distribution", from: "pump_train", to: "pipe_network", kind: "flow" },
      { name: "flow_regulation", from: "valve_bank", to: "pipe_network", kind: "flow" },
      { name: "pressure_feedback", from: "pipe_network", to: "control_interlock", kind: "feedback" },
      { name: "reliability_signal", from: "leak_monitor", to: "control_interlock", kind: "safety" },
      { name: "thermal_feedback", from: "thermal_exchanger", to: "control_interlock", kind: "feedback" }
    ],
    kpis: [
      { key: "flow_stability", name: "Flow Stability", unit: "ratio", metricKey: "flow", threshold: 0.79, relevantScenarioTypes: ["nominal_operation", "boundary_conditions", "parameter_sweep"] },
      { key: "pressure_margin", name: "Pressure Margin", unit: "ratio", metricKey: "pressure", threshold: 0.78, relevantScenarioTypes: ["stress_overload", "boundary_conditions"] },
      { key: "thermal_efficiency", name: "Thermal Efficiency", unit: "ratio", metricKey: "thermal", threshold: 0.74, relevantScenarioTypes: ["nominal_operation", "stress_overload", "component_degradation"] },
      { key: "leak_detection_coverage", name: "Leak Detection Coverage", unit: "ratio", metricKey: "safety", threshold: 0.8, relevantScenarioTypes: ["fault_injection", "component_degradation", "safety_failover"] }
    ],
    gates: [
      { key: "flow_gate", name: "Flow Gate", kpiKey: "flow_stability", threshold: 0.79, severity: "high" },
      { key: "pressure_gate", name: "Pressure Gate", kpiKey: "pressure_margin", threshold: 0.78, severity: "high" },
      { key: "thermal_gate", name: "Thermal Gate", kpiKey: "thermal_efficiency", threshold: 0.74, severity: "medium" },
      { key: "reliability_gate", name: "Reliability Gate", kpiKey: "leak_detection_coverage", threshold: 0.8, severity: "critical" }
    ],
    requirements: [
      "The system shall remain within flow and pressure margins across boundary and stress scenarios.",
      "Control and interlocks must detect leaks, unstable flow and unsafe thermal drift.",
      "Evidence must trace hydraulic scenarios to resulting pass/fail gates."
    ],
    defaultAssumptions: [
      "Full CFD is deferred to a reduced-order flow network adapter in this kernel.",
      "Valve and pipe roughness parameters are inferred from domain defaults until measured data exists."
    ]
  },
  vehicle_systems: {
    id: "vehicle_systems",
    label: "Vehicle Systems",
    keywords: ["vehicle", "battery", "powertrain", "brake", "braking", "thermal loop", "range", "wheel", "failover", "drive cycle"],
    subsystems: [
      { key: "powertrain", name: "Powertrain", description: "Torque generation and energy conversion." },
      { key: "thermal", name: "Battery and Thermal Loop", description: "Thermal safety and energy envelope." },
      { key: "safety", name: "Safety and Braking", description: "Brake, failover and safety supervision." },
      { key: "control", name: "Supervisory Control", description: "Vehicle state management and arbitration." },
      { key: "observability", name: "Observability", description: "Sensor fusion and validation coverage." }
    ],
    components: [
      {
        key: "powertrain_core",
        subsystemKey: "powertrain",
        name: "Powertrain Core",
        templateId: "tmpl.vehicle.powertrain",
        parameters: ["torque_nm", "efficiency_target", "range_target_km"],
        stateVariables: ["torque_delivery", "regen_ratio", "energy_use_wh_km"],
        failureModes: ["torque_drop", "regen_loss", "thermal_limit"]
      },
      {
        key: "battery_thermal_loop",
        subsystemKey: "thermal",
        name: "Battery Thermal Loop",
        templateId: "tmpl.thermal",
        parameters: ["thermal_limit_c", "heat_flux_w", "cooldown_window_s"],
        stateVariables: ["pack_temp_c", "cooling_margin", "derating_ratio"],
        failureModes: ["overtemperature", "thermal_runaway", "cooling_loss"]
      },
      {
        key: "braking_controller",
        subsystemKey: "safety",
        name: "Braking and Safety Controller",
        templateId: "tmpl.control.safety",
        parameters: ["trip_threshold", "interlock_response_ms"],
        stateVariables: ["brake_response_ms", "stability_state", "safe_stop_readiness"],
        failureModes: ["trip_failure", "unsafe_state", "failover_gap"]
      },
      {
        key: "supervisory_control",
        subsystemKey: "control",
        name: "Supervisory Control",
        templateId: "tmpl.control.system",
        parameters: ["sample_time_ms", "control_bandwidth_hz"],
        stateVariables: ["state_estimation_error", "mode_switch_latency_ms", "recovery_time_s"],
        failureModes: ["instability", "overshoot", "recovery_delay"]
      },
      {
        key: "sensor_fusion",
        subsystemKey: "observability",
        name: "Sensor Fusion and Telemetry",
        templateId: "tmpl.telemetry",
        parameters: ["sampling_rate_hz", "retention_window_s"],
        stateVariables: ["sensor_agreement", "telemetry_health", "blind_window_ratio"],
        failureModes: ["telemetry_drop", "timestamp_drift", "blind_window"]
      },
      {
        key: "reliability_observer",
        subsystemKey: "observability",
        name: "Reliability Observer",
        templateId: "tmpl.verification.reference",
        parameters: ["coverage_target", "reference_baseline"],
        stateVariables: ["coverage_ratio", "fault_observability", "oracle_match_ratio"],
        failureModes: ["coverage_gap", "oracle_mismatch", "audit_hole"]
      }
    ],
    interfaces: [
      { name: "torque_request", from: "supervisory_control", to: "powertrain_core", kind: "control" },
      { name: "thermal_feedback", from: "battery_thermal_loop", to: "supervisory_control", kind: "feedback" },
      { name: "brake_guard", from: "braking_controller", to: "supervisory_control", kind: "safety" },
      { name: "vehicle_telemetry", from: "sensor_fusion", to: "reliability_observer", kind: "telemetry" },
      { name: "safety_trace", from: "reliability_observer", to: "braking_controller", kind: "observation" }
    ],
    kpis: [
      { key: "range_efficiency", name: "Range Efficiency", unit: "ratio", metricKey: "efficiency", threshold: 0.77, relevantScenarioTypes: ["nominal_operation", "parameter_sweep", "stress_overload"] },
      { key: "brake_response", name: "Brake Response", unit: "ratio", metricKey: "safety", threshold: 0.82, relevantScenarioTypes: ["boundary_conditions", "fault_injection", "safety_failover"] },
      { key: "thermal_safety", name: "Thermal Safety", unit: "ratio", metricKey: "thermal", threshold: 0.8, relevantScenarioTypes: ["stress_overload", "component_degradation", "safety_failover"] },
      { key: "failover_integrity", name: "Failover Integrity", unit: "ratio", metricKey: "reliability", threshold: 0.8, relevantScenarioTypes: ["fault_injection", "control_ablation", "safety_failover"] }
    ],
    gates: [
      { key: "range_gate", name: "Range Gate", kpiKey: "range_efficiency", threshold: 0.77, severity: "medium" },
      { key: "brake_gate", name: "Brake Gate", kpiKey: "brake_response", threshold: 0.82, severity: "critical" },
      { key: "thermal_gate", name: "Thermal Gate", kpiKey: "thermal_safety", threshold: 0.8, severity: "critical" },
      { key: "failover_gate", name: "Failover Gate", kpiKey: "failover_integrity", threshold: 0.8, severity: "critical" }
    ],
    requirements: [
      "The vehicle subsystem shall preserve braking and failover integrity during boundary and injected fault scenarios.",
      "Thermal safety and range efficiency shall remain auditable across drive-cycle perturbations.",
      "Telemetry and review decisions must remain traceable to gates and solver bindings."
    ],
    defaultAssumptions: [
      "Vehicle dynamics are reduced to subsystem-level validation rather than full multi-body simulation in this kernel.",
      "Drive-cycle coverage is represented with template scenarios until project-specific traces are uploaded."
    ]
  },
  materials_chemistry: {
    id: "materials_chemistry",
    label: "Materials and Chemistry Systems",
    keywords: ["chemistry", "chemical", "reaction", "reactor", "diffusion", "barrier", "coating", "polymer", "formulation", "rheology", "adsorption", "surface"],
    subsystems: [
      { key: "reaction_core", name: "Reaction Core", description: "Reaction pathway, conversion and residence behavior." },
      { key: "transport", name: "Transport and Barrier", description: "Diffusion, permeation and transport limitations." },
      { key: "formulation", name: "Formulation and Rheology", description: "Rheology, texture and viscoelastic response." },
      { key: "surface", name: "Surface Interaction", description: "Adsorption and surface affinity behavior." }
    ],
    components: [
      {
        key: "reactor_pathway",
        subsystemKey: "reaction_core",
        name: "Reactor Pathway",
        templateId: "tmpl.chemistry.reaction",
        parameters: ["reaction_rate_constant", "reactant_concentration", "residence_time_s", "target_conversion"],
        stateVariables: ["conversion_ratio", "residence_margin", "reaction_flux"],
        failureModes: ["under_conversion", "residence_time_loss", "reaction_stall"]
      },
      {
        key: "barrier_layer",
        subsystemKey: "transport",
        name: "Barrier Layer",
        templateId: "tmpl.chemistry.reaction",
        parameters: ["diffusion_coefficient_m2_s", "barrier_thickness_um", "exposure_time_h", "retention_target"],
        stateVariables: ["penetration_fraction", "retention_ratio", "transport_index"],
        failureModes: ["transport_bottleneck", "barrier_breakthrough", "retention_loss"]
      },
      {
        key: "formulation_matrix",
        subsystemKey: "formulation",
        name: "Formulation Matrix",
        templateId: "tmpl.chemistry.formulation",
        parameters: ["shear_rate_s", "viscosity_pa_s", "elastic_modulus_kpa", "spreadability_target"],
        stateVariables: ["apparent_viscosity", "spreadability", "recovery_ratio"],
        failureModes: ["phase_instability", "viscosity_drift", "spread_loss"]
      },
      {
        key: "surface_phase",
        subsystemKey: "surface",
        name: "Surface Phase",
        templateId: "tmpl.chemistry.formulation",
        parameters: ["adsorption_capacity_mg_g", "surface_area_m2_g", "contaminant_concentration_mg_l", "retention_target"],
        stateVariables: ["surface_coverage", "uptake_capacity", "loading_ratio"],
        failureModes: ["surface_saturation", "adsorption_loss", "coverage_drop"]
      }
    ],
    interfaces: [
      { name: "reaction_transport_coupling", from: "reactor_pathway", to: "barrier_layer", kind: "transport" },
      { name: "formulation_transport_feedback", from: "formulation_matrix", to: "barrier_layer", kind: "material" },
      { name: "surface_exchange", from: "surface_phase", to: "formulation_matrix", kind: "surface" }
    ],
    kpis: [
      { key: "conversion_quality", name: "Conversion Quality", unit: "ratio", metricKey: "performance", threshold: 0.78, relevantScenarioTypes: ["nominal_operation", "boundary_conditions", "parameter_sweep"] },
      { key: "transport_margin", name: "Transport Margin", unit: "ratio", metricKey: "safety", threshold: 0.76, relevantScenarioTypes: ["stress_overload", "component_degradation"] },
      { key: "formulation_stability", name: "Formulation Stability", unit: "ratio", metricKey: "quality", threshold: 0.77, relevantScenarioTypes: ["nominal_operation", "component_degradation", "stress_overload"] },
      { key: "surface_consistency", name: "Surface Consistency", unit: "ratio", metricKey: "reliability", threshold: 0.74, relevantScenarioTypes: ["fault_injection", "parameter_sweep"] }
    ],
    gates: [
      { key: "conversion_gate", name: "Conversion Gate", kpiKey: "conversion_quality", threshold: 0.78, severity: "high" },
      { key: "transport_gate", name: "Transport Gate", kpiKey: "transport_margin", threshold: 0.76, severity: "high" },
      { key: "stability_gate", name: "Stability Gate", kpiKey: "formulation_stability", threshold: 0.77, severity: "medium" },
      { key: "surface_gate", name: "Surface Gate", kpiKey: "surface_consistency", threshold: 0.74, severity: "medium" }
    ],
    requirements: [
      "The formulation shall preserve conversion and transport margin across nominal and stressed conditions.",
      "Rheology and surface interaction shall remain within validated quality windows.",
      "Evidence must connect formulation behavior, transport screening and resulting quality gates."
    ],
    defaultAssumptions: [
      "Reaction and transport are represented with reduced-order kinetics until lab-calibrated models are available.",
      "Surface interaction is screened with adsorption proxies before richer characterization data is attached."
    ]
  },
  cosmetic_science: {
    id: "cosmetic_science",
    label: "Cosmetic and Personal Care Science",
    keywords: ["cosmetic", "cosmetics", "skin", "dermal", "cream", "lotion", "serum", "preservative", "formulation", "stability", "sensory", "challenge test", "personal care"],
    subsystems: [
      { key: "dermal", name: "Dermal Interaction", description: "Exposure, penetration and local retention." },
      { key: "stability", name: "Formulation Stability", description: "Shelf-life, separation and thermal robustness." },
      { key: "preservation", name: "Preservation", description: "Microbial challenge and preservative efficacy." },
      { key: "sensory", name: "Sensory Quality", description: "Texture, uniformity and panel consistency." }
    ],
    components: [
      {
        key: "dermal_barrier",
        subsystemKey: "dermal",
        name: "Dermal Barrier Interaction",
        templateId: "tmpl.cosmetic.dermal",
        parameters: ["skin_diffusion_coeff_cm2_h", "partition_coefficient", "exposure_dose_mg_cm2", "max_systemic_exposure_mg"],
        stateVariables: ["absorbed_dose_mg", "retention_ratio", "penetration_rate"],
        failureModes: ["over_exposure", "barrier_breakthrough", "retention_loss"]
      },
      {
        key: "stability_matrix",
        subsystemKey: "stability",
        name: "Stability Matrix",
        templateId: "tmpl.cosmetic.dermal",
        parameters: ["formulation_viscosity_pa_s", "temperature_cycling_range_c", "shelf_life_months", "separation_limit_fraction"],
        stateVariables: ["separation_index", "viscosity_retention", "thermal_margin"],
        failureModes: ["phase_instability", "stability_loss", "texture_shift"]
      },
      {
        key: "preservation_system",
        subsystemKey: "preservation",
        name: "Preservation System",
        templateId: "tmpl.cosmetic.quality",
        parameters: ["preservative_log_reduction_target", "microbial_load_cfu_ml", "preservative_concentration_pct", "challenge_time_days"],
        stateVariables: ["log_reduction", "challenge_margin", "microbial_escape_risk"],
        failureModes: ["microbial_escape", "challenge_failure", "preservation_gap"]
      },
      {
        key: "sensory_panel_reference",
        subsystemKey: "sensory",
        name: "Sensory Panel Reference",
        templateId: "tmpl.cosmetic.quality",
        parameters: ["fragrance_intensity_target", "texture_uniformity_target", "panel_variability", "shelf_life_months"],
        stateVariables: ["consistency_score", "panel_variance", "texture_uniformity"],
        failureModes: ["panel_rejection", "texture_inconsistency", "fragrance_drift"]
      }
    ],
    interfaces: [
      { name: "stability_to_dermal", from: "stability_matrix", to: "dermal_barrier", kind: "material" },
      { name: "preservation_to_stability", from: "preservation_system", to: "stability_matrix", kind: "quality" },
      { name: "sensory_feedback", from: "sensory_panel_reference", to: "stability_matrix", kind: "observation" }
    ],
    kpis: [
      { key: "dermal_safety", name: "Dermal Safety", unit: "ratio", metricKey: "safety", threshold: 0.8, relevantScenarioTypes: ["nominal_operation", "boundary_conditions", "stress_overload"] },
      { key: "stability_score", name: "Stability Score", unit: "ratio", metricKey: "stability", threshold: 0.77, relevantScenarioTypes: ["component_degradation", "stress_overload", "parameter_sweep"] },
      { key: "preservation_effectiveness", name: "Preservation Effectiveness", unit: "ratio", metricKey: "efficacy", threshold: 0.78, relevantScenarioTypes: ["fault_injection", "nominal_operation"] },
      { key: "sensory_consistency", name: "Sensory Consistency", unit: "ratio", metricKey: "quality", threshold: 0.76, relevantScenarioTypes: ["nominal_operation", "parameter_sweep", "component_degradation"] }
    ],
    gates: [
      { key: "dermal_gate", name: "Dermal Gate", kpiKey: "dermal_safety", threshold: 0.8, severity: "critical" },
      { key: "stability_gate", name: "Stability Gate", kpiKey: "stability_score", threshold: 0.77, severity: "high" },
      { key: "preservation_gate", name: "Preservation Gate", kpiKey: "preservation_effectiveness", threshold: 0.78, severity: "high" },
      { key: "sensory_gate", name: "Sensory Gate", kpiKey: "sensory_consistency", threshold: 0.76, severity: "medium" }
    ],
    requirements: [
      "The formulation shall remain stable and within dermal safety margins across intended use conditions.",
      "Preservative efficacy and sensory consistency shall remain auditable over the validated shelf-life window.",
      "Evidence must connect challenge tests, sensory observations and resulting release gates."
    ],
    defaultAssumptions: [
      "Dermal transport is screened with reduced-order exposure proxies until validated lab data is attached.",
      "Sensory consistency starts as panel-derived evidence and should later absorb governed observation bundles."
    ]
  },
  space_cosmology: {
    id: "space_cosmology",
    label: "Space and Cosmology Systems",
    keywords: ["orbit", "orbital", "space", "satellite", "telescope", "observation", "cosmology", "stellar", "astronomy", "astrophysics", "hubble", "survey", "calibration"],
    subsystems: [
      { key: "mission_geometry", name: "Mission Geometry", description: "Orbital geometry and dynamic margin." },
      { key: "observation", name: "Observation Pipeline", description: "Calibration, SNR and data reduction." },
      { key: "stellar_models", name: "Stellar Models", description: "Reduced-order stellar structure and luminosity screening." },
      { key: "inference", name: "Cosmology Inference", description: "Parameter estimation and fit quality." }
    ],
    components: [
      {
        key: "orbital_frame",
        subsystemKey: "mission_geometry",
        name: "Orbital Frame",
        templateId: "tmpl.space.orbit",
        parameters: ["semi_major_axis_km", "eccentricity", "delta_v_budget_m_s", "mission_duration_h"],
        stateVariables: ["orbital_period_min", "geometry_margin", "eccentricity_drift"],
        failureModes: ["geometry_margin_loss", "eccentricity_growth", "mission_window_slip"]
      },
      {
        key: "observation_chain",
        subsystemKey: "observation",
        name: "Observation Chain",
        templateId: "tmpl.space.orbit",
        parameters: ["sensor_noise_arcsec", "calibration_reference_count", "exposure_time_s", "signal_to_noise_target"],
        stateVariables: ["snr", "residual_bias", "calibration_margin"],
        failureModes: ["tracking_bias", "calibration_drift", "noise_floor_rise"]
      },
      {
        key: "stellar_screen",
        subsystemKey: "stellar_models",
        name: "Stellar Screening Model",
        templateId: "tmpl.space.inference",
        parameters: ["stellar_mass_solar", "metallicity_fraction", "luminosity_target_lsun", "age_gyr"],
        stateVariables: ["predicted_luminosity", "evolutionary_coherence", "model_residual"],
        failureModes: ["model_mismatch", "luminosity_bias", "screening_drift"]
      },
      {
        key: "cosmology_fit",
        subsystemKey: "inference",
        name: "Cosmology Fit Engine",
        templateId: "tmpl.space.inference",
        parameters: ["hubble_constant_km_s_mpc", "matter_density_omega_m", "dark_energy_density_omega_lambda", "target_reduced_chi2"],
        stateVariables: ["reduced_chi2", "flatness_deviation", "fit_margin"],
        failureModes: ["fit_divergence", "inference_bias", "parameter_instability"]
      }
    ],
    interfaces: [
      { name: "geometry_to_observation", from: "orbital_frame", to: "observation_chain", kind: "observation" },
      { name: "observation_to_inference", from: "observation_chain", to: "cosmology_fit", kind: "data" },
      { name: "stellar_to_inference", from: "stellar_screen", to: "cosmology_fit", kind: "model" }
    ],
    kpis: [
      { key: "geometry_integrity", name: "Geometry Integrity", unit: "ratio", metricKey: "performance", threshold: 0.76, relevantScenarioTypes: ["nominal_operation", "boundary_conditions"] },
      { key: "observation_quality", name: "Observation Quality", unit: "ratio", metricKey: "quality", threshold: 0.8, relevantScenarioTypes: ["nominal_operation", "parameter_sweep", "component_degradation"] },
      { key: "stellar_screening_quality", name: "Stellar Screening Quality", unit: "ratio", metricKey: "efficacy", threshold: 0.74, relevantScenarioTypes: ["parameter_sweep", "stress_overload"] },
      { key: "inference_reliability", name: "Inference Reliability", unit: "ratio", metricKey: "reliability", threshold: 0.74, relevantScenarioTypes: ["fault_injection", "component_degradation", "parameter_sweep"] }
    ],
    gates: [
      { key: "geometry_gate", name: "Geometry Gate", kpiKey: "geometry_integrity", threshold: 0.76, severity: "high" },
      { key: "observation_gate", name: "Observation Gate", kpiKey: "observation_quality", threshold: 0.8, severity: "high" },
      { key: "stellar_gate", name: "Stellar Gate", kpiKey: "stellar_screening_quality", threshold: 0.74, severity: "medium" },
      { key: "inference_gate", name: "Inference Gate", kpiKey: "inference_reliability", threshold: 0.74, severity: "high" }
    ],
    requirements: [
      "Orbital geometry and observation quality shall remain traceable across mission and calibration perturbations.",
      "Stellar screening and cosmology fit quality shall remain evidence-backed and reviewable.",
      "Observation artifacts, model assumptions and inference gates must remain linked in the validation report."
    ],
    defaultAssumptions: [
      "Orbital and cosmology paths start as reduced-order screening and should absorb governed survey data over time.",
      "Observation quality is treated as an artifact-heavy validation problem before stronger external scientific backends are integrated."
    ]
  },
  general_systems: {
    id: "general_systems",
    label: "General MVP Systems",
    keywords: ["app", "service", "platform", "workflow", "automation", "saas", "mvp", "startup", "marketplace", "customer", "onboarding", "subscription", "booking"],
    subsystems: [
      { key: "workflow", name: "Workflow Core", description: "Primary user or operator workflow." },
      { key: "runtime", name: "Service Runtime", description: "Runtime capacity, latency and service path." },
      { key: "governance", name: "Governance and Guardrails", description: "Policy, security and compliance controls." },
      { key: "observability", name: "Observability", description: "Telemetry, usage signals and auditability." }
    ],
    components: [
      {
        key: "workflow_core",
        subsystemKey: "workflow",
        name: "Workflow Core",
        templateId: "tmpl.business.workflow",
        parameters: ["arrival_rate_per_hour", "service_rate_per_hour", "sla_hours", "rework_rate"],
        stateVariables: ["cycle_time_h", "handoff_rate", "completion_ratio"],
        failureModes: ["cycle_time_breach", "handoff_delay", "workflow_drift"]
      },
      {
        key: "service_runtime",
        subsystemKey: "runtime",
        name: "Service Runtime",
        templateId: "tmpl.business.service",
        parameters: ["requests_per_second", "service_time_ms", "replica_count", "latency_slo_ms"],
        stateVariables: ["utilization_ratio", "latency_ms", "replica_health"],
        failureModes: ["latency_spike", "capacity_exhaustion", "availability_drop"]
      },
      {
        key: "policy_guardrail",
        subsystemKey: "governance",
        name: "Policy Guardrail",
        templateId: "tmpl.business.policy",
        parameters: ["policy_count", "control_coverage", "threat_level", "violation_tolerance"],
        stateVariables: ["policy_coverage", "risk_exposure", "violation_count"],
        failureModes: ["policy_gap", "threat_exposure", "compliance_drift"]
      },
      {
        key: "usage_telemetry",
        subsystemKey: "observability",
        name: "Usage Telemetry",
        templateId: "tmpl.telemetry",
        parameters: ["sampling_rate_hz", "retention_window_s"],
        stateVariables: ["event_capture_ratio", "blind_window_ms", "retention_health"],
        failureModes: ["telemetry_drop", "timestamp_drift", "blind_window"]
      }
    ],
    interfaces: [
      { name: "workflow_to_runtime", from: "workflow_core", to: "service_runtime", kind: "execution" },
      { name: "runtime_to_policy", from: "service_runtime", to: "policy_guardrail", kind: "governance" },
      { name: "runtime_to_telemetry", from: "service_runtime", to: "usage_telemetry", kind: "telemetry" },
      { name: "workflow_to_telemetry", from: "workflow_core", to: "usage_telemetry", kind: "telemetry" }
    ],
    kpis: [
      { key: "workflow_efficiency", name: "Workflow Efficiency", unit: "ratio", metricKey: "performance", threshold: 0.78, relevantScenarioTypes: ["nominal_operation", "boundary_conditions", "parameter_sweep"] },
      { key: "runtime_latency", name: "Runtime Latency", unit: "ratio", metricKey: "latency", threshold: 0.76, relevantScenarioTypes: ["nominal_operation", "stress_overload", "control_ablation"] },
      { key: "governance_quality", name: "Governance Quality", unit: "ratio", metricKey: "quality", threshold: 0.75, relevantScenarioTypes: ["fault_injection", "boundary_conditions", "safety_failover"] },
      { key: "service_reliability", name: "Service Reliability", unit: "ratio", metricKey: "reliability", threshold: 0.78, relevantScenarioTypes: ["fault_injection", "component_degradation", "safety_failover"] }
    ],
    gates: [
      { key: "workflow_gate", name: "Workflow Gate", kpiKey: "workflow_efficiency", threshold: 0.78, severity: "high" },
      { key: "latency_gate", name: "Latency Gate", kpiKey: "runtime_latency", threshold: 0.76, severity: "high" },
      { key: "governance_gate", name: "Governance Gate", kpiKey: "governance_quality", threshold: 0.75, severity: "medium" },
      { key: "reliability_gate", name: "Reliability Gate", kpiKey: "service_reliability", threshold: 0.78, severity: "critical" }
    ],
    requirements: [
      "The MVP shall support one primary workflow with measurable latency and completion targets.",
      "Governance and policy guardrails must remain visible on the critical path.",
      "Telemetry, KPIs and validation evidence must remain traceable for the first pilot release."
    ],
    defaultAssumptions: [
      "The MVP is intentionally narrowed to one workflow and one service path.",
      "Usage telemetry and policy coverage are treated as first-class launch constraints."
    ]
  }
};
