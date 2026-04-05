import { createId } from "./id.js";

const REVIEW_GATED_DOMAINS = new Set(["medical", "cosmetic_science", "space_cosmology"]);

export function createPilotWorkbench({
  workspaceId,
  project,
  graph,
  blueprint,
  decision,
  currentRun = null,
  evidenceReport = null
}) {
  const artifactChecklist = buildArtifactChecklist({
    graph,
    blueprint,
    decision,
    evidenceReport
  });
  const backlog = buildBacklog({
    blueprint,
    decision,
    artifactChecklist,
    evidenceReport
  });

  return {
    id: createId("pilot_workbench"),
    workspaceId,
    projectId: project.id,
    compilationId: project.latestCompilationId,
    blueprintId: blueprint.id,
    decisionId: decision.id,
    currentRunId: currentRun?.id || null,
    reportId: evidenceReport?.id || null,
    createdAt: new Date().toISOString(),
    summary: {
      stage: inferWorkbenchStage({
        decision,
        currentRun,
        evidenceReport
      }),
      recommendation: decision.summary.recommendation,
      status: decision.summary.status,
      dominantDomainId: graph.dominantDomainId,
      targetUser: decision.summary.targetUser
    },
    backlog,
    artifactChecklist,
    pilotPacket: {
      targetUser: decision.pilotPlan.targetUser,
      pilotScope: decision.pilotPlan.pilotScope,
      successMetric: decision.pilotPlan.successMetric,
      acceptanceRule: decision.pilotPlan.acceptanceRule,
      claimBoundary: decision.pilotPlan.claimBoundary
    },
    executionBoard: {
      runStatus: currentRun?.status || "not_started",
      validationOutcome: evidenceReport?.summary.validationOutcome || null,
      scenarioCoverage: evidenceReport?.summary.scenarioCoverage || 0,
      confidence: evidenceReport?.summary.confidence || null,
      realExecution: evidenceReport?.summary.realExecution || false
    },
    nextApiSequence: buildNextApiSequence({
      decision,
      currentRun,
      evidenceReport
    })
  };
}

function buildArtifactChecklist({ graph, blueprint, decision, evidenceReport }) {
  const requested = blueprint.validation.evidenceNeeds || [];
  const artifactPaths = new Set((evidenceReport?.artifacts || []).map((artifact) => artifact.path).filter(Boolean));
  const requirements = [];

  for (const label of requested) {
    requirements.push({
      id: slugChecklist(label),
      label,
      status: artifactPaths.size ? "partial" : "missing",
      requiredFor: "pilot_readiness",
      source: "blueprint_evidence_need"
    });
  }

  if (graph.parameters.some((parameter) => parameter.source === "unresolved")) {
    requirements.push({
      id: "numeric-targets",
      label: "numeric targets and thresholds for unresolved parameters",
      status: "missing",
      requiredFor: "solver_readiness",
      source: "graph_unresolved_parameters"
    });
  }

  if ((evidenceReport?.artifacts || []).length) {
    requirements.push({
      id: "baseline-report",
      label: "baseline validation report and attached artifacts",
      status: "ready",
      requiredFor: "pilot_review",
      source: "report_artifacts"
    });
  } else {
    requirements.push({
      id: "baseline-report",
      label: "baseline validation report and attached artifacts",
      status: "missing",
      requiredFor: "pilot_review",
      source: "report_artifacts"
    });
  }

  if (graph.domainIds.some((domainId) => REVIEW_GATED_DOMAINS.has(domainId))) {
    requirements.push({
      id: "human-review",
      label: "human review packet for claims and launch gating",
      status: decision.summary.status === "gated_review" ? "required" : "pending",
      requiredFor: "claim_release",
      source: "review_gated_domain"
    });
  }

  return dedupeById(requirements).slice(0, 12);
}

function buildBacklog({ blueprint, decision, artifactChecklist, evidenceReport }) {
  const now = [];
  const next = [];
  const later = [];

  if (!evidenceReport) {
    now.push("complete the first baseline run and collect the first report");
  }

  now.push(...decision.blockers);
  now.push(...blueprint.nextActions.slice(0, 3));

  for (const item of artifactChecklist.filter((entry) => entry.status !== "ready").slice(0, 3)) {
    now.push(`collect ${item.label}`);
  }

  next.push(...decision.nextBuildSteps.slice(0, 4));
  next.push(...blueprint.mvp.includedFeatures.slice(0, 3).map((feature) => `implement ${feature}`));

  later.push(...blueprint.mvp.deferredFeatures.slice(0, 4).map((feature) => `defer ${feature}`));
  later.push("expand scope only after the bounded pilot proves the main workflow");

  return {
    now: dedupe(now).slice(0, 8),
    next: dedupe(next).slice(0, 8),
    later: dedupe(later).slice(0, 8)
  };
}

function buildNextApiSequence({ decision, currentRun, evidenceReport }) {
  const sequence = [];

  if (!currentRun) {
    sequence.push("POST /projects/{id}/runs");
  } else if (currentRun.status === "queued" || currentRun.status === "running") {
    sequence.push("GET /runs/{id}");
  }

  if (currentRun?.status === "completed" && evidenceReport) {
    sequence.push("GET /runs/{id}/report");
    sequence.push("POST /projects/{id}/mvp-decision");
  }

  sequence.push("GET /projects/{id}/pilot-workbench");

  return dedupe(sequence);
}

function inferWorkbenchStage({ decision, currentRun, evidenceReport }) {
  if (!currentRun) {
    return "bootstrap_ready";
  }

  if (currentRun.status === "queued" || currentRun.status === "running") {
    return "baseline_running";
  }

  if (!evidenceReport) {
    return "awaiting_evidence";
  }

  if (decision.summary.status === "pilot_candidate") {
    return "pilot_candidate";
  }

  if (decision.summary.status === "gated_review") {
    return "review_gate";
  }

  return "iteration_loop";
}

function slugChecklist(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 48);
}

function dedupe(items) {
  return [...new Set(items.filter(Boolean))];
}

function dedupeById(items) {
  const seen = new Set();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}
