import { domainBlueprints, getTemplateById, operatingModeCatalog, scenarioProfiles } from "./catalog.js";
import { createId, slugify } from "./id.js";

export function compileCanonicalGraph({ project, documents, revision, targetDomains = [], systemName }) {
  const textCorpus = buildCorpus(project, documents);
  const selectedDomains = classifyDomains(textCorpus, targetDomains.length ? targetDomains : project.targetDomains);
  const dominantDomainId = pickDominantDomain(textCorpus, selectedDomains);
  const compiledAt = new Date().toISOString();
  const versionId = createId("version");
  const graphId = createId("graph");
  const systemId = createId("system");

  const projectVersion = {
    id: versionId,
    projectId: project.id,
    revision,
    createdAt: compiledAt,
    sourceDocumentIds: documents.map((document) => document.id),
    status: "compiled"
  };

  const graph = {
    id: graphId,
    projectId: project.id,
    projectVersionId: projectVersion.id,
    generatedAt: compiledAt,
    dominantDomainId,
    domainIds: selectedDomains,
    sourceDocumentIds: documents.map((document) => document.id),
    system: {
      id: systemId,
      name: systemName || project.name,
      kind: "System",
      description: project.description,
      domainIds: selectedDomains
    },
    subsystems: [],
    components: [],
    interfaces: [],
    parameters: [],
    stateVariables: [],
    operatingModes: [],
    constraints: [],
    failureModes: [],
    agentTemplates: [],
    agentInstances: [],
    solverBindings: [],
    scenarios: [],
    telemetryStreams: [],
    kpis: [],
    gates: [],
    evidenceArtifacts: [],
    assumptions: [],
    reviewDecisions: [],
    requirements: [],
    traceability: []
  };

  const modeMap = new Map();

  for (const operatingMode of operatingModeCatalog) {
    const operatingModeId = createId("mode");
    graph.operatingModes.push({
      id: operatingModeId,
      systemId,
      key: operatingMode.key,
      name: operatingMode.name,
      description: operatingMode.description
    });
    modeMap.set(operatingMode.key, operatingModeId);
  }

  const selectedTemplateIds = new Set();
  const numericSignals = extractNumericSignals(textCorpus);

  if (!numericSignals.length) {
    graph.assumptions.push({
      id: createId("assumption"),
      severity: "high",
      source: "ingestion",
      message: "No explicit numeric operating limits were extracted from the uploaded material; parameter evidence remains unresolved."
    });
  }

  for (const domainId of selectedDomains) {
    const blueprint = domainBlueprints[domainId];
    const subsystemMap = new Map();
    const componentMap = new Map();
    const kpiMap = new Map();

    for (const subsystemBlueprint of blueprint.subsystems) {
      const subsystemId = createId("subsys");
      subsystemMap.set(subsystemBlueprint.key, subsystemId);
      graph.subsystems.push({
        id: subsystemId,
        systemId,
        domainId,
        name: subsystemBlueprint.name,
        description: subsystemBlueprint.description
      });
    }

    for (const componentBlueprint of blueprint.components) {
      const componentId = createId("comp");
      componentMap.set(componentBlueprint.key, componentId);
      graph.components.push({
        id: componentId,
        systemId,
        subsystemId: subsystemMap.get(componentBlueprint.subsystemKey),
        domainId,
        name: componentBlueprint.name,
        templateId: componentBlueprint.templateId,
        slug: slugify(`${domainId}-${componentBlueprint.name}`)
      });

      for (const parameterName of componentBlueprint.parameters) {
        const extractedValue = numericSignals.find((signal) => signal.label.includes(parameterName.split("_")[0]))?.raw || null;
        graph.parameters.push({
          id: createId("param"),
          componentId,
          domainId,
          name: parameterName,
          value: extractedValue,
          source: extractedValue ? "ingested_document" : "unresolved"
        });
      }

      for (const stateVariableName of componentBlueprint.stateVariables) {
        graph.stateVariables.push({
          id: createId("state"),
          componentId,
          domainId,
          name: stateVariableName
        });
      }

      for (const failureModeName of componentBlueprint.failureModes) {
        graph.failureModes.push({
          id: createId("failure"),
          componentId,
          domainId,
          name: failureModeName,
          severity: inferFailureSeverity(failureModeName)
        });
      }

      const template = getTemplateById(componentBlueprint.templateId);

      if (template && !selectedTemplateIds.has(template.id)) {
        selectedTemplateIds.add(template.id);
        graph.agentTemplates.push(template);
      }

      if (template) {
        const agentInstanceId = createId("agent");
        graph.agentInstances.push({
          id: agentInstanceId,
          componentId,
          templateId: template.id,
          domainId,
          role: template.role,
          confidenceFloor: template.confidenceFloor
        });

        graph.solverBindings.push({
          id: createId("solver"),
          agentInstanceId,
          componentId,
          domainId,
          solver: null,
          compatibleSolvers: template.compatibleSolvers,
          status: "unbound",
          bindingMode: "explicit_required",
          adapterType: null,
          configuration: null,
          declaredCompatible: null,
          requiredParameters: template.requiredParameters
        });
      }
    }

    for (const interfaceBlueprint of blueprint.interfaces) {
      graph.interfaces.push({
        id: createId("ifc"),
        domainId,
        sourceComponentId: componentMap.get(interfaceBlueprint.from),
        targetComponentId: componentMap.get(interfaceBlueprint.to),
        name: interfaceBlueprint.name,
        kind: interfaceBlueprint.kind
      });
    }

    for (const kpiBlueprint of blueprint.kpis) {
      const kpiId = createId("kpi");
      kpiMap.set(kpiBlueprint.key, kpiId);
      graph.kpis.push({
        id: kpiId,
        domainId,
        name: kpiBlueprint.name,
        metricKey: kpiBlueprint.metricKey,
        threshold: kpiBlueprint.threshold,
        unit: kpiBlueprint.unit,
        relevantScenarioTypes: kpiBlueprint.relevantScenarioTypes
      });
    }

    for (const gateBlueprint of blueprint.gates) {
      const gateId = createId("gate");
      graph.gates.push({
        id: gateId,
        domainId,
        name: gateBlueprint.name,
        kpiId: kpiMap.get(gateBlueprint.kpiKey),
        threshold: gateBlueprint.threshold,
        severity: gateBlueprint.severity
      });
      graph.constraints.push({
        id: createId("constraint"),
        gateId,
        domainId,
        name: `${gateBlueprint.name} Constraint`,
        operator: ">=",
        threshold: gateBlueprint.threshold
      });
    }

    graph.scenarios.push(
      ...generateScenarios({
        domainId,
        blueprint,
        componentIds: [...componentMap.values()],
        operatingModeIds: modeMap,
        kpis: graph.kpis.filter((kpi) => kpi.domainId === domainId),
        gates: graph.gates.filter((gate) => gate.domainId === domainId)
      })
    );

    const requirements = extractDomainRequirements(textCorpus, blueprint.requirements);

    for (const requirementText of requirements) {
      graph.requirements.push({
        id: createId("req"),
        domainId,
        text: requirementText,
        source: "document_or_domain_seed"
      });
    }

    for (const assumptionText of blueprint.defaultAssumptions) {
      graph.assumptions.push({
        id: createId("assumption"),
        severity: "medium",
        source: domainId,
        message: assumptionText
      });
    }
  }

  graph.traceability = buildTraceability(graph.requirements, graph.scenarios, graph.kpis, graph.gates);
  graph.evidenceArtifacts.push(
    { id: createId("artifact"), graphId: graph.id, kind: "source_bundle", stage: "compile", name: "Source document bundle" },
    { id: createId("artifact"), graphId: graph.id, kind: "graph_manifest", stage: "compile", name: "Canonical system graph manifest" },
    { id: createId("artifact"), graphId: graph.id, kind: "template_manifest", stage: "compile", name: "Agent template and solver binding manifest" }
  );

  return {
    projectVersion,
    graph
  };
}

export function classifyDomains(text, requestedDomains = []) {
  const validRequestedDomains = requestedDomains.filter((domainId) => domainBlueprints[domainId]);

  if (validRequestedDomains.length) {
    return [...new Set(validRequestedDomains)];
  }

  const matches = Object.values(domainBlueprints)
    .map((domain) => ({
      id: domain.id,
      score: domain.keywords.reduce((sum, keyword) => sum + (text.includes(keyword.toLowerCase()) ? 1 : 0), 0)
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  if (!matches.length) {
    return ["compute_semiconductor"];
  }

  return matches.slice(0, 2).map((entry) => entry.id);
}

function pickDominantDomain(text, selectedDomains) {
  return selectedDomains
    .map((domainId) => ({
      domainId,
      score: domainBlueprints[domainId].keywords.reduce((sum, keyword) => sum + (text.includes(keyword.toLowerCase()) ? 1 : 0), 0)
    }))
    .sort((left, right) => right.score - left.score)[0]?.domainId || selectedDomains[0];
}

function buildCorpus(project, documents) {
  return [project.name, project.description || "", ...documents.flatMap((document) => [document.name, document.content || ""])]
    .join("\n")
    .toLowerCase();
}

function extractNumericSignals(text) {
  const matches = [...text.matchAll(/\b(\d+(?:\.\d+)?)\s?(rpm|w|kw|c|bar|psi|ms|s|v|a|kg|nm|hz|db|km)\b/g)];
  return matches.map((match) => ({ raw: `${match[1]} ${match[2]}`, label: match[2] }));
}

function inferFailureSeverity(failureModeName) {
  if (/(unsafe|runaway|burst|trip_failure|thermal_runaway)/.test(failureModeName)) {
    return "critical";
  }

  if (/(fault|stall|leak|overtemperature|resonance)/.test(failureModeName)) {
    return "high";
  }

  return "medium";
}

function generateScenarios({ domainId, blueprint, componentIds, operatingModeIds, kpis, gates }) {
  return scenarioProfiles
    .map((scenarioProfile) => {
      const scenarioKpiIds = kpis
        .filter((kpi) => kpi.relevantScenarioTypes.includes(scenarioProfile.type))
        .map((kpi) => kpi.id);

      if (!scenarioKpiIds.length) {
        return null;
      }

      return {
        id: createId("scenario"),
        domainId,
        type: scenarioProfile.type,
        name: `${blueprint.label} - ${scenarioProfile.label}`,
        description: `Automatic validation scenario for ${blueprint.label.toLowerCase()} in ${scenarioProfile.label.toLowerCase()} conditions.`,
        operatingModeId: operatingModeIds.get(scenarioProfile.operatingMode),
        componentIds,
        kpiIds: scenarioKpiIds,
        gateIds: gates
          .filter((gate) => kpis.some((kpi) => kpi.id === gate.kpiId && kpi.relevantScenarioTypes.includes(scenarioProfile.type)))
          .map((gate) => gate.id),
        passThreshold: scenarioProfile.threshold,
        priority: scenarioProfile.priority
      };
    })
    .filter(Boolean);
}

function extractDomainRequirements(textCorpus, fallbackRequirements) {
  const sentenceCandidates = textCorpus
    .split(/[.!?]/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .filter((sentence) => /\b(shall|must|should|deve|dovra|dovrà)\b/.test(sentence));

  if (sentenceCandidates.length) {
    return sentenceCandidates.slice(0, 3);
  }

  return fallbackRequirements;
}

function buildTraceability(requirements, scenarios, kpis, gates) {
  return requirements.map((requirement, index) => {
    const domainScenarios = scenarios.filter((scenario) => scenario.domainId === requirement.domainId);

    return {
      id: createId("trace"),
      requirementId: requirement.id,
      scenarioIds: domainScenarios.slice(index % scenarioProfiles.length, (index % scenarioProfiles.length) + 2).map((scenario) => scenario.id),
      kpiIds: kpis.filter((kpi) => kpi.domainId === requirement.domainId).slice(0, 2).map((kpi) => kpi.id),
      gateIds: gates.filter((gate) => gate.domainId === requirement.domainId).slice(0, 2).map((gate) => gate.id)
    };
  });
}
