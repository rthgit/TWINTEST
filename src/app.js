import http from "node:http";
import { readFile } from "node:fs/promises";
import { listSupportedDomains, scenarioProfiles } from "./core/catalog.js";
import {
  getBillingProviderCatalog,
  getCommercePlanCatalog,
  listBillingProviders,
  listCommercePlans
} from "./core/commerce.js";
import { listIdeaDomainGuides } from "./core/idea-to-mvp.js";
import { createPlatform, HttpError } from "./core/platform.js";
import { getSupportedAdapterTypes, getSupportedBuiltinSolvers } from "./core/solver-adapters.js";
import { getBuiltinSolverCatalog } from "./core/builtin-solvers.js";
import { countSolverCategories, getSolverCategoryCatalog, listSolverCategories } from "./core/solver-category-catalog.js";
import {
  getExternalSolverManifestCatalog,
  getExternalSolverManifestSummary,
  listExternalSolverManifests
} from "./core/external-solver-manifests.js";
import {
  getNativeSolverReadinessCatalog,
  getNativeSolverReadinessSummary,
  listNativeSolverReadiness
} from "./core/native-solver-readiness.js";
import {
  getUniversalTestFoundation,
  getUniversalTestFoundationSummary
} from "./core/universal-test-foundation.js";
import {
  getSolverIntegrationRoadmapCatalog,
  getSolverIntegrationSummary,
  listSolverIntegrationRoadmap
} from "./core/solver-integration-roadmap.js";
import { listSolverSectors, proposedSolverSectors, solverSectorCatalog } from "./core/solver-sector-catalog.js";

export async function createApp(options = {}) {
  const platform = createPlatform(options);
  await platform.store.initialize();
  await platform.artifactStore.initialize();
  const studioAssets = await loadStudioAssets();

  const server = http.createServer(async (request, response) => {
    try {
      await handleRequest(request, response, platform, studioAssets);
    } catch (error) {
      handleError(response, error);
    }
  });

  return { server, platform };
}

async function handleRequest(request, response, platform, studioAssets) {
  setBaseHeaders(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url, "http://localhost");
  const pathname = url.pathname;

  if (request.method === "GET" && studioAssets[pathname]) {
    response.writeHead(200, { "Content-Type": studioAssets[pathname].contentType });
    response.end(studioAssets[pathname].body);
    return;
  }

  if (request.method === "GET" && pathname === "/") {
    const nativeSolverReadinessSummary = await getNativeSolverReadinessSummary();
    const nativeSolverReadiness = await getNativeSolverReadinessCatalog();
    const gaReadiness = await platform.getGaReadiness();

    return sendJson(response, 200, {
      service: "TwinTest",
      status: "ok",
      mode: "kernel",
      offerProfile: platform.offerProfile,
      runEngine: {
        mode: platform.runMode,
        storeBackend: platform.store.kind,
        storeRuntime: platform.store.describe ? platform.store.describe() : null
      },
      artifactStorage: platform.artifactStore.describe
        ? platform.artifactStore.describe()
        : {
          backend: platform.artifactStore.kind
        },
      supportedDomains: listSupportedDomains(),
      supportedAdapterTypes: getSupportedAdapterTypes(),
      supportedBuiltinSolvers: getSupportedBuiltinSolvers(),
      builtinSolverCatalog: getBuiltinSolverCatalog(),
      solverCategoryCount: countSolverCategories(),
      solverCategories: listSolverCategories(),
      solverCategoryCatalog: getSolverCategoryCatalog(),
      solverIntegrationSummary: getSolverIntegrationSummary(),
      solverIntegrationRoadmap: getSolverIntegrationRoadmapCatalog(),
      externalSolverManifestSummary: getExternalSolverManifestSummary(),
      externalSolverManifests: getExternalSolverManifestCatalog(),
      commercePlans: listCommercePlans({
        offerProfile: platform.offerProfile
      }),
      commercePlanCatalog: getCommercePlanCatalog({
        offerProfile: platform.offerProfile
      }),
      billingProviders: listBillingProviders(),
      billingProviderCatalog: getBillingProviderCatalog(),
      billingRuntime: platform.billingGateway?.describe ? platform.billingGateway.describe() : null,
      gaReadinessSummary: {
        stage: gaReadiness.stage,
        canDeclareGa: gaReadiness.canDeclareGa,
        criticalCount: gaReadiness.criticalCount,
        warningCount: gaReadiness.warningCount
      },
      nativeSolverReadinessSummary,
      nativeSolverReadiness,
      ideaDomainGuides: listIdeaDomainGuides(),
      universalTestFoundationSummary: getUniversalTestFoundationSummary(),
      universalTestFoundation: getUniversalTestFoundation(),
      solverSectors: listSolverSectors(),
      solverSectorCatalog,
      proposedSolverSectors,
      scenarioTypes: scenarioProfiles.map((scenarioProfile) => scenarioProfile.type),
      endpoints: [
        "GET /studio",
        "GET /ops/health",
        "GET /ops/ga-readiness",
        "GET /commerce/plans",
        "GET /commerce/billing-providers",
        "POST /billing/webhooks/simulated",
        "POST /auth/users/register",
        "POST /auth/login",
        "GET /auth/session",
        "POST /auth/logout",
        "GET /ops/run-queue",
        "POST /ops/run-queue/drain-once",
        "POST /workspaces",
        "GET /workspaces/{id}",
        "GET /workspaces/{id}/billing",
        "POST /workspaces/{id}/billing/checkout-session",
        "GET /workspaces/{id}/billing/invoices",
        "GET /workspaces/{id}/billing/events",
        "POST /workspaces/{id}/subscription",
        "GET /workspaces/{id}/usage",
        "GET /workspaces/{id}/members",
        "POST /workspaces/{id}/members",
        "GET /workspaces/{id}/api-clients",
        "POST /workspaces/{id}/api-clients",
        "GET /idea-domain-guides",
        "POST /ideas/bootstrap",
        "POST /projects",
        "POST /projects/{id}/documents",
        "POST /projects/{id}/documents/import-artifact",
        "GET /projects/{id}/artifacts",
        "POST /projects/{id}/artifacts",
        "POST /projects/{id}/compile",
        "GET /projects/{id}/mvp-blueprint",
        "POST /projects/{id}/mvp-blueprint",
        "GET /projects/{id}/mvp-decision",
        "POST /projects/{id}/mvp-decision",
        "GET /projects/{id}/pilot-workbench",
        "POST /projects/{id}/pilot-workbench",
        "GET /projects/{id}/system-graph",
        "POST /projects/{id}/solver-bindings",
        "POST /projects/{id}/solver-bindings/autobind-builtin",
        "POST /projects/{id}/solver-bindings/autobind-ai",
        "POST /projects/{id}/runs",
        "GET /solver-roadmap",
        "GET /solver-manifests",
        "GET /solver-native-readiness",
        "GET /test-foundation",
        "GET /runs/{id}",
        "GET /runs/{id}/telemetry",
        "GET /runs/{id}/report",
        "GET /artifacts/{id}",
        "GET /artifacts/{id}/content",
        "POST /projects/{id}/reviews"
      ]
    });
  }

  if (request.method === "GET" && pathname === "/solver-roadmap") {
    return sendJson(response, 200, {
      summary: getSolverIntegrationSummary(),
      items: listSolverIntegrationRoadmap(),
      catalog: getSolverIntegrationRoadmapCatalog()
    });
  }

  if (request.method === "GET" && pathname === "/solver-manifests") {
    return sendJson(response, 200, {
      summary: getExternalSolverManifestSummary(),
      items: listExternalSolverManifests(),
      catalog: getExternalSolverManifestCatalog()
    });
  }

  if (request.method === "GET" && pathname === "/solver-native-readiness") {
    return sendJson(response, 200, {
      summary: await getNativeSolverReadinessSummary(),
      items: await listNativeSolverReadiness(),
      catalog: await getNativeSolverReadinessCatalog()
    });
  }

  if (request.method === "GET" && pathname === "/test-foundation") {
    return sendJson(response, 200, {
      summary: getUniversalTestFoundationSummary(),
      foundation: getUniversalTestFoundation()
    });
  }

  if (request.method === "GET" && pathname === "/ops/health") {
    return sendJson(response, 200, await platform.getOperationalHealth());
  }

  if (request.method === "GET" && pathname === "/ops/ga-readiness") {
    return sendJson(response, 200, await platform.getGaReadiness());
  }

  if (request.method === "GET" && pathname === "/idea-domain-guides") {
    return sendJson(response, 200, {
      guides: listIdeaDomainGuides()
    });
  }

  if (request.method === "GET" && pathname === "/commerce/plans") {
    return sendJson(response, 200, {
      offerProfile: platform.offerProfile,
      plans: listCommercePlans({
        offerProfile: platform.offerProfile
      }),
      catalog: getCommercePlanCatalog({
        offerProfile: platform.offerProfile
      })
    });
  }

  if (request.method === "GET" && pathname === "/commerce/billing-providers") {
    return sendJson(response, 200, {
      providers: listBillingProviders(),
      catalog: getBillingProviderCatalog()
    });
  }

  if (request.method === "POST" && pathname === "/billing/webhooks/simulated") {
    const rawBody = await readBodyText(request);
    const body = parseJsonBodyText(rawBody);
    return sendJson(response, 200, await platform.processBillingWebhook({
      provider: body.provider || "simulated_stripe",
      eventType: body.eventType || "",
      payload: body.payload || {},
      signature: normalizeHeaderValue(request.headers["x-billing-signature"] || ""),
      timestamp: normalizeHeaderValue(request.headers["x-billing-timestamp"] || ""),
      legacySecret: normalizeHeaderValue(request.headers["x-billing-webhook-secret"] || request.headers["x-webhook-secret"] || ""),
      rawBody,
      receivedBy: "simulated_billing_webhook"
    }));
  }

  if (request.method === "POST" && pathname === "/auth/users/register") {
    const body = await readJsonBody(request);
    return sendJson(response, 201, await platform.registerUser({
      email: body.email,
      displayName: body.displayName || "",
      password: body.password,
      createdBy: "self_service"
    }));
  }

  if (request.method === "POST" && pathname === "/auth/login") {
    const body = await readJsonBody(request);
    return sendJson(response, 201, await platform.createUserSession({
      workspaceId: body.workspaceId,
      email: body.email,
      password: body.password
    }));
  }

  const authContext = platform.authorize(request.headers);
  platform.enforceRequestPolicy({
    authContext,
    method: request.method,
    path: pathname
  });
  await platform.recordAuthorizedRequest({
    authContext,
    method: request.method,
    path: pathname
  });
  const workspaceId = authContext.workspaceId;

  if (request.method === "POST" && pathname === "/workspaces") {
    platform.assertPlatformAdmin(authContext);
    const body = await readJsonBody(request);
    return sendJson(response, 201, await platform.createWorkspace({
      name: body.name,
      workspaceId: body.workspaceId || "",
      planId: body.planId || "",
      createdBy: authContext.authMode
    }));
  }

  let match = pathname.match(/^\/workspaces\/([^/]+)$/);

  if (request.method === "GET" && match) {
    platform.assertWorkspaceAccess(authContext, decodeURIComponent(match[1]));
    return sendJson(response, 200, await platform.getWorkspace({
      workspaceId: decodeURIComponent(match[1])
    }));
  }

  if (request.method === "GET" && pathname === "/auth/session") {
    return sendJson(response, 200, await platform.getAuthSession({
      authContext
    }));
  }

  if (request.method === "POST" && pathname === "/auth/logout") {
    return sendJson(response, 200, await platform.revokeCurrentSession({
      authContext
    }));
  }

  if (request.method === "GET" && pathname === "/ops/run-queue") {
    if (authContext.authMode !== "master") {
      platform.assertWorkspaceAccess(authContext, workspaceId, ["owner", "admin", "operator"]);
    }

    return sendJson(response, 200, await platform.listRunQueue({
      workspaceId: authContext.authMode === "master"
        ? url.searchParams.get("workspaceId") || ""
        : workspaceId,
      statuses: url.searchParams.getAll("status")
    }));
  }

  if (request.method === "POST" && pathname === "/ops/run-queue/drain-once") {
    if (authContext.authMode !== "master") {
      platform.assertWorkspaceAccess(authContext, workspaceId, ["owner", "admin", "operator"]);
    }

    const body = await readJsonBody(request);
    return sendJson(response, 200, await platform.processQueuedRunsOnce({
      workerId: authContext.userId || authContext.apiClientId || authContext.authMode,
      workspaceId: authContext.authMode === "master"
        ? body.workspaceId || ""
        : workspaceId,
      limit: Number(body.limit) > 0 ? Number(body.limit) : 5
    }));
  }

  match = pathname.match(/^\/workspaces\/([^/]+)\/billing$/);

  if (request.method === "GET" && match) {
    platform.assertWorkspaceAccess(authContext, decodeURIComponent(match[1]), ["owner", "admin"]);
    return sendJson(response, 200, await platform.getWorkspaceBilling({
      workspaceId: decodeURIComponent(match[1])
    }));
  }

  match = pathname.match(/^\/workspaces\/([^/]+)\/billing\/checkout-session$/);

  if (request.method === "POST" && match) {
    platform.assertWorkspaceAccess(authContext, decodeURIComponent(match[1]), ["owner", "admin"]);
    const body = await readJsonBody(request);
    return sendJson(response, 201, await platform.createWorkspaceCheckoutSession({
      workspaceId: decodeURIComponent(match[1]),
      planId: body.planId || "",
      provider: body.provider || "simulated_stripe",
      successUrl: body.successUrl || "",
      cancelUrl: body.cancelUrl || "",
      billingEmail: body.billingEmail || "",
      createdBy: authContext.userId || authContext.apiClientId || authContext.authMode
    }));
  }

  match = pathname.match(/^\/workspaces\/([^/]+)\/billing\/invoices$/);

  if (request.method === "GET" && match) {
    platform.assertWorkspaceAccess(authContext, decodeURIComponent(match[1]), ["owner", "admin"]);
    return sendJson(response, 200, await platform.listWorkspaceBillingInvoices({
      workspaceId: decodeURIComponent(match[1])
    }));
  }

  match = pathname.match(/^\/workspaces\/([^/]+)\/billing\/events$/);

  if (request.method === "GET" && match) {
    platform.assertWorkspaceAccess(authContext, decodeURIComponent(match[1]), ["owner", "admin"]);
    return sendJson(response, 200, await platform.listWorkspaceBillingEvents({
      workspaceId: decodeURIComponent(match[1])
    }));
  }

  match = pathname.match(/^\/workspaces\/([^/]+)\/subscription$/);

  if (request.method === "POST" && match) {
    platform.assertWorkspaceAccess(authContext, decodeURIComponent(match[1]), ["owner", "admin"]);
    const body = await readJsonBody(request);
    return sendJson(response, 200, await platform.updateWorkspaceSubscription({
      workspaceId: decodeURIComponent(match[1]),
      planId: body.planId || "",
      status: body.status || "",
      billingEmail: body.billingEmail || "",
      renewsAt: body.renewsAt || "",
      notes: body.notes || ""
    }));
  }

  match = pathname.match(/^\/workspaces\/([^/]+)\/usage$/);

  if (request.method === "GET" && match) {
    platform.assertWorkspaceAccess(authContext, decodeURIComponent(match[1]), ["owner", "admin", "operator"]);
    return sendJson(response, 200, await platform.getWorkspaceUsage({
      workspaceId: decodeURIComponent(match[1])
    }));
  }

  match = pathname.match(/^\/workspaces\/([^/]+)\/members$/);

  if (request.method === "GET" && match) {
    platform.assertWorkspaceAccess(authContext, decodeURIComponent(match[1]), ["owner", "admin"]);
    return sendJson(response, 200, await platform.listWorkspaceMembers({
      workspaceId: decodeURIComponent(match[1])
    }));
  }

  if (request.method === "POST" && match) {
    platform.assertWorkspaceAccess(authContext, decodeURIComponent(match[1]), ["owner", "admin"]);
    const body = await readJsonBody(request);
    return sendJson(response, 201, await platform.createWorkspaceMember({
      workspaceId: decodeURIComponent(match[1]),
      email: body.email || "",
      displayName: body.displayName || "",
      password: body.password || "",
      role: body.role || "viewer",
      userId: body.userId || "",
      createdBy: authContext.userId || authContext.apiClientId || authContext.authMode
    }));
  }

  match = pathname.match(/^\/workspaces\/([^/]+)\/api-clients$/);

  if (request.method === "GET" && match) {
    platform.assertWorkspaceAccess(authContext, decodeURIComponent(match[1]), ["owner", "admin"]);
    return sendJson(response, 200, await platform.listWorkspaceApiClients({
      workspaceId: decodeURIComponent(match[1])
    }));
  }

  if (request.method === "POST" && match) {
    platform.assertWorkspaceAccess(authContext, decodeURIComponent(match[1]), ["owner", "admin"]);
    const body = await readJsonBody(request);
    return sendJson(response, 201, await platform.createWorkspaceApiClient({
      workspaceId: decodeURIComponent(match[1]),
      name: body.name,
      role: body.role || "operator",
      createdBy: authContext.apiClientId || authContext.authMode
    }));
  }

  if (request.method === "POST" && pathname === "/ideas/bootstrap") {
    const body = await readJsonBody(request);
    return sendJson(response, 201, await platform.bootstrapIdeaToMvp({
      workspaceId,
      idea: body.idea || body.prompt || body.description,
      name: body.name || "",
      desiredOutcome: body.desiredOutcome || "",
      targetUser: body.targetUser || "",
      constraints: body.constraints || [],
      targetDomains: body.targetDomains || [],
      autobind: body.autobind || "builtin",
      strategy: body.strategy || "prefer_runtime_ready",
      instructions: body.instructions || "",
      queueRun: Boolean(body.queueRun),
      runLabel: body.runLabel || "",
      systemName: body.systemName || ""
    }));
  }

  if (request.method === "POST" && pathname === "/projects") {
    const body = await readJsonBody(request);
    platform.assertWorkspaceAccess(authContext, workspaceId, ["owner", "admin", "operator"]);
    return sendJson(response, 201, await platform.createProject({
      workspaceId,
      name: body.name,
      description: body.description,
      targetDomains: body.targetDomains || []
    }));
  }

  match = pathname.match(/^\/projects\/([^/]+)\/documents$/);

  if (request.method === "POST" && match) {
    const body = await readJsonBody(request);
    platform.assertWorkspaceAccess(authContext, workspaceId, ["owner", "admin", "operator"]);
    return sendJson(response, 201, await platform.addDocument({
      workspaceId,
      projectId: decodeURIComponent(match[1]),
      name: body.name,
      content: body.content || body.body,
      format: body.format,
      metadata: body.metadata || {}
    }));
  }

  match = pathname.match(/^\/projects\/([^/]+)\/documents\/import-artifact$/);

  if (request.method === "POST" && match) {
    const body = await readJsonBody(request);
    platform.assertWorkspaceAccess(authContext, workspaceId, ["owner", "admin", "operator"]);
    return sendJson(response, 201, await platform.importDocumentArtifact({
      workspaceId,
      projectId: decodeURIComponent(match[1]),
      name: body.name,
      format: body.format,
      mediaType: body.mediaType || "",
      textContent: body.textContent || "",
      contentBase64: body.contentBase64 || "",
      encoding: body.encoding || "utf8",
      metadata: body.metadata || {},
      createdBy: authContext.userId || authContext.apiClientId || authContext.authMode
    }));
  }

  match = pathname.match(/^\/projects\/([^/]+)\/artifacts$/);

  if (request.method === "GET" && match) {
    platform.assertWorkspaceAccess(authContext, workspaceId, ["owner", "admin", "operator", "viewer"]);
    return sendJson(response, 200, await platform.listProjectArtifacts({
      workspaceId,
      projectId: decodeURIComponent(match[1])
    }));
  }

  if (request.method === "POST" && match) {
    const body = await readJsonBody(request);
    platform.assertWorkspaceAccess(authContext, workspaceId, ["owner", "admin", "operator"]);
    return sendJson(response, 201, await platform.createProjectArtifact({
      workspaceId,
      projectId: decodeURIComponent(match[1]),
      name: body.name,
      mediaType: body.mediaType || "",
      kind: body.kind || "project_attachment",
      textContent: body.textContent || "",
      contentBase64: body.contentBase64 || "",
      encoding: body.encoding || "utf8",
      metadata: body.metadata || {},
      createdBy: authContext.userId || authContext.apiClientId || authContext.authMode
    }));
  }

  match = pathname.match(/^\/projects\/([^/]+)\/compile$/);

  if (request.method === "POST" && match) {
    const body = await readJsonBody(request);
    platform.assertWorkspaceAccess(authContext, workspaceId, ["owner", "admin", "operator"]);
    return sendJson(response, 202, await platform.compileProject({
      workspaceId,
      projectId: decodeURIComponent(match[1]),
      targetDomains: body.targetDomains || [],
      systemName: body.systemName
    }));
  }

  match = pathname.match(/^\/projects\/([^/]+)\/mvp-blueprint$/);

  if (request.method === "GET" && match) {
    platform.assertWorkspaceAccess(authContext, workspaceId, ["owner", "admin", "operator", "viewer"]);
    return sendJson(response, 200, await platform.getMvpBlueprint({
      workspaceId,
      projectId: decodeURIComponent(match[1])
    }));
  }

  if (request.method === "POST" && match) {
    const body = await readJsonBody(request);
    platform.assertWorkspaceAccess(authContext, workspaceId, ["owner", "admin", "operator"]);
    return sendJson(response, 201, await platform.refreshMvpBlueprint({
      workspaceId,
      projectId: decodeURIComponent(match[1]),
      idea: body.idea || "",
      targetUser: body.targetUser || "",
      desiredOutcome: body.desiredOutcome || "",
      constraints: body.constraints || [],
      autobind: body.autobind || "none",
      queueRun: Boolean(body.queueRun)
    }));
  }

  match = pathname.match(/^\/projects\/([^/]+)\/mvp-decision$/);

  if (request.method === "GET" && match) {
    platform.assertWorkspaceAccess(authContext, workspaceId, ["owner", "admin", "operator", "viewer"]);
    return sendJson(response, 200, await platform.getMvpDecision({
      workspaceId,
      projectId: decodeURIComponent(match[1])
    }));
  }

  if (request.method === "POST" && match) {
    const body = await readJsonBody(request);
    platform.assertWorkspaceAccess(authContext, workspaceId, ["owner", "admin", "operator"]);
    return sendJson(response, 201, await platform.refreshMvpDecision({
      workspaceId,
      projectId: decodeURIComponent(match[1]),
      runId: body.runId || ""
    }));
  }

  match = pathname.match(/^\/projects\/([^/]+)\/pilot-workbench$/);

  if (request.method === "GET" && match) {
    platform.assertWorkspaceAccess(authContext, workspaceId, ["owner", "admin", "operator", "viewer"]);
    return sendJson(response, 200, await platform.getPilotWorkbench({
      workspaceId,
      projectId: decodeURIComponent(match[1])
    }));
  }

  if (request.method === "POST" && match) {
    const body = await readJsonBody(request);
    platform.assertWorkspaceAccess(authContext, workspaceId, ["owner", "admin", "operator"]);
    return sendJson(response, 201, await platform.refreshPilotWorkbench({
      workspaceId,
      projectId: decodeURIComponent(match[1]),
      runId: body.runId || ""
    }));
  }

  match = pathname.match(/^\/projects\/([^/]+)\/system-graph$/);

  if (request.method === "GET" && match) {
    platform.assertWorkspaceAccess(authContext, workspaceId, ["owner", "admin", "operator", "viewer"]);
    return sendJson(response, 200, await platform.getSystemGraph({
      workspaceId,
      projectId: decodeURIComponent(match[1])
    }));
  }

  match = pathname.match(/^\/projects\/([^/]+)\/solver-bindings$/);

  if (request.method === "POST" && match) {
    const body = await readJsonBody(request);
    platform.assertWorkspaceAccess(authContext, workspaceId, ["owner", "admin", "operator"]);
    return sendJson(response, 200, await platform.bindSolvers({
      workspaceId,
      projectId: decodeURIComponent(match[1]),
      bindings: body.bindings || []
    }));
  }

  match = pathname.match(/^\/projects\/([^/]+)\/solver-bindings\/autobind-builtin$/);

  if (request.method === "POST" && match) {
    const body = await readJsonBody(request);
    platform.assertWorkspaceAccess(authContext, workspaceId, ["owner", "admin", "operator"]);
    return sendJson(response, 200, await platform.autoBindBuiltinSolvers({
      workspaceId,
      projectId: decodeURIComponent(match[1]),
      componentParameters: body.componentParameters || {},
      bindingParameters: body.bindingParameters || {},
      replaceExisting: Boolean(body.replaceExisting)
    }));
  }

  match = pathname.match(/^\/projects\/([^/]+)\/solver-bindings\/autobind-ai$/);

  if (request.method === "POST" && match) {
    const body = await readJsonBody(request);
    platform.assertWorkspaceAccess(authContext, workspaceId, ["owner", "admin", "operator"]);
    return sendJson(response, 200, await platform.autoBindAiSolvers({
      workspaceId,
      projectId: decodeURIComponent(match[1]),
      bindingParameters: body.bindingParameters || {},
      manifestConfigurationOverrides: body.manifestConfigurationOverrides || {},
      replaceExisting: Boolean(body.replaceExisting),
      strategy: body.strategy || "prefer_runtime_ready",
      instructions: body.instructions || ""
    }));
  }

  match = pathname.match(/^\/projects\/([^/]+)\/runs$/);

  if (request.method === "POST" && match) {
    const body = await readJsonBody(request);
    platform.assertWorkspaceAccess(authContext, workspaceId, ["owner", "admin", "operator"]);
    return sendJson(response, 202, await platform.createRun({
      workspaceId,
      projectId: decodeURIComponent(match[1]),
      label: body.label,
      scenarioIds: body.scenarioIds || []
    }));
  }

  match = pathname.match(/^\/projects\/([^/]+)\/reviews$/);

  if (request.method === "POST" && match) {
    const body = await readJsonBody(request);
    platform.assertWorkspaceAccess(authContext, workspaceId, ["owner", "admin", "operator"]);
    return sendJson(response, 201, await platform.addReview({
      workspaceId,
      projectId: decodeURIComponent(match[1]),
      runId: body.runId,
      compilationId: body.compilationId,
      decision: body.decision,
      reviewer: body.reviewer,
      notes: body.notes
    }));
  }

  match = pathname.match(/^\/runs\/([^/]+)$/);

  if (request.method === "GET" && match) {
    platform.assertWorkspaceAccess(authContext, workspaceId, ["owner", "admin", "operator", "viewer"]);
    return sendJson(response, 200, await platform.getRun({
      workspaceId,
      runId: decodeURIComponent(match[1])
    }));
  }

  match = pathname.match(/^\/runs\/([^/]+)\/telemetry$/);

  if (request.method === "GET" && match) {
    platform.assertWorkspaceAccess(authContext, workspaceId, ["owner", "admin", "operator", "viewer"]);
    return sendJson(response, 200, await platform.getRunTelemetry({
      workspaceId,
      runId: decodeURIComponent(match[1])
    }));
  }

  match = pathname.match(/^\/runs\/([^/]+)\/report$/);

  if (request.method === "GET" && match) {
    platform.assertWorkspaceAccess(authContext, workspaceId, ["owner", "admin", "operator", "viewer"]);
    return sendJson(response, 200, await platform.getRunReport({
      workspaceId,
      runId: decodeURIComponent(match[1])
    }));
  }

  match = pathname.match(/^\/artifacts\/([^/]+)$/);

  if (request.method === "GET" && match) {
    platform.assertWorkspaceAccess(authContext, workspaceId, ["owner", "admin", "operator", "viewer"]);
    return sendJson(response, 200, await platform.getArtifact({
      workspaceId,
      artifactId: decodeURIComponent(match[1])
    }));
  }

  match = pathname.match(/^\/artifacts\/([^/]+)\/content$/);

  if (request.method === "GET" && match) {
    platform.assertWorkspaceAccess(authContext, workspaceId, ["owner", "admin", "operator", "viewer"]);
    const artifactPayload = await platform.getArtifactContent({
      workspaceId,
      artifactId: decodeURIComponent(match[1])
    });
    return sendBinary(response, 200, artifactPayload.artifact.mediaType, artifactPayload.content, {
      "Content-Disposition": `inline; filename="${sanitizeContentDispositionFilename(artifactPayload.artifact.name)}"`
    });
  }

  throw new HttpError(404, "Endpoint not found.");
}

async function readJsonBody(request) {
  const bodyText = await readBodyText(request);
  return parseJsonBodyText(bodyText);
}

async function readBodyText(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return "";
  }

  return Buffer.concat(chunks).toString("utf8");
}

function parseJsonBodyText(bodyText) {
  if (!String(bodyText || "").trim().length) {
    return {};
  }

  try {
    return JSON.parse(bodyText);
  } catch {
    throw new HttpError(400, "Invalid JSON body.");
  }
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload, null, 2));
}

function sendBinary(response, statusCode, contentType, body, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "Content-Type": contentType || "application/octet-stream",
    ...extraHeaders
  });
  response.end(body);
}

function setBaseHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-api-key, x-workspace-id, x-billing-webhook-secret, x-webhook-secret, x-billing-signature, x-billing-timestamp"
  );
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

function handleError(response, error) {
  if (error instanceof HttpError) {
    if (error.status === 429 && Number(error.details?.retryAfterSeconds) > 0) {
      response.setHeader("Retry-After", String(Math.ceil(Number(error.details.retryAfterSeconds))));
    }

    return sendJson(response, error.status, { error: error.message, details: error.details || null });
  }

  return sendJson(response, 500, { error: "Internal server error." });
}

function sanitizeContentDispositionFilename(name) {
  return String(name || "artifact.bin").replaceAll("\"", "");
}

function normalizeHeaderValue(value) {
  return Array.isArray(value) ? value[0] || "" : String(value || "");
}

async function loadStudioAssets() {
  const [html, css, js] = await Promise.all([
    readFile(new URL("./ui/studio.html", import.meta.url), "utf8"),
    readFile(new URL("./ui/studio.css", import.meta.url), "utf8"),
    readFile(new URL("./ui/studio.js", import.meta.url), "utf8")
  ]);

  return {
    "/studio": {
      contentType: "text/html; charset=utf-8",
      body: html
    },
    "/studio/styles.css": {
      contentType: "text/css; charset=utf-8",
      body: css
    },
    "/studio/app.js": {
      contentType: "application/javascript; charset=utf-8",
      body: js
    }
  };
}
