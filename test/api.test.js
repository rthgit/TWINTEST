import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { createApp } from "../src/app.js";
import { executeBuiltinSolver, getBuiltinSolverCatalog, getBuiltinSolverNames } from "../src/core/builtin-solvers.js";
import { templateLibrary } from "../src/core/catalog.js";
import {
  createAiSolverOrchestrator,
  resolveAiBaseUrl,
  resolveAiModel,
  resolveAiProvider
} from "../src/core/ai-solver-orchestrator.js";
import {
  getExternalSolverManifestSummary,
  listExternalSolverManifests
} from "../src/core/external-solver-manifests.js";
import {
  getNativeSolverReadinessSummary,
  listNativeSolverReadiness
} from "../src/core/native-solver-readiness.js";
import { getSolverIntegrationSummary, listSolverIntegrationRoadmap } from "../src/core/solver-integration-roadmap.js";

test("TwinTest root endpoint exposes solver sectors, categories and industry catalog", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `root-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  await mkdir(tempDir, { recursive: true });

  const { server, platform } = await createApp({
    apiKey: "root-key",
    dataFilePath,
    runDelayMs: 5
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const response = await fetch(`${baseUrl}/`, {
      method: "GET"
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.ok(payload.solverCategoryCount >= 78);
    assert.ok(payload.supportedDomains.some((domain) => domain.id === "general_systems"));
    assert.ok(payload.supportedDomains.some((domain) => domain.id === "cosmetic_science"));
    assert.ok(payload.supportedDomains.some((domain) => domain.id === "space_cosmology"));
    assert.equal(payload.ideaDomainGuides.general_systems.coreValue.includes("one measurable workflow"), true);
    assert.equal(payload.runEngine.mode, "embedded");
    assert.equal(payload.runEngine.storeBackend, "json");
    assert.equal(payload.runEngine.storeRuntime.backend, "json");
    assert.ok(payload.runEngine.storeRuntime.availableBackends.includes("postgres_http"));
    assert.equal(payload.artifactStorage.backend, "local_filesystem");
    assert.ok(payload.artifactStorage.availableBackends.includes("s3_layout_filesystem"));
    assert.ok(payload.artifactStorage.availableBackends.includes("remote_http_object_store"));
    assert.ok(payload.endpoints.includes("GET /studio"));
    assert.ok(payload.endpoints.includes("GET /ops/health"));
    assert.ok(payload.endpoints.includes("GET /ops/ga-readiness"));
    assert.ok(payload.endpoints.includes("GET /commerce/plans"));
    assert.ok(payload.endpoints.includes("GET /commerce/billing-providers"));
    assert.ok(payload.endpoints.includes("POST /billing/webhooks/simulated"));
    assert.ok(payload.endpoints.includes("POST /auth/users/register"));
    assert.ok(payload.endpoints.includes("POST /auth/login"));
    assert.ok(payload.endpoints.includes("GET /auth/session"));
    assert.ok(payload.endpoints.includes("POST /auth/logout"));
    assert.ok(payload.endpoints.includes("GET /ops/run-queue"));
    assert.ok(payload.endpoints.includes("POST /ops/run-queue/drain-once"));
    assert.ok(payload.endpoints.includes("POST /workspaces"));
    assert.ok(payload.endpoints.includes("GET /workspaces/{id}/billing"));
    assert.ok(payload.endpoints.includes("POST /workspaces/{id}/billing/checkout-session"));
    assert.ok(payload.endpoints.includes("GET /workspaces/{id}/billing/invoices"));
    assert.ok(payload.endpoints.includes("GET /workspaces/{id}/billing/events"));
    assert.ok(payload.endpoints.includes("POST /workspaces/{id}/subscription"));
    assert.ok(payload.endpoints.includes("GET /workspaces/{id}/usage"));
    assert.ok(payload.endpoints.includes("GET /workspaces/{id}/members"));
    assert.ok(payload.endpoints.includes("POST /workspaces/{id}/members"));
    assert.ok(payload.endpoints.includes("POST /workspaces/{id}/api-clients"));
    assert.equal(payload.commercePlans.some((plan) => plan.id === "starter"), true);
    assert.equal(payload.billingProviders.some((provider) => provider.id === "simulated_stripe"), true);
    assert.equal(payload.billingProviders.some((provider) => provider.id === "http_json"), true);
    assert.equal(payload.billingRuntime.defaultProvider, "simulated_stripe");
    assert.ok(payload.endpoints.includes("POST /ideas/bootstrap"));
    assert.ok(payload.endpoints.includes("POST /projects/{id}/documents/import-artifact"));
    assert.ok(payload.endpoints.includes("GET /projects/{id}/artifacts"));
    assert.ok(payload.endpoints.includes("POST /projects/{id}/artifacts"));
    assert.ok(payload.endpoints.includes("GET /idea-domain-guides"));
    assert.ok(payload.endpoints.includes("GET /projects/{id}/mvp-blueprint"));
    assert.ok(payload.endpoints.includes("POST /projects/{id}/mvp-blueprint"));
    assert.ok(payload.endpoints.includes("GET /projects/{id}/mvp-decision"));
    assert.ok(payload.endpoints.includes("POST /projects/{id}/mvp-decision"));
    assert.ok(payload.endpoints.includes("GET /projects/{id}/pilot-workbench"));
    assert.ok(payload.endpoints.includes("POST /projects/{id}/pilot-workbench"));
    assert.ok(payload.endpoints.includes("GET /artifacts/{id}"));
    assert.ok(payload.endpoints.includes("GET /artifacts/{id}/content"));
    assert.equal(payload.solverCategories.length, payload.solverCategoryCount);
    assert.ok(payload.solverCategories.some((category) => category.id === "continuous_time_dynamics"));
    assert.ok(payload.solverCategories.some((category) => category.id === "medical_device_control"));
    assert.ok(payload.solverCategories.some((category) => category.id === "skin_penetration_and_retention"));
    assert.ok(payload.solverCategories.some((category) => category.id === "cosmology_parameter_inference"));
    assert.equal(payload.solverCategoryCatalog.climate_resilience_screening.sector, "environment_climate");
    assert.equal(payload.solverCategoryCatalog.skin_penetration_and_retention.sector, "cosmetic_science");
    assert.equal(payload.solverCategoryCatalog.orbital_dynamics_and_mission_geometry.sector, "space_cosmology");
    assert.equal(payload.solverIntegrationSummary.totalCategories, payload.solverCategoryCount);
    assert.equal(payload.solverIntegrationSummary.coveredCategories, payload.solverCategoryCount);
    assert.equal(payload.solverIntegrationRoadmap.continuous_time_dynamics.targetPath.solver, "SUNDIALS");
    assert.equal(payload.solverIntegrationRoadmap.medical_device_control.reviewPolicy, "regulated_review_required");
    assert.equal(payload.solverIntegrationRoadmap.skin_penetration_and_retention.reviewPolicy, "human_review_required");
    assert.ok(payload.externalSolverManifestSummary.totalManifests >= 16);
    assert.equal(payload.externalSolverManifestSummary.runtimeReadyLocalDrivers, 13);
    assert.equal(payload.externalSolverManifestSummary.artifactPipelineReady, 3);
    assert.equal(payload.externalSolverManifests["gem5-cli-json"].solver, "gem5");
    assert.equal(payload.externalSolverManifests["materials-chemistry-cli-json"].solver, "Chemical Transport Backend");
    assert.equal(payload.nativeSolverReadinessSummary.totalExternalProcessManifests, 13);
    assert.equal(payload.nativeSolverReadinessSummary.localDriverFallbackReady, 13);
    assert.ok(payload.solverSectors.some((sector) => sector.id === "industry"));
    assert.ok(payload.solverSectors.some((sector) => sector.id === "medical"));
    assert.ok(payload.solverSectors.some((sector) => sector.id === "environment_climate"));
    assert.ok(payload.solverSectors.some((sector) => sector.id === "cosmetic_science"));
    assert.ok(payload.solverSectors.some((sector) => sector.id === "space_cosmology"));
    assert.equal(payload.solverSectorCatalog.industry.status, "active");
    assert.ok(payload.solverSectorCatalog.industry.categoryIds.length >= 20);
    assert.equal(payload.solverSectorCatalog.robotics_autonomy.status, "building");
    assert.equal(payload.solverSectorCatalog.cosmetic_science.categoryIds.length, 4);
    assert.equal(payload.solverSectorCatalog.space_cosmology.categoryIds.length, 4);
    assert.ok(payload.supportedBuiltinSolvers.includes("monte-carlo-var-solver"));
    assert.ok(payload.supportedBuiltinSolvers.includes("skin-penetration-solver"));
    assert.ok(payload.supportedBuiltinSolvers.includes("cosmology-parameter-fit-solver"));
    assert.equal(payload.builtinSolverCatalog["robot-kinematics-solver"].sector, "robotics_autonomy");
    assert.equal(payload.builtinSolverCatalog["skin-penetration-solver"].sector, "cosmetic_science");
    assert.equal(payload.builtinSolverCatalog["orbital-mechanics-solver"].sector, "space_cosmology");
    assert.ok(payload.universalTestFoundationSummary.primitiveCount >= 6);
    assert.ok(payload.universalTestFoundationSummary.archetypeCount >= 8);
    assert.ok(payload.universalTestFoundation.testArchetypes.some((archetype) => archetype.id === "observation_and_calibration"));
    assert.ok(payload.gaReadinessSummary);
    assert.ok(["commercial_alpha", "ga_candidate_with_warnings", "commercial_ga_ready"].includes(payload.gaReadinessSummary.stage));
    assert.equal(typeof payload.gaReadinessSummary.canDeclareGa, "boolean");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await platform.store.close?.();
    await removeDirectoryWithRetry(tempDir);
  }
});

test("TwinTest exposes operational health and GA readiness endpoints", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `ops-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  await mkdir(tempDir, { recursive: true });

  const { server } = await createApp({
    apiKey: "ops-key",
    dataFilePath,
    runDelayMs: 5
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    let response = await fetch(`${baseUrl}/ops/health`, {
      method: "GET"
    });

    assert.equal(response.status, 200);
    const healthPayload = await response.json();
    assert.ok(["ok", "degraded"].includes(healthPayload.status));
    assert.equal(healthPayload.components.store.backend, "json");
    assert.equal(typeof healthPayload.components.requestPolicy.rateLimitEnabled, "boolean");

    response = await fetch(`${baseUrl}/ops/ga-readiness`, {
      method: "GET"
    });

    assert.equal(response.status, 200);
    const readinessPayload = await response.json();
    assert.ok(["commercial_alpha", "ga_candidate_with_warnings", "commercial_ga_ready"].includes(readinessPayload.stage));
    assert.equal(typeof readinessPayload.canDeclareGa, "boolean");
    assert.ok(Array.isArray(readinessPayload.checks));
    assert.ok(readinessPayload.checks.some((check) => check.id === "store_backend"));
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest GA readiness can reach commercial_ga_ready with hardened runtime configuration", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `ga-ready-${Date.now()}`);
  const artifactRoot = path.join(tempDir, "artifacts");
  const postgresFetch = createFakePostgresStoreFetch();
  await mkdir(tempDir, { recursive: true });

  const { server } = await createApp({
    apiKey: "ga-master-key",
    storeBackend: "postgres_http",
    postgresBaseUrl: "https://postgres-gateway.twintest.test",
    postgresApiKey: "pg-api-key",
    postgresFetch,
    artifactRoot,
    artifactStoreBackend: "s3_layout_filesystem",
    artifactBucket: "ga-artifacts",
    artifactPublicBaseUrl: "https://cdn.twintest.ga",
    runMode: "external",
    billingWebhookSecret: "ga-webhook-secret",
    billingWebhookMode: "hmac_sha256",
    requestRateLimitEnabled: true,
    requestRateLimitMaxRequests: 1200,
    requestRateLimitWindowSeconds: 60,
    authLockoutThreshold: 5,
    authLockoutWindowSeconds: 600,
    authLockoutDurationSeconds: 900
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const response = await fetch(`${baseUrl}/ops/ga-readiness`, {
      method: "GET"
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.stage, "commercial_ga_ready");
    assert.equal(payload.canDeclareGa, true);
    assert.equal(payload.criticalCount, 0);
    assert.equal(payload.warningCount, 0);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest offer profiles separate freemium and paid plan catalogs", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `offer-profiles-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });

  const freemiumStore = path.join(tempDir, "freemium-store.json");
  const paidStore = path.join(tempDir, "paid-store.json");

  const { server: freemiumServer } = await createApp({
    apiKey: "profile-master-key",
    dataFilePath: freemiumStore,
    offerProfile: "freemium",
    runDelayMs: 5
  });
  const { server: paidServer } = await createApp({
    apiKey: "profile-master-key",
    dataFilePath: paidStore,
    offerProfile: "paid",
    runDelayMs: 5
  });

  await new Promise((resolve) => freemiumServer.listen(0, "127.0.0.1", resolve));
  await new Promise((resolve) => paidServer.listen(0, "127.0.0.1", resolve));

  const freemiumAddress = freemiumServer.address();
  const paidAddress = paidServer.address();
  const freemiumBaseUrl = `http://127.0.0.1:${freemiumAddress.port}`;
  const paidBaseUrl = `http://127.0.0.1:${paidAddress.port}`;
  const headers = {
    "content-type": "application/json",
    "x-api-key": "profile-master-key",
    "x-workspace-id": "platform-admin"
  };

  try {
    let response = await fetch(`${freemiumBaseUrl}/commerce/plans`, {
      method: "GET"
    });
    assert.equal(response.status, 200);
    let payload = await response.json();
    assert.equal(payload.offerProfile, "freemium");
    assert.deepEqual(payload.plans.map((plan) => plan.id), ["freemium"]);

    response = await fetch(`${freemiumBaseUrl}/workspaces`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Freemium Workspace"
      })
    });
    assert.equal(response.status, 201);
    payload = await response.json();
    assert.equal(payload.workspace.planId, "freemium");

    response = await fetch(`${freemiumBaseUrl}/workspaces`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Freemium Forbidden Growth",
        planId: "growth"
      })
    });
    assert.equal(response.status, 403);

    response = await fetch(`${paidBaseUrl}/commerce/plans`, {
      method: "GET"
    });
    assert.equal(response.status, 200);
    payload = await response.json();
    assert.equal(payload.offerProfile, "paid");
    assert.equal(payload.plans.some((plan) => plan.id === "freemium"), false);
    assert.equal(payload.plans.some((plan) => plan.id === "starter"), true);

    response = await fetch(`${paidBaseUrl}/workspaces`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Paid Forbidden Freemium",
        planId: "freemium"
      })
    });
    assert.equal(response.status, 403);
  } finally {
    await new Promise((resolve) => freemiumServer.close(resolve));
    await new Promise((resolve) => paidServer.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest solver integration roadmap covers every category with validated mappings", () => {
  const summary = getSolverIntegrationSummary();
  const roadmap = listSolverIntegrationRoadmap();
  const byCategoryId = Object.fromEntries(roadmap.map((item) => [item.categoryId, item]));

  assert.ok(summary.totalCategories >= 78);
  assert.equal(summary.coveredCategories, summary.totalCategories);
  assert.equal(roadmap.length, summary.totalCategories);
  assert.equal(byCategoryId.continuous_time_dynamics.targetPath.solver, "SUNDIALS");
  assert.equal(byCategoryId.formal_logic_verification.targetPath.solver, "nuXmv");
  assert.equal(byCategoryId.telemetry_timeseries_evaluation.phase, "artifact_pipeline_now");
  assert.equal(byCategoryId.medical_device_control.reviewPolicy, "regulated_review_required");
  assert.equal(byCategoryId.autonomy_safety_envelope.priority, "p0");
  assert.equal(byCategoryId.skin_penetration_and_retention.targetPath.solver, "dermal transport and formulation backend");
  assert.equal(byCategoryId.preservative_efficacy_validation.phase, "artifact_pipeline_now");
  assert.equal(byCategoryId.orbital_dynamics_and_mission_geometry.reviewPolicy, "human_review_required");
  assert.equal(byCategoryId.cosmology_parameter_inference.priority, "p2");
});

test("TwinTest serves the studio UI and static assets", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `studio-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  await mkdir(tempDir, { recursive: true });

  const { server } = await createApp({
    apiKey: "studio-key",
    dataFilePath,
    runDelayMs: 5
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    let response = await fetch(`${baseUrl}/studio`, {
      method: "GET"
    });

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /text\/html/);
    const html = await response.text();
    assert.ok(html.includes("TwinTest Studio"));
    assert.ok(html.includes("Open a human session first"));
    assert.ok(html.includes("accessGuide"));
    assert.ok(html.includes("coverageExplorer"));
    assert.ok(html.includes("localePicker"));
    assert.ok(html.includes("Italiano"));
    assert.ok(html.includes("/studio/app.js"));

    response = await fetch(`${baseUrl}/studio/styles.css`, {
      method: "GET"
    });

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /text\/css/);
    const css = await response.text();
    assert.ok(css.includes(".studio-shell"));
    assert.ok(css.includes(".workflow-strip"));
    assert.ok(css.includes(".subpanel-grid"));
    assert.ok(css.includes(".coverage-explorer"));

    response = await fetch(`${baseUrl}/studio/app.js`, {
      method: "GET"
    });

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /application\/javascript/);
    const js = await response.text();
    assert.ok(js.includes("handleBootstrapSubmit"));
    assert.ok(js.includes("handleLaunchWorkspace"));
    assert.ok(js.includes("refreshWorkspaceSnapshot"));
    assert.ok(js.includes("LOCALE_CATALOG"));
    assert.ok(js.includes("resolveInitialLocale"));
    assert.ok(js.includes("renderCoverageExplorer"));
    assert.ok(js.includes("renderAccessGuide"));
    assert.ok(js.includes("renderWorkbench"));
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest can store project artifacts, import text documents from artifacts and serve downloads", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `artifacts-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  await mkdir(tempDir, { recursive: true });

  const { server } = await createApp({
    apiKey: "artifact-key",
    dataFilePath,
    runDelayMs: 5
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const headers = {
    "content-type": "application/json",
    "x-api-key": "artifact-key",
    "x-workspace-id": "artifact-lab"
  };

  try {
    let response = await fetch(`${baseUrl}/projects`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Artifact Intake Project",
        description: "Project with file-backed inputs."
      })
    });

    assert.equal(response.status, 201);
    const projectPayload = await response.json();
    const projectId = projectPayload.project.id;

    response = await fetch(`${baseUrl}/projects/${projectId}/artifacts`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "constraints.txt",
        mediaType: "text/plain",
        kind: "project_attachment",
        textContent: "keep traceability visible\nlimit scope to one workflow"
      })
    });

    assert.equal(response.status, 201);
    const uploadedArtifactPayload = await response.json();
    assert.equal(uploadedArtifactPayload.artifact.kind, "project_attachment");

    const markdown = [
      "# Intake",
      "",
      "Build a clinic scheduling MVP with follow-up automation.",
      "",
      "- keep one workflow",
      "- measure completion rate"
    ].join("\n");

    response = await fetch(`${baseUrl}/projects/${projectId}/documents/import-artifact`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "idea-intake.md",
        format: "markdown",
        mediaType: "text/markdown",
        contentBase64: Buffer.from(markdown, "utf8").toString("base64"),
        metadata: {
          source: "artifact-test"
        }
      })
    });

    assert.equal(response.status, 201);
    const importedPayload = await response.json();
    assert.equal(importedPayload.document.metadata.sourceArtifactId, importedPayload.artifact.id);
    assert.match(importedPayload.document.content, /clinic scheduling MVP/i);

    response = await fetch(`${baseUrl}/projects/${projectId}/compile`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        systemName: "Artifact Intake System"
      })
    });

    assert.equal(response.status, 202);

    response = await fetch(`${baseUrl}/projects/${projectId}/artifacts`, {
      method: "GET",
      headers
    });

    assert.equal(response.status, 200);
    const listPayload = await response.json();
    assert.ok(listPayload.artifacts.length >= 2);
    assert.ok(listPayload.artifacts.some((artifact) => artifact.kind === "document_source"));

    const artifactId = importedPayload.artifact.id;

    response = await fetch(`${baseUrl}/artifacts/${artifactId}`, {
      method: "GET",
      headers
    });

    assert.equal(response.status, 200);
    const artifactPayload = await response.json();
    assert.equal(artifactPayload.artifact.mediaType, "text/markdown");

    response = await fetch(`${baseUrl}/artifacts/${artifactId}/content`, {
      method: "GET",
      headers: {
        "x-api-key": "artifact-key",
        "x-workspace-id": "artifact-lab"
      }
    });

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /text\/markdown/);
    const downloadedText = await response.text();
    assert.equal(downloadedText, markdown);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest supports the s3-layout artifact backend for object-style storage metadata", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `artifact-backend-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  const artifactRoot = path.join(tempDir, "artifact-objects");
  await mkdir(tempDir, { recursive: true });

  const { server } = await createApp({
    apiKey: "artifact-layout-key",
    dataFilePath,
    artifactRoot,
    artifactStoreBackend: "s3_layout_filesystem",
    artifactBucket: "tenant-artifacts",
    artifactPublicBaseUrl: "https://cdn.twintest.test"
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const headers = {
    "content-type": "application/json",
    "x-api-key": "artifact-layout-key",
    "x-workspace-id": "artifact-layout-lab"
  };

  try {
    let response = await fetch(`${baseUrl}/`, { method: "GET" });
    assert.equal(response.status, 200);
    let payload = await response.json();
    assert.equal(payload.artifactStorage.backend, "s3_layout_filesystem");
    assert.equal(payload.artifactStorage.bucket, "tenant-artifacts");
    assert.equal(payload.artifactStorage.publicBaseUrlConfigured, true);

    response = await fetch(`${baseUrl}/projects`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Artifact Layout Project",
        description: "Validate object-style artifact metadata."
      })
    });

    assert.equal(response.status, 201);
    const projectPayload = await response.json();
    const projectId = projectPayload.project.id;

    response = await fetch(`${baseUrl}/projects/${projectId}/artifacts`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "evidence.json",
        mediaType: "application/json",
        kind: "project_attachment",
        textContent: "{\"status\":\"ok\"}"
      })
    });

    assert.equal(response.status, 201);
    payload = await response.json();
    assert.equal(payload.artifact.storageBackend, "s3_layout_filesystem");
    assert.equal(payload.artifact.bucket, "tenant-artifacts");
    assert.match(payload.artifact.objectKey, /^artifact-layout-lab\//);
    assert.match(payload.artifact.objectUrl, /^https:\/\/cdn\.twintest\.test\/tenant-artifacts\//);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest supports the remote HTTP artifact backend with fetch-backed object storage", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `artifact-remote-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  const objectMap = new Map();
  const artifactFetch = createFakeRemoteArtifactFetch(objectMap);
  await mkdir(tempDir, { recursive: true });

  const { server } = await createApp({
    apiKey: "artifact-remote-key",
    dataFilePath,
    artifactStoreBackend: "remote_http_object_store",
    artifactRemoteBaseUrl: "https://objects.twintest.test/api",
    artifactRemoteApiKey: "artifact-token",
    artifactBucket: "remote-bucket",
    artifactPublicBaseUrl: "https://cdn.twintest.test",
    artifactFetch
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const headers = {
    "content-type": "application/json",
    "x-api-key": "artifact-remote-key",
    "x-workspace-id": "artifact-remote-lab"
  };

  try {
    let response = await fetch(`${baseUrl}/projects`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Remote Artifact Project",
        description: "Validate remote object storage backend."
      })
    });

    assert.equal(response.status, 201);
    const projectPayload = await response.json();
    const projectId = projectPayload.project.id;

    response = await fetch(`${baseUrl}/projects/${projectId}/artifacts`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "evidence.txt",
        mediaType: "text/plain",
        kind: "project_attachment",
        textContent: "remote object evidence"
      })
    });

    assert.equal(response.status, 201);
    const artifactPayload = await response.json();
    assert.equal(artifactPayload.artifact.storageBackend, "remote_http_object_store");
    assert.equal(artifactPayload.artifact.bucket, "remote-bucket");
    assert.match(artifactPayload.artifact.objectUrl, /^https:\/\/cdn\.twintest\.test\/remote-bucket\//);
    assert.ok(objectMap.has(artifactPayload.artifact.storagePath));

    response = await fetch(`${baseUrl}/artifacts/${artifactPayload.artifact.id}/content`, {
      method: "GET",
      headers: {
        "x-api-key": "artifact-remote-key",
        "x-workspace-id": "artifact-remote-lab"
      }
    });

    assert.equal(response.status, 200);
    assert.equal(await response.text(), "remote object evidence");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest can persist application state on the native sqlite store backend", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `sqlite-${Date.now()}`);
  const databaseFilePath = path.join(tempDir, "twintest.sqlite");
  await mkdir(tempDir, { recursive: true });

  let app = await createApp({
    apiKey: "sqlite-key",
    storeBackend: "sqlite",
    databaseFilePath,
    runMode: "external"
  });

  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  let address = app.server.address();
  let baseUrl = `http://127.0.0.1:${address.port}`;
  const headers = {
    "content-type": "application/json",
    "x-api-key": "sqlite-key",
    "x-workspace-id": "sqlite-lab"
  };
  let projectId;

  try {
    let response = await fetch(`${baseUrl}/projects`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "SQLite Persistence Project",
        description: "Persist me across app restarts."
      })
    });

    assert.equal(response.status, 201);
    const projectPayload = await response.json();
    projectId = projectPayload.project.id;
  } finally {
    await new Promise((resolve) => app.server.close(resolve));
    await app.platform.store.close?.();
  }

  app = await createApp({
    apiKey: "sqlite-key",
    storeBackend: "sqlite",
    databaseFilePath,
    runMode: "external"
  });

  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  address = app.server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const response = await fetch(`${baseUrl}/projects/${projectId}/documents`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "persisted-spec.md",
        format: "markdown",
        content: "SQLite-backed project still exists after restart."
      })
    });

    assert.equal(response.status, 201);
    const documentPayload = await response.json();
    assert.equal(documentPayload.document.projectId, projectId);
  } finally {
    await new Promise((resolve) => app.server.close(resolve));
    await app.platform.store.close?.();
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest can persist application state on the postgres_http store backend", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `postgres-http-${Date.now()}`);
  const postgresFetch = createFakePostgresStoreFetch();
  await mkdir(tempDir, { recursive: true });

  let app = await createApp({
    apiKey: "postgres-key",
    storeBackend: "postgres_http",
    postgresBaseUrl: "https://postgres-gateway.twintest.test",
    postgresApiKey: "pg-api-key",
    postgresSchema: "twintest",
    postgresTable: "state_store",
    postgresFetch,
    runMode: "external"
  });

  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  let address = app.server.address();
  let baseUrl = `http://127.0.0.1:${address.port}`;
  const headers = {
    "content-type": "application/json",
    "x-api-key": "postgres-key",
    "x-workspace-id": "postgres-lab"
  };
  let projectId;

  try {
    let response = await fetch(`${baseUrl}/`, { method: "GET" });
    assert.equal(response.status, 200);
    let rootPayload = await response.json();
    assert.equal(rootPayload.runEngine.storeBackend, "postgres_http");
    assert.equal(rootPayload.runEngine.storeRuntime.schema, "twintest");
    assert.equal(rootPayload.runEngine.storeRuntime.table, "state_store");

    response = await fetch(`${baseUrl}/projects`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Postgres Persistence Project",
        description: "Persist me across app restarts through postgres_http."
      })
    });

    assert.equal(response.status, 201);
    const projectPayload = await response.json();
    projectId = projectPayload.project.id;
  } finally {
    await new Promise((resolve) => app.server.close(resolve));
    await app.platform.store.close?.();
  }

  app = await createApp({
    apiKey: "postgres-key",
    storeBackend: "postgres_http",
    postgresBaseUrl: "https://postgres-gateway.twintest.test",
    postgresApiKey: "pg-api-key",
    postgresSchema: "twintest",
    postgresTable: "state_store",
    postgresFetch,
    runMode: "external"
  });

  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  address = app.server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const response = await fetch(`${baseUrl}/projects/${projectId}/documents`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "persisted-postgres-spec.md",
        format: "markdown",
        content: "postgres_http-backed project still exists after restart."
      })
    });

    assert.equal(response.status, 201);
    const documentPayload = await response.json();
    assert.equal(documentPayload.document.projectId, projectId);
  } finally {
    await new Promise((resolve) => app.server.close(resolve));
    await app.platform.store.close?.();
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest external run mode keeps runs queued until a worker drains the persistent queue", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `external-worker-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  await mkdir(tempDir, { recursive: true });

  const { server, platform } = await createApp({
    apiKey: "external-key",
    dataFilePath,
    runDelayMs: 5,
    runMode: "external"
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const headers = {
    "content-type": "application/json",
    "x-api-key": "external-key",
    "x-workspace-id": "external-lab"
  };

  try {
    const projectId = await seedProject(baseUrl, headers);

    let response = await fetch(`${baseUrl}/projects/${projectId}/compile`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        systemName: "External Queue Washer"
      })
    });

    assert.equal(response.status, 202);

    response = await fetch(`${baseUrl}/projects/${projectId}/system-graph`, {
      method: "GET",
      headers
    });

    assert.equal(response.status, 200);
    const graphPayload = await response.json();

    response = await fetch(`${baseUrl}/projects/${projectId}/solver-bindings/autobind-builtin`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        bindingParameters: Object.fromEntries(
          graphPayload.graph.solverBindings.map((binding) => [
            binding.id,
            buildBuiltinParameters(binding.requiredParameters)
          ])
        )
      })
    });

    assert.equal(response.status, 200);

    response = await fetch(`${baseUrl}/projects/${projectId}/runs`, {
      method: "POST",
      headers,
      body: JSON.stringify({})
    });

    assert.equal(response.status, 202);
    const runPayload = await response.json();
    const runId = runPayload.run.id;

    await wait(40);

    response = await fetch(`${baseUrl}/runs/${runId}`, {
      method: "GET",
      headers
    });

    assert.equal(response.status, 200);
    let currentRunPayload = await response.json();
    assert.equal(currentRunPayload.run.status, "queued");

    response = await fetch(`${baseUrl}/ops/run-queue`, {
      method: "GET",
      headers
    });

    assert.equal(response.status, 200);
    const queuePayload = await response.json();
    assert.equal(queuePayload.workerMode, "external");
    assert.ok(queuePayload.jobs.some((job) => job.runId === runId && job.status === "queued"));

    const drainResult = await platform.processQueuedRunsOnce({
      workerId: "test-worker",
      workspaceId: "external-lab",
      limit: 5
    });

    assert.ok(drainResult.claimedCount >= 1);

    for (let index = 0; index < 20; index += 1) {
      response = await fetch(`${baseUrl}/runs/${runId}`, {
        method: "GET",
        headers
      });
      currentRunPayload = await response.json();

      if (currentRunPayload.run.status === "completed") {
        break;
      }

      await wait(20);
    }

    assert.equal(currentRunPayload.run.status, "completed");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest supports workspace plans, API clients and usage metering for commercial tenants", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `commerce-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  await mkdir(tempDir, { recursive: true });

  const { server } = await createApp({
    apiKey: "platform-key",
    dataFilePath,
    runDelayMs: 5
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    let response = await fetch(`${baseUrl}/commerce/plans`, {
      method: "GET"
    });

    assert.equal(response.status, 200);
    const plansPayload = await response.json();
    assert.equal(plansPayload.catalog.starter.limits.maxProjects, 3);

    response = await fetch(`${baseUrl}/commerce/billing-providers`, {
      method: "GET"
    });

    assert.equal(response.status, 200);
    const billingProviderPayload = await response.json();
    assert.equal(billingProviderPayload.catalog.simulated_stripe.webhookMode, "signed_webhook");

    response = await fetch(`${baseUrl}/workspaces`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": "platform-key",
        "x-workspace-id": "platform-admin"
      },
      body: JSON.stringify({
        name: "Acme Robotics",
        workspaceId: "acme-robotics",
        planId: "starter"
      })
    });

    assert.equal(response.status, 201);
    const workspacePayload = await response.json();
    assert.equal(workspacePayload.workspace.id, "acme-robotics");
    assert.equal(workspacePayload.workspace.planId, "starter");
    assert.ok(workspacePayload.bootstrapApiClient.apiKey.startsWith("ttsk_"));

    const clientHeaders = {
      "content-type": "application/json",
      "x-api-key": workspacePayload.bootstrapApiClient.apiKey
    };

    response = await fetch(`${baseUrl}/workspaces/acme-robotics`, {
      method: "GET",
      headers: clientHeaders
    });

    assert.equal(response.status, 200);
    const workspaceSummaryPayload = await response.json();
    assert.equal(workspaceSummaryPayload.workspace.id, "acme-robotics");
    assert.equal(workspaceSummaryPayload.workspace.subscription.status, "trialing");

    response = await fetch(`${baseUrl}/workspaces/acme-robotics/billing`, {
      method: "GET",
      headers: clientHeaders
    });

    assert.equal(response.status, 200);
    const initialBillingPayload = await response.json();
    assert.equal(initialBillingPayload.billing.plan.id, "starter");
    assert.equal(initialBillingPayload.billing.recurringChargeUsd, 199);
    assert.equal(initialBillingPayload.billing.subscription.status, "trialing");
    assert.equal(initialBillingPayload.billing.customerCount, 0);

    response = await fetch(`${baseUrl}/workspaces/acme-robotics/api-clients`, {
      method: "POST",
      headers: clientHeaders,
      body: JSON.stringify({
        name: "Operations Client",
        role: "admin"
      })
    });

    assert.equal(response.status, 201);
    const secondClientPayload = await response.json();
    assert.equal(secondClientPayload.apiClient.role, "admin");
    assert.ok(secondClientPayload.apiKey.startsWith("ttsk_"));

    response = await fetch(`${baseUrl}/workspaces/acme-robotics/api-clients`, {
      method: "GET",
      headers: clientHeaders
    });

    assert.equal(response.status, 200);
    const clientsPayload = await response.json();
    assert.equal(clientsPayload.apiClients.length, 2);

    for (const projectName of ["Pilot A", "Pilot B", "Pilot C"]) {
      response = await fetch(`${baseUrl}/projects`, {
        method: "POST",
        headers: clientHeaders,
        body: JSON.stringify({
          name: projectName,
          description: "Commercial tenant project"
        })
      });

      assert.equal(response.status, 201);
    }

    response = await fetch(`${baseUrl}/projects`, {
      method: "POST",
      headers: clientHeaders,
      body: JSON.stringify({
        name: "Pilot D",
        description: "Should exceed starter plan limit"
      })
    });

    assert.equal(response.status, 403);
    const limitPayload = await response.json();
    assert.equal(limitPayload.error, "Plan limit reached for projects. Upgrade from starter to continue.");

    response = await fetch(`${baseUrl}/workspaces/acme-robotics/usage`, {
      method: "GET",
      headers: clientHeaders
    });

    assert.equal(response.status, 200);
    const usagePayload = await response.json();
    assert.equal(usagePayload.usage.planId, "starter");
    assert.equal(usagePayload.usage.counts.projectsCreated, 3);
    assert.equal(usagePayload.usage.counts.apiClients, 2);
    assert.ok(usagePayload.usage.counts.apiCalls >= 7);
    assert.ok(usagePayload.usage.endpointCounters["POST /projects"] >= 4);

    response = await fetch(`${baseUrl}/workspaces/acme-robotics/billing/checkout-session`, {
      method: "POST",
      headers: clientHeaders,
      body: JSON.stringify({
        planId: "growth",
        provider: "simulated_stripe",
        billingEmail: "finance@acme-robotics.test",
        successUrl: "https://app.acme-robotics.test/billing/success",
        cancelUrl: "https://app.acme-robotics.test/billing/cancel"
      })
    });

    assert.equal(response.status, 201);
    const checkoutPayload = await response.json();
    assert.equal(checkoutPayload.checkoutSession.planId, "growth");
    assert.equal(checkoutPayload.checkoutSession.status, "open");
    assert.equal(checkoutPayload.customer.provider, "simulated_stripe");
    assert.match(checkoutPayload.checkoutSession.checkoutUrl, /simulated_stripe\/checkout\//);

    response = await fetch(`${baseUrl}/billing/webhooks/simulated`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-billing-webhook-secret": "dev-billing-webhook-secret"
      },
      body: JSON.stringify({
        provider: "simulated_stripe",
        eventType: "checkout.session.completed",
        payload: {
          workspaceId: "acme-robotics",
          sessionId: checkoutPayload.checkoutSession.id,
          planId: "growth",
          billingEmail: "finance@acme-robotics.test",
          amountUsd: 1290
        }
      })
    });

    assert.equal(response.status, 200);
    const webhookPayload = await response.json();
    assert.equal(webhookPayload.workspace.planId, "growth");
    assert.equal(webhookPayload.checkoutSession.status, "completed");
    assert.equal(webhookPayload.invoice.status, "paid");
    assert.equal(webhookPayload.billing.invoiceStatusCounts.paid, 1);

    response = await fetch(`${baseUrl}/workspaces/acme-robotics/billing/invoices`, {
      method: "GET",
      headers: clientHeaders
    });

    assert.equal(response.status, 200);
    const invoicePayload = await response.json();
    assert.equal(invoicePayload.invoices.length, 1);
    assert.equal(invoicePayload.invoices[0].status, "paid");

    response = await fetch(`${baseUrl}/workspaces/acme-robotics/billing/events`, {
      method: "GET",
      headers: clientHeaders
    });

    assert.equal(response.status, 200);
    const billingEventsPayload = await response.json();
    assert.equal(billingEventsPayload.events.length, 1);
    assert.equal(billingEventsPayload.events[0].eventType, "checkout.session.completed");

    response = await fetch(`${baseUrl}/workspaces/acme-robotics/subscription`, {
      method: "POST",
      headers: clientHeaders,
      body: JSON.stringify({
        planId: "growth",
        status: "active",
        billingEmail: "finance@acme-robotics.test",
        notes: "Moved to growth after starter limit reached."
      })
    });

    assert.equal(response.status, 200);
    const subscriptionPayload = await response.json();
    assert.equal(subscriptionPayload.workspace.planId, "growth");
    assert.equal(subscriptionPayload.workspace.billingEmail, "finance@acme-robotics.test");
    assert.equal(subscriptionPayload.subscription.status, "active");
    assert.equal(subscriptionPayload.billing.plan.id, "growth");
    assert.equal(subscriptionPayload.billing.recurringChargeUsd, 1290);

    response = await fetch(`${baseUrl}/workspaces/acme-robotics/billing`, {
      method: "GET",
      headers: clientHeaders
    });

    assert.equal(response.status, 200);
    const updatedBillingPayload = await response.json();
    assert.equal(updatedBillingPayload.billing.plan.id, "growth");
    assert.equal(updatedBillingPayload.billing.subscription.status, "active");
    assert.equal(updatedBillingPayload.billing.billingEmail, "finance@acme-robotics.test");
    assert.equal(updatedBillingPayload.billing.upgradeRecommendation, "current_plan_ok");
    assert.equal(updatedBillingPayload.billing.customerCount, 1);
    assert.equal(updatedBillingPayload.billing.openCheckoutSessions, 0);
    assert.equal(updatedBillingPayload.billing.latestInvoice.status, "paid");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest can create checkout sessions through an external HTTP billing provider adapter", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `billing-http-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  const billingFetch = createFakeExternalBillingFetch();
  await mkdir(tempDir, { recursive: true });

  const { server } = await createApp({
    apiKey: "platform-key",
    dataFilePath,
    billingProvider: "http_json",
    billingApiBaseUrl: "https://billing-provider.twintest.test/v1",
    billingApiKey: "billing-api-key",
    billingCallbackBaseUrl: "https://app.twintest.test",
    billingFetch
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    let response = await fetch(`${baseUrl}/workspaces`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": "platform-key",
        "x-workspace-id": "platform-admin"
      },
      body: JSON.stringify({
        name: "Billing Provider Lab",
        workspaceId: "billing-provider-lab",
        planId: "starter"
      })
    });

    assert.equal(response.status, 201);
    const workspacePayload = await response.json();
    const ownerHeaders = {
      "content-type": "application/json",
      "x-api-key": workspacePayload.bootstrapApiClient.apiKey
    };

    response = await fetch(`${baseUrl}/workspaces/billing-provider-lab/billing/checkout-session`, {
      method: "POST",
      headers: ownerHeaders,
      body: JSON.stringify({
        provider: "http_json",
        planId: "growth",
        billingEmail: "finance@billing-provider-lab.test"
      })
    });

    assert.equal(response.status, 201);
    const checkoutPayload = await response.json();
    assert.equal(checkoutPayload.checkoutSession.provider, "http_json");
    assert.equal(checkoutPayload.checkoutSession.status, "open");
    assert.equal(checkoutPayload.customer.provider, "http_json");
    assert.equal(checkoutPayload.customer.providerCustomerId, "ext_cus_001");
    assert.equal(checkoutPayload.checkoutSession.providerSessionId, "ext_cs_001");
    assert.equal(checkoutPayload.checkoutSession.checkoutUrl, "https://pay.example.test/checkout/ext_cs_001");

    response = await fetch(`${baseUrl}/`, { method: "GET" });
    assert.equal(response.status, 200);
    const rootPayload = await response.json();
    assert.equal(rootPayload.billingRuntime.defaultProvider, "http_json");
    assert.equal(rootPayload.billingRuntime.apiBaseUrlConfigured, true);
    assert.equal(rootPayload.billingRuntime.apiKeyConfigured, true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest validates HMAC-signed billing webhooks", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `billing-hmac-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  await mkdir(tempDir, { recursive: true });

  const { server } = await createApp({
    apiKey: "platform-key",
    dataFilePath,
    runDelayMs: 5,
    billingWebhookSecret: "hmac-webhook-secret",
    billingWebhookMode: "hmac_sha256"
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    let response = await fetch(`${baseUrl}/workspaces`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": "platform-key",
        "x-workspace-id": "platform-admin"
      },
      body: JSON.stringify({
        name: "Webhook HMAC Lab",
        workspaceId: "webhook-hmac-lab",
        planId: "growth"
      })
    });

    assert.equal(response.status, 201);
    const workspacePayload = await response.json();
    const ownerApiKey = workspacePayload.bootstrapApiClient.apiKey;
    const ownerHeaders = {
      "content-type": "application/json",
      "x-api-key": ownerApiKey
    };

    response = await fetch(`${baseUrl}/workspaces/webhook-hmac-lab/billing/checkout-session`, {
      method: "POST",
      headers: ownerHeaders,
      body: JSON.stringify({
        planId: "growth",
        provider: "simulated_stripe",
        billingEmail: "finance@webhook-hmac-lab.test"
      })
    });

    assert.equal(response.status, 201);
    const checkoutPayload = await response.json();

    const webhookPayload = {
      provider: "simulated_stripe",
      eventType: "checkout.session.completed",
      payload: {
        workspaceId: "webhook-hmac-lab",
        sessionId: checkoutPayload.checkoutSession.id,
        planId: "growth",
        billingEmail: "finance@webhook-hmac-lab.test",
        amountUsd: 1290
      }
    };
    const rawBody = JSON.stringify(webhookPayload);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmac("sha256", "hmac-webhook-secret")
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

    response = await fetch(`${baseUrl}/billing/webhooks/simulated`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-billing-signature": `t=${timestamp},v1=${signature}`
      },
      body: rawBody
    });

    assert.equal(response.status, 200);
    const processedPayload = await response.json();
    assert.equal(processedPayload.workspace.planId, "growth");
    assert.equal(processedPayload.verification.mode, "hmac_sha256");
    assert.equal(processedPayload.verification.verified, true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest supports user sessions and workspace RBAC", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `rbac-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  await mkdir(tempDir, { recursive: true });

  const { server } = await createApp({
    apiKey: "platform-key",
    dataFilePath,
    runDelayMs: 5
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    let response = await fetch(`${baseUrl}/workspaces`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": "platform-key",
        "x-workspace-id": "platform-admin"
      },
      body: JSON.stringify({
        name: "Session Lab",
        workspaceId: "session-lab",
        planId: "growth"
      })
    });

    assert.equal(response.status, 201);
    const workspacePayload = await response.json();
    const ownerApiKey = workspacePayload.bootstrapApiClient.apiKey;
    const ownerHeaders = {
      "content-type": "application/json",
      "x-api-key": ownerApiKey
    };

    response = await fetch(`${baseUrl}/auth/users/register`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: "operator@session-lab.test",
        displayName: "Operator User",
        password: "StrongPassword!123"
      })
    });

    assert.equal(response.status, 201);
    const operatorUserPayload = await response.json();

    response = await fetch(`${baseUrl}/workspaces/session-lab/members`, {
      method: "POST",
      headers: ownerHeaders,
      body: JSON.stringify({
        userId: operatorUserPayload.user.id,
        role: "operator"
      })
    });

    assert.equal(response.status, 201);
    const membershipPayload = await response.json();
    assert.equal(membershipPayload.membership.role, "operator");

    response = await fetch(`${baseUrl}/workspaces/session-lab/members`, {
      method: "POST",
      headers: ownerHeaders,
      body: JSON.stringify({
        email: "viewer@session-lab.test",
        displayName: "Viewer User",
        password: "ViewerPassword!123",
        role: "viewer"
      })
    });

    assert.equal(response.status, 201);

    response = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        workspaceId: "session-lab",
        email: "operator@session-lab.test",
        password: "StrongPassword!123"
      })
    });

    assert.equal(response.status, 201);
    const operatorSessionPayload = await response.json();
    const operatorSessionHeaders = {
      "content-type": "application/json",
      authorization: `Bearer ${operatorSessionPayload.sessionToken}`
    };

    response = await fetch(`${baseUrl}/auth/session`, {
      method: "GET",
      headers: operatorSessionHeaders
    });

    assert.equal(response.status, 200);
    const authPayload = await response.json();
    assert.equal(authPayload.auth.authMode, "user_session");
    assert.equal(authPayload.auth.session.role, "operator");

    response = await fetch(`${baseUrl}/projects`, {
      method: "POST",
      headers: operatorSessionHeaders,
      body: JSON.stringify({
        name: "Session Operator Project",
        description: "Created via session auth"
      })
    });

    assert.equal(response.status, 201);

    response = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        workspaceId: "session-lab",
        email: "viewer@session-lab.test",
        password: "ViewerPassword!123"
      })
    });

    assert.equal(response.status, 201);
    const viewerSessionPayload = await response.json();
    const viewerSessionHeaders = {
      "content-type": "application/json",
      authorization: `Bearer ${viewerSessionPayload.sessionToken}`
    };

    response = await fetch(`${baseUrl}/projects`, {
      method: "POST",
      headers: viewerSessionHeaders,
      body: JSON.stringify({
        name: "Viewer Project",
        description: "Viewer should not create this"
      })
    });

    assert.equal(response.status, 403);

    response = await fetch(`${baseUrl}/workspaces/session-lab/members`, {
      method: "GET",
      headers: viewerSessionHeaders
    });

    assert.equal(response.status, 403);

    response = await fetch(`${baseUrl}/auth/logout`, {
      method: "POST",
      headers: operatorSessionHeaders
    });

    assert.equal(response.status, 200);

    response = await fetch(`${baseUrl}/auth/session`, {
      method: "GET",
      headers: operatorSessionHeaders
    });

    assert.equal(response.status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest locks login after repeated failed attempts", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `login-lockout-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  await mkdir(tempDir, { recursive: true });

  const { server } = await createApp({
    apiKey: "platform-key",
    dataFilePath,
    runDelayMs: 5,
    authLockoutThreshold: 3,
    authLockoutWindowSeconds: 120,
    authLockoutDurationSeconds: 120
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    let response = await fetch(`${baseUrl}/workspaces`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": "platform-key",
        "x-workspace-id": "platform-admin"
      },
      body: JSON.stringify({
        name: "Lockout Lab",
        workspaceId: "lockout-lab",
        planId: "growth"
      })
    });

    assert.equal(response.status, 201);
    const workspacePayload = await response.json();
    const ownerApiKey = workspacePayload.bootstrapApiClient.apiKey;

    response = await fetch(`${baseUrl}/workspaces/lockout-lab/members`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ownerApiKey
      },
      body: JSON.stringify({
        email: "operator@lockout-lab.test",
        displayName: "Lockout Operator",
        password: "StrongPassword!123",
        role: "operator"
      })
    });

    assert.equal(response.status, 201);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      response = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          workspaceId: "lockout-lab",
          email: "operator@lockout-lab.test",
          password: "WrongPassword!123"
        })
      });

      assert.equal(response.status, 401);
    }

    response = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        workspaceId: "lockout-lab",
        email: "operator@lockout-lab.test",
        password: "WrongPassword!123"
      })
    });

    assert.equal(response.status, 429);
    let payload = await response.json();
    assert.equal(payload.error, "Too many login attempts. Try again later.");
    assert.ok(payload.details.retryAfterSeconds >= 1);

    response = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        workspaceId: "lockout-lab",
        email: "operator@lockout-lab.test",
        password: "StrongPassword!123"
      })
    });

    assert.equal(response.status, 429);
    payload = await response.json();
    assert.equal(payload.error, "Too many login attempts. Try again later.");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest enforces request rate limiting when configured", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `rate-limit-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  await mkdir(tempDir, { recursive: true });

  const { server } = await createApp({
    apiKey: "rate-limit-key",
    dataFilePath,
    runDelayMs: 5,
    requestRateLimitEnabled: true,
    requestRateLimitMaxRequests: 2,
    requestRateLimitWindowSeconds: 60
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const headers = {
    "x-api-key": "rate-limit-key",
    "x-workspace-id": "rate-limit-lab"
  };

  try {
    let response = await fetch(`${baseUrl}/ops/run-queue`, {
      method: "GET",
      headers
    });
    assert.equal(response.status, 200);

    response = await fetch(`${baseUrl}/ops/run-queue`, {
      method: "GET",
      headers
    });
    assert.equal(response.status, 200);

    response = await fetch(`${baseUrl}/ops/run-queue`, {
      method: "GET",
      headers
    });
    assert.equal(response.status, 429);
    assert.ok(Number(response.headers.get("retry-after")) >= 1);
    const payload = await response.json();
    assert.equal(payload.error, "Request rate limit exceeded.");
    assert.ok(payload.details.retryAfterSeconds >= 1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest external solver manifest catalog covers the priority solvers", () => {
  const summary = getExternalSolverManifestSummary();
  const manifests = listExternalSolverManifests();
  const byId = Object.fromEntries(manifests.map((manifest) => [manifest.id, manifest]));

  assert.ok(summary.totalManifests >= 16);
  assert.ok(summary.byPriority.p0 >= 5);
  assert.equal(summary.runtimeReadyLocalDrivers, 13);
  assert.equal(summary.byStatus.runtime_ready_local_driver, 13);
  assert.equal(byId["sundials-cli-json"].adapterType, "external_process_json");
  assert.equal(byId["sundials-cli-json"].status, "runtime_ready_local_driver");
  assert.equal(byId["gem5-trace-artifact-bundle"].adapterType, "artifact_metrics_json");
  assert.equal(byId["nuxmv-cli-json"].priority, "p0");
  assert.ok(byId["project-chrono-cli-json"].categories.includes("robot_kinematics_and_reachability"));
  assert.equal(byId["materials-chemistry-cli-json"].adapterType, "external_process_json");
  assert.equal(byId["cosmetic-evidence-artifact-bundle"].adapterType, "artifact_metrics_json");
  assert.equal(byId["space-inference-cli-json"].priority, "p2");
});

test("TwinTest native solver readiness reports vendor availability and fallback coverage", async () => {
  const summary = await getNativeSolverReadinessSummary();
  const entries = await listNativeSolverReadiness();
  const byManifestId = Object.fromEntries(entries.map((entry) => [entry.manifestId, entry]));

  assert.equal(summary.totalExternalProcessManifests, 13);
  assert.equal(summary.localDriverFallbackReady, 13);
  assert.equal(summary.nativeAvailable + summary.nativeMissing, 13);
  assert.equal(summary.datasetPipelineReady, 3);
  assert.ok(["native_available", "native_missing"].includes(byManifestId["sundials-cli-json"].status));
  assert.equal(byManifestId["gem5-trace-artifact-bundle"].status, "dataset_pipeline_ready");
  assert.ok(["native_available", "native_missing"].includes(byManifestId["materials-chemistry-cli-json"].status));
  assert.equal(byManifestId["space-observation-artifact-bundle"].status, "dataset_pipeline_ready");
});

test("TwinTest maps Groq gpt 120oss alias to the official model id", () => {
  assert.equal(resolveAiProvider("GROQ"), "groq");
  assert.equal(resolveAiModel("groq", "gpt 120oss"), "openai/gpt-oss-120b");
  assert.equal(resolveAiModel("groq", "kimi"), "moonshotai/kimi-k2-instruct-0905");
  assert.equal(resolveAiBaseUrl("groq", ""), "https://api.groq.com/openai/v1/responses");
});

test("TwinTest Groq AI orchestrator uses Groq endpoint and omits unsupported store field", async () => {
  const calls = [];
  const orchestrator = createAiSolverOrchestrator({
    provider: "groq",
    apiKey: "groq-test-key",
    model: "gpt 120oss",
    fetchImpl: async (url, init) => {
      calls.push({
        url,
        body: JSON.parse(init.body)
      });

      return {
        ok: true,
        json: async () => ({
          id: "resp_groq_test",
          model: "openai/gpt-oss-120b",
          output_text: JSON.stringify({
            summary: "Groq plan.",
            decisions: [
              {
                bindingId: "binding_test",
                decisionType: "external_manifest",
                solver: "",
                manifestId: "gem5-cli-json",
                reason: "Use the runtime-ready compute manifest."
              }
            ]
          })
        })
      };
    }
  });

  const plan = await orchestrator.createAutobindPlan({
    project: {
      id: "project_test",
      name: "Groq Test",
      description: "compute accelerator"
    },
    compilation: {
      graph: {
        dominantDomainId: "compute_semiconductor",
        domainIds: ["compute_semiconductor"],
        components: [{ id: "component_test", name: "Compute Tile" }],
        parameters: [],
        solverBindings: [
          {
            id: "binding_test",
            componentId: "component_test",
            domainId: "compute_semiconductor",
            compatibleSolvers: ["architectural-surrogate"],
            requiredParameters: ["throughput_target", "latency_budget_ms"],
            status: "unbound"
          }
        ]
      }
    }
  });

  assert.equal(plan.provider, "groq");
  assert.equal(plan.model, "openai/gpt-oss-120b");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.groq.com/openai/v1/responses");
  assert.equal(calls[0].body.model, "openai/gpt-oss-120b");
  assert.equal("store" in calls[0].body, false);
});

test("TwinTest exposes a dedicated solver roadmap endpoint", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `roadmap-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  await mkdir(tempDir, { recursive: true });

  const { server } = await createApp({
    apiKey: "roadmap-key",
    dataFilePath,
    runDelayMs: 5
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const response = await fetch(`${baseUrl}/solver-roadmap`, {
      method: "GET"
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.summary.coveredCategories, payload.summary.totalCategories);
    assert.equal(payload.items.length, payload.summary.totalCategories);
    assert.equal(payload.catalog.continuous_time_dynamics.targetPath.solver, "SUNDIALS");
    assert.equal(payload.catalog.avionics_failover_validation.targetPath.solver, "nuXmv");
    assert.equal(payload.catalog.sensor_fusion_quality.phase, "artifact_pipeline_now");
    assert.equal(payload.catalog.skin_penetration_and_retention.targetPath.solver, "dermal transport and formulation backend");
    assert.equal(payload.catalog.observation_pipeline_calibration.phase, "artifact_pipeline_now");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest exposes a dedicated universal test foundation endpoint", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `foundation-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  await mkdir(tempDir, { recursive: true });

  const { server } = await createApp({
    apiKey: "foundation-key",
    dataFilePath,
    runDelayMs: 5
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const response = await fetch(`${baseUrl}/test-foundation`, {
      method: "GET"
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.ok(payload.summary.primitiveCount >= 6);
    assert.ok(payload.summary.archetypeCount >= 8);
    assert.ok(payload.foundation.primitives.some((entry) => entry.id === "evidence_and_traceability"));
    assert.ok(payload.foundation.claimFamilies.some((entry) => entry.id === "safety"));
    assert.ok(payload.foundation.solverModalities.some((entry) => entry.id === "observation_and_signal_processing"));
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest exposes a dedicated native solver readiness endpoint", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `native-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  await mkdir(tempDir, { recursive: true });

  const { server } = await createApp({
    apiKey: "native-key",
    dataFilePath,
    runDelayMs: 5
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const response = await fetch(`${baseUrl}/solver-native-readiness`, {
      method: "GET"
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.summary.totalExternalProcessManifests, 13);
    assert.equal(payload.summary.localDriverFallbackReady, 13);
    assert.equal(payload.catalog["gem5-trace-artifact-bundle"].status, "dataset_pipeline_ready");
    assert.ok(["native_available", "native_missing"].includes(payload.catalog["openmodelica-cli-json"].status));
    assert.equal(payload.catalog["space-observation-artifact-bundle"].status, "dataset_pipeline_ready");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest exposes a dedicated solver manifest endpoint", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `manifests-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  await mkdir(tempDir, { recursive: true });

  const { server } = await createApp({
    apiKey: "manifest-key",
    dataFilePath,
    runDelayMs: 5
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const response = await fetch(`${baseUrl}/solver-manifests`, {
      method: "GET"
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.ok(payload.summary.totalManifests >= 16);
    assert.equal(payload.summary.runtimeReadyLocalDrivers, 13);
    assert.equal(payload.catalog["openmodelica-cli-json"].solver, "OpenModelica");
    assert.equal(payload.catalog["openmodelica-cli-json"].status, "runtime_ready_local_driver");
    assert.equal(payload.catalog["gem5-trace-artifact-bundle"].adapterType, "artifact_metrics_json");
    assert.equal(payload.items.find((manifest) => manifest.id === "nuxmv-cli-json").priority, "p0");
    assert.equal(payload.catalog["materials-chemistry-cli-json"].solver, "Chemical Transport Backend");
    assert.equal(payload.catalog["space-inference-cli-json"].status, "runtime_ready_local_driver");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest can apply AI-generated autobind plans through the API", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `ai-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  await mkdir(tempDir, { recursive: true });

  const { server } = await createApp({
    apiKey: "ai-key",
    aiProvider: "groq",
    aiApiKey: "groq-test-key",
    aiModel: "gpt 120oss",
    aiFetch: createFakeAiFetch(),
    dataFilePath,
    runDelayMs: 5
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const headers = {
    "content-type": "application/json",
    "x-api-key": "ai-key",
    "x-workspace-id": "ws-ai"
  };

  try {
    const projectId = await seedProject(baseUrl, headers);

    let response = await fetch(`${baseUrl}/projects/${projectId}/compile`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        systemName: "Twin Washer"
      })
    });

    assert.equal(response.status, 202);

    response = await fetch(`${baseUrl}/projects/${projectId}/solver-bindings/autobind-ai`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        strategy: "prefer_runtime_ready"
      })
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.readiness.unboundSolverBindings, 0);
    assert.ok(payload.aiPlan.summary.includes("AI-selected"));
    assert.equal(payload.aiPlan.provider, "groq");
    assert.equal(payload.aiPlan.model, "openai/gpt-oss-120b");
    assert.ok(payload.solverBindings.every((binding) => binding.status === "bound"));
    assert.ok(payload.solverBindings.some((binding) => binding.bindingMode === "ai_autobind"));
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest AI autobind can select new manifests for cosmetic and cosmology domains", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `ai-cross-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  await mkdir(tempDir, { recursive: true });

  const { server } = await createApp({
    apiKey: "ai-cross-key",
    aiProvider: "groq",
    aiApiKey: "groq-test-key",
    aiModel: "gpt 120oss",
    aiFetch: createFakeAiFetch(),
    dataFilePath,
    runDelayMs: 5
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const headers = {
    "content-type": "application/json",
    "x-api-key": "ai-cross-key",
    "x-workspace-id": "ws-ai-cross"
  };

  try {
    let response = await fetch(`${baseUrl}/projects`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "AI Universal Pilot",
        description: "Cosmetic stability with orbital observation quality.",
        targetDomains: ["cosmetic_science", "space_cosmology"]
      })
    });

    assert.equal(response.status, 201);
    const projectPayload = await response.json();
    const projectId = projectPayload.project.id;

    response = await fetch(`${baseUrl}/projects/${projectId}/documents`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "ai-cross-spec.md",
        format: "markdown",
        content: "The cosmetic formulation shall maintain dermal margin and stability. The orbital mission shall preserve geometry margin and cosmology fit confidence."
      })
    });

    assert.equal(response.status, 201);

    response = await fetch(`${baseUrl}/projects/${projectId}/compile`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        systemName: "AI Universal Test Graph",
        targetDomains: ["cosmetic_science", "space_cosmology"]
      })
    });

    assert.equal(response.status, 202);

    response = await fetch(`${baseUrl}/projects/${projectId}/solver-bindings/autobind-ai`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        strategy: "prefer_runtime_ready"
      })
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.readiness.unboundSolverBindings, 0);
    assert.ok(payload.solverBindings.some((binding) => binding.aiDecision?.manifestId === "cosmetic-transport-cli-json"));
    assert.ok(payload.solverBindings.some((binding) => binding.aiDecision?.manifestId === "space-orbital-cli-json"));
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest exposes dedicated idea domain guides for MVP intake clients", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `guides-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  await mkdir(tempDir, { recursive: true });

  const { server } = await createApp({
    apiKey: "guides-key",
    dataFilePath,
    runDelayMs: 5
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const response = await fetch(`${baseUrl}/idea-domain-guides`, {
      method: "GET"
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.guides.general_systems.firstMilestone.includes("TwinTest can validate"), true);
    assert.equal(payload.guides.cosmetic_science.evidenceNeeds.includes("challenge-test evidence"), true);
    assert.equal(payload.guides.space_cosmology.mvpFeatures.includes("core inference or fit report"), true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest bootstraps an idea into a runnable MVP blueprint and can refresh it", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `idea-mvp-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  await mkdir(tempDir, { recursive: true });

  const { server } = await createApp({
    apiKey: "idea-key",
    dataFilePath,
    runDelayMs: 5
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const headers = {
    "content-type": "application/json",
    "x-api-key": "idea-key",
    "x-workspace-id": "ws-idea"
  };

  try {
    let response = await fetch(`${baseUrl}/ideas/bootstrap`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        idea: "A service that lets boutique clinics manage bookings, intake workflows and treatment follow-ups without manual coordination.",
        targetUser: "clinic operations lead",
        desiredOutcome: "launch a narrow booking and follow-up MVP with measurable completion rate and response time",
        constraints: [
          "launch with one critical workflow only",
          "keep governance checks visible to operators"
        ],
        targetDomains: ["general_systems"],
        autobind: "builtin",
        queueRun: true,
        runLabel: "Idea Bootstrap Baseline",
        systemName: "Clinic Workflow MVP"
      })
    });

    assert.equal(response.status, 201);
    const bootstrapPayload = await response.json();
    assert.equal(bootstrapPayload.project.status, "compiled");
    assert.equal(bootstrapPayload.project.latestMvpBlueprintId, bootstrapPayload.mvpBlueprint.id);
    assert.equal(bootstrapPayload.project.latestMvpDecisionId, bootstrapPayload.mvpDecision.id);
    assert.equal(bootstrapPayload.project.latestPilotWorkbenchId, bootstrapPayload.pilotWorkbench.id);
    assert.equal(bootstrapPayload.graphSummary.dominantDomainId, "general_systems");
    assert.equal(bootstrapPayload.readiness.unboundSolverBindings, 0);
    assert.ok(bootstrapPayload.solverBindings.every((binding) => binding.adapterType === "builtin_solver"));
    assert.equal(bootstrapPayload.mvpBlueprint.inference.dominantDomainId, "general_systems");
    assert.equal(bootstrapPayload.mvpBlueprint.validation.firstRunPath.canExecuteImmediately, true);
    assert.ok(["wait_for_baseline_run", "collect_baseline_evidence", "proceed_to_pilot", "iterate_before_pilot"].includes(
      bootstrapPayload.mvpDecision.summary.recommendation
    ));
    assert.equal(bootstrapPayload.pilotWorkbench.summary.stage, "baseline_running");
    assert.ok(bootstrapPayload.pilotWorkbench.backlog.now.length >= 1);
    assert.ok(bootstrapPayload.pilotWorkbench.artifactChecklist.length >= 1);
    assert.equal(bootstrapPayload.run.label, "Idea Bootstrap Baseline");

    const projectId = bootstrapPayload.project.id;
    const runId = bootstrapPayload.run.id;
    let runStatus = bootstrapPayload.run.status;

    for (let index = 0; index < 40 && !["completed", "failed"].includes(runStatus); index += 1) {
      await wait(20);
      response = await fetch(`${baseUrl}/runs/${runId}`, {
        method: "GET",
        headers
      });
      assert.equal(response.status, 200);
      const currentRunPayload = await response.json();
      runStatus = currentRunPayload.run.status;
    }

    assert.equal(runStatus, "completed");

    response = await fetch(`${baseUrl}/runs/${runId}/report`, {
      method: "GET",
      headers
    });

    assert.equal(response.status, 200);
    const reportPayload = await response.json();
    assert.equal(reportPayload.summary.realExecution, true);
    assert.ok(reportPayload.solverBindings.every((binding) => binding.adapterType === "builtin_solver"));

    response = await fetch(`${baseUrl}/projects/${projectId}/mvp-decision`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        runId
      })
    });

    assert.equal(response.status, 201);
    const refreshedDecisionPayload = await response.json();
    assert.equal(refreshedDecisionPayload.project.latestMvpDecisionId, refreshedDecisionPayload.mvpDecision.id);
    assert.equal(refreshedDecisionPayload.mvpDecision.currentRunId, runId);
    assert.equal(refreshedDecisionPayload.mvpDecision.evidenceRunId, runId);
    assert.ok(refreshedDecisionPayload.mvpDecision.reportId);
    assert.equal(refreshedDecisionPayload.mvpDecision.evidenceStatus.hasEvidenceReport, true);
    assert.equal(refreshedDecisionPayload.mvpDecision.evidenceStatus.currentRunStatus, "completed");
    assert.equal(
      refreshedDecisionPayload.project.latestPilotWorkbenchId,
      refreshedDecisionPayload.pilotWorkbench.id
    );
    assert.equal(refreshedDecisionPayload.pilotWorkbench.executionBoard.runStatus, "completed");
    assert.equal(refreshedDecisionPayload.pilotWorkbench.executionBoard.realExecution, true);
    assert.ok(
      ["proceed_to_pilot", "iterate_before_pilot"].includes(refreshedDecisionPayload.mvpDecision.summary.recommendation)
    );

    response = await fetch(`${baseUrl}/projects/${projectId}/mvp-decision`, {
      method: "GET",
      headers
    });

    assert.equal(response.status, 200);
    const storedDecisionPayload = await response.json();
    assert.equal(storedDecisionPayload.project.latestMvpDecisionId, refreshedDecisionPayload.mvpDecision.id);
    assert.equal(storedDecisionPayload.mvpDecision.id, refreshedDecisionPayload.mvpDecision.id);
    assert.equal(storedDecisionPayload.mvpDecision.evidenceStatus.hasEvidenceReport, true);

    response = await fetch(`${baseUrl}/projects/${projectId}/pilot-workbench`, {
      method: "GET",
      headers
    });

    assert.equal(response.status, 200);
    const storedWorkbenchPayload = await response.json();
    assert.equal(storedWorkbenchPayload.project.latestPilotWorkbenchId, refreshedDecisionPayload.pilotWorkbench.id);
    assert.equal(storedWorkbenchPayload.pilotWorkbench.id, refreshedDecisionPayload.pilotWorkbench.id);
    assert.ok(storedWorkbenchPayload.pilotWorkbench.backlog.next.length >= 1);
    assert.ok(storedWorkbenchPayload.pilotWorkbench.nextApiSequence.includes("GET /projects/{id}/pilot-workbench"));

    response = await fetch(`${baseUrl}/projects/${projectId}/mvp-blueprint`, {
      method: "GET",
      headers
    });

    assert.equal(response.status, 200);
    const storedBlueprintPayload = await response.json();
    assert.equal(storedBlueprintPayload.project.latestMvpBlueprintId, bootstrapPayload.mvpBlueprint.id);
    assert.equal(storedBlueprintPayload.mvpBlueprint.id, bootstrapPayload.mvpBlueprint.id);
    assert.equal(storedBlueprintPayload.mvpBlueprint.ideaInput.targetUser, "clinic operations lead");

    response = await fetch(`${baseUrl}/projects/${projectId}/mvp-blueprint`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        targetUser: "multi-site clinic manager",
        desiredOutcome: "validate a single appointment workflow before broader rollout",
        constraints: [
          "do not build billing in the first MVP",
          "keep the first pilot limited to one clinic"
        ],
        autobind: "builtin",
        queueRun: false
      })
    });

    assert.equal(response.status, 201);
    const refreshedBlueprintPayload = await response.json();
    assert.notEqual(refreshedBlueprintPayload.mvpBlueprint.id, bootstrapPayload.mvpBlueprint.id);
    assert.equal(
      refreshedBlueprintPayload.project.latestMvpBlueprintId,
      refreshedBlueprintPayload.mvpBlueprint.id
    );
    assert.equal(
      refreshedBlueprintPayload.project.latestMvpDecisionId,
      refreshedBlueprintPayload.mvpDecision.id
    );
    assert.equal(
      refreshedBlueprintPayload.project.latestPilotWorkbenchId,
      refreshedBlueprintPayload.pilotWorkbench.id
    );
    assert.equal(refreshedBlueprintPayload.mvpBlueprint.ideaInput.targetUser, "multi-site clinic manager");
    assert.equal(
      refreshedBlueprintPayload.mvpBlueprint.ideaInput.desiredOutcome,
      "validate a single appointment workflow before broader rollout"
    );
    assert.equal(refreshedBlueprintPayload.mvpDecision.blueprintId, refreshedBlueprintPayload.mvpBlueprint.id);
    assert.equal(refreshedBlueprintPayload.pilotWorkbench.blueprintId, refreshedBlueprintPayload.mvpBlueprint.id);

    response = await fetch(`${baseUrl}/projects/${projectId}/pilot-workbench`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        runId
      })
    });

    assert.equal(response.status, 201);
    const refreshedWorkbenchPayload = await response.json();
    assert.equal(
      refreshedWorkbenchPayload.project.latestPilotWorkbenchId,
      refreshedWorkbenchPayload.pilotWorkbench.id
    );
    assert.equal(refreshedWorkbenchPayload.pilotWorkbench.currentRunId, runId);
    assert.ok(refreshedWorkbenchPayload.pilotWorkbench.pilotPacket.acceptanceRule.includes("Proceed only if"));
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest compiles targeted cosmetic and cosmology domain packs into executable system graphs", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `cross-domain-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  await mkdir(tempDir, { recursive: true });

  const { server } = await createApp({
    apiKey: "cross-domain-key",
    dataFilePath,
    runDelayMs: 5
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const headers = {
    "content-type": "application/json",
    "x-api-key": "cross-domain-key",
    "x-workspace-id": "ws-cross-domain"
  };

  try {
    let response = await fetch(`${baseUrl}/projects`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Universal Science Pilot",
        description: "Cosmetic dermal formulation with observation calibration and cosmology inference targets.",
        targetDomains: ["cosmetic_science", "space_cosmology"]
      })
    });

    assert.equal(response.status, 201);
    const projectPayload = await response.json();
    const projectId = projectPayload.project.id;

    response = await fetch(`${baseUrl}/projects/${projectId}/documents`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "cross-domain-spec.md",
        format: "markdown",
        content: "The cosmetic serum shall maintain dermal safety, preservative efficacy and sensory consistency. The observation pipeline shall preserve calibration quality and cosmology fit confidence."
      })
    });

    assert.equal(response.status, 201);

    response = await fetch(`${baseUrl}/projects/${projectId}/compile`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        systemName: "Universal Test Graph",
        targetDomains: ["cosmetic_science", "space_cosmology"]
      })
    });

    assert.equal(response.status, 202);
    const compilePayload = await response.json();
    assert.ok(["cosmetic_science", "space_cosmology"].includes(compilePayload.compilation.graphSummary.dominantDomainId));

    response = await fetch(`${baseUrl}/projects/${projectId}/system-graph`, {
      method: "GET",
      headers
    });

    assert.equal(response.status, 200);
    const graphPayload = await response.json();
    assert.ok(graphPayload.graph.domainIds.includes("cosmetic_science"));
    assert.ok(graphPayload.graph.domainIds.includes("space_cosmology"));
    assert.ok(graphPayload.graph.components.some((component) => component.name === "Dermal Barrier Interaction"));
    assert.ok(graphPayload.graph.components.some((component) => component.name === "Cosmology Fit Engine"));
    assert.ok(
      graphPayload.graph.solverBindings.some((binding) => binding.compatibleSolvers.includes("skin-penetration-solver"))
    );
    assert.ok(
      graphPayload.graph.solverBindings.some((binding) => binding.compatibleSolvers.includes("orbital-mechanics-solver"))
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest builtin solver registry covers every compatible solver declared in templates", () => {
  const declaredSolvers = [...new Set(templateLibrary.flatMap((template) => template.compatibleSolvers))].sort();
  const builtinNames = getBuiltinSolverNames();
  assert.ok(declaredSolvers.every((solverName) => builtinNames.includes(solverName)));
});

test("TwinTest can execute smoke runs for every builtin solver", () => {
  const builtinCatalog = getBuiltinSolverCatalog();
  const scenario = {
    id: "scenario_smoke",
    type: "nominal_operation"
  };
  const project = {
    id: "project_smoke"
  };
  const graph = {
    id: "graph_smoke",
    components: [{ id: "component_smoke", name: "Smoke Component" }],
    parameters: []
  };

  for (const solverName of getBuiltinSolverNames()) {
    const result = executeBuiltinSolver({
      binding: {
        id: `binding_${solverName}`,
        solver: solverName,
        componentId: "component_smoke",
        configuration: {
          parameters: buildUniversalSolverParameters()
        }
      },
      scenario,
      graph,
      project
    });

    assert.ok(result.metrics);
    assert.ok(Object.keys(result.metrics).length >= 1);
    assert.ok(typeof builtinCatalog[solverName].sector === "string");
  }
});

test("TwinTest requires explicit real solver bindings before runs", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `strict-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  await mkdir(tempDir, { recursive: true });

  const { server } = await createApp({
    apiKey: "strict-key",
    dataFilePath,
    runDelayMs: 5
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const headers = {
    "content-type": "application/json",
    "x-api-key": "strict-key",
    "x-workspace-id": "ws-strict"
  };

  try {
    const projectId = await seedProject(baseUrl, headers);

    let response = await fetch(`${baseUrl}/projects/${projectId}/compile`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        systemName: "Twin Washer"
      })
    });

    assert.equal(response.status, 202);

    response = await fetch(`${baseUrl}/projects/${projectId}/runs`, {
      method: "POST",
      headers,
      body: JSON.stringify({})
    });

    assert.equal(response.status, 409);
    const errorPayload = await response.json();
    assert.equal(errorPayload.error, "Cannot create a run while solver bindings are unresolved.");
    assert.ok(errorPayload.details.unboundSolverBindings > 0);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest executes project -> compile -> bind real artifacts -> run -> report flow", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `case-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  const artifactPath = path.join(tempDir, "washer-metrics.json");
  await mkdir(tempDir, { recursive: true });
  await writeFile(artifactPath, JSON.stringify(buildScenarioArtifact(), null, 2));

  const { server } = await createApp({
    apiKey: "test-key",
    dataFilePath,
    runDelayMs: 5
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const headers = {
    "content-type": "application/json",
    "x-api-key": "test-key",
    "x-workspace-id": "ws-lab"
  };

  try {
    const projectId = await seedProject(baseUrl, headers);

    let response = await fetch(`${baseUrl}/projects/${projectId}/compile`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        systemName: "Twin Washer"
      })
    });

    assert.equal(response.status, 202);
    const compilePayload = await response.json();
    assert.equal(compilePayload.compilation.graphSummary.dominantDomainId, "mechatronics");
    assert.ok(compilePayload.compilation.graphSummary.readiness.unboundSolverBindings > 0);

    response = await fetch(`${baseUrl}/projects/${projectId}/system-graph`, {
      method: "GET",
      headers
    });

    assert.equal(response.status, 200);
    const graphPayload = await response.json();
    assert.ok(graphPayload.graph.components.length >= 6);
    assert.ok(graphPayload.graph.scenarios.some((scenario) => scenario.type === "fault_injection"));
    assert.ok(graphPayload.graph.agentInstances.length >= 6);
    assert.ok(graphPayload.compilation.readiness.unboundSolverBindings > 0);

    response = await fetch(`${baseUrl}/projects/${projectId}/solver-bindings`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        bindings: graphPayload.graph.solverBindings.map((binding) => ({
          bindingId: binding.id,
          solver: binding.compatibleSolvers[0],
          adapterType: "artifact_metrics_json",
          configuration: {
            path: artifactPath,
            selector: "scenarioType",
            label: "Washer validation metrics"
          }
        }))
      })
    });

    assert.equal(response.status, 200);
    const bindingPayload = await response.json();
    assert.equal(bindingPayload.readiness.unboundSolverBindings, 0);

    response = await fetch(`${baseUrl}/projects/${projectId}/runs`, {
      method: "POST",
      headers,
      body: JSON.stringify({})
    });

    assert.equal(response.status, 202);
    const runPayload = await response.json();
    const runId = runPayload.run.id;
    let runStatus = runPayload.run.status;

    for (let index = 0; index < 40 && runStatus !== "completed"; index += 1) {
      await wait(20);
      response = await fetch(`${baseUrl}/runs/${runId}`, {
        method: "GET",
        headers
      });
      assert.equal(response.status, 200);
      const currentRunPayload = await response.json();
      runStatus = currentRunPayload.run.status;
    }

    assert.equal(runStatus, "completed");

    response = await fetch(`${baseUrl}/runs/${runId}/telemetry`, {
      method: "GET",
      headers
    });

    assert.equal(response.status, 200);
    const telemetryPayload = await response.json();
    assert.ok(telemetryPayload.telemetry.some((event) => event.type === "solver.completed"));
    assert.ok(telemetryPayload.telemetry.some((event) => event.type === "run.completed"));

    response = await fetch(`${baseUrl}/runs/${runId}/report`, {
      method: "GET",
      headers
    });

    assert.equal(response.status, 200);
    const reportPayload = await response.json();
    assert.equal(reportPayload.summary.realExecution, true);
    assert.ok(reportPayload.kpiResults.length >= 4);
    assert.ok(reportPayload.gateResults.length >= 4);
    assert.ok(reportPayload.evidenceMatrix.length >= 1);
    assert.equal(reportPayload.summary.validationOutcome, "pass");
    assert.ok(reportPayload.exportArtifactId);
    assert.ok(reportPayload.artifacts.some((artifact) => artifact.path === artifactPath));

    response = await fetch(`${baseUrl}/artifacts/${reportPayload.exportArtifactId}`, {
      method: "GET",
      headers
    });

    assert.equal(response.status, 200);
    const reportArtifactPayload = await response.json();
    assert.equal(reportArtifactPayload.artifact.kind, "run_report");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest executes builtin solver library through autobind", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `builtin-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  await mkdir(tempDir, { recursive: true });

  const { server } = await createApp({
    apiKey: "builtin-key",
    dataFilePath,
    runDelayMs: 5
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const headers = {
    "content-type": "application/json",
    "x-api-key": "builtin-key",
    "x-workspace-id": "ws-builtin"
  };

  try {
    const projectId = await seedProject(baseUrl, headers);

    let response = await fetch(`${baseUrl}/projects/${projectId}/compile`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        systemName: "Twin Washer"
      })
    });

    assert.equal(response.status, 202);

    response = await fetch(`${baseUrl}/projects/${projectId}/system-graph`, {
      method: "GET",
      headers
    });

    assert.equal(response.status, 200);
    const graphPayload = await response.json();

    response = await fetch(`${baseUrl}/projects/${projectId}/solver-bindings/autobind-builtin`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        bindingParameters: Object.fromEntries(
          graphPayload.graph.solverBindings.map((binding) => [
            binding.id,
            buildBuiltinParameters(binding.requiredParameters)
          ])
        )
      })
    });

    assert.equal(response.status, 200);
    const bindingPayload = await response.json();
    assert.equal(bindingPayload.readiness.unboundSolverBindings, 0);
    assert.ok(bindingPayload.solverBindings.every((binding) => binding.adapterType === "builtin_solver"));

    response = await fetch(`${baseUrl}/projects/${projectId}/runs`, {
      method: "POST",
      headers,
      body: JSON.stringify({})
    });

    assert.equal(response.status, 202);
    const runPayload = await response.json();
    const runId = runPayload.run.id;
    let runStatus = runPayload.run.status;

    for (let index = 0; index < 40 && !["completed", "failed"].includes(runStatus); index += 1) {
      await wait(20);
      response = await fetch(`${baseUrl}/runs/${runId}`, {
        method: "GET",
        headers
      });
      assert.equal(response.status, 200);
      const currentRunPayload = await response.json();
      runStatus = currentRunPayload.run.status;
    }

    assert.equal(runStatus, "completed");

    response = await fetch(`${baseUrl}/runs/${runId}/report`, {
      method: "GET",
      headers
    });

    assert.equal(response.status, 200);
    const reportPayload = await response.json();
    assert.equal(reportPayload.summary.realExecution, true);
    assert.ok(reportPayload.solverBindings.every((binding) => binding.adapterType === "builtin_solver"));
    assert.ok(reportPayload.summary.validationOutcome === "pass" || reportPayload.summary.validationOutcome === "fail");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest rejects requests without a valid API key", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `auth-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  await mkdir(tempDir, { recursive: true });

  const { server } = await createApp({
    apiKey: "secure-key",
    dataFilePath,
    runDelayMs: 5
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const response = await fetch(`${baseUrl}/projects`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-workspace-id": "ws-auth"
      },
      body: JSON.stringify({
        name: "Unauthorized project"
      })
    });

    assert.equal(response.status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

async function seedProject(baseUrl, headers) {
  let response = await fetch(`${baseUrl}/projects`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: "Twin Washer Pilot",
      description: "Washing machine with motor, drum, pump, valves, controller and vibration limits."
    })
  });

  assert.equal(response.status, 201);
  const projectPayload = await response.json();
  const projectId = projectPayload.project.id;

  response = await fetch(`${baseUrl}/projects/${projectId}/documents`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: "washer-spec.md",
      format: "markdown",
      content: "The system shall complete the cycle safely. Motor and drum must stay under vibration limits. The controller should protect pump and valve flows."
    })
  });

  assert.equal(response.status, 201);
  return projectId;
}

function buildScenarioArtifact() {
  const metrics = {
    performance: 0.92,
    efficiency: 0.88,
    safety: 0.94,
    reliability: 0.9,
    vibration: 0.87,
    thermal: 0.89,
    flow: 0.85,
    pressure: 0.84,
    latency: 0.83,
    quality: 0.86
  };

  const scenarioArtifact = {
    scenarios: {},
    artifacts: [
      {
        kind: "measured_dataset",
        path: ".tmp-tests/source-dataset.csv",
        label: "Dataset reference"
      }
    ]
  };

  for (const scenarioType of [
    "nominal_operation",
    "boundary_conditions",
    "stress_overload",
    "fault_injection",
    "component_degradation",
    "parameter_sweep",
    "control_ablation",
    "safety_failover"
  ]) {
    scenarioArtifact.scenarios[scenarioType] = {
      metrics
    };
  }

  return scenarioArtifact;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function removeDirectoryWithRetry(directoryPath, attempts = 6, delayMs = 120) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await rm(directoryPath, { recursive: true, force: true });
      return;
    } catch (error) {
      if (error?.code !== "EBUSY" || attempt === attempts) {
        throw error;
      }

      await wait(delayMs);
    }
  }
}

function buildBuiltinParameters(requiredParameters) {
  const defaults = buildUniversalSolverParameters();

  return Object.fromEntries(requiredParameters.map((parameterName) => [parameterName, defaults[parameterName]]));
}

function buildUniversalSolverParameters() {
  return {
    throughput_target: 120000,
    power_budget_watts: 420,
    latency_budget_ms: 4,
    dispatch_window_ms: 3,
    queue_depth: 32,
    priority_policy: "priority_weighted",
    mass_kg: 38,
    torque_nm: 52,
    rpm_target: 1400,
    vibration_limit_mm_s: 6.5,
    resonance_band_hz: 170,
    thermal_limit_c: 96,
    heat_flux_w: 320,
    cooldown_window_s: 220,
    flow_target_l_min: 34,
    pressure_limit_bar: 6.5,
    head_limit_m: 26,
    efficiency_target: 0.9,
    valve_response_ms: 40,
    pressure_drop_limit_bar: 1.6,
    network_volume_l: 12,
    leak_threshold_l_min: 0.45,
    detection_latency_s: 4,
    voltage_v: 230,
    current_limit_a: 16,
    sample_time_ms: 10,
    control_bandwidth_hz: 10,
    trip_threshold: 1,
    interlock_response_ms: 28,
    coverage_target: 0.95,
    reference_baseline: 0.93,
    sampling_rate_hz: 250,
    retention_window_s: 3600,
    range_target_km: 420,
    arrival_rate_per_hour: 120,
    service_rate_per_hour: 160,
    sla_hours: 4,
    rework_rate: 0.08,
    requests_per_second: 850,
    service_time_ms: 22,
    replica_count: 12,
    latency_slo_ms: 65,
    policy_count: 120,
    control_coverage: 0.93,
    threat_level: 0.35,
    violation_tolerance: 3,
    step_count: 24,
    mandatory_control_count: 18,
    evidence_completeness_target: 0.95,
    battery_capacity_ah: 18,
    internal_resistance_ohm: 0.045,
    load_current_a: 8,
    voltage_nominal_v: 14.8,
    skin_limit_c: 39,
    device_power_w: 2.8,
    contact_area_cm2: 28,
    ambient_temp_c: 24,
    base_load_kw: 3.2,
    pv_capacity_kw: 5.5,
    storage_capacity_kwh: 10,
    peak_limit_kw: 6,
    vehicle_mass_kg: 125,
    motor_power_kw: 9,
    brake_response_ms: 140,
    alarm_response_ms: 110,
    risk_threshold: 0.85,
    load_n: 1800,
    stiffness_n_mm: 450,
    displacement_limit_mm: 6,
    fatigue_target_cycles: 150000,
    critical_step_count: 8,
    handoff_count: 5,
    max_handoff_delay_min: 18,
    compartment_volume_l: 5,
    clearance_l_h: 0.9,
    dose_mg: 220,
    toxicity_limit: 70,
    generation_mw: 180,
    demand_mw: 150,
    line_limit_mw: 210,
    reserve_margin_target: 0.14,
    demand_m3_h: 260,
    supply_m3_h: 310,
    pressure_target_bar: 4.8,
    leakage_ratio: 0.06,
    redundancy_level: 3,
    repair_time_h: 6,
    hazard_rate: 0.018,
    service_level_target: 0.92,
    stall_speed_m_s: 58,
    max_speed_m_s: 245,
    load_factor_limit: 4.8,
    maneuver_demand: 2.4,
    thrust_target_kn: 84,
    fuel_flow_kg_s: 1.9,
    temperature_limit_c: 1320,
    compressor_ratio: 18,
    mission_duration_h: 12,
    subsystem_count: 14,
    failure_rate_per_h: 0.0015,
    payload_kg: 12,
    joint_speed_deg_s: 180,
    reach_m: 1.4,
    position_tolerance_mm: 2.5,
    sensor_latency_ms: 38,
    stopping_distance_m: 2.8,
    hazard_density: 0.22,
    safety_threshold: 0.82,
    sensor_count: 6,
    dropout_rate: 0.03,
    alignment_error_deg: 1.2,
    portfolio_value: 100000000,
    volatility: 0.18,
    confidence_level: 0.99,
    horizon_days: 10,
    stress_loss_fraction: 0.14,
    liquidity_buffer: 18000000,
    capital_ratio_target: 0.12,
    counterparty_count: 22,
    exposure_ratio: 0.06,
    settlement_window_days: 2,
    heat_loss_kw_k: 0.42,
    hvac_capacity_kw: 18,
    target_temp_c: 21,
    demand_mw: 150,
    renewable_mw: 62,
    storage_mwh: 110,
    reserve_target_mw: 20,
    rainfall_mm: 44,
    catchment_km2: 18,
    infiltration_ratio: 0.38,
    channel_capacity_m3_s: 95,
    reaction_rate_constant: 0.0045,
    reactant_concentration: 1.8,
    residence_time_s: 420,
    target_conversion: 0.82,
    diffusion_coefficient_m2_s: 1.2e-10,
    barrier_thickness_um: 35,
    exposure_time_h: 8,
    retention_target: 0.88,
    shear_rate_s: 120,
    viscosity_pa_s: 18,
    elastic_modulus_kpa: 7,
    spreadability_target: 0.8,
    adsorption_capacity_mg_g: 14,
    surface_area_m2_g: 180,
    contaminant_concentration_mg_l: 3.2,
    skin_diffusion_coeff_cm2_h: 0.0021,
    partition_coefficient: 2.6,
    exposure_dose_mg_cm2: 1.8,
    max_systemic_exposure_mg: 0.6,
    formulation_viscosity_pa_s: 22,
    temperature_cycling_range_c: 28,
    shelf_life_months: 18,
    separation_limit_fraction: 0.08,
    preservative_log_reduction_target: 3,
    microbial_load_cfu_ml: 12000,
    preservative_concentration_pct: 0.85,
    challenge_time_days: 14,
    fragrance_intensity_target: 0.72,
    texture_uniformity_target: 0.9,
    panel_variability: 0.08,
    semi_major_axis_km: 7050,
    eccentricity: 0.012,
    delta_v_budget_m_s: 420,
    sensor_noise_arcsec: 0.18,
    calibration_reference_count: 64,
    exposure_time_s: 1800,
    signal_to_noise_target: 24,
    stellar_mass_solar: 1.1,
    metallicity_fraction: 0.018,
    luminosity_target_lsun: 1.45,
    age_gyr: 4.6,
    hubble_constant_km_s_mpc: 67.8,
    matter_density_omega_m: 0.31,
    dark_energy_density_omega_lambda: 0.69,
    target_reduced_chi2: 1.1
  };
}

function createFakeAiFetch() {
  return async (_url, init) => {
    const request = JSON.parse(init.body);
    const context = JSON.parse(request.input[1].content[0].text);
    const decisions = context.bindings.map((binding) => {
      if (binding.domainId === "compute_semiconductor") {
        return {
          bindingId: binding.bindingId,
          decisionType: "external_manifest",
          solver: "",
          manifestId: "gem5-cli-json",
          reason: "AI-selected runtime-ready compute manifest."
        };
      }

      if (binding.domainId === "fluidic_energy") {
        return {
          bindingId: binding.bindingId,
          decisionType: "external_manifest",
          solver: "",
          manifestId: "openfoam-cli-json",
          reason: "AI-selected runtime-ready fluid manifest."
        };
      }

      if (binding.domainId === "cosmetic_science") {
        return {
          bindingId: binding.bindingId,
          decisionType: "external_manifest",
          solver: "",
          manifestId: "cosmetic-transport-cli-json",
          reason: "AI-selected runtime-ready cosmetic manifest."
        };
      }

      if (binding.domainId === "space_cosmology") {
        return {
          bindingId: binding.bindingId,
          decisionType: "external_manifest",
          solver: "",
          manifestId: "space-orbital-cli-json",
          reason: "AI-selected runtime-ready space manifest."
        };
      }

      if (binding.domainId === "materials_chemistry") {
        return {
          bindingId: binding.bindingId,
          decisionType: "external_manifest",
          solver: "",
          manifestId: "materials-chemistry-cli-json",
          reason: "AI-selected runtime-ready materials manifest."
        };
      }

      return {
        bindingId: binding.bindingId,
        decisionType: "builtin_solver",
        solver: binding.compatibleBuiltinSolvers[0],
        manifestId: "",
        reason: "AI-selected compatible builtin solver."
      };
    });

    return {
      ok: true,
      json: async () => ({
        id: "resp_test_ai",
        model: "openai/gpt-oss-120b",
        output_text: JSON.stringify({
          summary: "AI-selected solver binding plan.",
          decisions
        })
      })
    };
  };
}

function createFakeExternalBillingFetch() {
  return async (url, init) => {
    if (url !== "https://billing-provider.twintest.test/v1/checkout-sessions") {
      return {
        ok: false,
        status: 404,
        json: async () => ({})
      };
    }

    assert.equal(init.method, "POST");
    assert.equal(init.headers.authorization, "Bearer billing-api-key");
    const payload = JSON.parse(init.body);
    assert.equal(payload.planId, "growth");
    assert.equal(payload.billingEmail, "finance@billing-provider-lab.test");

    return {
      ok: true,
      status: 200,
      json: async () => ({
        providerSessionId: "ext_cs_001",
        providerCustomerId: "ext_cus_001",
        checkoutUrl: "https://pay.example.test/checkout/ext_cs_001",
        status: "open",
        billingEmail: payload.billingEmail
      })
    };
  };
}

function createFakeRemoteArtifactFetch(objectMap) {
  return async (url, init = {}) => {
    const prefix = "https://objects.twintest.test/api/objects/";

    if (!String(url).startsWith(prefix)) {
      return {
        ok: false,
        status: 404,
        json: async () => ({})
      };
    }

    const storagePath = decodeURIComponent(String(url).slice(prefix.length));

    if (init.method === "PUT") {
      const bodyBuffer = Buffer.isBuffer(init.body) ? init.body : Buffer.from(init.body);
      objectMap.set(storagePath, bodyBuffer);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          objectUrl: `https://cdn.twintest.test/${storagePath}`
        })
      };
    }

    if (init.method === "GET") {
      const bodyBuffer = objectMap.get(storagePath);

      if (!bodyBuffer) {
        return {
          ok: false,
          status: 404,
          arrayBuffer: async () => new ArrayBuffer(0)
        };
      }

      return {
        ok: true,
        status: 200,
        arrayBuffer: async () => bodyBuffer
      };
    }

    return {
      ok: false,
      status: 405,
      json: async () => ({})
    };
  };
}

function createFakePostgresStoreFetch() {
  const storage = {
    payload: null
  };

  return async (url, init) => {
    assert.equal(url, "https://postgres-gateway.twintest.test/query");
    assert.equal(init.method, "POST");
    assert.equal(init.headers.authorization, "Bearer pg-api-key");
    const request = JSON.parse(init.body);
    const sql = request.sql;
    const params = request.params || [];

    if (sql.startsWith("CREATE SCHEMA IF NOT EXISTS")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ rows: [] })
      };
    }

    if (sql.startsWith("CREATE TABLE IF NOT EXISTS")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ rows: [] })
      };
    }

    if (sql.startsWith("SELECT payload FROM")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          rows: storage.payload ? [{ payload: storage.payload }] : []
        })
      };
    }

    if (sql.startsWith("INSERT INTO")) {
      storage.payload = JSON.parse(params[1]);
      return {
        ok: true,
        status: 200,
        json: async () => ({ rows: [] })
      };
    }

    return {
      ok: false,
      status: 400,
      json: async () => ({ rows: [] })
    };
  };
}
