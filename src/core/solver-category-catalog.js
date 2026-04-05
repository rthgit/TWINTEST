export const solverCategoryCatalog = [
  { id: "continuous_time_dynamics", label: "Continuous-Time Dynamics", sector: "industry", status: "active", description: "ODE e dinamica continua per sistemi fisici e cyber-physical." },
  { id: "differential_algebraic_systems", label: "Differential-Algebraic Systems", sector: "industry", status: "active", description: "DAE e modelli con vincoli algebrici." },
  { id: "state_space_control", label: "State-Space Control", sector: "industry", status: "active", description: "Controllo continuo, tracking e stabilita." },
  { id: "discrete_event_control", label: "Discrete Event Control", sector: "industry", status: "active", description: "Scheduling, code paths discreti e supervisione." },
  { id: "formal_logic_verification", label: "Formal Logic Verification", sector: "industry", status: "active", description: "Model checking, proprieta temporali e safety logic." },
  { id: "multibody_dynamics", label: "Multibody Dynamics", sector: "industry", status: "active", description: "Dinamica rigida di sistemi meccanici articolati." },
  { id: "actuator_dynamics", label: "Actuator Dynamics", sector: "industry", status: "active", description: "Motori, drive, attuatori e risposta meccanica." },
  { id: "structural_static_fem", label: "Structural Static FEM", sector: "industry", status: "active", description: "Analisi FEM statica e quasi-statica." },
  { id: "nonlinear_structural_fem", label: "Nonlinear Structural FEM", sector: "industry", status: "active", description: "Analisi strutturale non lineare." },
  { id: "modal_vibration_analysis", label: "Modal and Vibration Analysis", sector: "industry", status: "active", description: "Modi propri, risonanza e vibrazioni." },
  { id: "thermal_rc_networks", label: "Thermal RC Networks", sector: "industry", status: "active", description: "Modelli termici lumped e transienti." },
  { id: "thermofluidic_cfd", label: "Thermofluidic CFD", sector: "industry", status: "active", description: "Fluidodinamica e scambio termico." },
  { id: "fluid_network_simulation", label: "Fluid Network Simulation", sector: "industry", status: "active", description: "Reti di flusso, pressione e portata." },
  { id: "pump_curve_analysis", label: "Pump Curve Analysis", sector: "industry", status: "active", description: "Curve pompa, head e operating point." },
  { id: "hydraulic_graph_analysis", label: "Hydraulic Graph Analysis", sector: "industry", status: "active", description: "Topologie idrauliche e perdite distribuite." },
  { id: "electrical_circuit_transient", label: "Electrical Circuit Transient", sector: "industry", status: "active", description: "Simulazione transiente di circuiti." },
  { id: "mixed_signal_drive_control", label: "Mixed-Signal Drive Control", sector: "industry", status: "active", description: "Drive elettronici e controllo misto." },
  { id: "probabilistic_reliability", label: "Probabilistic Reliability", sector: "industry", status: "active", description: "Affidabilita, hazard e survival." },
  { id: "uncertainty_quantification", label: "Uncertainty Quantification", sector: "industry", status: "active", description: "Sweep, Sobol, Monte Carlo e sensitivity." },
  { id: "telemetry_timeseries_evaluation", label: "Telemetry Timeseries Evaluation", sector: "industry", status: "active", description: "Valutazione telemetria e time-series validation." },
  { id: "computer_architecture_performance", label: "Computer Architecture Performance", sector: "industry", status: "active", description: "Latency, throughput e behavior microarchitectural." },
  { id: "scheduler_runtime_analysis", label: "Scheduler and Runtime Analysis", sector: "industry", status: "active", description: "Runtime scheduling, queueing e dispatch." },
  { id: "chip_power_thermal_coanalysis", label: "Chip Power-Thermal Coanalysis", sector: "industry", status: "active", description: "Co-analisi termica ed energetica del chip." },
  { id: "industrial_safety_interlocks", label: "Industrial Safety Interlocks", sector: "industry", status: "active", description: "Interlock industriali e failover safety." },
  { id: "power_electronics_switching", label: "Power Electronics Switching", sector: "industry", status: "active", description: "Switching, conversione e perdite di potenza." },
  { id: "battery_pack_models", label: "Battery Pack Models", sector: "industry", status: "active", description: "Modelli battery pack e comportamento elettrico." },
  { id: "vehicle_powertrain_dynamics", label: "Vehicle Powertrain Dynamics", sector: "industry", status: "active", description: "Powertrain, torque delivery ed energy flow." },
  { id: "brake_and_failover_validation", label: "Brake and Failover Validation", sector: "industry", status: "active", description: "Frenata, interlock e safe-stop." },
  { id: "business_process_simulation", label: "Business Process Simulation", sector: "private", status: "active", description: "Processi aziendali, code e throughput." },
  { id: "workflow_governance_validation", label: "Workflow Governance Validation", sector: "private", status: "active", description: "Workflow di controllo, escalation e governance." },
  { id: "service_capacity_planning", label: "Service Capacity Planning", sector: "private", status: "active", description: "Capacita, risorse e SLA." },
  { id: "queueing_service_reliability", label: "Queueing and Service Reliability", sector: "private", status: "active", description: "Affidabilita operativa di servizi e code." },
  { id: "security_policy_validation", label: "Security Policy Validation", sector: "private", status: "active", description: "Policy, guardrail e threat-driven validation." },
  { id: "compliance_evidence_evaluation", label: "Compliance Evidence Evaluation", sector: "private", status: "active", description: "Copertura evidence e compliance workflow." },
  { id: "wearable_thermal_comfort", label: "Wearable Thermal Comfort", sector: "personal", status: "active", description: "Comfort termico e limiti di contatto." },
  { id: "consumer_battery_endurance", label: "Consumer Battery Endurance", sector: "personal", status: "active", description: "Autonomia, resistenza interna e endurance." },
  { id: "home_energy_optimization", label: "Home Energy Optimization", sector: "personal", status: "active", description: "Carichi domestici, storage e autoproduzione." },
  { id: "smart_home_control_validation", label: "Smart Home Control Validation", sector: "personal", status: "active", description: "Validazione dei loop di controllo domestici." },
  { id: "personal_mobility_safety", label: "Personal Mobility Safety", sector: "personal", status: "active", description: "Micromobilita, frenata e autonomia." },
  { id: "home_robotics_validation", label: "Home Robotics Validation", sector: "personal", status: "active", description: "Robot domestici e scenari consumer." },
  { id: "medical_device_control", label: "Medical Device Control", sector: "medical", status: "active", description: "Controllo dispositivi medicali e alarm response." },
  { id: "biomechanics_reduced_order", label: "Biomechanics Reduced Order", sector: "medical", status: "active", description: "Biomeccanica ridotta, carichi e spostamenti." },
  { id: "clinical_workflow_safety", label: "Clinical Workflow Safety", sector: "medical", status: "active", description: "Workflow clinici, handoff e safety." },
  { id: "physiological_compartment_modeling", label: "Physiological Compartment Modeling", sector: "medical", status: "active", description: "Compartment models e concentrazioni." },
  { id: "medical_alarm_response_validation", label: "Medical Alarm Response Validation", sector: "medical", status: "active", description: "Tempi di reazione e soglie cliniche." },
  { id: "treatment_protocol_verification", label: "Treatment Protocol Verification", sector: "medical", status: "active", description: "Protocol verification e procedura clinica." },
  { id: "grid_load_flow", label: "Grid Load Flow", sector: "public_infrastructure", status: "active", description: "Flussi di rete, carichi e margini di riserva." },
  { id: "water_network_resilience", label: "Water Network Resilience", sector: "public_infrastructure", status: "active", description: "Pressione, perdite e delivery resiliente." },
  { id: "infrastructure_outage_recovery", label: "Infrastructure Outage Recovery", sector: "public_infrastructure", status: "active", description: "Ripristino e continuita di servizio." },
  { id: "utility_dispatch_reserve_analysis", label: "Utility Dispatch and Reserve Analysis", sector: "public_infrastructure", status: "active", description: "Dispatch, riserva e contingencies." },
  { id: "flight_envelope_assessment", label: "Flight Envelope Assessment", sector: "aerospace_defense", status: "active", description: "Margini di volo, load factor e speed window." },
  { id: "propulsion_cycle_analysis", label: "Propulsion Cycle Analysis", sector: "aerospace_defense", status: "active", description: "Spinta, fuel flow e limiti termici." },
  { id: "mission_assurance_reliability", label: "Mission Assurance Reliability", sector: "aerospace_defense", status: "active", description: "Survival e affidabilita missione." },
  { id: "avionics_failover_validation", label: "Avionics Failover Validation", sector: "aerospace_defense", status: "active", description: "Failover avionico e sistema ad alta assurance." },
  { id: "robot_kinematics_and_reachability", label: "Robot Kinematics and Reachability", sector: "robotics_autonomy", status: "active", description: "Kinematics, reachability e payload." },
  { id: "autonomy_safety_envelope", label: "Autonomy Safety Envelope", sector: "robotics_autonomy", status: "active", description: "Safety envelope per autonomy stacks." },
  { id: "sensor_fusion_quality", label: "Sensor Fusion Quality", sector: "robotics_autonomy", status: "active", description: "Fusion quality, dropouts e alignment." },
  { id: "manipulation_task_validation", label: "Manipulation Task Validation", sector: "robotics_autonomy", status: "active", description: "Manipolazione, placement accuracy e task completion." },
  { id: "market_risk_var", label: "Market Risk VaR", sector: "finance_risk", status: "active", description: "Value-at-Risk e rischio di mercato." },
  { id: "stress_scenario_analysis", label: "Stress Scenario Analysis", sector: "finance_risk", status: "active", description: "Stress scenario e capitale sotto shock." },
  { id: "liquidity_contagion_analysis", label: "Liquidity Contagion Analysis", sector: "finance_risk", status: "active", description: "Contagio, liquidita e settlement." },
  { id: "capital_adequacy_resilience", label: "Capital Adequacy Resilience", sector: "finance_risk", status: "active", description: "Resilienza patrimoniale e buffer." },
  { id: "building_thermal_balance", label: "Building Thermal Balance", sector: "environment_climate", status: "active", description: "Bilancio termico edificio e HVAC." },
  { id: "distributed_energy_dispatch", label: "Distributed Energy Dispatch", sector: "environment_climate", status: "active", description: "Dispatch energia distribuita e storage." },
  { id: "watershed_runoff_modeling", label: "Watershed Runoff Modeling", sector: "environment_climate", status: "active", description: "Pioggia, infiltrazione e runoff." },
  { id: "climate_resilience_screening", label: "Climate Resilience Screening", sector: "environment_climate", status: "active", description: "Screening rapido di resilienza climatica." },
  { id: "reaction_kinetics_modeling", label: "Reaction Kinetics Modeling", sector: "materials_chemistry", status: "active", description: "Cinetica di reazione, conversione e resa." },
  { id: "diffusion_and_barrier_transport", label: "Diffusion and Barrier Transport", sector: "materials_chemistry", status: "active", description: "Trasporto diffusivo, permeazione e barriere." },
  { id: "rheology_and_viscoelasticity", label: "Rheology and Viscoelasticity", sector: "materials_chemistry", status: "active", description: "Rheology, shear response e comportamento viscoelastico." },
  { id: "surface_interaction_and_adsorption", label: "Surface Interaction and Adsorption", sector: "materials_chemistry", status: "active", description: "Adsorbimento, interazione superficie-soluto e coating behavior." },
  { id: "skin_penetration_and_retention", label: "Skin Penetration and Retention", sector: "cosmetic_science", status: "active", description: "Penetrazione dermica, retention locale e margine di esposizione sistemica." },
  { id: "formulation_stability_screening", label: "Formulation Stability Screening", sector: "cosmetic_science", status: "active", description: "Stabilita di formulazione, separazione e robustezza termica." },
  { id: "preservative_efficacy_validation", label: "Preservative Efficacy Validation", sector: "cosmetic_science", status: "active", description: "Challenge test, riduzione microbica e preservazione." },
  { id: "sensory_profile_consistency", label: "Sensory Profile Consistency", sector: "cosmetic_science", status: "active", description: "Consistenza sensoriale, texture, uniformita e variabilita panel." },
  { id: "orbital_dynamics_and_mission_geometry", label: "Orbital Dynamics and Mission Geometry", sector: "space_cosmology", status: "active", description: "Geometria orbitale, margini dinamici e coerenza mission profile." },
  { id: "observation_pipeline_calibration", label: "Observation Pipeline Calibration", sector: "space_cosmology", status: "active", description: "Calibrazione di pipeline osservative, noise floor e data reduction." },
  { id: "stellar_structure_and_evolution_screening", label: "Stellar Structure and Evolution Screening", sector: "space_cosmology", status: "active", description: "Screening ridotto di struttura stellare, luminosita e coerenza evolutiva." },
  { id: "cosmology_parameter_inference", label: "Cosmology Parameter Inference", sector: "space_cosmology", status: "active", description: "Inferenza di parametri cosmologici e quality-of-fit del modello." }
];

export function listSolverCategories() {
  return [...solverCategoryCatalog];
}

export function getSolverCategoryCatalog() {
  return Object.fromEntries(
    solverCategoryCatalog.map((category) => [category.id, { ...category }])
  );
}

export function countSolverCategories() {
  return solverCategoryCatalog.length;
}

export function getSolverCategoryIdsBySector(sectorId) {
  return solverCategoryCatalog
    .filter((category) => category.sector === sectorId)
    .map((category) => category.id);
}
