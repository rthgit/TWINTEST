import { solverCategoryCatalog } from "./solver-category-catalog.js";
import { solverSectorCatalog } from "./solver-sector-catalog.js";

const SUPPORTED_ADAPTER_TYPES = new Set([
  "builtin_solver",
  "artifact_metrics_json",
  "external_process_json"
]);

const SUPPORTED_PRIORITIES = new Set(["p0", "p1", "p2"]);
const SUPPORTED_PHASES = new Set([
  "runtime_ready",
  "artifact_pipeline_now",
  "external_adapter_next",
  "review_gated_externalization"
]);
const SUPPORTED_REVIEW_POLICIES = new Set([
  "standard",
  "human_review_required",
  "regulated_review_required"
]);

function plan(categoryIds, spec) {
  return categoryIds.map((categoryId) => ({
    categoryId,
    ...structuredClone(spec)
  }));
}

const rawRoadmapEntries = [
  ...plan([
    "continuous_time_dynamics",
    "differential_algebraic_systems",
    "state_space_control"
  ], {
    solverFamily: "continuous_system_simulation",
    currentPath: {
      solver: "ode-state-space / state-space-control",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "SUNDIALS",
      adapterType: "external_process_json"
    },
    secondaryTarget: "OpenModelica",
    priority: "p0",
    phase: "external_adapter_next",
    reviewPolicy: "standard",
    evidenceMode: "solver_stdout_json",
    notes: "Core cross-domain path for ODE, DAE and closed-loop control validation."
  }),
  ...plan([
    "discrete_event_control",
    "formal_logic_verification",
    "industrial_safety_interlocks"
  ], {
    solverFamily: "formal_and_discrete_supervision",
    currentPath: {
      solver: "rule-engine / discrete-event-scheduler",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "nuXmv",
      adapterType: "external_process_json"
    },
    secondaryTarget: "artifact-backed safety evidence bundles",
    priority: "p0",
    phase: "external_adapter_next",
    reviewPolicy: "human_review_required",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Safety logic must move from screening rules to formal model checking."
  }),
  ...plan([
    "multibody_dynamics",
    "actuator_dynamics",
    "vehicle_powertrain_dynamics",
    "brake_and_failover_validation"
  ], {
    solverFamily: "multibody_and_vehicle_dynamics",
    currentPath: {
      solver: "multibody-surrogate / powertrain-ode",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "Project Chrono",
      adapterType: "external_process_json"
    },
    secondaryTarget: "OpenModelica",
    priority: "p1",
    phase: "external_adapter_next",
    reviewPolicy: "standard",
    evidenceMode: "solver_stdout_json",
    notes: "Dynamics-heavy validation should converge on time-domain multibody execution."
  }),
  ...plan([
    "structural_static_fem",
    "nonlinear_structural_fem",
    "modal_vibration_analysis"
  ], {
    solverFamily: "structural_fem",
    currentPath: {
      solver: "artifact-backed structural evidence",
      adapterType: "artifact_metrics_json"
    },
    targetPath: {
      solver: "CalculiX",
      adapterType: "external_process_json"
    },
    secondaryTarget: "Elmer",
    priority: "p1",
    phase: "external_adapter_next",
    reviewPolicy: "standard",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Structural categories are live today through governed datasets and should externalize next."
  }),
  ...plan([
    "thermal_rc_networks"
  ], {
    solverFamily: "lumped_thermal_networks",
    currentPath: {
      solver: "thermal-network",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "OpenModelica",
      adapterType: "external_process_json"
    },
    secondaryTarget: "SUNDIALS",
    priority: "p1",
    phase: "external_adapter_next",
    reviewPolicy: "standard",
    evidenceMode: "solver_stdout_json",
    notes: "Thermal RC validation is already executable internally but should align with external model exchange."
  }),
  ...plan([
    "thermofluidic_cfd",
    "fluid_network_simulation",
    "pump_curve_analysis",
    "hydraulic_graph_analysis"
  ], {
    solverFamily: "thermofluidic_and_network_flow",
    currentPath: {
      solver: "fluid-network / cfd-lite",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "OpenFOAM",
      adapterType: "external_process_json"
    },
    secondaryTarget: "artifact-backed bench flow datasets",
    priority: "p1",
    phase: "external_adapter_next",
    reviewPolicy: "standard",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Fluid categories should converge on CFD or governed field data depending the claim."
  }),
  ...plan([
    "electrical_circuit_transient",
    "mixed_signal_drive_control",
    "power_electronics_switching",
    "battery_pack_models"
  ], {
    solverFamily: "electrical_and_power_electronics",
    currentPath: {
      solver: "circuit-state-space / control-loop",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "Xyce",
      adapterType: "external_process_json"
    },
    secondaryTarget: "ngspice",
    priority: "p1",
    phase: "external_adapter_next",
    reviewPolicy: "standard",
    evidenceMode: "solver_stdout_json",
    notes: "Circuit and drive validation should move to dedicated transient solvers once adapter contracts stabilize."
  }),
  ...plan([
    "probabilistic_reliability",
    "uncertainty_quantification"
  ], {
    solverFamily: "uq_and_reliability",
    currentPath: {
      solver: "probabilistic-reliability",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "OpenTURNS",
      adapterType: "external_process_json"
    },
    secondaryTarget: "artifact-backed sampling datasets",
    priority: "p0",
    phase: "external_adapter_next",
    reviewPolicy: "standard",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Reliability and UQ are cross-cutting and should be available as first-class external pipelines."
  }),
  ...plan([
    "telemetry_timeseries_evaluation"
  ], {
    solverFamily: "telemetry_replay_and_evaluation",
    currentPath: {
      solver: "telemetry evidence ingestion",
      adapterType: "artifact_metrics_json"
    },
    targetPath: {
      solver: "telemetry replay and evaluator pipeline",
      adapterType: "artifact_metrics_json"
    },
    secondaryTarget: "timeseries-evaluator",
    priority: "p0",
    phase: "artifact_pipeline_now",
    reviewPolicy: "standard",
    evidenceMode: "workspace_artifact_json",
    notes: "This category is data-first: governed artifact ingestion is the correct current execution path."
  }),
  ...plan([
    "computer_architecture_performance",
    "scheduler_runtime_analysis"
  ], {
    solverFamily: "computer_architecture_and_runtime",
    currentPath: {
      solver: "architectural-surrogate / queueing-simulator",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "gem5",
      adapterType: "external_process_json"
    },
    secondaryTarget: "SST",
    priority: "p0",
    phase: "external_adapter_next",
    reviewPolicy: "standard",
    evidenceMode: "solver_stdout_json",
    notes: "Compute wedge categories should externalize first because the project already has RTH-IMC alignment."
  }),
  ...plan([
    "chip_power_thermal_coanalysis"
  ], {
    solverFamily: "chip_power_thermal_coanalysis",
    currentPath: {
      solver: "thermal-network + architectural-surrogate",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "gem5 trace + OpenModelica co-analysis",
      adapterType: "artifact_metrics_json"
    },
    secondaryTarget: "external_process_json",
    priority: "p0",
    phase: "artifact_pipeline_now",
    reviewPolicy: "standard",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Power-thermal co-analysis is trace-driven and should land first as a governed hybrid pipeline."
  }),
  ...plan([
    "business_process_simulation",
    "workflow_governance_validation"
  ], {
    solverFamily: "business_process_and_workflow_validation",
    currentPath: {
      solver: "business-process-simulator / compliance-workflow-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "workflow engine backend",
      adapterType: "external_process_json"
    },
    secondaryTarget: "artifact-backed workflow traces",
    priority: "p1",
    phase: "external_adapter_next",
    reviewPolicy: "standard",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Operational workflows can run today, but enterprise-grade evidence wants workflow traces and external engines."
  }),
  ...plan([
    "service_capacity_planning",
    "queueing_service_reliability"
  ], {
    solverFamily: "service_capacity_and_queueing",
    currentPath: {
      solver: "service-capacity-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "queueing analysis backend",
      adapterType: "external_process_json"
    },
    secondaryTarget: "artifact-backed service telemetry",
    priority: "p1",
    phase: "external_adapter_next",
    reviewPolicy: "standard",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Capacity planning should bridge synthetic stress to real service traces."
  }),
  ...plan([
    "security_policy_validation"
  ], {
    solverFamily: "policy_and_guardrail_validation",
    currentPath: {
      solver: "security-policy-checker",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "policy-as-code engine",
      adapterType: "external_process_json"
    },
    secondaryTarget: "artifact-backed policy evidence",
    priority: "p1",
    phase: "external_adapter_next",
    reviewPolicy: "human_review_required",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Policy validation should become evidence-backed and replayable against real policy bundles."
  }),
  ...plan([
    "compliance_evidence_evaluation"
  ], {
    solverFamily: "compliance_evidence_pipeline",
    currentPath: {
      solver: "compliance evidence ingestion",
      adapterType: "artifact_metrics_json"
    },
    targetPath: {
      solver: "evidence governance pipeline",
      adapterType: "artifact_metrics_json"
    },
    secondaryTarget: "compliance-workflow-solver",
    priority: "p1",
    phase: "artifact_pipeline_now",
    reviewPolicy: "human_review_required",
    evidenceMode: "workspace_artifact_json",
    notes: "Compliance categories are document and artifact heavy; dataset governance is the correct first-class path."
  }),
  ...plan([
    "wearable_thermal_comfort"
  ], {
    solverFamily: "consumer_thermal_validation",
    currentPath: {
      solver: "wearable-thermal-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "OpenModelica",
      adapterType: "external_process_json"
    },
    secondaryTarget: "artifact-backed thermal bench datasets",
    priority: "p1",
    phase: "external_adapter_next",
    reviewPolicy: "standard",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Thermal comfort should graduate from lumped estimation to externally reproduced thermal runs."
  }),
  ...plan([
    "consumer_battery_endurance"
  ], {
    solverFamily: "consumer_battery_models",
    currentPath: {
      solver: "battery-ecm-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "FMI 3.0 battery FMU",
      adapterType: "external_process_json"
    },
    secondaryTarget: "OpenModelica",
    priority: "p1",
    phase: "external_adapter_next",
    reviewPolicy: "standard",
    evidenceMode: "solver_stdout_json",
    notes: "Battery endurance should externalize through FMU-compatible models wherever possible."
  }),
  ...plan([
    "home_energy_optimization"
  ], {
    solverFamily: "home_energy_and_storage",
    currentPath: {
      solver: "home-energy-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "OpenModelica",
      adapterType: "external_process_json"
    },
    secondaryTarget: "OpenTURNS",
    priority: "p1",
    phase: "external_adapter_next",
    reviewPolicy: "standard",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Home energy planning should combine physics-backed dispatch with scenario uncertainty."
  }),
  ...plan([
    "smart_home_control_validation"
  ], {
    solverFamily: "consumer_control_and_supervision",
    currentPath: {
      solver: "control-loop",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "nuXmv",
      adapterType: "external_process_json"
    },
    secondaryTarget: "OpenModelica",
    priority: "p1",
    phase: "external_adapter_next",
    reviewPolicy: "human_review_required",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Home control logic is a small-scale but still safety-relevant supervisory validation problem."
  }),
  ...plan([
    "personal_mobility_safety"
  ], {
    solverFamily: "personal_mobility_dynamics",
    currentPath: {
      solver: "personal-mobility-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "Project Chrono",
      adapterType: "external_process_json"
    },
    secondaryTarget: "OpenModelica",
    priority: "p1",
    phase: "external_adapter_next",
    reviewPolicy: "human_review_required",
    evidenceMode: "solver_stdout_json",
    notes: "Mobility safety needs a stronger dynamic path than reduced-order consumer checks."
  }),
  ...plan([
    "home_robotics_validation"
  ], {
    solverFamily: "consumer_robotics_validation",
    currentPath: {
      solver: "robot-kinematics-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "Project Chrono",
      adapterType: "external_process_json"
    },
    secondaryTarget: "artifact-backed replay datasets",
    priority: "p2",
    phase: "external_adapter_next",
    reviewPolicy: "standard",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Consumer robotics can reuse the robotics stack after the industrial autonomy wedge is stable."
  }),
  ...plan([
    "medical_device_control",
    "medical_alarm_response_validation"
  ], {
    solverFamily: "medical_device_control_and_alarming",
    currentPath: {
      solver: "medical-device-control-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "OpenModelica",
      adapterType: "external_process_json"
    },
    secondaryTarget: "nuXmv",
    priority: "p0",
    phase: "review_gated_externalization",
    reviewPolicy: "regulated_review_required",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Control and alarm categories are high-priority but must remain review-gated because they are safety critical."
  }),
  ...plan([
    "biomechanics_reduced_order"
  ], {
    solverFamily: "medical_biomechanics",
    currentPath: {
      solver: "biomechanics-reduced-order",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "CalculiX",
      adapterType: "external_process_json"
    },
    secondaryTarget: "Elmer",
    priority: "p1",
    phase: "review_gated_externalization",
    reviewPolicy: "regulated_review_required",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Biomechanics should progress to governed FEM once input provenance and mesh discipline are available."
  }),
  ...plan([
    "clinical_workflow_safety",
    "treatment_protocol_verification"
  ], {
    solverFamily: "clinical_workflow_and_protocol_logic",
    currentPath: {
      solver: "clinical-workflow-checker",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "nuXmv",
      adapterType: "external_process_json"
    },
    secondaryTarget: "artifact-backed clinical evidence bundles",
    priority: "p0",
    phase: "review_gated_externalization",
    reviewPolicy: "regulated_review_required",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Clinical logic should externalize only with regulated review, protocol governance and explicit evidence bundles."
  }),
  ...plan([
    "physiological_compartment_modeling"
  ], {
    solverFamily: "physiological_compartment_models",
    currentPath: {
      solver: "physiological-compartment-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "SUNDIALS",
      adapterType: "external_process_json"
    },
    secondaryTarget: "OpenModelica",
    priority: "p1",
    phase: "review_gated_externalization",
    reviewPolicy: "regulated_review_required",
    evidenceMode: "solver_stdout_json",
    notes: "Compartment models are numerically well-suited for ODE solvers but still require regulated review."
  }),
  ...plan([
    "grid_load_flow",
    "utility_dispatch_reserve_analysis"
  ], {
    solverFamily: "grid_and_dispatch_analysis",
    currentPath: {
      solver: "grid-load-flow-lite",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "grid simulation backend",
      adapterType: "external_process_json"
    },
    secondaryTarget: "artifact-backed utility datasets",
    priority: "p1",
    phase: "external_adapter_next",
    reviewPolicy: "human_review_required",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Utilities need governed scenarios and reserve evidence in addition to model execution."
  }),
  ...plan([
    "water_network_resilience"
  ], {
    solverFamily: "water_network_and_resilience",
    currentPath: {
      solver: "water-network-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "OpenFOAM",
      adapterType: "external_process_json"
    },
    secondaryTarget: "artifact-backed flow and outage datasets",
    priority: "p1",
    phase: "external_adapter_next",
    reviewPolicy: "human_review_required",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Water categories should combine topology-level screening with field evidence and external flow execution."
  }),
  ...plan([
    "infrastructure_outage_recovery"
  ], {
    solverFamily: "outage_and_recovery_resilience",
    currentPath: {
      solver: "infrastructure-resilience-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "outage resilience evidence pipeline",
      adapterType: "artifact_metrics_json"
    },
    secondaryTarget: "external_process_json",
    priority: "p1",
    phase: "artifact_pipeline_now",
    reviewPolicy: "human_review_required",
    evidenceMode: "workspace_artifact_json",
    notes: "Continuity and recovery claims are often artifact-led before full outage simulation is automated."
  }),
  ...plan([
    "flight_envelope_assessment"
  ], {
    solverFamily: "flight_dynamics_envelope",
    currentPath: {
      solver: "flight-envelope-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "flight dynamics backend",
      adapterType: "external_process_json"
    },
    secondaryTarget: "SUNDIALS",
    priority: "p1",
    phase: "review_gated_externalization",
    reviewPolicy: "human_review_required",
    evidenceMode: "solver_stdout_json",
    notes: "Aerospace categories should stay review-gated even while moving toward external dynamics execution."
  }),
  ...plan([
    "propulsion_cycle_analysis"
  ], {
    solverFamily: "propulsion_cycle_models",
    currentPath: {
      solver: "propulsion-cycle-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "OpenModelica",
      adapterType: "external_process_json"
    },
    secondaryTarget: "artifact-backed bench data",
    priority: "p1",
    phase: "review_gated_externalization",
    reviewPolicy: "human_review_required",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Propulsion categories should connect model execution to bench evidence before any strong claim."
  }),
  ...plan([
    "mission_assurance_reliability"
  ], {
    solverFamily: "mission_reliability_and_survivability",
    currentPath: {
      solver: "mission-reliability-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "OpenTURNS",
      adapterType: "external_process_json"
    },
    secondaryTarget: "artifact-backed mission datasets",
    priority: "p1",
    phase: "review_gated_externalization",
    reviewPolicy: "human_review_required",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Mission assurance needs governed reliability evidence, not only Monte Carlo outputs."
  }),
  ...plan([
    "avionics_failover_validation"
  ], {
    solverFamily: "avionics_failover_logic",
    currentPath: {
      solver: "rule-engine",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "nuXmv",
      adapterType: "external_process_json"
    },
    secondaryTarget: "artifact-backed avionics test bundles",
    priority: "p0",
    phase: "review_gated_externalization",
    reviewPolicy: "human_review_required",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Avionics failover is a safety-first logic problem and should jump early to formal verification."
  }),
  ...plan([
    "robot_kinematics_and_reachability",
    "manipulation_task_validation"
  ], {
    solverFamily: "robot_kinematics_and_manipulation",
    currentPath: {
      solver: "robot-kinematics-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "Project Chrono",
      adapterType: "external_process_json"
    },
    secondaryTarget: "artifact-backed task replay datasets",
    priority: "p1",
    phase: "external_adapter_next",
    reviewPolicy: "standard",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Kinematics and manipulation should move to physics-backed trajectory execution once replay pipelines are stable."
  }),
  ...plan([
    "autonomy_safety_envelope"
  ], {
    solverFamily: "autonomy_safety_logic",
    currentPath: {
      solver: "autonomy-safety-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "nuXmv",
      adapterType: "external_process_json"
    },
    secondaryTarget: "artifact-backed autonomy replay datasets",
    priority: "p0",
    phase: "external_adapter_next",
    reviewPolicy: "human_review_required",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Autonomy safety should externalize early because screening logic is not enough for real safety envelopes."
  }),
  ...plan([
    "sensor_fusion_quality"
  ], {
    solverFamily: "sensor_fusion_and_replay",
    currentPath: {
      solver: "sensor-fusion-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "perception replay pipeline",
      adapterType: "artifact_metrics_json"
    },
    secondaryTarget: "external_process_json",
    priority: "p1",
    phase: "artifact_pipeline_now",
    reviewPolicy: "standard",
    evidenceMode: "workspace_artifact_json",
    notes: "Fusion quality is best validated through governed replay datasets before heavier online integrations."
  }),
  ...plan([
    "market_risk_var",
    "stress_scenario_analysis",
    "liquidity_contagion_analysis",
    "capital_adequacy_resilience"
  ], {
    solverFamily: "financial_risk_and_stress_testing",
    currentPath: {
      solver: "monte-carlo-var-solver / stress-scenario-solver / liquidity-contagion-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "OpenTURNS",
      adapterType: "external_process_json"
    },
    secondaryTarget: "artifact-backed governed risk datasets",
    priority: "p1",
    phase: "external_adapter_next",
    reviewPolicy: "human_review_required",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Risk categories should move toward governed external sampling and scenario pipelines."
  }),
  ...plan([
    "building_thermal_balance"
  ], {
    solverFamily: "building_thermal_models",
    currentPath: {
      solver: "building-thermal-balance-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "OpenModelica",
      adapterType: "external_process_json"
    },
    secondaryTarget: "artifact-backed weather replay datasets",
    priority: "p1",
    phase: "external_adapter_next",
    reviewPolicy: "standard",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Building thermal categories should combine envelope models with weather and occupancy evidence."
  }),
  ...plan([
    "distributed_energy_dispatch"
  ], {
    solverFamily: "distributed_energy_and_dispatch",
    currentPath: {
      solver: "energy-dispatch-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "OpenModelica",
      adapterType: "external_process_json"
    },
    secondaryTarget: "OpenTURNS",
    priority: "p1",
    phase: "external_adapter_next",
    reviewPolicy: "standard",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Dispatch categories should pair physical dispatch models with uncertainty-aware reserve sweeps."
  }),
  ...plan([
    "watershed_runoff_modeling"
  ], {
    solverFamily: "hydrology_and_runoff_models",
    currentPath: {
      solver: "watershed-runoff-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "hydrology backend",
      adapterType: "external_process_json"
    },
    secondaryTarget: "artifact-backed rainfall datasets",
    priority: "p2",
    phase: "external_adapter_next",
    reviewPolicy: "standard",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Runoff categories are valid today internally, but full external hydrology integration can come later."
  }),
  ...plan([
    "climate_resilience_screening"
  ], {
    solverFamily: "climate_resilience_screening",
    currentPath: {
      solver: "climate resilience evidence ingestion",
      adapterType: "artifact_metrics_json"
    },
    targetPath: {
      solver: "OpenTURNS",
      adapterType: "external_process_json"
    },
    secondaryTarget: "artifact-backed resilience scorecards",
    priority: "p2",
    phase: "artifact_pipeline_now",
    reviewPolicy: "human_review_required",
    evidenceMode: "workspace_artifact_json",
    notes: "Screening categories should start as governed evidence pipelines before full probabilistic externalization."
  }),
  ...plan([
    "reaction_kinetics_modeling",
    "diffusion_and_barrier_transport",
    "rheology_and_viscoelasticity",
    "surface_interaction_and_adsorption"
  ], {
    solverFamily: "materials_chemistry_and_transport",
    currentPath: {
      solver: "reaction-kinetics-solver / diffusion-barrier-solver / rheology-profile-solver / surface-adsorption-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "chemical and transport backend",
      adapterType: "external_process_json"
    },
    secondaryTarget: "artifact-backed lab characterization datasets",
    priority: "p1",
    phase: "external_adapter_next",
    reviewPolicy: "standard",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Materials and chemistry categories should bridge reduced-order screening with governed lab and transport execution."
  }),
  ...plan([
    "skin_penetration_and_retention",
    "formulation_stability_screening"
  ], {
    solverFamily: "cosmetic_transport_and_formulation_stability",
    currentPath: {
      solver: "skin-penetration-solver / cosmetic-stability-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "dermal transport and formulation backend",
      adapterType: "external_process_json"
    },
    secondaryTarget: "artifact-backed stability chamber datasets",
    priority: "p1",
    phase: "external_adapter_next",
    reviewPolicy: "human_review_required",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Cosmetic transport and stability need stronger evidence because exposure and shelf-life claims are sensitive."
  }),
  ...plan([
    "preservative_efficacy_validation",
    "sensory_profile_consistency"
  ], {
    solverFamily: "cosmetic_challenge_and_sensory_evidence",
    currentPath: {
      solver: "preservative-efficacy-solver / sensory-profile-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "challenge-test and sensory evidence pipeline",
      adapterType: "artifact_metrics_json"
    },
    secondaryTarget: "external_process_json",
    priority: "p1",
    phase: "artifact_pipeline_now",
    reviewPolicy: "human_review_required",
    evidenceMode: "workspace_artifact_json",
    notes: "Challenge tests and sensory panels are experiment-heavy and should stay artifact-led first."
  }),
  ...plan([
    "orbital_dynamics_and_mission_geometry"
  ], {
    solverFamily: "orbital_dynamics_and_geometry",
    currentPath: {
      solver: "orbital-mechanics-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "orbital mechanics backend",
      adapterType: "external_process_json"
    },
    secondaryTarget: "artifact-backed mission geometry bundles",
    priority: "p1",
    phase: "external_adapter_next",
    reviewPolicy: "human_review_required",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Orbital geometry is a natural candidate for externalized scientific dynamics backends."
  }),
  ...plan([
    "observation_pipeline_calibration"
  ], {
    solverFamily: "observation_calibration_and_reduction",
    currentPath: {
      solver: "observation-calibration-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "observation reduction pipeline",
      adapterType: "artifact_metrics_json"
    },
    secondaryTarget: "external_process_json",
    priority: "p1",
    phase: "artifact_pipeline_now",
    reviewPolicy: "human_review_required",
    evidenceMode: "workspace_artifact_json",
    notes: "Observation quality claims are dataset-first and should stay tied to governed reduction artifacts."
  }),
  ...plan([
    "stellar_structure_and_evolution_screening",
    "cosmology_parameter_inference"
  ], {
    solverFamily: "astrophysical_screening_and_inference",
    currentPath: {
      solver: "stellar-structure-lite-solver / cosmology-parameter-fit-solver",
      adapterType: "builtin_solver"
    },
    targetPath: {
      solver: "scientific computing backend",
      adapterType: "external_process_json"
    },
    secondaryTarget: "artifact-backed survey datasets",
    priority: "p2",
    phase: "external_adapter_next",
    reviewPolicy: "human_review_required",
    evidenceMode: "hybrid_solver_plus_artifact",
    notes: "Astrophysical screening and cosmology inference should remain review-heavy and evidence-driven."
  })
];

const categoryById = Object.fromEntries(
  solverCategoryCatalog.map((category) => [category.id, category])
);

const roadmapItems = buildRoadmapItems();
const roadmapCatalog = Object.fromEntries(
  roadmapItems.map((item) => [item.categoryId, item])
);

export function listSolverIntegrationRoadmap() {
  return structuredClone(roadmapItems);
}

export function getSolverIntegrationRoadmapCatalog() {
  return structuredClone(roadmapCatalog);
}

export function getSolverIntegrationSummary() {
  return structuredClone({
    totalCategories: solverCategoryCatalog.length,
    coveredCategories: roadmapItems.length,
    uncoveredCategories: [],
    byPriority: countBy(roadmapItems, (item) => item.priority),
    byPhase: countBy(roadmapItems, (item) => item.phase),
    bySector: countBy(roadmapItems, (item) => item.sector),
    byCurrentAdapter: countBy(roadmapItems, (item) => item.currentPath.adapterType),
    byTargetAdapter: countBy(roadmapItems, (item) => item.targetPath.adapterType),
    byReviewPolicy: countBy(roadmapItems, (item) => item.reviewPolicy),
    sectorCategoryTotals: Object.fromEntries(
      Object.values(solverSectorCatalog).map((sector) => [sector.id, sector.categoryIds.length])
    )
  });
}

function buildRoadmapItems() {
  validateRawRoadmap(rawRoadmapEntries);

  return rawRoadmapEntries.map((entry) => {
    const category = categoryById[entry.categoryId];

    return {
      categoryId: category.id,
      categoryLabel: category.label,
      categoryDescription: category.description,
      sector: category.sector,
      sectorLabel: solverSectorCatalog[category.sector]?.label || category.sector,
      priority: entry.priority,
      phase: entry.phase,
      reviewPolicy: entry.reviewPolicy,
      solverFamily: entry.solverFamily,
      currentPath: structuredClone(entry.currentPath),
      targetPath: structuredClone(entry.targetPath),
      secondaryTarget: entry.secondaryTarget,
      evidenceMode: entry.evidenceMode,
      notes: entry.notes
    };
  });
}

function validateRawRoadmap(entries) {
  const seenCategoryIds = new Set();

  for (const entry of entries) {
    if (!categoryById[entry.categoryId]) {
      throw new Error(`Solver roadmap references unknown category "${entry.categoryId}".`);
    }

    if (seenCategoryIds.has(entry.categoryId)) {
      throw new Error(`Solver roadmap duplicates category "${entry.categoryId}".`);
    }

    seenCategoryIds.add(entry.categoryId);

    if (!SUPPORTED_PRIORITIES.has(entry.priority)) {
      throw new Error(`Solver roadmap category "${entry.categoryId}" uses unsupported priority "${entry.priority}".`);
    }

    if (!SUPPORTED_PHASES.has(entry.phase)) {
      throw new Error(`Solver roadmap category "${entry.categoryId}" uses unsupported phase "${entry.phase}".`);
    }

    if (!SUPPORTED_REVIEW_POLICIES.has(entry.reviewPolicy)) {
      throw new Error(`Solver roadmap category "${entry.categoryId}" uses unsupported review policy "${entry.reviewPolicy}".`);
    }

    validatePath(entry.categoryId, "currentPath", entry.currentPath);
    validatePath(entry.categoryId, "targetPath", entry.targetPath);
  }

  const missingCategories = solverCategoryCatalog
    .map((category) => category.id)
    .filter((categoryId) => !seenCategoryIds.has(categoryId));

  if (missingCategories.length) {
    throw new Error(`Solver roadmap is missing categories: ${missingCategories.join(", ")}.`);
  }
}

function validatePath(categoryId, pathName, pathDefinition) {
  if (!pathDefinition?.solver?.trim()) {
    throw new Error(`Solver roadmap category "${categoryId}" requires ${pathName}.solver.`);
  }

  if (!SUPPORTED_ADAPTER_TYPES.has(pathDefinition.adapterType)) {
    throw new Error(`Solver roadmap category "${categoryId}" uses unsupported ${pathName}.adapterType "${pathDefinition.adapterType}".`);
  }
}

function countBy(items, selectKey) {
  return items.reduce((accumulator, item) => {
    const key = selectKey(item);
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
}
