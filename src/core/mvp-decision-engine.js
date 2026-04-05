import { average, clamp, createId } from "./id.js";

const REVIEW_GATED_DOMAINS = new Set(["medical", "cosmetic_science", "space_cosmology"]);

export function createMvpDecision({
  workspaceId,
  project,
  graph,
  blueprint,
  currentRun = null,
  evidenceRun = null,
  evidenceReport = null
}) {
  const hasCurrentRun = Boolean(currentRun);
  const hasEvidenceReport = Boolean(evidenceRun && evidenceReport);
  const gatePassRate = hasEvidenceReport
    ? ratio(
        evidenceReport.gateResults.filter((gateResult) => gateResult.passed).length,
        evidenceReport.gateResults.length
      )
    : 0;
  const kpiPassRate = hasEvidenceReport
    ? ratio(
        evidenceReport.kpiResults.filter((kpiResult) => kpiResult.passed).length,
        evidenceReport.kpiResults.length
      )
    : 0;
  const evidenceSatisfactionRate = hasEvidenceReport
    ? ratio(
        evidenceReport.evidenceMatrix.filter((entry) => entry.status === "satisfied").length,
        evidenceReport.evidenceMatrix.length
      )
    : 0;
  const reportConfidence = hasEvidenceReport ? evidenceReport.summary.confidence : 0;
  const scenarioPassRate = hasEvidenceReport ? evidenceReport.summary.passRate : 0;
  const blueprintReadinessScore = blueprint.readiness.overallScore;
  const validationStrengthScore = Number(
    clamp(
      average([
        reportConfidence,
        gatePassRate,
        kpiPassRate,
        evidenceSatisfactionRate,
        scenarioPassRate
      ]),
      0,
      1
    ).toFixed(6)
  );
  const complexityPenalty = Math.max(0, graph.domainIds.length - 1) * 0.04;
  const pilotFitScore = Number(
    clamp(
      blueprintReadinessScore * 0.48 +
        validationStrengthScore * 0.42 +
        (hasEvidenceReport ? 0.12 : 0) -
        complexityPenalty,
      0,
      1
    ).toFixed(6)
  );
  const reviewGateRequired = graph.domainIds.some((domainId) => REVIEW_GATED_DOMAINS.has(domainId));
  const blockers = buildBlockers({
    graph,
    blueprint,
    currentRun,
    hasCurrentRun,
    hasEvidenceReport,
    evidenceReport,
    reviewGateRequired
  });
  const goSignals = buildGoSignals({
    blueprint,
    currentRun,
    hasEvidenceReport,
    evidenceReport,
    gatePassRate,
    kpiPassRate,
    evidenceSatisfactionRate
  });
  const recommendation = decideRecommendation({
    currentRun,
    hasEvidenceReport,
    evidenceReport,
    reviewGateRequired,
    pilotFitScore
  });
  const nextBuildSteps = buildNextBuildSteps({
    blueprint,
    evidenceReport,
    recommendation
  });

  return {
    id: createId("mvp_decision"),
    workspaceId,
    projectId: project.id,
    compilationId: project.latestCompilationId,
    blueprintId: blueprint.id,
    currentRunId: currentRun?.id || null,
    evidenceRunId: evidenceRun?.id || null,
    reportId: evidenceReport?.id || null,
    createdAt: new Date().toISOString(),
    summary: {
      recommendation: recommendation.code,
      status: recommendation.status,
      rationale: recommendation.rationale,
      dominantDomainId: graph.dominantDomainId,
      domainIds: graph.domainIds,
      targetUser: blueprint.inference.targetUserProfile,
      productStatement: blueprint.mvp.productStatement
    },
    scores: {
      blueprintReadinessScore,
      validationStrengthScore,
      pilotFitScore,
      gatePassRate: Number(gatePassRate.toFixed(6)),
      kpiPassRate: Number(kpiPassRate.toFixed(6)),
      evidenceSatisfactionRate: Number(evidenceSatisfactionRate.toFixed(6)),
      reportConfidence: Number(reportConfidence.toFixed(6))
    },
    deliveryShape: {
      shipNow: blueprint.mvp.includedFeatures.slice(0, 4),
      deferNow: blueprint.mvp.deferredFeatures.slice(0, 4),
      firstMilestone: blueprint.mvp.firstMilestone
    },
    pilotPlan: {
      targetUser: blueprint.inference.targetUserProfile,
      pilotScope: buildPilotScope(blueprint),
      successMetric: buildSuccessMetric(blueprint, evidenceReport),
      acceptanceRule: buildAcceptanceRule(evidenceReport, blueprint),
      claimBoundary: buildClaimBoundary({
        graph,
        hasEvidenceReport,
        evidenceReport,
        reviewGateRequired
      })
    },
    evidenceStatus: {
      currentRunStatus: currentRun?.status || "not_started",
      hasEvidenceReport,
      validationOutcome: evidenceReport?.summary.validationOutcome || null,
      scenarioCoverage: evidenceReport?.summary.scenarioCoverage || 0,
      realExecution: evidenceReport?.summary.realExecution || false
    },
    goSignals,
    blockers,
    nextBuildSteps,
    warnings: blueprint.warnings
  };
}

function buildBlockers({
  graph,
  blueprint,
  currentRun,
  hasCurrentRun,
  hasEvidenceReport,
  evidenceReport,
  reviewGateRequired
}) {
  const blockers = [];

  if (!hasCurrentRun) {
    blockers.push("no validation run has been queued yet");
  } else if (currentRun.status === "queued") {
    blockers.push("the latest validation run is queued and has not produced evidence yet");
  } else if (currentRun.status === "running") {
    blockers.push("the latest validation run is still executing");
  } else if (currentRun.status === "failed") {
    blockers.push("the latest validation run failed and needs triage before any pilot decision");
  }

  if (!hasEvidenceReport) {
    blockers.push("no completed validation report is available yet");
  }

  if (!blueprint.validation.firstRunPath.canExecuteImmediately) {
    blockers.push("the current project still has unresolved execution readiness before a strong MVP claim");
  }

  if (hasEvidenceReport && evidenceReport.summary.validationOutcome !== "pass") {
    blockers.push("the latest completed validation report did not pass all gates");
  }

  if (hasEvidenceReport) {
    const failedGates = evidenceReport.gateResults.filter((gateResult) => !gateResult.passed);

    if (failedGates.length) {
      blockers.push(`failed gates remain: ${failedGates.map((gateResult) => gateResult.name).join(", ")}`);
    }
  }

  if (graph.assumptions.length >= 4) {
    blockers.push("the graph still relies on several assumptions and needs more evidence before scaling scope");
  }

  if (reviewGateRequired) {
    blockers.push("human review remains mandatory before external claims or launch decisions in this domain");
  }

  return dedupe(blockers).slice(0, 8);
}

function buildGoSignals({
  blueprint,
  currentRun,
  hasEvidenceReport,
  evidenceReport,
  gatePassRate,
  kpiPassRate,
  evidenceSatisfactionRate
}) {
  const signals = [];

  if (blueprint.readiness.readinessBand === "high") {
    signals.push("the MVP blueprint is already in the high-readiness band");
  } else if (blueprint.readiness.readinessBand === "medium") {
    signals.push("the MVP blueprint is in the medium-readiness band with a narrow enough scope");
  }

  if (currentRun?.status === "completed") {
    signals.push("at least one validation run completed successfully from an execution perspective");
  }

  if (hasEvidenceReport && evidenceReport.summary.validationOutcome === "pass") {
    signals.push("the latest completed validation report passed the current gates");
  }

  if (gatePassRate >= 0.8) {
    signals.push("most validation gates are already passing");
  }

  if (kpiPassRate >= 0.75) {
    signals.push("the KPI layer is converging on the target thresholds");
  }

  if (evidenceSatisfactionRate >= 0.75) {
    signals.push("the evidence matrix already covers most traced requirements");
  }

  if (blueprint.inference.projectShape === "single_domain") {
    signals.push("the current MVP remains focused on one dominant domain");
  }

  return dedupe(signals).slice(0, 8);
}

function decideRecommendation({
  currentRun,
  hasEvidenceReport,
  evidenceReport,
  reviewGateRequired,
  pilotFitScore
}) {
  if (currentRun?.status === "queued" || currentRun?.status === "running") {
    return {
      code: "wait_for_baseline_run",
      status: "in_progress",
      rationale: "The baseline run is not finished yet, so TwinTest should wait for real evidence before deciding."
    };
  }

  if (!hasEvidenceReport) {
    return {
      code: "collect_baseline_evidence",
      status: "blocked",
      rationale: "A decision without at least one completed validation report would be weak and non-auditable."
    };
  }

  if (currentRun?.status === "failed" || evidenceReport.summary.validationOutcome !== "pass") {
    return {
      code: "iterate_before_pilot",
      status: "iterate",
      rationale: "The current validation evidence is not strong enough to justify a pilot without another iteration."
    };
  }

  if (reviewGateRequired) {
    return {
      code: "human_review_gate",
      status: "gated_review",
      rationale: "The technical baseline looks promising, but this domain still requires a human review gate before claims or launch."
    };
  }

  if (pilotFitScore >= 0.78) {
    return {
      code: "proceed_to_pilot",
      status: "pilot_candidate",
      rationale: "The MVP scope is narrow, the report passed, and the evidence posture is strong enough for a bounded pilot."
    };
  }

  return {
    code: "iterate_before_pilot",
    status: "iterate",
    rationale: "The MVP is close, but the current evidence suggests one more tightening cycle before a pilot."
  };
}

function buildNextBuildSteps({ blueprint, evidenceReport, recommendation }) {
  const steps = [];

  if (recommendation.code === "collect_baseline_evidence") {
    steps.push("queue and complete the first validation run before making any launch decision");
  }

  if (recommendation.code === "wait_for_baseline_run") {
    steps.push("wait for the baseline run to finish and refresh the MVP decision immediately after");
  }

  if (evidenceReport) {
    const failedGates = evidenceReport.gateResults.filter((gateResult) => !gateResult.passed);

    for (const gateResult of failedGates.slice(0, 3)) {
      steps.push(`raise ${gateResult.name} above its current threshold before expanding the MVP surface`);
    }
  }

  steps.push(...blueprint.nextActions);

  if (recommendation.code === "proceed_to_pilot") {
    steps.push("prepare a bounded pilot with one workflow, one target user segment and one success metric");
  }

  return dedupe(steps).slice(0, 8);
}

function buildPilotScope(blueprint) {
  return {
    targetWorkflow: blueprint.mvp.firstUserJourney[0],
    deliverySlice: blueprint.mvp.includedFeatures.slice(0, 3),
    deferredScope: blueprint.mvp.deferredFeatures.slice(0, 3)
  };
}

function buildSuccessMetric(blueprint, evidenceReport) {
  const initialKpi = blueprint.validation.initialKpis[0];
  const reportedKpi = evidenceReport?.kpiResults?.[0];

  return {
    name: reportedKpi?.name || initialKpi?.name || "Primary MVP KPI",
    threshold: reportedKpi?.threshold ?? initialKpi?.threshold ?? null,
    metricKey: reportedKpi?.metricKey || initialKpi?.metricKey || null,
    currentValue: reportedKpi?.value ?? null
  };
}

function buildAcceptanceRule(evidenceReport, blueprint) {
  const gate = evidenceReport?.gateResults?.find((gateResult) => gateResult.severity === "critical")
    || evidenceReport?.gateResults?.[0];

  if (gate) {
    return `Proceed only if ${gate.name} stays above ${gate.threshold}.`;
  }

  const blueprintGate = blueprint.validation.initialGates[0];
  return blueprintGate
    ? `Proceed only if ${blueprintGate.name} stays above ${blueprintGate.threshold}.`
    : "Proceed only if the primary gate remains above its threshold.";
}

function buildClaimBoundary({ graph, hasEvidenceReport, evidenceReport, reviewGateRequired }) {
  if (!hasEvidenceReport) {
    return "screening_only";
  }

  if (reviewGateRequired) {
    return "review_required_before_external_claims";
  }

  return evidenceReport.summary.validationOutcome === "pass"
    ? graph.domainIds.includes("general_systems")
      ? "bounded_pilot_claims"
      : "technical_pilot_claims"
    : "screening_only";
}

function ratio(part, total) {
  return total ? part / total : 0;
}

function dedupe(items) {
  return [...new Set(items.filter(Boolean))];
}
