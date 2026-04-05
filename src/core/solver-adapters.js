import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { executeBuiltinSolver, getBuiltinSolverNames } from "./builtin-solvers.js";
import { createId } from "./id.js";

const SUPPORTED_ADAPTER_TYPES = [
  "builtin_solver",
  "artifact_metrics_json",
  "external_process_json"
];

export function getSupportedAdapterTypes() {
  return [...SUPPORTED_ADAPTER_TYPES];
}

export function getSupportedBuiltinSolvers() {
  return getBuiltinSolverNames();
}

export async function executeBoundSolver({
  binding,
  scenario,
  graph,
  project,
  workspaceRoot
}) {
  if (!binding?.adapterType) {
    throw new Error(`Solver binding ${binding.id} is missing an adapter type.`);
  }

  if (!SUPPORTED_ADAPTER_TYPES.includes(binding.adapterType)) {
    throw new Error(`Unsupported adapter type "${binding.adapterType}" on binding ${binding.id}.`);
  }

  if (binding.adapterType === "builtin_solver") {
    return executeBuiltinSolver({
      binding,
      scenario,
      graph,
      project
    });
  }

  if (binding.adapterType === "artifact_metrics_json") {
    return executeArtifactMetricsJson({
      binding,
      scenario,
      graph,
      project,
      workspaceRoot
    });
  }

  return executeExternalProcessJson({
    binding,
    scenario,
    graph,
    project,
    workspaceRoot
  });
}

async function executeArtifactMetricsJson({
  binding,
  scenario,
  graph,
  project,
  workspaceRoot
}) {
  const config = binding.configuration || {};
  const artifactPath = resolveWorkspacePath(workspaceRoot, config.path);
  const raw = await readFile(artifactPath, "utf8");
  const payload = JSON.parse(raw);
  const scenarioPayload = selectScenarioPayload(payload, scenario, config.selector || "scenarioType");
  const metrics = normalizeMetrics(scenarioPayload?.metrics ?? payload.metrics);

  if (!Object.keys(metrics).length) {
    throw new Error(`Artifact ${artifactPath} does not expose metrics for scenario ${scenario.type}.`);
  }

  return {
    executionId: createId("solver_exec"),
    bindingId: binding.id,
    adapterType: binding.adapterType,
    solver: binding.solver,
    metrics,
    artifacts: normalizeArtifacts(
      scenarioPayload?.artifacts ?? payload.artifacts ?? [],
      workspaceRoot
    ).concat([
      {
        id: createId("artifact"),
        kind: "solver_input",
        path: artifactPath,
        label: config.label || path.basename(artifactPath)
      }
    ]),
    metadata: {
      source: "artifact_metrics_json",
      selector: config.selector || "scenarioType",
      scenarioKey: config.selector === "scenarioId" ? scenario.id : scenario.type,
      projectId: project.id,
      graphId: graph.id
    }
  };
}

async function executeExternalProcessJson({
  binding,
  scenario,
  graph,
  project,
  workspaceRoot
}) {
  const config = binding.configuration || {};

  if (!config.command) {
    throw new Error(`Binding ${binding.id} is missing "command" for external_process_json.`);
  }

  const cwd = config.cwd ? resolveWorkspacePath(workspaceRoot, config.cwd) : workspaceRoot;
  const timeoutMs = Number(config.timeoutMs || 120000);
  const args = Array.isArray(config.args) ? config.args.map((arg) => substituteTokens(String(arg), scenario, binding, project, graph)) : [];
  const stdinPayload = JSON.stringify({
    project,
    graph: {
      id: graph.id,
      dominantDomainId: graph.dominantDomainId
    },
    scenario,
    binding
  });
  const env = buildProcessEnv(config.env, scenario, binding, project, graph);

  const output = await spawnJsonProcess({
    command: config.command,
    args,
    cwd,
    timeoutMs,
    env,
    stdinPayload
  });

  return {
    executionId: createId("solver_exec"),
    bindingId: binding.id,
    adapterType: binding.adapterType,
    solver: binding.solver,
    metrics: normalizeMetrics(output.metrics),
    artifacts: normalizeArtifacts(output.artifacts || [], workspaceRoot),
    metadata: {
      source: "external_process_json",
      cwd,
      command: config.command,
      exitCode: output.exitCode ?? 0
    }
  };
}

function selectScenarioPayload(payload, scenario, selector) {
  if (payload?.scenarios && typeof payload.scenarios === "object") {
    const scenarioMap = payload.scenarios;
    const primaryKey = selector === "scenarioId" ? scenario.id : scenario.type;
    return scenarioMap[primaryKey] || scenarioMap[scenario.type] || scenarioMap[scenario.id] || scenarioMap.default;
  }

  if (payload?.scenarioTypeResults && typeof payload.scenarioTypeResults === "object") {
    return payload.scenarioTypeResults[scenario.type] || payload.scenarioTypeResults.default;
  }

  if (payload?.scenarioIdResults && typeof payload.scenarioIdResults === "object") {
    return payload.scenarioIdResults[scenario.id] || payload.scenarioIdResults.default;
  }

  return payload;
}

function normalizeMetrics(metrics) {
  if (!metrics || typeof metrics !== "object") {
    return {};
  }

  const normalized = {};

  for (const [key, value] of Object.entries(metrics)) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      continue;
    }

    normalized[key] = Number(numericValue.toFixed(6));
  }

  return normalized;
}

function normalizeArtifacts(artifacts, workspaceRoot) {
  if (!Array.isArray(artifacts)) {
    return [];
  }

  return artifacts.map((artifact) => ({
    id: artifact.id || createId("artifact"),
    kind: artifact.kind || "solver_artifact",
    path: artifact.path ? resolveWorkspacePath(workspaceRoot, artifact.path) : null,
    label: artifact.label || artifact.name || artifact.kind || "artifact"
  }));
}

function resolveWorkspacePath(workspaceRoot, candidatePath) {
  if (!candidatePath || typeof candidatePath !== "string") {
    throw new Error("A workspace-relative or absolute path is required.");
  }

  const resolvedRoot = path.resolve(workspaceRoot);
  const resolvedPath = path.resolve(workspaceRoot, candidatePath);

  if (resolvedPath !== resolvedRoot && !resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`Path "${candidatePath}" escapes the workspace root.`);
  }

  return resolvedPath;
}

function substituteTokens(value, scenario, binding, project, graph) {
  return value
    .replaceAll("{scenarioId}", scenario.id)
    .replaceAll("{scenarioType}", scenario.type)
    .replaceAll("{bindingId}", binding.id)
    .replaceAll("{projectId}", project.id)
    .replaceAll("{graphId}", graph.id);
}

function buildProcessEnv(envMap = {}, scenario, binding, project, graph) {
  const env = { ...process.env };

  for (const [key, value] of Object.entries(envMap || {})) {
    env[key] = substituteTokens(String(value), scenario, binding, project, graph);
  }

  env.TWINTEST_SCENARIO_ID = scenario.id;
  env.TWINTEST_SCENARIO_TYPE = scenario.type;
  env.TWINTEST_BINDING_ID = binding.id;
  env.TWINTEST_PROJECT_ID = project.id;
  env.TWINTEST_GRAPH_ID = graph.id;

  return env;
}

function spawnJsonProcess({ command, args, cwd, timeoutMs, env, stdinPayload }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill("SIGTERM");
        reject(new Error(`Process timeout after ${timeoutMs} ms.`));
      }
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timer);

      if (!settled) {
        settled = true;
        reject(error);
      }
    });

    child.on("close", (code) => {
      clearTimeout(timer);

      if (settled) {
        return;
      }

      if (code !== 0) {
        settled = true;
        reject(new Error(`Process exited with code ${code}. ${stderr.trim()}`.trim()));
        return;
      }

      try {
        const parsed = JSON.parse(stdout || "{}");
        settled = true;
        resolve({
          ...parsed,
          exitCode: code
        });
      } catch (error) {
        settled = true;
        reject(new Error(`Solver process did not emit valid JSON. ${stderr.trim()}`.trim()));
      }
    });

    child.stdin.write(stdinPayload);
    child.stdin.end();
  });
}
