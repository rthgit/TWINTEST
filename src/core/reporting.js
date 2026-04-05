import { average, clamp, createId } from "./id.js";
import { executeBoundSolver } from "./solver-adapters.js";

export async function executeValidationRun({
  project,
  compilation,
  run,
  workspaceRoot
}) {
  const graph = compilation.graph;
  const telemetryEvents = [];
  const scenarioResults = [];
  const allArtifacts = [];
  let sequence = 1;

  telemetryEvents.push(createTelemetryEvent({
    runId: run.id,
    sequence: sequence++,
    type: "run.started",
    level: "info",
    message: `Validation run ${run.id} started.`,
    data: {
      projectId: project.id,
      compilationId: compilation.id,
      realExecution: true
    }
  }));

  const selectedScenarioIds = new Set(
    run.selectedScenarioIds?.length
      ? run.selectedScenarioIds
      : graph.scenarios.map((scenario) => scenario.id)
  );
  const selectedScenarios = graph.scenarios.filter((scenario) => selectedScenarioIds.has(scenario.id));

  for (const scenario of selectedScenarios) {
    telemetryEvents.push(createTelemetryEvent({
      runId: run.id,
      sequence: sequence++,
      type: "scenario.started",
      level: "info",
      message: `${scenario.name} started.`,
      data: {
        scenarioId: scenario.id,
        scenarioType: scenario.type
      }
    }));

    const { scenarioResult, telemetry, artifacts } = await executeScenario({
      project,
      graph,
      run,
      scenario,
      workspaceRoot
    });

    scenarioResults.push(scenarioResult);
    telemetryEvents.push(
      ...telemetry.map((event) => ({
        ...event,
        sequence: sequence++
      }))
    );
    allArtifacts.push(...artifacts);

    telemetryEvents.push(createTelemetryEvent({
      runId: run.id,
      sequence: sequence++,
      type: "scenario.completed",
      level: scenarioResult.passed ? "info" : "warning",
      message: `${scenario.name} completed with ${scenarioResult.passed ? "pass" : "fail"}.`,
      data: {
        scenarioId: scenario.id,
        passed: scenarioResult.passed,
        score: scenarioResult.score
      }
    }));
  }

  const kpiResults = graph.kpis.map((kpi) => buildKpiResult(kpi, scenarioResults));
  validateKpiCoverage(graph, kpiResults, selectedScenarios);
  const gateResults = graph.gates.map((gate) => buildGateResult(gate, kpiResults));
  const evidenceMatrix = buildEvidenceMatrix(graph, scenarioResults, gateResults, allArtifacts);
  const confidence = computeConfidence(graph, gateResults, scenarioResults);
  const validationOutcome = gateResults.every((gateResult) => gateResult.passed) ? "pass" : "fail";

  telemetryEvents.push(createTelemetryEvent({
    runId: run.id,
    sequence: sequence++,
    type: "run.completed",
    level: validationOutcome === "pass" ? "info" : "warning",
    message: `Validation run ${run.id} completed with outcome ${validationOutcome}.`,
    data: {
      validationOutcome,
      confidence
    }
  }));

  const reportArtifacts = dedupeArtifacts(allArtifacts).concat([
    {
      id: createId("artifact"),
      kind: "validation_report",
      path: null,
      label: "Validation report"
    }
  ]);

  const report = {
    id: createId("report"),
    runId: run.id,
    projectId: project.id,
    workspaceId: run.workspaceId,
    compilationId: compilation.id,
    createdAt: new Date().toISOString(),
    summary: {
      validationOutcome,
      confidence,
      dominantDomainId: graph.dominantDomainId,
      domains: graph.domainIds,
      scenarioCoverage: selectedScenarios.length,
      passRate: Number(
        (
          scenarioResults.filter((scenarioResult) => scenarioResult.passed).length /
          Math.max(1, scenarioResults.length)
        ).toFixed(3)
      ),
      realExecution: true
    },
    kpiResults,
    gateResults,
    scenarioResults,
    evidenceMatrix,
    assumptions: graph.assumptions,
    templatesUsed: graph.agentTemplates.map((template) => ({
      id: template.id,
      name: template.name,
      category: template.category
    })),
    solverBindings: graph.solverBindings,
    artifacts: reportArtifacts
  };

  return {
    report,
    scenarioResults,
    telemetryEvents
  };
}

async function executeScenario({ project, graph, run, scenario, workspaceRoot }) {
  const bindings = graph.solverBindings.filter((binding) => scenario.componentIds.includes(binding.componentId));

  if (!bindings.length) {
    throw new Error(`Scenario ${scenario.id} has no solver bindings.`);
  }

  const telemetry = [];
  const bindingResults = [];
  const artifacts = [];

  for (const binding of bindings) {
    telemetry.push(createTelemetryEvent({
      runId: run.id,
      type: "solver.started",
      level: "info",
      message: `Binding ${binding.id} started for scenario ${scenario.id}.`,
      data: {
        scenarioId: scenario.id,
        bindingId: binding.id,
        solver: binding.solver
      }
    }));

    const result = await executeBoundSolver({
      binding,
      scenario,
      graph,
      project,
      workspaceRoot
    });

    bindingResults.push(result);
    artifacts.push(...result.artifacts);

    telemetry.push(createTelemetryEvent({
      runId: run.id,
      type: "solver.completed",
      level: "info",
      message: `Binding ${binding.id} completed for scenario ${scenario.id}.`,
      data: {
        scenarioId: scenario.id,
        bindingId: binding.id,
        solver: binding.solver
      }
    }));
  }

  const aggregatedMetrics = aggregateBindingMetrics(bindingResults);
  const scenarioScore = computeScenarioScore(graph, scenario, aggregatedMetrics);
  const scenarioArtifacts = dedupeArtifacts(artifacts);

  return {
    scenarioResult: {
      id: createId("scenario_run"),
      runId: run.id,
      scenarioId: scenario.id,
      scenarioType: scenario.type,
      name: scenario.name,
      score: Number(scenarioScore.toFixed(6)),
      passed: scenarioScore >= scenario.passThreshold,
      metrics: aggregatedMetrics,
      solverExecutions: bindingResults.map((result) => ({
        executionId: result.executionId,
        bindingId: result.bindingId,
        solver: result.solver,
        adapterType: result.adapterType,
        metrics: result.metrics,
        metadata: result.metadata
      })),
      artifactIds: scenarioArtifacts.map((artifact) => artifact.id)
    },
    telemetry,
    artifacts: scenarioArtifacts
  };
}

function aggregateBindingMetrics(bindingResults) {
  const metricGroups = new Map();

  for (const result of bindingResults) {
    for (const [metricKey, metricValue] of Object.entries(result.metrics || {})) {
      if (!metricGroups.has(metricKey)) {
        metricGroups.set(metricKey, []);
      }

      metricGroups.get(metricKey).push(metricValue);
    }
  }

  return Object.fromEntries(
    [...metricGroups.entries()].map(([metricKey, values]) => [
      metricKey,
      Number(average(values).toFixed(6))
    ])
  );
}

function computeScenarioScore(graph, scenario, aggregatedMetrics) {
  const relevantMetricKeys = scenario.kpiIds
    .map((kpiId) => graph.kpis.find((kpi) => kpi.id === kpiId)?.metricKey)
    .filter(Boolean);

  const scoreInputs = relevantMetricKeys.map((metricKey) => aggregatedMetrics[metricKey]).filter(Number.isFinite);

  if (!scoreInputs.length) {
    throw new Error(`Scenario ${scenario.id} did not produce any KPI-aligned metrics.`);
  }

  return clamp(average(scoreInputs), 0, 1);
}

function buildKpiResult(kpi, scenarioResults) {
  const relevantScenarios = scenarioResults.filter((scenarioResult) =>
    kpi.relevantScenarioTypes.includes(scenarioResult.scenarioType)
  );
  const rawValues = relevantScenarios
    .map((scenarioResult) => scenarioResult.metrics[kpi.metricKey])
    .filter(Number.isFinite);
  const value = rawValues.length ? Number(average(rawValues).toFixed(6)) : null;

  return {
    kpiId: kpi.id,
    name: kpi.name,
    metricKey: kpi.metricKey,
    threshold: kpi.threshold,
    unit: kpi.unit,
    value,
    passed: value !== null ? value >= kpi.threshold : false,
    scenarioIds: relevantScenarios.map((scenarioResult) => scenarioResult.scenarioId)
  };
}

function buildGateResult(gate, kpiResults) {
  const linkedKpi = kpiResults.find((kpiResult) => kpiResult.kpiId === gate.kpiId);
  const value = linkedKpi?.value ?? null;

  return {
    gateId: gate.id,
    name: gate.name,
    threshold: gate.threshold,
    severity: gate.severity,
    value,
    passed: value !== null ? value >= gate.threshold : false,
    kpiId: gate.kpiId
  };
}

function buildEvidenceMatrix(graph, scenarioResults, gateResults, artifacts) {
  const artifactIds = dedupeArtifacts(artifacts).map((artifact) => artifact.id);

  return graph.traceability.map((trace) => {
    const linkedScenarioResults = scenarioResults.filter((scenarioResult) =>
      trace.scenarioIds.includes(scenarioResult.scenarioId)
    );
    const linkedGateResults = gateResults.filter((gateResult) =>
      trace.gateIds.includes(gateResult.gateId)
    );
    const requirement = graph.requirements.find((item) => item.id === trace.requirementId);

    return {
      requirementId: trace.requirementId,
      requirement: requirement?.text || "Requirement unavailable",
      scenarioIds: trace.scenarioIds,
      gateIds: trace.gateIds,
      evidenceArtifactIds: artifactIds,
      status:
        linkedScenarioResults.length > 0 &&
        linkedScenarioResults.every((scenarioResult) => scenarioResult.passed) &&
        linkedGateResults.every((gateResult) => gateResult.passed)
          ? "satisfied"
          : "needs_review"
    };
  });
}

function computeConfidence(graph, gateResults, scenarioResults) {
  const boundCoverage =
    graph.solverBindings.filter((binding) => binding.status === "bound").length /
    Math.max(1, graph.solverBindings.length);
  const gatePassRate =
    gateResults.filter((gateResult) => gateResult.passed).length / Math.max(1, gateResults.length);
  const scenarioEvidenceRate =
    scenarioResults.filter((scenarioResult) => Object.keys(scenarioResult.metrics || {}).length > 0).length /
    Math.max(1, scenarioResults.length);
  const assumptionPenalty = Math.min(0.25, graph.assumptions.length * 0.02);

  return Number(
    clamp(
      0.55 + boundCoverage * 0.2 + gatePassRate * 0.15 + scenarioEvidenceRate * 0.1 - assumptionPenalty,
      0,
      1
    ).toFixed(6)
  );
}

function validateKpiCoverage(graph, kpiResults, selectedScenarios) {
  const missingKpis = kpiResults
    .filter((kpiResult) => kpiResult.value === null)
    .filter((kpiResult) =>
      selectedScenarios.some((scenario) =>
        graph.kpis.find((kpi) => kpi.id === kpiResult.kpiId)?.relevantScenarioTypes.includes(scenario.type)
      )
    );

  if (missingKpis.length) {
    throw new Error(
      `Missing real metrics for KPI(s): ${missingKpis.map((kpiResult) => kpiResult.name).join(", ")}.`
    );
  }
}

function dedupeArtifacts(artifacts) {
  const seen = new Set();

  return artifacts.filter((artifact) => {
    const key = `${artifact.kind}:${artifact.path || artifact.id}:${artifact.label}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function createTelemetryEvent({ runId, sequence = 0, type, level, message, data }) {
  return {
    id: createId("telemetry"),
    runId,
    sequence,
    type,
    level,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}
