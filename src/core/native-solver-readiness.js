import { access } from "node:fs/promises";
import path from "node:path";
import { listExternalSolverManifests } from "./external-solver-manifests.js";

const nativeSolverHints = {
  SUNDIALS: {
    envVars: ["TWINTEST_SUNDIALS_BIN"],
    candidates: ["sundials", "cvode", "arkode"]
  },
  OpenModelica: {
    envVars: ["TWINTEST_OPENMODELICA_BIN"],
    candidates: ["omc"]
  },
  nuXmv: {
    envVars: ["TWINTEST_NUXMV_BIN"],
    candidates: ["nuxmv"]
  },
  gem5: {
    envVars: ["TWINTEST_GEM5_BIN"],
    candidates: ["gem5.opt", "gem5.fast", "gem5"]
  },
  OpenTURNS: {
    envVars: ["TWINTEST_OPENTURNS_BIN"],
    candidates: ["openturns"]
  },
  "Project Chrono": {
    envVars: ["TWINTEST_PROJECT_CHRONO_BIN"],
    candidates: ["projectchrono", "chrono-driver"]
  },
  CalculiX: {
    envVars: ["TWINTEST_CALCULIX_BIN"],
    candidates: ["ccx"]
  },
  OpenFOAM: {
    envVars: ["TWINTEST_OPENFOAM_BIN"],
    candidates: ["simpleFoam", "icoFoam", "pimpleFoam"]
  },
  Xyce: {
    envVars: ["TWINTEST_XYCE_BIN"],
    candidates: ["Xyce"]
  },
  "Chemical Transport Backend": {
    envVars: ["TWINTEST_CHEMICAL_TRANSPORT_BIN"],
    candidates: ["chem-transport", "chemical-transport-backend"]
  },
  "Dermal and Formulation Backend": {
    envVars: ["TWINTEST_COSMETIC_TRANSPORT_BIN"],
    candidates: ["cosmetic-transport", "dermal-transport-backend"]
  },
  "Orbital Mechanics Backend": {
    envVars: ["TWINTEST_SPACE_ORBITAL_BIN"],
    candidates: ["space-orbital", "orbital-backend"]
  },
  "Scientific Inference Backend": {
    envVars: ["TWINTEST_SPACE_INFERENCE_BIN"],
    candidates: ["space-inference", "scientific-inference-backend"]
  }
};

export async function listNativeSolverReadiness() {
  const manifests = listExternalSolverManifests();
  const externalManifests = manifests.filter((manifest) => manifest.adapterType === "external_process_json");
  const datasetManifests = manifests.filter((manifest) => manifest.adapterType === "artifact_metrics_json");
  const readinessEntries = await Promise.all(
    externalManifests.map(async (manifest) => buildReadinessEntry(manifest))
  );

  return readinessEntries.concat(
    datasetManifests.map((manifest) => ({
      manifestId: manifest.id,
      solver: manifest.solver,
      status: "dataset_pipeline_ready",
      resolvedPath: null,
      resolutionSource: null,
      localDriverId: null,
      envVars: [],
      candidates: [],
      notes: "Artifact-backed manifest; no native binary required."
    }))
  );
}

export async function getNativeSolverReadinessCatalog() {
  const entries = await listNativeSolverReadiness();
  return Object.fromEntries(entries.map((entry) => [entry.manifestId, entry]));
}

export async function getNativeSolverReadinessSummary() {
  const entries = await listNativeSolverReadiness();
  const externalEntries = entries.filter((entry) => entry.status !== "dataset_pipeline_ready");

  return {
    totalManifests: entries.length,
    totalExternalProcessManifests: externalEntries.length,
    nativeAvailable: externalEntries.filter((entry) => entry.status === "native_available").length,
    nativeMissing: externalEntries.filter((entry) => entry.status === "native_missing").length,
    localDriverFallbackReady: externalEntries.filter((entry) => Boolean(entry.localDriverId)).length,
    datasetPipelineReady: entries.filter((entry) => entry.status === "dataset_pipeline_ready").length
  };
}

async function buildReadinessEntry(manifest) {
  const hint = nativeSolverHints[manifest.solver] || {
    envVars: [],
    candidates: []
  };
  const envResolution = await resolveFromEnv(hint.envVars);

  if (envResolution) {
    return {
      manifestId: manifest.id,
      solver: manifest.solver,
      status: "native_available",
      resolvedPath: envResolution.path,
      resolutionSource: envResolution.source,
      localDriverId: manifest.bindingTemplate.configuration.localDriverId || null,
      envVars: hint.envVars,
      candidates: hint.candidates,
      notes: "Vendor binary available through environment override."
    };
  }

  const pathResolution = await resolveFromPath(hint.candidates);

  return {
    manifestId: manifest.id,
    solver: manifest.solver,
    status: pathResolution ? "native_available" : "native_missing",
    resolvedPath: pathResolution?.path || null,
    resolutionSource: pathResolution?.source || null,
    localDriverId: manifest.bindingTemplate.configuration.localDriverId || null,
    envVars: hint.envVars,
    candidates: hint.candidates,
    notes: pathResolution
      ? "Vendor binary discovered on PATH."
      : "Vendor binary not found; local driver fallback remains available."
  };
}

async function resolveFromEnv(envVars) {
  for (const envVar of envVars) {
    const candidatePath = process.env[envVar];

    if (!candidatePath) {
      continue;
    }

    if (await pathExists(candidatePath)) {
      return {
        path: path.resolve(candidatePath),
        source: `env:${envVar}`
      };
    }
  }

  return null;
}

async function resolveFromPath(candidates) {
  const pathEntries = String(process.env.PATH || "")
    .split(path.delimiter)
    .filter(Boolean);
  const pathExtensions = process.platform === "win32"
    ? String(process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM")
      .split(";")
      .filter(Boolean)
    : [""];

  for (const candidate of candidates) {
    const candidateNames = candidate.includes(".")
      ? [candidate]
      : [candidate, ...pathExtensions.map((extension) => `${candidate}${extension.toLowerCase()}`)];

    for (const pathEntry of pathEntries) {
      for (const candidateName of candidateNames) {
        const candidatePath = path.join(pathEntry, candidateName);

        if (await pathExists(candidatePath)) {
          return {
            path: candidatePath,
            source: "path"
          };
        }
      }
    }
  }

  return null;
}

async function pathExists(candidatePath) {
  try {
    await access(candidatePath);
    return true;
  } catch {
    return false;
  }
}
