const universalTestFoundation = {
  primitives: [
    {
      id: "entity_under_test",
      label: "Entity Under Test",
      description: "Qualsiasi sistema, materiale, organismo, formulazione, workflow o fenomeno osservato che deve essere validato."
    },
    {
      id: "environment_and_exposure",
      label: "Environment and Exposure",
      description: "Condizioni al contorno, stimoli, protocollo di esposizione o scenario operativo che governano il test."
    },
    {
      id: "state_and_observables",
      label: "State and Observables",
      description: "Variabili di stato, segnali osservabili, biomarcatori, telemetry stream o misure astronomiche raccolte."
    },
    {
      id: "constraints_and_limits",
      label: "Constraints and Limits",
      description: "Safety bounds, efficacy thresholds, tolerance windows, compliance rules e margini fisici."
    },
    {
      id: "hazards_and_failure_modes",
      label: "Hazards and Failure Modes",
      description: "Failure mode, adverse event, contamination, drift, instability o inconsistenza osservativa."
    },
    {
      id: "evidence_and_traceability",
      label: "Evidence and Traceability",
      description: "Artefatti, provenance, protocol references, solver contract e audit trail del test."
    }
  ],
  testArchetypes: [
    {
      id: "nominal_operation",
      label: "Nominal Operation",
      description: "Valida il comportamento atteso in condizioni standard o di riferimento."
    },
    {
      id: "boundary_and_stress",
      label: "Boundary and Stress",
      description: "Forza il sistema vicino ai limiti di processo, dose, carico, temperatura o osservabilita."
    },
    {
      id: "exposure_response",
      label: "Exposure Response",
      description: "Studia assorbimento, risposta dose-effetto, interazione superficie-ambiente o risposta del sistema a stimoli esterni."
    },
    {
      id: "protocol_and_workflow_adherence",
      label: "Protocol and Workflow Adherence",
      description: "Verifica che procedure, workflow clinici, manufacturing protocol o pipeline osservative seguano il contratto corretto."
    },
    {
      id: "degradation_and_longitudinal_drift",
      label: "Degradation and Longitudinal Drift",
      description: "Valuta deterioramento, invecchiamento, shelf-life, calibration drift o evoluzione nel tempo."
    },
    {
      id: "safety_failover_and_interlocks",
      label: "Safety Failover and Interlocks",
      description: "Copre fail-safe, alarm response, interlock, contamination control e shutdown logic."
    },
    {
      id: "uncertainty_and_inference",
      label: "Uncertainty and Inference",
      description: "Usa sweep, inferenza statistica, parameter fitting, UQ e confidence accounting."
    },
    {
      id: "observation_and_calibration",
      label: "Observation and Calibration",
      description: "Valida pipeline di misura, calibrazione, quality-of-observation e coerenza del dato sperimentale."
    }
  ],
  evidenceModes: [
    {
      id: "solver_execution",
      label: "Solver Execution",
      description: "Evidenza prodotta da solver numerici, reduced-order model o backend esterni."
    },
    {
      id: "artifact_replay",
      label: "Artifact Replay",
      description: "Evidenza prodotta da dataset, lab bundle, telemetry replay, challenge test o observation bundle."
    },
    {
      id: "formal_verification",
      label: "Formal Verification",
      description: "Evidenza logica o model-checking per protocolli, failover e safety-critical decision logic."
    },
    {
      id: "statistical_inference",
      label: "Statistical Inference",
      description: "Evidenza da fitting, confidence interval, Bayesian update o uncertainty propagation."
    },
    {
      id: "human_review_gated",
      label: "Human Review Gated",
      description: "Evidenza che richiede revisione umana esplicita prima di qualunque claim regolato."
    }
  ],
  solverModalities: [
    {
      id: "physics_and_transport",
      label: "Physics and Transport",
      description: "ODE, DAE, FEM, CFD, circuiti, dynamics, diffusion e transport."
    },
    {
      id: "workflow_and_logic",
      label: "Workflow and Logic",
      description: "Discrete-event, protocol logic, process governance e formal interlock verification."
    },
    {
      id: "inference_and_uq",
      label: "Inference and UQ",
      description: "Monte Carlo, reliability, fitting, sensitivity e parameter estimation."
    },
    {
      id: "observation_and_signal_processing",
      label: "Observation and Signal Processing",
      description: "Calibration, sensory panels, telemetry quality, sensor fusion e reduction pipelines."
    }
  ],
  reviewTiers: [
    {
      id: "standard",
      label: "Standard",
      description: "Normale review tecnica per categorie non regolamentate."
    },
    {
      id: "human_review_required",
      label: "Human Review Required",
      description: "Richiede revisione umana formale per categorie safety-sensitive o claim sperimentali delicati."
    },
    {
      id: "regulated_review_required",
      label: "Regulated Review Required",
      description: "Richiede governance regolata per medicale, protocolli terapeutici o altri claim ad alto impatto."
    }
  ],
  claimFamilies: [
    {
      id: "performance",
      label: "Performance",
      description: "Prestazione, throughput, efficienza o quality-of-service."
    },
    {
      id: "safety",
      label: "Safety",
      description: "Limiti di rischio, fail-safe, alarm response, toxicology o boundary of safe operation."
    },
    {
      id: "efficacy",
      label: "Efficacy",
      description: "Raggiungimento dell'effetto atteso, conversione, retention, risposta o outcome desiderato."
    },
    {
      id: "stability",
      label: "Stability",
      description: "Shelf-life, long-term drift, robustness termica, chimica o strutturale."
    },
    {
      id: "observation_quality",
      label: "Observation Quality",
      description: "Signal-to-noise, calibration quality, trace fidelity e confidence del dato osservato."
    },
    {
      id: "compliance_and_protocol",
      label: "Compliance and Protocol",
      description: "Aderenza a regole, workflow, procedure, challenge test e governance evidence."
    }
  ]
};

export function getUniversalTestFoundation() {
  return structuredClone(universalTestFoundation);
}

export function getUniversalTestFoundationSummary() {
  return {
    primitiveCount: universalTestFoundation.primitives.length,
    archetypeCount: universalTestFoundation.testArchetypes.length,
    evidenceModeCount: universalTestFoundation.evidenceModes.length,
    solverModalityCount: universalTestFoundation.solverModalities.length,
    reviewTierCount: universalTestFoundation.reviewTiers.length,
    claimFamilyCount: universalTestFoundation.claimFamilies.length
  };
}
