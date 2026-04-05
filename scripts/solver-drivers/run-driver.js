import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { runLocalExternalDriver } from "../../src/core/local-external-drivers.js";

const driverId = process.argv[2];

if (!driverId) {
  process.stderr.write("Local driver id is required.\n");
  process.exit(1);
}

try {
  const payload = await readStdinJson();
  const result = runLocalExternalDriver({
    driverId,
    payload
  });

  if (result.outputMode === "key_value_file") {
    const rawOutputPath = resolveRawOutputPath(payload);
    await mkdir(path.dirname(rawOutputPath), { recursive: true });
    await writeFile(rawOutputPath, formatKeyValueMetrics(result.metrics));
    process.stdout.write(`wrote ${path.basename(rawOutputPath)}\n`);
  } else {
    process.stdout.write(JSON.stringify({
      metrics: result.metrics
    }));
  }
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}

async function readStdinJson() {
  const chunks = [];

  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? JSON.parse(raw) : {};
}

function resolveRawOutputPath(payload) {
  const rawOutputPath = payload?.binding?.configuration?.rawOutputPath;
  const solverCwd = payload?.binding?.configuration?.solverCwd || process.cwd();

  if (!rawOutputPath) {
    throw new Error("rawOutputPath is required for file-emitting local drivers.");
  }

  return path.resolve(String(solverCwd), String(rawOutputPath));
}

function formatKeyValueMetrics(metrics) {
  return Object.entries(metrics)
    .map(([key, value]) => `${key} ${value}`)
    .join("\n");
}
