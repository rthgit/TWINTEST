import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { runLocalExternalDriver } from "../../src/core/local-external-drivers.js";

const SUPPORTED_RESULT_FORMATS = new Set([
  "json_stdout",
  "json_file",
  "key_value_stdout",
  "key_value_file"
]);

export async function runConfiguredWrapper({
  solverName,
  defaultResultFormat = "json_stdout",
  defaultMetricMap = {}
}) {
  try {
    const payload = await readStdinJson();
    const binding = payload?.binding || {};
    const config = binding.configuration || {};
    const localDriverId = String(config.localDriverId || "").trim();
    const resultFormat = String(config.resultFormat || defaultResultFormat);
    const metricMap = config.metricMap && typeof config.metricMap === "object"
      ? config.metricMap
      : defaultMetricMap;
    const solverCwd = path.resolve(config.solverCwd ? String(config.solverCwd) : process.cwd());
    const rawOutputPath = config.rawOutputPath
      ? path.resolve(solverCwd, String(config.rawOutputPath))
      : null;

    if (localDriverId) {
      const localResult = runLocalExternalDriver({
        driverId: localDriverId,
        payload
      });
      const output = await buildLocalDriverWrapperOutput({
        solverName,
        localDriverId,
        resultFormat,
        solverCwd,
        rawOutputPath,
        configuredArtifacts: config.artifactPaths,
        localResult
      });

      process.stdout.write(JSON.stringify(output));
      return;
    }

    const solverBinary = String(config.solverBinary || "").trim();

    if (!solverBinary) {
      throw new Error(`${solverName} wrapper requires binding.configuration.solverBinary or localDriverId.`);
    }

    const solverArgs = Array.isArray(config.solverArgs) ? config.solverArgs.map((value) => String(value)) : [];
    const solverTimeoutMs = Number(config.solverTimeoutMs || config.timeoutMs || 120000);
    const solverEnv = {
      ...process.env,
      ...stringifyRecord(config.solverEnv || {}),
      TWINTEST_SOLVER_WRAPPER: solverName
    };
    const { stdout, stderr, exitCode } = await runChildProcess({
      command: solverBinary,
      args: solverArgs,
      cwd: solverCwd,
      env: solverEnv,
      timeoutMs: solverTimeoutMs,
      stdinPayload: config.forwardInputAsJson ? JSON.stringify(payload) : null
    });

    const output = await normalizeWrapperOutput({
      resultFormat,
      stdout,
      rawOutputPath
    }, {
      metricMap,
      configuredArtifacts: config.artifactPaths,
      solverCwd,
      includeRawOutputArtifact: config.includeRawOutputArtifact !== false
    });

    output.metadata = {
      source: "solver_wrapper",
      solverName,
      solverBinary,
      resultFormat,
      exitCode,
      stderr: stderr.trim() || null
    };

    process.stdout.write(JSON.stringify(output));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

async function buildLocalDriverWrapperOutput({
  solverName,
  localDriverId,
  resultFormat,
  solverCwd,
  rawOutputPath,
  configuredArtifacts,
  localResult
}) {
  if (resultFormat === "json_file") {
    if (!rawOutputPath) {
      throw new Error("rawOutputPath is required for json_file local driver execution.");
    }

    await mkdir(path.dirname(rawOutputPath), { recursive: true });
    await writeFile(rawOutputPath, JSON.stringify({ metrics: localResult.metrics }, null, 2));
  }

  if (resultFormat === "key_value_file") {
    if (!rawOutputPath) {
      throw new Error("rawOutputPath is required for key_value_file local driver execution.");
    }

    await mkdir(path.dirname(rawOutputPath), { recursive: true });
    await writeFile(rawOutputPath, formatKeyValueMetrics(localResult.metrics));
  }

  return {
    metrics: localResult.metrics,
    artifacts: normalizeArtifacts({
      rawOutputPath,
      solverCwd,
      configuredArtifacts,
      parsedArtifacts: [],
      includeRawOutputArtifact: Boolean(rawOutputPath)
    }),
    metadata: {
      source: "solver_wrapper",
      solverName,
      solverBinary: null,
      resultFormat,
      exitCode: 0,
      stderr: null,
      executionMode: "local_driver",
      localDriverId
    }
  };
}

async function readStdinJson() {
  const chunks = [];

  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? JSON.parse(raw) : {};
}

function stringifyRecord(input) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, String(value)])
  );
}

function runChildProcess({ command, args, cwd, env, timeoutMs, stdinPayload }) {
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
        reject(new Error(`Wrapped solver timeout after ${timeoutMs} ms.`));
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
        reject(new Error(`Wrapped solver exited with code ${code}. ${stderr.trim()}`.trim()));
        return;
      }

      settled = true;
      resolve({
        stdout,
        stderr,
        exitCode: code
      });
    });

    if (stdinPayload) {
      child.stdin.write(stdinPayload);
    }

    child.stdin.end();
  });
}

async function parseSolverResult({ resultFormat, stdout, rawOutputPath }) {
  if (!SUPPORTED_RESULT_FORMATS.has(resultFormat)) {
    throw new Error(`Unsupported wrapper result format "${resultFormat}".`);
  }

  if (resultFormat === "json_stdout") {
    return parseJsonText(stdout);
  }

  if (resultFormat === "json_file") {
    return parseJsonText(await readFileRequired(rawOutputPath));
  }

  if (resultFormat === "key_value_stdout") {
    return parseKeyValueText(stdout);
  }

  return parseKeyValueText(await readFileRequired(rawOutputPath));
}

export async function normalizeWrapperOutput(
  { resultFormat, stdout = "", rawOutputPath = null },
  {
    metricMap = {},
    configuredArtifacts = [],
    solverCwd = process.cwd(),
    includeRawOutputArtifact = true
  } = {}
) {
  const parsed = await parseSolverResult({
    resultFormat,
    stdout,
    rawOutputPath
  });
  const metrics = normalizeMetrics(extractMetrics(parsed, metricMap));

  if (!Object.keys(metrics).length) {
    throw new Error("Wrapper output did not resolve any numeric metrics.");
  }

  return {
    metrics,
    artifacts: normalizeArtifacts({
      rawOutputPath,
      solverCwd,
      configuredArtifacts,
      parsedArtifacts: parsed.artifacts,
      includeRawOutputArtifact
    }),
    metadata: {}
  };
}

async function readFileRequired(candidatePath) {
  if (!candidatePath) {
    throw new Error("rawOutputPath is required for file-based wrapper formats.");
  }

  return readFile(candidatePath, "utf8");
}

function parseJsonText(raw) {
  try {
    return JSON.parse(raw || "{}");
  } catch {
    throw new Error("Wrapped solver did not emit valid JSON.");
  }
}

function parseKeyValueText(raw) {
  const parsed = {};

  for (const line of String(raw || "").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = trimmed.match(/^([^:=\s]+)\s*(?:=|:|\s)\s*(.+)$/);

    if (!match) {
      continue;
    }

    parsed[match[1]] = match[2].trim();
  }

  return parsed;
}

function extractMetrics(parsed, metricMap) {
  if (parsed?.metrics && typeof parsed.metrics === "object") {
    return parsed.metrics;
  }

  if (metricMap && Object.keys(metricMap).length) {
    return Object.fromEntries(
      Object.entries(metricMap).map(([metricKey, sourcePath]) => [
        metricKey,
        getValueAtPath(parsed, String(sourcePath))
      ])
    );
  }

  return parsed;
}

function getValueAtPath(source, dottedPath) {
  return dottedPath.split(".").reduce((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return current[key];
    }

    return undefined;
  }, source);
}

function normalizeMetrics(metrics) {
  if (!metrics || typeof metrics !== "object") {
    return {};
  }

  const normalized = {};

  for (const [key, value] of Object.entries(metrics)) {
    const numericValue = Number(value);

    if (Number.isFinite(numericValue)) {
      normalized[key] = Number(numericValue.toFixed(6));
    }
  }

  return normalized;
}

function normalizeArtifacts({
  rawOutputPath,
  solverCwd,
  configuredArtifacts,
  parsedArtifacts,
  includeRawOutputArtifact
}) {
  const artifacts = [];

  if (Array.isArray(parsedArtifacts)) {
    for (const artifact of parsedArtifacts) {
      if (!artifact) {
        continue;
      }

      artifacts.push({
        kind: artifact.kind || "solver_artifact",
        path: artifact.path ? path.resolve(solverCwd, String(artifact.path)) : null,
        label: artifact.label || artifact.kind || "artifact"
      });
    }
  }

  if (Array.isArray(configuredArtifacts)) {
    for (const artifact of configuredArtifacts) {
      if (typeof artifact === "string") {
        artifacts.push({
          kind: "solver_artifact",
          path: path.resolve(solverCwd, artifact),
          label: path.basename(artifact)
        });
        continue;
      }

      if (artifact?.path) {
        artifacts.push({
          kind: artifact.kind || "solver_artifact",
          path: path.resolve(solverCwd, String(artifact.path)),
          label: artifact.label || artifact.kind || path.basename(String(artifact.path))
        });
      }
    }
  }

  if (includeRawOutputArtifact && rawOutputPath) {
    artifacts.push({
      kind: "solver_raw_output",
      path: rawOutputPath,
      label: path.basename(rawOutputPath)
    });
  }

  return dedupeArtifacts(artifacts);
}

function dedupeArtifacts(artifacts) {
  const seen = new Set();

  return artifacts.filter((artifact) => {
    const key = `${artifact.kind}:${artifact.path || ""}:${artifact.label || ""}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function formatKeyValueMetrics(metrics) {
  return Object.entries(metrics)
    .map(([key, value]) => `${key} ${value}`)
    .join("\n");
}
