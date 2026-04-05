import { average, clamp, createId } from "./id.js";
import { domainBlueprints } from "./catalog.js";

const DOMAIN_PRODUCT_GUIDES = {
  general_systems: {
    targetUserProfile: "founder, product owner or operations lead who needs one core workflow to work end-to-end",
    coreValue: "turn a raw idea into one measurable workflow with visible usage, latency and compliance signals",
    mvpFeatures: [
      "single primary user workflow",
      "one operator-facing control panel",
      "basic service runtime with latency tracking",
      "guardrail and policy checks on the critical path"
    ],
    deferredFeatures: [
      "multi-tenant permissions",
      "advanced billing or marketplace features",
      "secondary workflows and edge automations",
      "custom analytics beyond MVP KPIs"
    ],
    evidenceNeeds: [
      "one clear target user persona",
      "one outcome metric for the core workflow",
      "basic SLA or response-time expectation",
      "minimum policy or compliance guardrails"
    ],
    firstMilestone: "A first user completes the main workflow end-to-end and TwinTest can validate the service path."
  },
  compute_semiconductor: {
    targetUserProfile: "chip architect or systems engineer validating throughput, latency and thermal behavior",
    coreValue: "prove the architecture meets performance and observability guardrails before high-cost implementation",
    mvpFeatures: [
      "benchmark intake and workload selection",
      "throughput and latency scoreboard",
      "thermal and power guardrail view",
      "traceable solver and evidence report"
    ],
    deferredFeatures: [
      "full floorplan co-simulation",
      "cluster-scale orchestration",
      "advanced multi-workload scheduling",
      "custom silicon sign-off automation"
    ],
    evidenceNeeds: [
      "target workload mix",
      "latency and power budgets",
      "telemetry or benchmark trace bundle"
    ],
    firstMilestone: "The benchmark path can be replayed and compared against throughput, latency and energy gates."
  },
  mechatronics: {
    targetUserProfile: "product engineer validating a controlled electromechanical device",
    coreValue: "de-risk the first controllable machine behavior before building a large software surface",
    mvpFeatures: [
      "core actuation cycle",
      "safety interlock path",
      "thermal and vibration monitoring",
      "fault and failover validation report"
    ],
    deferredFeatures: [
      "full production optimization",
      "advanced maintenance analytics",
      "fleet-scale telemetry",
      "secondary machine modes"
    ],
    evidenceNeeds: [
      "actuation target",
      "safety trip thresholds",
      "thermal and vibration limits"
    ],
    firstMilestone: "The machine completes the core cycle while respecting vibration, thermal and safety gates."
  },
  fluidic_energy: {
    targetUserProfile: "system engineer validating flow, pressure and thermal behavior",
    coreValue: "show the fluid/energy loop can stay stable before custom controls and dashboards expand",
    mvpFeatures: [
      "primary flow path",
      "pressure and thermal guardrails",
      "leak or instability detection",
      "scenario-based validation report"
    ],
    deferredFeatures: [
      "rich network optimization",
      "advanced maintenance forecasting",
      "multi-asset dispatch"
    ],
    evidenceNeeds: [
      "flow target",
      "pressure limit",
      "thermal envelope",
      "reliability trigger points"
    ],
    firstMilestone: "The loop remains within flow, pressure and thermal constraints under nominal and stressed scenarios."
  },
  vehicle_systems: {
    targetUserProfile: "vehicle subsystem engineer or product team validating one mission-critical subsystem",
    coreValue: "prove one subsystem can meet range, braking or failover targets before scaling integration",
    mvpFeatures: [
      "one drive or braking workflow",
      "thermal safety envelope",
      "supervisory failover path",
      "traceable report against safety gates"
    ],
    deferredFeatures: [
      "full-vehicle digital twin",
      "fleet analytics",
      "multi-drive-cycle optimization"
    ],
    evidenceNeeds: [
      "range or torque target",
      "brake response expectation",
      "thermal envelope limits"
    ],
    firstMilestone: "The selected subsystem survives key drive, fault and failover scenarios."
  },
  materials_chemistry: {
    targetUserProfile: "materials or process engineer screening conversion, transport and formulation behavior",
    coreValue: "identify whether the chemistry or material stack is viable before deep lab or pilot investment",
    mvpFeatures: [
      "reaction or conversion screen",
      "barrier or transport margin",
      "formulation rheology view",
      "surface interaction summary"
    ],
    deferredFeatures: [
      "full lab workflow orchestration",
      "rich process optimization",
      "large screening matrix automation"
    ],
    evidenceNeeds: [
      "reaction target",
      "transport or retention target",
      "viscosity or rheology constraints"
    ],
    firstMilestone: "The formulation or process passes first-pass conversion, transport and stability screens."
  },
  cosmetic_science: {
    targetUserProfile: "formulation lead validating dermal margin, stability and product consistency",
    coreValue: "turn a cosmetic concept into a governed formulation MVP with clear safety and quality gates",
    mvpFeatures: [
      "dermal exposure screen",
      "stability window",
      "preservative evidence bundle",
      "sensory consistency check"
    ],
    deferredFeatures: [
      "full regulatory dossier automation",
      "multi-region release workflows",
      "advanced panel analytics"
    ],
    evidenceNeeds: [
      "intended use and exposure level",
      "shelf-life target",
      "challenge-test evidence",
      "sensory acceptance threshold"
    ],
    firstMilestone: "The formulation clears dermal, stability and quality gates for a first controlled pilot."
  },
  space_cosmology: {
    targetUserProfile: "science or mission team validating one observation or inference workflow",
    coreValue: "show the observation-to-inference chain is coherent before scaling the scientific product",
    mvpFeatures: [
      "mission geometry screen",
      "observation calibration path",
      "core inference or fit report",
      "artifact-backed evidence trail"
    ],
    deferredFeatures: [
      "full scientific pipeline orchestration",
      "large survey-scale compute automation",
      "advanced collaborative review tooling"
    ],
    evidenceNeeds: [
      "observation quality target",
      "mission geometry constraints",
      "fit quality threshold"
    ],
    firstMilestone: "The observation chain and fit path hold together on one bounded use case."
  }
};

const GENERIC_PRODUCT_GUIDE = {
  targetUserProfile: "builder or domain owner trying to validate whether the idea can become a narrow, testable MVP",
  coreValue: "reduce the idea to one workflow, one success metric and one evidence-backed validation path",
  mvpFeatures: [
    "one critical workflow",
    "one measurable success metric",
    "one validation report path",
    "one review loop for constraints and risks"
  ],
  deferredFeatures: [
    "secondary user journeys",
    "non-critical integrations",
    "broad customization"
  ],
  evidenceNeeds: [
    "clear user intent",
    "one success metric",
    "minimum operational constraints"
  ],
  firstMilestone: "A first user can complete one workflow and TwinTest can score it."
};

export function suggestProjectName(idea) {
  const clean = String(idea || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) {
    return "TwinTest MVP Concept";
  }

  const basis = clean
    .split(/[.!?\n]/)
    .map((part) => part.trim())
    .find(Boolean) || clean;
  const words = basis.split(/\s+/).slice(0, 6);

  return words
    .map((word) => word.replace(/[^\p{L}\p{N}-]/gu, ""))
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ") || "TwinTest MVP Concept";
}

export function buildIdeaDocumentMarkdown({
  idea,
  targetUser = "",
  desiredOutcome = "",
  constraints = [],
  targetDomains = []
}) {
  const normalizedConstraints = normalizeList(constraints);
  const lines = [
    "# Idea Intake",
    "",
    "## Idea",
    idea.trim()
  ];

  if (targetUser.trim()) {
    lines.push("", "## Target User", targetUser.trim());
  }

  if (desiredOutcome.trim()) {
    lines.push("", "## Desired Outcome", desiredOutcome.trim());
  }

  if (targetDomains.length) {
    lines.push("", "## Requested Domains", targetDomains.join(", "));
  }

  if (normalizedConstraints.length) {
    lines.push("", "## Constraints", ...normalizedConstraints.map((item) => `- ${item}`));
  }

  lines.push(
    "",
    "## MVP Intent",
    "TwinTest should transform this idea into a testable MVP with one narrow workflow, measurable KPIs, explicit gates and a first executable validation path."
  );

  return lines.join("\n");
}

export function createMvpBlueprint({
  workspaceId,
  project,
  graph,
  readiness,
  ideaInput,
  autobindMode = "none",
  queueRun = false
}) {
  const guides = graph.domainIds.map((domainId) => DOMAIN_PRODUCT_GUIDES[domainId] || GENERIC_PRODUCT_GUIDE);
  const dominantGuide = DOMAIN_PRODUCT_GUIDES[graph.dominantDomainId] || guides[0] || GENERIC_PRODUCT_GUIDE;
  const unresolvedRatio = graph.parameters.length
    ? readiness.unresolvedParameters / graph.parameters.length
    : 0;
  const bindingCoverage = readiness.totalSolverBindings
    ? readiness.boundSolverBindings / readiness.totalSolverBindings
    : 0;
  const ideaSpecificity = clamp(String(ideaInput.idea || "").trim().length / 320, 0.35, 1);
  const scopePenalty = Math.max(0, graph.domainIds.length - 1) * 0.05;
  const testabilityScore = clamp(0.45 + bindingCoverage * 0.3 + (1 - unresolvedRatio) * 0.15 - scopePenalty, 0, 1);
  const mvpClarityScore = clamp(
    0.36 +
      ideaSpecificity * 0.36 +
      (ideaInput.targetUser ? 0.12 : 0) +
      (ideaInput.desiredOutcome ? 0.12 : 0) -
      scopePenalty,
    0,
    1
  );
  const buildabilityScore = clamp(
    0.42 +
      bindingCoverage * 0.2 +
      (graph.components.length <= 6 ? 0.12 : 0.06) +
      (graph.domainIds.includes("general_systems") ? 0.12 : 0) -
      unresolvedRatio * 0.16,
    0,
    1
  );
  const overallScore = Number(average([testabilityScore, mvpClarityScore, buildabilityScore]).toFixed(6));
  const readinessBand = overallScore >= 0.8
    ? "high"
    : overallScore >= 0.62
      ? "medium"
      : "low";

  const includedFeatures = collectUnique(guides.flatMap((guide) => guide.mvpFeatures)).slice(0, 6);
  const deferredFeatures = collectUnique(guides.flatMap((guide) => guide.deferredFeatures)).slice(0, 6);
  const evidenceNeeds = collectUnique(guides.flatMap((guide) => guide.evidenceNeeds));
  const initialScenarios = graph.scenarios.slice(0, 4).map((scenario) => ({
    id: scenario.id,
    type: scenario.type,
    name: scenario.name,
    priority: scenario.priority
  }));
  const initialKpis = graph.kpis.slice(0, 4).map((kpi) => ({
    id: kpi.id,
    name: kpi.name,
    metricKey: kpi.metricKey,
    threshold: kpi.threshold
  }));
  const initialGates = graph.gates.slice(0, 4).map((gate) => ({
    id: gate.id,
    name: gate.name,
    severity: gate.severity,
    threshold: gate.threshold
  }));

  if (readiness.unresolvedParameters > 0) {
    evidenceNeeds.push("numeric limits and target operating values for unresolved parameters");
  }

  const nextActions = buildNextActions({
    graph,
    readiness,
    ideaInput,
    autobindMode,
    queueRun
  });

  const warnings = buildWarnings({
    graph,
    readiness
  });

  return {
    id: createId("mvp_blueprint"),
    workspaceId,
    projectId: project.id,
    compilationId: project.latestCompilationId,
    createdAt: new Date().toISOString(),
    title: suggestProjectName(ideaInput.idea),
    ideaInput: {
      idea: ideaInput.idea,
      targetUser: ideaInput.targetUser || "",
      desiredOutcome: ideaInput.desiredOutcome || "",
      constraints: normalizeList(ideaInput.constraints || []),
      requestedDomains: ideaInput.targetDomains || [],
      autobindMode,
      queueRun
    },
    inference: {
      dominantDomainId: graph.dominantDomainId,
      domainIds: graph.domainIds,
      targetUserProfile: ideaInput.targetUser || dominantGuide.targetUserProfile,
      coreValue: dominantGuide.coreValue,
      projectShape: graph.domainIds.length > 1 ? "multi_domain" : "single_domain"
    },
    mvp: {
      productStatement: buildProductStatement({
        project,
        ideaInput,
        dominantGuide
      }),
      includedFeatures,
      deferredFeatures,
      firstUserJourney: [
        "capture one real user request or primary workflow input",
        "execute the core service or system response path",
        "measure KPI output and gate status",
        "review evidence and decide whether to iterate or narrow scope"
      ],
      technicalSpine: [
        `compile the idea into the ${graph.dominantDomainId} system graph`,
        "bind the narrowest valid solver path for each component",
        "run nominal, boundary and failure scenarios first",
        "ship only the workflow that can be validated against explicit gates"
      ],
      firstMilestone: dominantGuide.firstMilestone
    },
    validation: {
      firstRunPath: {
        recommendedAutobind: autobindMode === "none" ? "builtin" : autobindMode,
        queueRunRequested: queueRun,
        canExecuteImmediately: readiness.unboundSolverBindings === 0,
        primaryEvidenceMode: recommendEvidenceMode(graph),
        recommendedNextEndpoint:
          readiness.unboundSolverBindings === 0
            ? "POST /projects/{id}/runs"
            : autobindMode === "ai"
              ? "POST /projects/{id}/solver-bindings/autobind-ai"
              : "POST /projects/{id}/solver-bindings/autobind-builtin"
      },
      initialScenarios,
      initialKpis,
      initialGates,
      evidenceNeeds: collectUnique(evidenceNeeds).slice(0, 8)
    },
    readiness: {
      testabilityScore: Number(testabilityScore.toFixed(6)),
      mvpClarityScore: Number(mvpClarityScore.toFixed(6)),
      buildabilityScore: Number(buildabilityScore.toFixed(6)),
      overallScore,
      readinessBand
    },
    nextActions,
    warnings
  };
}

function buildProductStatement({ project, ideaInput, dominantGuide }) {
  const outcome = ideaInput.desiredOutcome?.trim()
    || "deliver one narrow workflow with measurable business or technical value";
  const user = ideaInput.targetUser?.trim()
    || dominantGuide.targetUserProfile;

  return `${project.name} should help ${user} ${outcome}.`;
}

function buildNextActions({ graph, readiness, ideaInput, autobindMode, queueRun }) {
  const actions = [];

  if (!ideaInput.targetUser?.trim()) {
    actions.push("declare the first target user explicitly so the MVP scope stays narrow");
  }

  if (!ideaInput.desiredOutcome?.trim()) {
    actions.push("define one success outcome or commercial signal for the first pilot");
  }

  if (readiness.unresolvedParameters > 0) {
    actions.push("upload numeric targets, thresholds or lab constraints for unresolved parameters");
  }

  if (readiness.unboundSolverBindings > 0) {
    actions.push(
      autobindMode === "ai"
        ? "review or rerun AI autobind until every solver binding is resolved"
        : "apply builtin or AI autobind so the first run becomes executable"
    );
  }

  if (graph.domainIds.includes("cosmetic_science")) {
    actions.push("attach challenge-test, stability or sensory evidence bundles before making product claims");
  }

  if (graph.domainIds.includes("space_cosmology")) {
    actions.push("attach calibrated observation or survey artifacts before expanding the scientific scope");
  }

  if (graph.domainIds.includes("general_systems")) {
    actions.push("build only the core workflow and instrument one SLA plus one completion KPI");
  }

  if (!queueRun && readiness.unboundSolverBindings === 0) {
    actions.push("queue the first validation run immediately to get a baseline report");
  }

  return collectUnique(actions).slice(0, 8);
}

function buildWarnings({ graph, readiness }) {
  const warnings = [];

  if (graph.domainIds.length > 1) {
    warnings.push("the idea spans multiple domains; the first MVP should ship one dominant workflow only");
  }

  if (graph.assumptions.length >= 4) {
    warnings.push("the current graph still contains several assumptions and should absorb more evidence before strong claims");
  }

  if (readiness.unresolvedParameters > 0) {
    warnings.push("unresolved parameters reduce confidence and can block strong validation claims");
  }

  if (graph.domainIds.includes("cosmetic_science")) {
    warnings.push("cosmetic claims should remain evidence-backed and human-reviewed");
  }

  if (graph.domainIds.includes("space_cosmology")) {
    warnings.push("scientific inference claims depend on observation quality, not only on reduced-order screening");
  }

  return collectUnique(warnings).slice(0, 6);
}

function recommendEvidenceMode(graph) {
  if (graph.domainIds.some((domainId) => ["cosmetic_science", "space_cosmology"].includes(domainId))) {
    return "artifact_plus_solver";
  }

  if (graph.domainIds.includes("general_systems")) {
    return "solver_plus_usage_metrics";
  }

  return "solver_first";
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return collectUnique(
      value
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    );
  }

  if (typeof value === "string" && value.trim()) {
    return collectUnique(
      value
        .split(/\r?\n|[,;]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    );
  }

  return [];
}

function collectUnique(items) {
  return [...new Set(items.filter(Boolean))];
}

export function listIdeaDomainGuides() {
  return Object.fromEntries(
    Object.keys(domainBlueprints).map((domainId) => [
      domainId,
      DOMAIN_PRODUCT_GUIDES[domainId] || GENERIC_PRODUCT_GUIDE
    ])
  );
}
