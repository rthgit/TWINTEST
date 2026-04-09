import { getSolverCategoryIdsBySector } from "./solver-category-catalog.js";

export const solverSectorCatalog = {
  industry: {
    id: "industry",
    label: "Industria",
    status: "active",
    description: "Sistemi fisici, cyber-physical e impianti industriali con forte requisito di validazione tecnica.",
    focusAreas: [
      "compute_semiconductor",
      "mechatronics",
      "fluidic_energy",
      "vehicle_systems",
      "industrial_control",
      "power_electronics"
    ],
    primarySolvers: [
      "SUNDIALS",
      "OpenModelica",
      "FMI 3.0 / FMU",
      "OpenTURNS",
      "nuXmv",
      "gem5",
      "OpenFOAM",
      "CalculiX",
      "Project Chrono",
      "Xyce"
    ],
    secondarySolvers: ["SST", "Elmer", "MOOSE", "ngspice"],
    categoryIds: getSolverCategoryIdsBySector("industry"),
    builtinSolvers: [
      "architectural-surrogate",
      "queueing-simulator",
      "discrete-event-scheduler",
      "state-space-control",
      "multibody-surrogate",
      "ode-state-space",
      "modal-analysis",
      "spectral-monitor",
      "thermal-network",
      "cfd-surrogate",
      "fluid-network",
      "cfd-lite",
      "pump-curve-solver",
      "rule-engine",
      "hydraulic-graph",
      "probabilistic-reliability",
      "circuit-state-space",
      "control-loop",
      "logic-simulation",
      "constraint-checker",
      "timeseries-evaluator",
      "powertrain-ode",
      "energy-flow-solver"
    ]
  },
  private: {
    id: "private",
    label: "Settore Privato",
    status: "active",
    description: "Workflow di test e validazione per prodotti, servizi e operations aziendali non strettamente industriali.",
    focusAreas: [
      "business_processes",
      "service_operations",
      "security_compliance",
      "workflow_reliability"
    ],
    categoryIds: getSolverCategoryIdsBySector("private"),
    builtinSolvers: [
      "business-process-simulator",
      "service-capacity-solver",
      "security-policy-checker",
      "compliance-workflow-solver"
    ],
    externalDirections: [
      "BPMN / workflow engines",
      "discrete-event simulation backends",
      "policy and compliance engines"
    ]
  },
  personal: {
    id: "personal",
    label: "Settore Personale",
    status: "active",
    description: "Validazione di sistemi consumer, home automation, wearable, personal robotics e use case domestici.",
    focusAreas: [
      "battery_devices",
      "wearable_thermal",
      "home_energy",
      "personal_mobility"
    ],
    categoryIds: getSolverCategoryIdsBySector("personal"),
    builtinSolvers: [
      "battery-ecm-solver",
      "wearable-thermal-solver",
      "home-energy-solver",
      "personal-mobility-solver"
    ],
    externalDirections: [
      "battery FMU / Modelica models",
      "thermal solvers",
      "consumer telemetry replay"
    ]
  },
  medical: {
    id: "medical",
    label: "Settore Medico",
    status: "active",
    description: "Validazione di dispositivi, workflow clinici, safety interlock e simulazione patient-specific sotto governance piu stretta.",
    focusAreas: [
      "medical_devices",
      "biomechanics",
      "clinical_workflows",
      "physiological_models"
    ],
    categoryIds: getSolverCategoryIdsBySector("medical"),
    builtinSolvers: [
      "medical-device-control-solver",
      "biomechanics-reduced-order",
      "clinical-workflow-checker",
      "physiological-compartment-solver"
    ],
    externalDirections: [
      "formal verification for safety cases",
      "FEM / biomechanics solvers",
      "review-gated medical validation workflows"
    ]
  },
  public_infrastructure: {
    id: "public_infrastructure",
    label: "Infrastrutture e Utilities",
    status: "active",
    description: "Grid, reti idriche, smart infrastructure e asset mission-critical.",
    focusAreas: [
      "electric_grids",
      "water_networks",
      "asset_resilience"
    ],
    categoryIds: getSolverCategoryIdsBySector("public_infrastructure"),
    builtinSolvers: [
      "grid-load-flow-lite",
      "water-network-solver",
      "infrastructure-resilience-solver"
    ],
    externalDirections: [
      "power system simulators",
      "water network solvers",
      "resilience and outage simulation"
    ]
  },
  aerospace_defense: {
    id: "aerospace_defense",
    label: "Aerospace e Difesa",
    status: "active",
    description: "High-assurance systems, mission profiles, avionics, propulsion e safety envelopes.",
    focusAreas: [
      "flight_envelopes",
      "propulsion",
      "mission_assurance"
    ],
    categoryIds: getSolverCategoryIdsBySector("aerospace_defense"),
    builtinSolvers: [
      "flight-envelope-solver",
      "propulsion-cycle-solver",
      "mission-reliability-solver"
    ],
    externalDirections: [
      "flight dynamics solvers",
      "propulsion cycle tools",
      "mission-level reliability frameworks"
    ]
  },
  robotics_autonomy: {
    id: "robotics_autonomy",
    label: "Robotica e Autonomia",
    status: "active",
    description: "Robot mobili, manipolatori, perception-control co-simulation e failover autonomo.",
    focusAreas: [
      "robot_kinematics",
      "autonomy_safety",
      "sensor_fusion"
    ],
    categoryIds: getSolverCategoryIdsBySector("robotics_autonomy"),
    builtinSolvers: [
      "robot-kinematics-solver",
      "autonomy-safety-solver",
      "sensor-fusion-solver"
    ],
    externalDirections: [
      "Chrono / ROS2 / Gazebo style integrations",
      "formal autonomy safety checks",
      "sensor and telemetry replay"
    ]
  },
  finance_risk: {
    id: "finance_risk",
    label: "Finance e Risk Systems",
    status: "active",
    description: "Stress test, scenario generation, reliability e explainable validation per sistemi decisionali.",
    focusAreas: [
      "market_risk",
      "stress_testing",
      "liquidity_and_counterparty"
    ],
    categoryIds: getSolverCategoryIdsBySector("finance_risk"),
    builtinSolvers: [
      "monte-carlo-var-solver",
      "stress-scenario-solver",
      "liquidity-contagion-solver"
    ],
    externalDirections: [
      "Monte Carlo and scenario engines",
      "optimization solvers",
      "risk data validation frameworks"
    ]
  },
  environment_climate: {
    id: "environment_climate",
    label: "Ambiente e Climate Tech",
    status: "active",
    description: "Thermofluidics, energy systems, forecasting pipelines e resilience validation.",
    focusAreas: [
      "building_energy",
      "dispatch_and_storage",
      "hydrology_and_runoff"
    ],
    categoryIds: getSolverCategoryIdsBySector("environment_climate"),
    builtinSolvers: [
      "building-thermal-balance-solver",
      "energy-dispatch-solver",
      "watershed-runoff-solver"
    ],
    externalDirections: [
      "CFD / thermal tools",
      "energy dispatch optimizers",
      "environmental and hydrology models"
    ]
  },
  materials_chemistry: {
    id: "materials_chemistry",
    label: "Materiali e Chimica",
    status: "active",
    description: "Base di test per processi chimici, materiali formulati, barriera, reologia e interazioni di superficie.",
    focusAreas: [
      "reaction_kinetics",
      "barrier_transport",
      "rheology",
      "surface_interactions"
    ],
    categoryIds: getSolverCategoryIdsBySector("materials_chemistry"),
    builtinSolvers: [
      "reaction-kinetics-solver",
      "diffusion-barrier-solver",
      "rheology-profile-solver",
      "surface-adsorption-solver"
    ],
    externalDirections: [
      "reaction kinetics engines",
      "transport and diffusion solvers",
      "lab characterization evidence pipelines"
    ]
  },
  cosmetic_science: {
    id: "cosmetic_science",
    label: "Cosmetica e Personal Care Science",
    status: "active",
    description: "Validazione di formulazioni, skin interaction, preservazione, stabilita e coerenza sensoriale.",
    focusAreas: [
      "dermal_transport",
      "formulation_stability",
      "preservative_efficacy",
      "sensory_consistency"
    ],
    categoryIds: getSolverCategoryIdsBySector("cosmetic_science"),
    builtinSolvers: [
      "skin-penetration-solver",
      "cosmetic-stability-solver",
      "preservative-efficacy-solver",
      "sensory-profile-solver"
    ],
    externalDirections: [
      "dermal transport and exposure models",
      "stability chamber and challenge-test pipelines",
      "panel and sensory evidence workflows"
    ]
  },
  space_cosmology: {
    id: "space_cosmology",
    label: "Spazio e Cosmologia",
    status: "active",
    description: "Test foundation per dinamica orbitale, pipeline osservative, modelli stellari e inferenza cosmologica.",
    focusAreas: [
      "orbital_dynamics",
      "observation_calibration",
      "stellar_screening",
      "cosmology_inference"
    ],
    categoryIds: getSolverCategoryIdsBySector("space_cosmology"),
    builtinSolvers: [
      "orbital-mechanics-solver",
      "observation-calibration-solver",
      "stellar-structure-lite-solver",
      "cosmology-parameter-fit-solver"
    ],
    externalDirections: [
      "orbital mechanics backends",
      "observation reduction pipelines",
      "scientific computing and parameter inference stacks"
    ]
  }
};

export const proposedSolverSectors = [];

export function listSolverSectors() {
  return Object.values(solverSectorCatalog).map((sector) => ({
    id: sector.id,
    label: sector.label,
    status: sector.status
  }));
}
