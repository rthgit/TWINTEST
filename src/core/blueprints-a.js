export const domainBlueprintsA = {
  compute_semiconductor: {
    id: "compute_semiconductor",
    label: "Compute / Semiconductor Systems",
    keywords: ["chip", "semiconductor", "compute", "tile", "latency", "scheduler", "runtime", "verification", "silicon", "telemetry", "rth", "imc"],
    subsystems: [
      { key: "execution_fabric", name: "Execution Fabric", description: "Compute tiles, dispatch and execution fabric." },
      { key: "thermal_envelope", name: "Thermal Envelope", description: "Thermal containment and heat dissipation." },
      { key: "runtime_control", name: "Runtime Control", description: "Scheduling, dispatch and supervisory control." },
      { key: "observability", name: "Observability", description: "Verification, telemetry and audit trail." }
    ],
    components: [
      {
        key: "compute_tile_cluster",
        subsystemKey: "execution_fabric",
        name: "Compute Tile Cluster",
        templateId: "tmpl.compute.tile",
        parameters: ["throughput_target", "power_budget_watts", "latency_budget_ms"],
        stateVariables: ["tile_temperature_c", "queue_depth", "utilization_ratio"],
        failureModes: ["tile_fault", "latency_regression", "thermal_throttle"]
      },
      {
        key: "runtime_scheduler",
        subsystemKey: "runtime_control",
        name: "Runtime Scheduler",
        templateId: "tmpl.compute.scheduler",
        parameters: ["dispatch_window_ms", "queue_depth", "priority_policy"],
        stateVariables: ["backlog", "dispatch_rate", "preemption_count"],
        failureModes: ["runtime_backpressure", "starvation", "deadlock_risk"]
      },
      {
        key: "thermal_plane",
        subsystemKey: "thermal_envelope",
        name: "Thermal Plane",
        templateId: "tmpl.thermal",
        parameters: ["thermal_limit_c", "heat_flux_w", "cooldown_window_s"],
        stateVariables: ["junction_temp_c", "cooling_margin", "fan_budget"],
        failureModes: ["overtemperature", "cooling_loss", "thermal_runaway"]
      },
      {
        key: "verification_probe",
        subsystemKey: "observability",
        name: "Verification Probe",
        templateId: "tmpl.verification.reference",
        parameters: ["coverage_target", "reference_baseline"],
        stateVariables: ["coverage_ratio", "oracle_match_ratio", "audit_gaps"],
        failureModes: ["coverage_gap", "oracle_mismatch", "audit_hole"]
      },
      {
        key: "telemetry_bus",
        subsystemKey: "observability",
        name: "Telemetry Bus",
        templateId: "tmpl.telemetry",
        parameters: ["sampling_rate_hz", "retention_window_s"],
        stateVariables: ["stream_health", "drop_rate", "timestamp_skew_ms"],
        failureModes: ["telemetry_drop", "timestamp_drift", "blind_window"]
      }
    ],
    interfaces: [
      { name: "dispatch_control_loop", from: "runtime_scheduler", to: "compute_tile_cluster", kind: "control" },
      { name: "thermal_feedback", from: "thermal_plane", to: "runtime_scheduler", kind: "feedback" },
      { name: "execution_trace", from: "compute_tile_cluster", to: "telemetry_bus", kind: "telemetry" },
      { name: "coverage_stream", from: "verification_probe", to: "telemetry_bus", kind: "observation" }
    ],
    kpis: [
      { key: "quality_score", name: "Quality Score", unit: "ratio", metricKey: "quality", threshold: 0.82, relevantScenarioTypes: ["nominal_operation", "boundary_conditions"] },
      { key: "energy_efficiency", name: "Energy Efficiency", unit: "ratio", metricKey: "efficiency", threshold: 0.76, relevantScenarioTypes: ["stress_overload", "parameter_sweep"] },
      { key: "latency_budget", name: "Latency Budget", unit: "ratio", metricKey: "latency", threshold: 0.78, relevantScenarioTypes: ["nominal_operation", "control_ablation"] },
      { key: "correction_burden", name: "Correction Burden", unit: "ratio", metricKey: "reliability", threshold: 0.72, relevantScenarioTypes: ["fault_injection", "component_degradation", "safety_failover"] }
    ],
    gates: [
      { key: "quality_gate", name: "Quality Gate", kpiKey: "quality_score", threshold: 0.82, severity: "high" },
      { key: "energy_gate", name: "Energy Gate", kpiKey: "energy_efficiency", threshold: 0.76, severity: "medium" },
      { key: "latency_gate", name: "Latency Gate", kpiKey: "latency_budget", threshold: 0.78, severity: "high" },
      { key: "resilience_gate", name: "Resilience Gate", kpiKey: "correction_burden", threshold: 0.72, severity: "critical" }
    ],
    requirements: [
      "The architecture shall sustain quality targets under nominal and boundary conditions.",
      "The runtime shall remain within latency and backlog guardrails under scheduler perturbations.",
      "The platform must retain auditability of telemetry, solver choice and validation evidence."
    ],
    defaultAssumptions: [
      "Physical floorplan detail is inferred from high-level compute topology.",
      "Thermal coupling is approximated with a thermal network until richer solver evidence is provided."
    ]
  },
  mechatronics: {
    id: "mechatronics",
    label: "Mechatronics Systems",
    keywords: ["motor", "drive", "washing", "lavatrice", "drum", "actuator", "sensor", "vibration", "noise", "controller", "safety", "valve", "pump"],
    subsystems: [
      { key: "actuation", name: "Actuation", description: "Electrical drive and torque delivery." },
      { key: "mechanics", name: "Mechanics", description: "Drum, shaft and moving mechanical assemblies." },
      { key: "hydraulics", name: "Hydraulic Loop", description: "Water inlet, outlet and fluid management." },
      { key: "control", name: "Control and Safety", description: "Controller, safety and interlock logic." },
      { key: "observability", name: "Observability", description: "Vibration, noise and telemetry." }
    ],
    components: [
      {
        key: "motor_drive",
        subsystemKey: "actuation",
        name: "Motor and Drive",
        templateId: "tmpl.electrical.drive",
        parameters: ["voltage_v", "current_limit_a", "torque_nm"],
        stateVariables: ["shaft_speed_rpm", "motor_temp_c", "current_draw_a"],
        failureModes: ["overcurrent", "stall", "brownout"]
      },
      {
        key: "drum_mechanics",
        subsystemKey: "mechanics",
        name: "Drum and Mechanics",
        templateId: "tmpl.mechanical.component",
        parameters: ["mass_kg", "rpm_target", "torque_nm"],
        stateVariables: ["load_balance_ratio", "drum_speed_rpm", "bearing_health"],
        failureModes: ["imbalance", "wear", "shaft_slip"]
      },
      {
        key: "hydraulic_loop",
        subsystemKey: "hydraulics",
        name: "Hydraulic Inflow and Outflow",
        templateId: "tmpl.fluidic.loop",
        parameters: ["flow_target_l_min", "pressure_limit_bar"],
        stateVariables: ["fill_rate", "drain_rate", "pressure_margin"],
        failureModes: ["flow_instability", "blockage", "cavitation"]
      },
      {
        key: "thermal_envelope",
        subsystemKey: "control",
        name: "Thermal Envelope",
        templateId: "tmpl.thermal",
        parameters: ["thermal_limit_c", "heat_flux_w", "cooldown_window_s"],
        stateVariables: ["housing_temp_c", "cooldown_margin", "heater_state"],
        failureModes: ["overtemperature", "thermal_runaway", "cooling_loss"]
      },
      {
        key: "vibration_monitor",
        subsystemKey: "observability",
        name: "Vibration and Noise Monitor",
        templateId: "tmpl.mechanical.vibration",
        parameters: ["vibration_limit_mm_s", "resonance_band_hz"],
        stateVariables: ["vibration_rms", "noise_level_db", "resonance_risk"],
        failureModes: ["resonance", "bearing_wear", "noise_spike"]
      },
      {
        key: "controller_safety",
        subsystemKey: "control",
        name: "Controller and Safety",
        templateId: "tmpl.control.safety",
        parameters: ["trip_threshold", "interlock_response_ms"],
        stateVariables: ["control_state", "trip_state", "recovery_timer_ms"],
        failureModes: ["unsafe_state", "trip_failure", "failover_gap"]
      }
    ],
    interfaces: [
      { name: "torque_delivery", from: "motor_drive", to: "drum_mechanics", kind: "energy" },
      { name: "load_feedback", from: "drum_mechanics", to: "controller_safety", kind: "feedback" },
      { name: "hydraulic_state", from: "hydraulic_loop", to: "controller_safety", kind: "telemetry" },
      { name: "vibration_alerts", from: "vibration_monitor", to: "controller_safety", kind: "safety" },
      { name: "thermal_feedback", from: "thermal_envelope", to: "controller_safety", kind: "safety" }
    ],
    kpis: [
      { key: "cycle_completion", name: "Cycle Completion", unit: "ratio", metricKey: "performance", threshold: 0.8, relevantScenarioTypes: ["nominal_operation", "boundary_conditions", "parameter_sweep"] },
      { key: "energy_use", name: "Energy Use", unit: "ratio", metricKey: "efficiency", threshold: 0.74, relevantScenarioTypes: ["nominal_operation", "stress_overload"] },
      { key: "vibration_margin", name: "Vibration Margin", unit: "ratio", metricKey: "vibration", threshold: 0.75, relevantScenarioTypes: ["stress_overload", "component_degradation", "boundary_conditions"] },
      { key: "fault_resilience", name: "Fault Resilience", unit: "ratio", metricKey: "safety", threshold: 0.78, relevantScenarioTypes: ["fault_injection", "control_ablation", "safety_failover"] }
    ],
    gates: [
      { key: "cycle_gate", name: "Cycle Gate", kpiKey: "cycle_completion", threshold: 0.8, severity: "high" },
      { key: "energy_gate", name: "Energy Gate", kpiKey: "energy_use", threshold: 0.74, severity: "medium" },
      { key: "vibration_gate", name: "Vibration Gate", kpiKey: "vibration_margin", threshold: 0.75, severity: "high" },
      { key: "safety_gate", name: "Safety Gate", kpiKey: "fault_resilience", threshold: 0.78, severity: "critical" }
    ],
    requirements: [
      "The machine shall complete the operational cycle within allowed energy and vibration limits.",
      "The control layer must detect and contain unsafe hydraulic, thermal or imbalance conditions.",
      "Validation evidence shall connect scenarios, safety gates and resulting telemetry."
    ],
    defaultAssumptions: [
      "Load distribution and drum imbalance are represented with template defaults until measured data is provided.",
      "Hydraulic behavior is approximated using a reduced-order flow network."
    ]
  }
};
