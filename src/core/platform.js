import { createAiSolverOrchestrator, materializeAiBindingPlan } from "./ai-solver-orchestrator.js";
import { buildBindingParameterSeed } from "./binding-parameter-seeds.js";
import {
  applyBillingWebhookEvent,
  assertPlanLimit,
  buildWorkspaceBillingSummary,
  createBillingCheckoutSessionRecord,
  createApiClientRecord,
  createWorkspaceId,
  createWorkspaceRecord,
  ensureUsageMeter,
  ensureBillingCustomerRecord,
  sanitizeBillingCheckoutSession,
  sanitizeBillingEvent,
  sanitizeBillingInvoice,
  sanitizeBillingCustomer,
  hashApiClientSecret,
  isAiAutobindAllowed,
  isPlanAllowedForOfferProfile,
  resolveDefaultPlanForOfferProfile,
  sanitizeApiClient,
  sanitizeWorkspace,
  updateWorkspaceSubscription as applyWorkspaceSubscriptionUpdate,
  summarizeWorkspaceUsage
} from "./commerce.js";
import { createBillingGateway } from "./billing-gateway.js";
import {
  createSessionRecord,
  createUserRecord,
  createWorkspaceMembership,
  hashSessionToken,
  normalizeEmail,
  sanitizeSession,
  sanitizeUser,
  sanitizeWorkspaceMembership,
  verifyUserPassword
} from "./identity.js";
import { buildIdeaDocumentMarkdown, createMvpBlueprint, suggestProjectName } from "./idea-to-mvp.js";
import { createMvpDecision } from "./mvp-decision-engine.js";
import { createPilotWorkbench } from "./pilot-workbench.js";
import { createHmac, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createArtifactStore } from "./artifact-store.js";
import { domainBlueprints } from "./catalog.js";
import { compileCanonicalGraph } from "./compiler.js";
import { ingestDocumentBuffer } from "./document-ingestion.js";
import { createId } from "./id.js";
import { executeValidationRun } from "./reporting.js";
import { getSupportedAdapterTypes } from "./solver-adapters.js";
import { createStore } from "./store.js";

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

export class TwinTestPlatform {
  constructor({
    store,
    apiKey = "dev-twintest-key",
    offerProfile = "full",
    runDelayMs = 20,
    runMode = "embedded",
    workspaceRoot = process.cwd(),
    artifactStore = createArtifactStore({
      rootDir: path.join(workspaceRoot, "data", "artifacts")
    }),
    billingWebhookSecret = "dev-billing-webhook-secret",
    billingWebhookMode = "auto",
    billingWebhookToleranceMs = 300_000,
    requestRateLimitEnabled = true,
    requestRateLimitMaxRequests = 600,
    requestRateLimitWindowMs = 60_000,
    authLockoutThreshold = 5,
    authLockoutWindowMs = 600_000,
    authLockoutDurationMs = 900_000,
    billingGateway = createBillingGateway(),
    aiOrchestrator = createAiSolverOrchestrator()
  }) {
    this.store = store;
    this.apiKey = apiKey;
    this.offerProfile = normalizeOfferProfile(offerProfile);
    this.runDelayMs = runDelayMs;
    this.runMode = normalizeRunMode(runMode);
    this.workspaceRoot = path.resolve(workspaceRoot);
    this.artifactStore = artifactStore;
    this.embeddedRunPump = null;
    this.workerId = `worker_${process.pid}`;
    this.billingWebhookSecret = billingWebhookSecret;
    this.billingWebhookMode = normalizeBillingWebhookMode(billingWebhookMode);
    this.billingWebhookToleranceMs = normalizePositiveInteger(billingWebhookToleranceMs, 300_000);
    this.requestRateLimitEnabled = Boolean(requestRateLimitEnabled);
    this.requestRateLimitMaxRequests = normalizePositiveInteger(requestRateLimitMaxRequests, 600);
    this.requestRateLimitWindowMs = normalizePositiveInteger(requestRateLimitWindowMs, 60_000);
    this.authLockoutThreshold = normalizePositiveInteger(authLockoutThreshold, 5);
    this.authLockoutWindowMs = normalizePositiveInteger(authLockoutWindowMs, 600_000);
    this.authLockoutDurationMs = normalizePositiveInteger(authLockoutDurationMs, 900_000);
    this.requestRateCounters = new Map();
    this.failedLoginCounters = new Map();
    this.billingGateway = billingGateway;
    this.aiOrchestrator = aiOrchestrator;
  }

  authorize(headers) {
    const apiKey = normalizeHeader(headers["x-api-key"]);
    const requestedWorkspaceId = normalizeHeader(headers["x-workspace-id"]);
    const sessionToken = extractBearerToken(headers.authorization);

    if (!apiKey?.trim() && !sessionToken) {
      throw new HttpError(401, "Invalid API key.");
    }

    if (apiKey?.trim() && apiKey === this.apiKey) {
      const developmentWorkspaceId = requestedWorkspaceId || "default-workspace";
      ensureDevelopmentWorkspace(
        this.store.state,
        developmentWorkspaceId,
        this.offerProfile === "full"
          ? "dev"
          : resolveDefaultPlanForOfferProfile(this.offerProfile)
      );
      return {
        workspaceId: developmentWorkspaceId,
        role: "platform_admin",
        authMode: "master",
        apiClientId: null,
        sessionId: null,
        userId: null
      };
    }

    if (apiKey?.trim()) {
      const secretHash = hashApiClientSecret(apiKey);
      const apiClient = Object.values(this.store.state.apiClients || {}).find((client) =>
        client.secretHash === secretHash && client.status === "active"
      );

      if (!apiClient) {
        throw new HttpError(401, "Invalid API key.");
      }

      const workspace = this.store.state.workspaces[apiClient.workspaceId];

      if (!workspace || workspace.status !== "active") {
        throw new HttpError(403, "Workspace is not active for this API client.");
      }

      if (requestedWorkspaceId && requestedWorkspaceId !== apiClient.workspaceId) {
        throw new HttpError(403, "API client is not authorized for the requested workspace.");
      }

      return {
        workspaceId: apiClient.workspaceId,
        role: apiClient.role,
        authMode: "workspace_client",
        apiClientId: apiClient.id,
        sessionId: null,
        userId: null
      };
    }

    const tokenHash = hashSessionToken(sessionToken);
    const session = Object.values(this.store.state.sessions || {}).find((entry) =>
      entry.tokenHash === tokenHash && entry.status === "active"
    );

    if (!session) {
      throw new HttpError(401, "Invalid session token.");
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      throw new HttpError(401, "Session has expired.");
    }

    if (requestedWorkspaceId && requestedWorkspaceId !== session.workspaceId) {
      throw new HttpError(403, "Session is not authorized for the requested workspace.");
    }

    const membership = this.store.state.workspaceMemberships[session.membershipId];
    const workspace = this.store.state.workspaces[session.workspaceId];
    const user = this.store.state.users[session.userId];

    if (!workspace || workspace.status !== "active") {
      throw new HttpError(403, "Workspace is not active for this session.");
    }

    if (!membership || membership.status !== "active" || !user || user.status !== "active") {
      throw new HttpError(403, "Session membership is no longer active.");
    }

    return {
      workspaceId: session.workspaceId,
      role: membership.role,
      authMode: "user_session",
      apiClientId: null,
      sessionId: session.id,
      userId: user.id
    };
  }

  async recordAuthorizedRequest({ authContext, method, path: routePath }) {
    await this.store.transact((state) => {
      const usageMeter = ensureUsageMeter(state, authContext.workspaceId);
      usageMeter.apiCalls += 1;
      usageMeter.lastActivityAt = new Date().toISOString();
      usageMeter.endpointCounters[`${method} ${routePath}`] = (usageMeter.endpointCounters[`${method} ${routePath}`] || 0) + 1;

      if (authContext.apiClientId && state.apiClients[authContext.apiClientId]) {
        state.apiClients[authContext.apiClientId].lastUsedAt = new Date().toISOString();
      }

      if (authContext.sessionId && state.sessions[authContext.sessionId]) {
        state.sessions[authContext.sessionId].lastUsedAt = new Date().toISOString();
      }

      if (authContext.userId && state.users[authContext.userId]) {
        state.users[authContext.userId].lastLoginAt = new Date().toISOString();
      }
    });
  }

  enforceRequestPolicy({ authContext, method, path: routePath, nowMs = Date.now() }) {
    if (!this.requestRateLimitEnabled) {
      return;
    }

    const policyKey = [
      authContext.workspaceId,
      authContext.authMode,
      authContext.userId || authContext.apiClientId || authContext.sessionId || "anonymous"
    ].join(":");
    const currentWindow = this.requestRateCounters.get(policyKey) || {
      startedAt: nowMs,
      requestCount: 0
    };
    const elapsedMs = nowMs - currentWindow.startedAt;
    const withinWindow = elapsedMs >= 0 && elapsedMs < this.requestRateLimitWindowMs;
    const windowEntry = withinWindow
      ? currentWindow
      : {
        startedAt: nowMs,
        requestCount: 0
      };

    if (windowEntry.requestCount >= this.requestRateLimitMaxRequests) {
      const retryAfterMs = Math.max(1, this.requestRateLimitWindowMs - Math.max(0, nowMs - windowEntry.startedAt));
      throw new HttpError(429, "Request rate limit exceeded.", {
        workspaceId: authContext.workspaceId,
        method,
        path: routePath,
        retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
        limit: this.requestRateLimitMaxRequests,
        windowSeconds: Math.ceil(this.requestRateLimitWindowMs / 1000)
      });
    }

    windowEntry.requestCount += 1;
    this.requestRateCounters.set(policyKey, windowEntry);
  }

  assertLoginNotLocked({ workspaceId, email, nowMs = Date.now() }) {
    const key = `${workspaceId}:${normalizeEmail(email)}`;
    const counter = this.failedLoginCounters.get(key);

    if (!counter || !counter.lockedUntil) {
      return;
    }

    if (counter.lockedUntil <= nowMs) {
      this.failedLoginCounters.delete(key);
      return;
    }

    throw new HttpError(429, "Too many login attempts. Try again later.", {
      workspaceId,
      email: normalizeEmail(email),
      lockedUntil: new Date(counter.lockedUntil).toISOString(),
      retryAfterSeconds: Math.ceil((counter.lockedUntil - nowMs) / 1000)
    });
  }

  registerFailedLoginAttempt({ workspaceId, email, nowMs = Date.now() }) {
    const key = `${workspaceId}:${normalizeEmail(email)}`;
    const counter = this.failedLoginCounters.get(key) || {
      attempts: [],
      lockedUntil: 0
    };

    counter.attempts = counter.attempts.filter((timestampMs) => nowMs - timestampMs <= this.authLockoutWindowMs);
    counter.attempts.push(nowMs);

    if (counter.attempts.length >= this.authLockoutThreshold) {
      counter.attempts = [];
      counter.lockedUntil = nowMs + this.authLockoutDurationMs;
    }

    this.failedLoginCounters.set(key, counter);

    return counter.lockedUntil > nowMs ? counter.lockedUntil : 0;
  }

  clearFailedLoginAttempts({ workspaceId, email }) {
    this.failedLoginCounters.delete(`${workspaceId}:${normalizeEmail(email)}`);
  }

  assertPlatformAdmin(authContext) {
    if (authContext.authMode !== "master") {
      throw new HttpError(403, "Platform admin access is required.");
    }
  }

  assertWorkspaceAccess(authContext, workspaceId, allowedRoles = ["owner", "admin", "operator", "viewer"]) {
    if (authContext.authMode === "master") {
      return;
    }

    if (authContext.workspaceId !== workspaceId) {
      throw new HttpError(403, "Workspace access denied.");
    }

    if (!allowedRoles.includes(authContext.role)) {
      throw new HttpError(403, "This API client role is not allowed for the requested workspace action.");
    }
  }

  resolvePlanIdForOffer(planId = "", { allowFallback = true } = {}) {
    const requestedPlanId = String(planId || "").trim();

    if (requestedPlanId) {
      if (!isPlanAllowedForOfferProfile(requestedPlanId, this.offerProfile)) {
        throw new HttpError(403, `Plan ${requestedPlanId} is not available in offer profile ${this.offerProfile}.`);
      }

      return requestedPlanId;
    }

    if (!allowFallback) {
      throw new HttpError(400, "Plan id is required.");
    }

    return resolveDefaultPlanForOfferProfile(this.offerProfile);
  }

  async createWorkspace({ name, workspaceId = "", planId = "", createdBy = "platform_admin" }) {
    if (!name?.trim()) {
      throw new HttpError(400, "Workspace name is required.");
    }

    return this.store.transact((state) => {
      const resolvedPlanId = this.resolvePlanIdForOffer(planId, {
        allowFallback: true
      });
      const resolvedWorkspaceId = createWorkspaceId(name, workspaceId);

      if (state.workspaces[resolvedWorkspaceId]) {
        throw new HttpError(409, "Workspace already exists.");
      }

      const workspace = createWorkspaceRecord({
        workspaceId: resolvedWorkspaceId,
        name,
        planId: resolvedPlanId,
        createdBy
      });
      const { client, apiKey } = createApiClientRecord({
        workspaceId: resolvedWorkspaceId,
        name: "Owner API Client",
        role: "owner",
        createdBy
      });

      state.workspaces[workspace.id] = workspace;
      state.apiClients[client.id] = client;
      workspace.apiClientIds.push(client.id);
      ensureUsageMeter(state, workspace.id);

      return {
        workspace: sanitizeWorkspace(workspace, summarizeWorkspaceUsage({ state, workspaceId: workspace.id })),
        bootstrapApiClient: {
          ...sanitizeApiClient(client),
          apiKey
        }
      };
    });
  }

  async getWorkspace({ workspaceId }) {
    const snapshot = await this.store.snapshot();
    const workspace = getWorkspace(snapshot, workspaceId);

    return {
      workspace: sanitizeWorkspace(workspace, summarizeWorkspaceUsage({ state: snapshot, workspaceId }))
    };
  }

  async listWorkspaceApiClients({ workspaceId }) {
    const snapshot = await this.store.snapshot();
    getWorkspace(snapshot, workspaceId);

    return {
      workspaceId,
      apiClients: Object.values(snapshot.apiClients)
        .filter((client) => client.workspaceId === workspaceId)
        .map((client) => sanitizeApiClient(client))
    };
  }

  async createWorkspaceApiClient({ workspaceId, name, role = "operator", createdBy = "workspace_owner" }) {
    if (!name?.trim()) {
      throw new HttpError(400, "API client name is required.");
    }

    return this.store.transact((state) => {
      const workspace = getWorkspace(state, workspaceId);
      const currentClients = Object.values(state.apiClients).filter((client) => client.workspaceId === workspaceId);
      try {
        assertPlanLimit({
          state,
          workspaceId,
          resource: "apiClients",
          currentCount: currentClients.length
        });
      } catch (error) {
        throw new HttpError(403, error.message);
      }

      const { client, apiKey } = createApiClientRecord({
        workspaceId,
        name,
        role,
        createdBy
      });

      state.apiClients[client.id] = client;
      workspace.apiClientIds.push(client.id);
      ensureUsageMeter(state, workspaceId);

      return {
        apiClient: sanitizeApiClient(client),
        apiKey
      };
    });
  }

  async getWorkspaceUsage({ workspaceId }) {
    const snapshot = await this.store.snapshot();
    getWorkspace(snapshot, workspaceId);

    return {
      workspaceId,
      usage: summarizeWorkspaceUsage({ state: snapshot, workspaceId })
    };
  }

  async getWorkspaceBilling({ workspaceId }) {
    const snapshot = await this.store.snapshot();
    getWorkspace(snapshot, workspaceId);

    return {
      workspaceId,
      billing: buildWorkspaceBillingSummary({ state: snapshot, workspaceId })
    };
  }

  async createWorkspaceCheckoutSession({
    workspaceId,
    planId = "",
    provider = "simulated_stripe",
    successUrl = "",
    cancelUrl = "",
    billingEmail = "",
    createdBy = "workspace_owner"
  }) {
    const snapshot = await this.store.snapshot();
    const snapshotWorkspace = getWorkspace(snapshot, workspaceId);
    const resolvedPlanId = this.resolvePlanIdForOffer(planId || snapshotWorkspace.planId, {
      allowFallback: true
    });
    const providerSession = await this.billingGateway.createCheckoutSession({
      provider,
      workspaceId,
      planId: resolvedPlanId,
      billingEmail,
      successUrl,
      cancelUrl,
      amountUsd: buildWorkspaceBillingSummary({ state: snapshot, workspaceId }).estimatedNextInvoiceUsd
    });

    return this.store.transact((state) => {
      const workspace = getWorkspace(state, workspaceId);
      const customer = ensureBillingCustomerRecord({
        state,
        workspaceId,
        provider,
        providerCustomerId: providerSession.customer?.providerCustomerId || "",
        billingEmail: providerSession.customer?.email || billingEmail,
        createdBy
      });
      const checkoutSession = createBillingCheckoutSessionRecord({
        state,
        workspaceId,
        planId: resolvedPlanId || workspace.planId,
        provider,
        successUrl,
        cancelUrl,
        billingEmail: providerSession.customer?.email || billingEmail,
        providerSessionId: providerSession.providerSessionId,
        customerId: customer.id,
        providerCustomerId: providerSession.customer?.providerCustomerId || "",
        checkoutUrl: providerSession.checkoutUrl,
        status: providerSession.status || "open",
        providerPayload: providerSession.providerPayload || {},
        createdBy
      });

      if (providerSession.customer?.email || billingEmail) {
        workspace.billingEmail = providerSession.customer?.email || billingEmail;
      }

      workspace.updatedAt = new Date().toISOString();

      return {
        workspace: sanitizeWorkspace(workspace, summarizeWorkspaceUsage({ state, workspaceId })),
        customer: sanitizeBillingCustomer(customer),
        checkoutSession: sanitizeBillingCheckoutSession(checkoutSession),
        billing: buildWorkspaceBillingSummary({ state, workspaceId })
      };
    });
  }

  async listWorkspaceBillingInvoices({ workspaceId }) {
    const snapshot = await this.store.snapshot();
    getWorkspace(snapshot, workspaceId);

    return {
      workspaceId,
      invoices: Object.values(snapshot.billingInvoices || {})
        .filter((invoice) => invoice.workspaceId === workspaceId)
        .sort((left, right) => right.issuedAt.localeCompare(left.issuedAt))
        .map((invoice) => sanitizeBillingInvoice(invoice))
    };
  }

  async listWorkspaceBillingEvents({ workspaceId }) {
    const snapshot = await this.store.snapshot();
    getWorkspace(snapshot, workspaceId);

    return {
      workspaceId,
      events: Object.values(snapshot.billingEvents || {})
        .filter((event) => event.workspaceId === workspaceId)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .map((event) => sanitizeBillingEvent(event))
    };
  }

  async processBillingWebhook({
    provider = "simulated_stripe",
    eventType = "",
    payload = {},
    signature = "",
    timestamp = "",
    legacySecret = "",
    rawBody = "",
    receivedBy = "billing_webhook"
  }) {
    const verification = this.verifyBillingWebhookAuth({
      signatureHeader: signature,
      timestampHeader: timestamp,
      legacySecret,
      rawBody
    });

    return this.store.transact((state) => {
      const {
        workspace,
        customer,
        checkoutSession,
        invoice,
        billingEvent
      } = applyBillingWebhookEvent({
        state,
        provider,
        eventType,
        payload,
        createdBy: receivedBy
      });

      return {
        workspace: sanitizeWorkspace(workspace, summarizeWorkspaceUsage({ state, workspaceId: workspace.id })),
        customer: sanitizeBillingCustomer(customer),
        checkoutSession: sanitizeBillingCheckoutSession(checkoutSession),
        invoice: sanitizeBillingInvoice(invoice),
        event: sanitizeBillingEvent(billingEvent),
        verification,
        billing: buildWorkspaceBillingSummary({ state, workspaceId: workspace.id })
      };
    });
  }

  verifyBillingWebhookAuth({
    signatureHeader = "",
    timestampHeader = "",
    legacySecret = "",
    rawBody = ""
  }) {
    const mode = this.billingWebhookMode;
    const normalizedRawBody = String(rawBody || "");

    if (mode === "shared_secret") {
      if (!legacySecret || legacySecret !== this.billingWebhookSecret) {
        throw new HttpError(401, "Invalid billing webhook secret.");
      }

      return {
        mode: "shared_secret",
        verified: true
      };
    }

    const hasSignature = String(signatureHeader || "").trim().length > 0;
    const shouldVerifyHmac = mode === "hmac_sha256" || (mode === "auto" && hasSignature);

    if (shouldVerifyHmac) {
      const parsedSignature = parseBillingSignatureHeader(signatureHeader, timestampHeader);

      if (!parsedSignature.timestamp || !parsedSignature.signature) {
        throw new HttpError(401, "Invalid billing webhook signature header.");
      }

      const nowMs = Date.now();
      const signatureAgeMs = Math.abs(nowMs - parsedSignature.timestamp * 1000);

      if (signatureAgeMs > this.billingWebhookToleranceMs) {
        throw new HttpError(401, "Billing webhook signature timestamp is outside tolerance.");
      }

      const expectedSignature = createHmac("sha256", this.billingWebhookSecret)
        .update(`${parsedSignature.timestamp}.${normalizedRawBody}`)
        .digest("hex");

      if (!safeEqualHex(expectedSignature, parsedSignature.signature)) {
        throw new HttpError(401, "Invalid billing webhook signature.");
      }

      return {
        mode: "hmac_sha256",
        verified: true,
        timestamp: new Date(parsedSignature.timestamp * 1000).toISOString()
      };
    }

    if (!legacySecret || legacySecret !== this.billingWebhookSecret) {
      throw new HttpError(401, "Invalid billing webhook secret.");
    }

    return {
      mode: "shared_secret",
      verified: true
    };
  }

  async updateWorkspaceSubscription({
    workspaceId,
    planId = "",
    status = "",
    billingEmail = "",
    renewsAt = "",
    notes = ""
  }) {
    return this.store.transact((state) => {
      const workspace = getWorkspace(state, workspaceId);
      const resolvedPlanId = this.resolvePlanIdForOffer(planId || workspace.planId, {
        allowFallback: true
      });
      const subscription = applyWorkspaceSubscriptionUpdate(workspace, {
        planId: resolvedPlanId,
        status,
        billingEmail,
        renewsAt,
        notes
      });
      ensureUsageMeter(state, workspaceId);

      return {
        workspace: sanitizeWorkspace(workspace, summarizeWorkspaceUsage({ state, workspaceId })),
        billing: buildWorkspaceBillingSummary({ state, workspaceId }),
        subscription
      };
    });
  }

  async registerUser({ email, displayName = "", password, createdBy = "self_service" }) {
    return this.store.transact((state) => {
      const normalizedEmail = normalizeEmail(email);

      if (findUserByEmail(state, normalizedEmail)) {
        throw new HttpError(409, "User already exists.");
      }

      const user = createUserRecord({
        email: normalizedEmail,
        displayName,
        password,
        createdBy
      });

      state.users[user.id] = user;
      return {
        user: sanitizeUser(user)
      };
    });
  }

  async createWorkspaceMember({
    workspaceId,
    email,
    displayName = "",
    password = "",
    role = "viewer",
    userId = "",
    createdBy = "workspace_owner"
  }) {
    return this.store.transact((state) => {
      const workspace = getWorkspace(state, workspaceId);
      let user = null;

      if (userId) {
        user = state.users[userId];
      } else if (email) {
        user = findUserByEmail(state, email);
      }

      if (!user) {
        user = createUserRecord({
          email,
          displayName,
          password,
          createdBy
        });
        state.users[user.id] = user;
      }

      const existingMembership = findWorkspaceMembership(state, workspaceId, user.id);

      if (existingMembership) {
        throw new HttpError(409, "User is already a member of this workspace.");
      }

      const membership = createWorkspaceMembership({
        workspaceId,
        userId: user.id,
        role,
        createdBy
      });

      state.workspaceMemberships[membership.id] = membership;
      workspace.updatedAt = new Date().toISOString();

      return {
        workspaceId,
        membership: sanitizeWorkspaceMembership({ membership, user })
      };
    });
  }

  async listWorkspaceMembers({ workspaceId }) {
    const snapshot = await this.store.snapshot();
    getWorkspace(snapshot, workspaceId);

    return {
      workspaceId,
      members: Object.values(snapshot.workspaceMemberships)
        .filter((membership) => membership.workspaceId === workspaceId)
        .map((membership) => sanitizeWorkspaceMembership({
          membership,
          user: snapshot.users[membership.userId]
        }))
    };
  }

  async createUserSession({ workspaceId, email, password }) {
    const normalizedEmail = normalizeEmail(email);
    this.assertLoginNotLocked({
      workspaceId,
      email: normalizedEmail
    });

    const snapshot = await this.store.snapshot();
    const workspace = getWorkspace(snapshot, workspaceId);
    const user = findUserByEmail(snapshot, normalizedEmail);

    if (!workspace || workspace.status !== "active" || !user || user.status !== "active") {
      const lockoutUntil = this.registerFailedLoginAttempt({
        workspaceId,
        email: normalizedEmail
      });

      if (lockoutUntil) {
        throw new HttpError(429, "Too many login attempts. Try again later.", {
          workspaceId,
          email: normalizedEmail,
          lockedUntil: new Date(lockoutUntil).toISOString(),
          retryAfterSeconds: Math.ceil((lockoutUntil - Date.now()) / 1000)
        });
      }

      throw new HttpError(401, "Invalid credentials.");
    }

    if (!verifyUserPassword(user, password)) {
      const lockoutUntil = this.registerFailedLoginAttempt({
        workspaceId,
        email: normalizedEmail
      });

      if (lockoutUntil) {
        throw new HttpError(429, "Too many login attempts. Try again later.", {
          workspaceId,
          email: normalizedEmail,
          lockedUntil: new Date(lockoutUntil).toISOString(),
          retryAfterSeconds: Math.ceil((lockoutUntil - Date.now()) / 1000)
        });
      }

      throw new HttpError(401, "Invalid credentials.");
    }

    const membership = findWorkspaceMembership(snapshot, workspaceId, user.id);

    if (!membership || membership.status !== "active") {
      throw new HttpError(403, "User is not an active member of this workspace.");
    }

    this.clearFailedLoginAttempts({
      workspaceId,
      email: normalizedEmail
    });

    const { session, sessionToken } = createSessionRecord({
      workspaceId,
      userId: user.id,
      role: membership.role,
      membershipId: membership.id
    });

    await this.store.transact((state) => {
      state.sessions[session.id] = session;
      state.users[user.id].lastLoginAt = new Date().toISOString();
      state.workspaceMemberships[membership.id].lastUsedAt = new Date().toISOString();
      ensureUsageMeter(state, workspaceId);
    });

    return {
      session: sanitizeSession({ session, user }),
      sessionToken
    };
  }

  async getAuthSession({ authContext }) {
    if (authContext.authMode === "user_session") {
      const snapshot = await this.store.snapshot();
      const session = snapshot.sessions[authContext.sessionId];
      const user = snapshot.users[authContext.userId];

      return {
        auth: {
          authMode: authContext.authMode,
          workspaceId: authContext.workspaceId,
          role: authContext.role,
          session: sanitizeSession({ session, user })
        }
      };
    }

    return {
      auth: {
        authMode: authContext.authMode,
        workspaceId: authContext.workspaceId,
        role: authContext.role,
        apiClientId: authContext.apiClientId || null
      }
    };
  }

  async revokeCurrentSession({ authContext }) {
    if (authContext.authMode !== "user_session" || !authContext.sessionId) {
      throw new HttpError(400, "A user session is required to logout.");
    }

    await this.store.transact((state) => {
      if (state.sessions[authContext.sessionId]) {
        state.sessions[authContext.sessionId].status = "revoked";
        state.sessions[authContext.sessionId].revokedAt = new Date().toISOString();
      }
    });

    return {
      loggedOut: true
    };
  }

  async createProject({ workspaceId, name, description = "", targetDomains = [] }) {
    if (!name?.trim()) {
      throw new HttpError(400, "Project name is required.");
    }

    const project = {
      id: createId("project"),
      workspaceId,
      name: name.trim(),
      description: description.trim(),
      targetDomains: targetDomains.filter((domainId) => domainBlueprints[domainId]),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "draft",
      documentIds: [],
      artifactIds: [],
      compilationIds: [],
      latestCompilationId: null,
      mvpBlueprintIds: [],
      latestMvpBlueprintId: null,
      mvpDecisionIds: [],
      latestMvpDecisionId: null,
      pilotWorkbenchIds: [],
      latestPilotWorkbenchId: null,
      runIds: [],
      reviewIds: []
    };

    await this.store.transact((state) => {
      const liveProjects = Object.values(state.projects).filter((projectEntry) => projectEntry.workspaceId === workspaceId);
      try {
        assertPlanLimit({
          state,
          workspaceId,
          resource: "projects",
          currentCount: liveProjects.length
        });
      } catch (error) {
        throw new HttpError(403, error.message);
      }
      state.projects[project.id] = project;
      const usageMeter = ensureUsageMeter(state, workspaceId);
      usageMeter.projectsCreated += 1;
      usageMeter.lastActivityAt = new Date().toISOString();
    });

    return { project };
  }

  async addDocument({ workspaceId, projectId, name, content, format = "markdown", metadata = {} }) {
    if (!name?.trim()) {
      throw new HttpError(400, "Document name is required.");
    }

    if (!content?.trim()) {
      throw new HttpError(400, "Document content is required.");
    }

    return this.store.transact((state) => {
      const project = getProject(state, projectId, workspaceId);
      const document = {
        id: createId("doc"),
        projectId,
        workspaceId,
        name: name.trim(),
        format,
        metadata,
        content: content.trim(),
        createdAt: new Date().toISOString()
      };

      state.documents[document.id] = document;
      project.documentIds.push(document.id);
      project.updatedAt = new Date().toISOString();
      return { document };
    });
  }

  async importDocumentArtifact({
    workspaceId,
    projectId,
    name,
    format = "markdown",
    mediaType = "",
    textContent = "",
    contentBase64 = "",
    encoding = "utf8",
    metadata = {},
    createdBy = "project_operator"
  }) {
    const artifactResult = await this.createProjectArtifact({
      workspaceId,
      projectId,
      name,
      mediaType: mediaType || inferMediaTypeFromName(name) || inferMediaTypeFromFormat(format),
      kind: "document_source",
      textContent,
      contentBase64,
      encoding,
      metadata: {
        ...metadata,
        importedAs: "document_source"
      },
      createdBy
    });
    const artifact = artifactResult.artifact;
    const buffer = await this.artifactStore.readArtifactContent(artifact);
    let ingestion = null;

    try {
      ingestion = ingestDocumentBuffer({
        name,
        mediaType: artifact.mediaType,
        requestedFormat: format,
        buffer,
        encoding
      });
    } catch (error) {
      throw new HttpError(415, error.message || "Artifact format is not importable as a TwinTest document.");
    }

    const document = await this.addDocument({
      workspaceId,
      projectId,
      name,
      format: ingestion.format,
      content: ingestion.content,
      metadata: {
        ...metadata,
        sourceArtifactId: artifact.id,
        sourceMediaType: artifact.mediaType,
        ingestion: ingestion.metadata
      }
    });

    return {
      artifact,
      document: document.document
    };
  }

  async createProjectArtifact({
    workspaceId,
    projectId,
    name,
    mediaType = "",
    kind = "project_attachment",
    textContent = "",
    contentBase64 = "",
    encoding = "utf8",
    metadata = {},
    runId = "",
    reportId = "",
    createdBy = "project_operator"
  }) {
    if (!name?.trim()) {
      throw new HttpError(400, "Artifact name is required.");
    }

    if (!String(textContent || "").length && !String(contentBase64 || "").length) {
      throw new HttpError(400, "Artifact content is required.");
    }

    const content = buildArtifactBuffer({
      textContent,
      contentBase64,
      encoding
    });

    const artifact = await this.artifactStore.writeArtifact({
      workspaceId,
      projectId,
      runId,
      reportId,
      name,
      mediaType: mediaType || inferMediaTypeFromName(name),
      kind,
      content,
      metadata,
      createdBy
    });

    await this.store.transact((state) => {
      const project = getProject(state, projectId, workspaceId);

      if (runId) {
        getRun(state, runId, workspaceId);
      }

      state.artifacts[artifact.id] = artifact;
      project.artifactIds = Array.isArray(project.artifactIds) ? project.artifactIds : [];
      project.artifactIds.push(artifact.id);
      project.updatedAt = new Date().toISOString();

      if (runId) {
        const run = state.runs[runId];
        run.artifactIds = Array.isArray(run.artifactIds) ? run.artifactIds : [];
        run.artifactIds.push(artifact.id);
      }
    });

    return { artifact };
  }

  async listProjectArtifacts({ workspaceId, projectId }) {
    const snapshot = await this.store.snapshot();
    const project = getProject(snapshot, projectId, workspaceId);

    return {
      project: summarizeProject(project),
      artifacts: (project.artifactIds || [])
        .map((artifactId) => snapshot.artifacts[artifactId])
        .filter(Boolean)
        .map(summarizeArtifact)
    };
  }

  async getArtifact({ workspaceId, artifactId }) {
    const snapshot = await this.store.snapshot();
    const artifact = getArtifact(snapshot, artifactId, workspaceId);
    return {
      artifact: summarizeArtifact(artifact)
    };
  }

  async getArtifactContent({ workspaceId, artifactId }) {
    const snapshot = await this.store.snapshot();
    const artifact = getArtifact(snapshot, artifactId, workspaceId);
    const content = await this.artifactStore.readArtifactContent(artifact);

    return {
      artifact: summarizeArtifact(artifact),
      content
    };
  }

  async compileProject({ workspaceId, projectId, targetDomains = [], systemName }) {
    return this.store.transact((state) => {
      const project = getProject(state, projectId, workspaceId);
      const documents = project.documentIds.map((documentId) => state.documents[documentId]).filter(Boolean);
      const revision = project.compilationIds.length + 1;
      const { projectVersion, graph } = compileCanonicalGraph({
        project,
        documents,
        revision,
        targetDomains,
        systemName
      });

      const compilation = {
        id: createId("compilation"),
        projectId,
        workspaceId,
        status: "compiled",
        createdAt: new Date().toISOString(),
        projectVersion,
        graph
      };

      state.compilations[compilation.id] = compilation;
      project.compilationIds.push(compilation.id);
      project.latestCompilationId = compilation.id;
      project.status = "compiled";
      project.updatedAt = new Date().toISOString();
      const usageMeter = ensureUsageMeter(state, workspaceId);
      usageMeter.compilationsCreated += 1;
      usageMeter.lastActivityAt = new Date().toISOString();

      return {
        compilation: {
          id: compilation.id,
          createdAt: compilation.createdAt,
          projectVersion,
          graphSummary: summarizeGraph(graph)
        }
      };
    });
  }

  async getSystemGraph({ workspaceId, projectId }) {
    const snapshot = await this.store.snapshot();
    const project = getProject(snapshot, projectId, workspaceId);

    if (!project.latestCompilationId) {
      throw new HttpError(404, "Project has no compiled system graph yet.");
    }

    const compilation = snapshot.compilations[project.latestCompilationId];
    return {
      project: summarizeProject(project),
      compilation: {
        id: compilation.id,
        createdAt: compilation.createdAt,
        projectVersion: compilation.projectVersion,
        readiness: summarizeReadiness(compilation.graph)
      },
      graph: compilation.graph
    };
  }

  async bindSolvers({ workspaceId, projectId, bindings = [] }) {
    if (!Array.isArray(bindings) || !bindings.length) {
      throw new HttpError(400, "At least one solver binding update is required.");
    }

    return this.store.transact((state) => {
      const project = getProject(state, projectId, workspaceId);

      if (!project.latestCompilationId) {
        throw new HttpError(409, "Compile the project before binding solvers.");
      }

      const compilation = state.compilations[project.latestCompilationId];
      const bindingMap = new Map(compilation.graph.solverBindings.map((binding) => [binding.id, binding]));

      for (const update of bindings) {
        const binding = bindingMap.get(update.bindingId);

        if (!binding) {
          throw new HttpError(404, `Solver binding ${update.bindingId} not found.`);
        }

        if (!update.solver?.trim()) {
          throw new HttpError(400, `Binding ${update.bindingId} requires a solver name.`);
        }

        if (!update.adapterType || !getSupportedAdapterTypes().includes(update.adapterType)) {
          throw new HttpError(400, `Binding ${update.bindingId} requires a supported adapter type.`);
        }

        if (!update.configuration || typeof update.configuration !== "object") {
          throw new HttpError(400, `Binding ${update.bindingId} requires a configuration object.`);
        }

        binding.solver = update.solver.trim();
        binding.adapterType = update.adapterType;
        binding.configuration = structuredClone(update.configuration);
        binding.status = "bound";
        binding.bindingMode = "real_execution";
        binding.boundAt = new Date().toISOString();
        binding.declaredCompatible = binding.compatibleSolvers.includes(binding.solver);
      }

      project.updatedAt = new Date().toISOString();

      return {
        solverBindings: compilation.graph.solverBindings,
        readiness: summarizeReadiness(compilation.graph)
      };
    });
  }

  async autoBindBuiltinSolvers({
    workspaceId,
    projectId,
    componentParameters = {},
    bindingParameters = {},
    replaceExisting = false
  }) {
    return this.store.transact((state) => {
      const project = getProject(state, projectId, workspaceId);

      if (!project.latestCompilationId) {
        throw new HttpError(409, "Compile the project before binding solvers.");
      }

      const compilation = state.compilations[project.latestCompilationId];

      for (const binding of compilation.graph.solverBindings) {
        if (!replaceExisting && binding.status === "bound") {
          continue;
        }

        const component = compilation.graph.components.find((entry) => entry.id === binding.componentId);
        const solver = binding.compatibleSolvers[0];
        const mergedParameters = {
          ...buildBindingParameterSeed({
            graph: compilation.graph,
            componentId: binding.componentId,
            requiredParameters: binding.requiredParameters
          }),
          ...(componentParameters[component?.id] || {}),
          ...(bindingParameters[binding.id] || {})
        };

        binding.solver = solver;
        binding.adapterType = "builtin_solver";
        binding.configuration = {
          parameters: mergedParameters
        };
        binding.status = "bound";
        binding.bindingMode = "real_execution";
        binding.boundAt = new Date().toISOString();
        binding.declaredCompatible = true;
      }

      project.updatedAt = new Date().toISOString();

      return {
        solverBindings: compilation.graph.solverBindings,
        readiness: summarizeReadiness(compilation.graph)
      };
    });
  }

  async autoBindAiSolvers({
    workspaceId,
    projectId,
    bindingParameters = {},
    manifestConfigurationOverrides = {},
    replaceExisting = false,
    strategy = "prefer_runtime_ready",
    instructions = ""
  }) {
    const snapshot = await this.store.snapshot();
    const project = getProject(snapshot, projectId, workspaceId);

    if (!project.latestCompilationId) {
      throw new HttpError(409, "Compile the project before using AI autobind.");
    }

    const compilation = snapshot.compilations[project.latestCompilationId];
    let plan;
    const workspace = this.store.state.workspaces[workspaceId];

    if (!isAiAutobindAllowed(workspace)) {
      throw new HttpError(403, "AI autobind is not enabled for this workspace plan.");
    }

    try {
      plan = await this.aiOrchestrator.createAutobindPlan({
        project,
        compilation,
        strategy,
        instructions
      });
    } catch (error) {
      throw new HttpError(503, "AI solver autobind is unavailable.", {
        reason: error.message
      });
    }

    return this.store.transact(async (state) => {
      const liveProject = getProject(state, projectId, workspaceId);
      const liveCompilation = state.compilations[liveProject.latestCompilationId];
      const applied = await materializeAiBindingPlan({
        graph: liveCompilation.graph,
        plan,
        replaceExisting,
        bindingParameters,
        manifestConfigurationOverrides
      });

      liveProject.updatedAt = new Date().toISOString();
      const usageMeter = ensureUsageMeter(state, workspaceId);
      usageMeter.aiAutobinds += 1;
      usageMeter.lastActivityAt = new Date().toISOString();

      return {
        solverBindings: liveCompilation.graph.solverBindings,
        readiness: summarizeReadiness(liveCompilation.graph),
        aiPlan: {
          summary: applied.planSummary,
          responseId: applied.responseId,
          model: applied.model,
          provider: applied.provider
        }
      };
    });
  }

  async createRun({ workspaceId, projectId, label = "", scenarioIds = [] }) {
    const result = await this.store.transact((state) => {
      const project = getProject(state, projectId, workspaceId);

      if (!project.latestCompilationId) {
        throw new HttpError(409, "Compile the project before creating runs.");
      }

      const compilation = state.compilations[project.latestCompilationId];
      const readiness = summarizeReadiness(compilation.graph);
      const liveRuns = Object.values(state.runs).filter((runEntry) => runEntry.workspaceId === workspaceId);

      if (readiness.unboundSolverBindings > 0) {
        throw new HttpError(409, "Cannot create a run while solver bindings are unresolved.", readiness);
      }

      try {
        assertPlanLimit({
          state,
          workspaceId,
          resource: "runs",
          currentCount: liveRuns.length
        });
      } catch (error) {
        throw new HttpError(403, error.message);
      }

      const validScenarioIds = new Set(compilation.graph.scenarios.map((scenario) => scenario.id));
      const selectedScenarioIds = scenarioIds.length
        ? scenarioIds.filter((scenarioId) => validScenarioIds.has(scenarioId))
        : [];

      if (scenarioIds.length && !selectedScenarioIds.length) {
        throw new HttpError(400, "No valid scenario ids were provided for this compilation.");
      }

      const run = {
        id: createId("run"),
        projectId,
        workspaceId,
        compilationId: compilation.id,
        label: label || `Run ${project.runIds.length + 1}`,
        status: "queued",
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        selectedScenarioIds,
        scenarioResults: [],
        artifactIds: [],
        reportId: null,
        outcome: null,
        error: null,
        queueJobId: null
      };
      const queueJob = createRunQueueJob({
        workspaceId,
        runId: run.id,
        availableAt: new Date(Date.now() + this.runDelayMs).toISOString()
      });

      state.runs[run.id] = run;
      run.queueJobId = queueJob.id;
      state.runQueueJobs[queueJob.id] = queueJob;
      project.runIds.push(run.id);
      project.updatedAt = new Date().toISOString();
      const usageMeter = ensureUsageMeter(state, workspaceId);
      usageMeter.runsCreated += 1;
      usageMeter.lastActivityAt = new Date().toISOString();
      const queuedTelemetry = createTelemetry({
        runId: run.id,
        sequence: 0,
        type: "run.queued",
        level: "info",
        message: `Validation run ${run.id} queued.`,
        data: {
          compilationId: compilation.id,
          realExecution: true
        }
      });
      state.telemetry[queuedTelemetry.id] = queuedTelemetry;

      return {
        run: summarizeRun(run),
        queueJob: summarizeRunQueueJob(queueJob)
      };
    });

    this.scheduleRunProcessing();
    return result;
  }

  async getRun({ workspaceId, runId }) {
    const snapshot = await this.store.snapshot();
    return { run: summarizeRun(getRun(snapshot, runId, workspaceId)) };
  }

  async getRunTelemetry({ workspaceId, runId }) {
    const snapshot = await this.store.snapshot();
    getRun(snapshot, runId, workspaceId);

    return {
      telemetry: Object.values(snapshot.telemetry)
        .filter((event) => event.runId === runId)
        .sort((left, right) => left.sequence - right.sequence)
    };
  }

  async getRunReport({ workspaceId, runId }) {
    const snapshot = await this.store.snapshot();
    const run = getRun(snapshot, runId, workspaceId);

    if (!run.reportId) {
      throw new HttpError(409, "Run has not produced a report yet.", {
        status: run.status,
        error: run.error
      });
    }

    await this.store.transact((state) => {
      const usageMeter = ensureUsageMeter(state, workspaceId);
      usageMeter.reportsRead += 1;
      usageMeter.lastActivityAt = new Date().toISOString();
    });

    return snapshot.reports[run.reportId];
  }

  async addReview({ workspaceId, projectId, runId, compilationId, decision, reviewer = "human-review", notes = "" }) {
    if (!decision?.trim()) {
      throw new HttpError(400, "Review decision is required.");
    }

    return this.store.transact((state) => {
      const project = getProject(state, projectId, workspaceId);

      if (runId) {
        getRun(state, runId, workspaceId);
      }

      if (compilationId && !state.compilations[compilationId]) {
        throw new HttpError(404, "Compilation not found for review.");
      }

      const review = {
        id: createId("review"),
        projectId,
        workspaceId,
        runId: runId || null,
        compilationId: compilationId || project.latestCompilationId,
        decision: decision.trim(),
        reviewer,
        notes: notes.trim(),
        createdAt: new Date().toISOString()
      };

      state.reviews[review.id] = review;
      project.reviewIds.push(review.id);
      project.updatedAt = new Date().toISOString();

      if (review.compilationId) {
        state.compilations[review.compilationId].graph.reviewDecisions.push(review);
      }

      return { review };
    });
  }

  async bootstrapIdeaToMvp({
    workspaceId,
    idea,
    name = "",
    desiredOutcome = "",
    targetUser = "",
    constraints = [],
    targetDomains = [],
    autobind = "builtin",
    strategy = "prefer_runtime_ready",
    instructions = "",
    queueRun = false,
    runLabel = "",
    systemName = ""
  }) {
    const normalizedIdea = String(idea || "").trim();
    const normalizedAutobind = String(autobind || "builtin").trim().toLowerCase();

    if (!normalizedIdea) {
      throw new HttpError(400, "Idea text is required.");
    }

    if (!["none", "builtin", "ai"].includes(normalizedAutobind)) {
      throw new HttpError(400, "Idea bootstrap requires autobind to be one of: none, builtin, ai.");
    }

    const normalizedTargetDomains = targetDomains.filter((domainId) => domainBlueprints[domainId]);
    const projectName = name.trim() || suggestProjectName(normalizedIdea);
    const projectDescription = desiredOutcome.trim() || normalizedIdea.slice(0, 220);
    const document = buildIdeaDocumentMarkdown({
      idea: normalizedIdea,
      targetUser,
      desiredOutcome,
      constraints,
      targetDomains: normalizedTargetDomains
    });

    const projectResult = await this.createProject({
      workspaceId,
      name: projectName,
      description: projectDescription,
      targetDomains: normalizedTargetDomains
    });

    await this.addDocument({
      workspaceId,
      projectId: projectResult.project.id,
      name: "idea-intake.md",
      content: document,
      format: "markdown",
      metadata: {
        source: "idea_bootstrap"
      }
    });

    const compilationResult = await this.compileProject({
      workspaceId,
      projectId: projectResult.project.id,
      targetDomains: normalizedTargetDomains,
      systemName: systemName.trim() || projectName
    });

    let bindingResult = null;

    if (normalizedAutobind === "builtin") {
      bindingResult = await this.autoBindBuiltinSolvers({
        workspaceId,
        projectId: projectResult.project.id
      });
    } else if (normalizedAutobind === "ai") {
      bindingResult = await this.autoBindAiSolvers({
        workspaceId,
        projectId: projectResult.project.id,
        strategy,
        instructions
      });
    }

    const graphPayload = await this.getSystemGraph({
      workspaceId,
      projectId: projectResult.project.id
    });
    const mvpBlueprint = await this.persistMvpBlueprint({
      workspaceId,
      projectId: projectResult.project.id,
      ideaInput: {
        idea: normalizedIdea,
        targetUser,
        desiredOutcome,
        constraints,
        targetDomains: normalizedTargetDomains
      },
      autobindMode: normalizedAutobind,
      queueRun
    });

    let runResult = null;

    if (queueRun) {
      const readiness = summarizeReadiness(graphPayload.graph);

      if (readiness.unboundSolverBindings > 0) {
        throw new HttpError(409, "Cannot queue the bootstrap run while solver bindings are unresolved.", readiness);
      }

      runResult = await this.createRun({
        workspaceId,
        projectId: projectResult.project.id,
        label: runLabel || `${projectName} Bootstrap Run`
      });
    }

    const mvpDecision = await this.persistMvpDecision({
      workspaceId,
      projectId: projectResult.project.id
    });
    const pilotWorkbench = await this.persistPilotWorkbench({
      workspaceId,
      projectId: projectResult.project.id
    });

    const latestProject = await this.getProjectSummary({
      workspaceId,
      projectId: projectResult.project.id
    });

    return {
      project: latestProject.project,
      compilation: compilationResult.compilation,
      graphSummary: summarizeGraph(graphPayload.graph),
      readiness: summarizeReadiness(graphPayload.graph),
      solverBindings: bindingResult?.solverBindings || graphPayload.graph.solverBindings,
      mvpBlueprint,
      mvpDecision,
      pilotWorkbench,
      run: runResult?.run || null
    };
  }

  async getProjectSummary({ workspaceId, projectId }) {
    const snapshot = await this.store.snapshot();
    const project = getProject(snapshot, projectId, workspaceId);
    return {
      project: summarizeProject(project)
    };
  }

  async getMvpBlueprint({ workspaceId, projectId }) {
    const snapshot = await this.store.snapshot();
    const project = getProject(snapshot, projectId, workspaceId);

    if (!project.latestMvpBlueprintId || !snapshot.mvpBlueprints[project.latestMvpBlueprintId]) {
      throw new HttpError(404, "Project has no MVP blueprint yet.");
    }

    return {
      project: summarizeProject(project),
      mvpBlueprint: snapshot.mvpBlueprints[project.latestMvpBlueprintId]
    };
  }

  async getMvpDecision({ workspaceId, projectId }) {
    const snapshot = await this.store.snapshot();
    const project = getProject(snapshot, projectId, workspaceId);

    if (!project.latestMvpDecisionId || !snapshot.mvpDecisions[project.latestMvpDecisionId]) {
      throw new HttpError(404, "Project has no MVP decision yet.");
    }

    return {
      project: summarizeProject(project),
      mvpDecision: snapshot.mvpDecisions[project.latestMvpDecisionId]
    };
  }

  async getPilotWorkbench({ workspaceId, projectId }) {
    const snapshot = await this.store.snapshot();
    const project = getProject(snapshot, projectId, workspaceId);

    if (!project.latestPilotWorkbenchId || !snapshot.pilotWorkbenches[project.latestPilotWorkbenchId]) {
      throw new HttpError(404, "Project has no pilot workbench yet.");
    }

    return {
      project: summarizeProject(project),
      pilotWorkbench: snapshot.pilotWorkbenches[project.latestPilotWorkbenchId]
    };
  }

  async refreshMvpBlueprint({
    workspaceId,
    projectId,
    idea = "",
    targetUser = "",
    desiredOutcome = "",
    constraints = [],
    autobind = "none",
    queueRun = false
  }) {
    const snapshot = await this.store.snapshot();
    const project = getProject(snapshot, projectId, workspaceId);

    if (!project.latestCompilationId) {
      throw new HttpError(409, "Compile the project before generating an MVP blueprint.");
    }

    const compilation = snapshot.compilations[project.latestCompilationId];
    const existingBlueprint = project.latestMvpBlueprintId
      ? snapshot.mvpBlueprints[project.latestMvpBlueprintId]
      : null;

    const mvpBlueprint = await this.persistMvpBlueprint({
      workspaceId,
      projectId,
      ideaInput: {
        idea: String(idea || "").trim() || existingBlueprint?.ideaInput?.idea || project.description || project.name,
        targetUser: String(targetUser || "").trim() || existingBlueprint?.ideaInput?.targetUser || "",
        desiredOutcome: String(desiredOutcome || "").trim() || existingBlueprint?.ideaInput?.desiredOutcome || "",
        constraints: normalizeConstraints(constraints, existingBlueprint?.ideaInput?.constraints || []),
        targetDomains: project.targetDomains || compilation.graph.domainIds
      },
      autobindMode: String(autobind || existingBlueprint?.ideaInput?.autobindMode || "none").trim().toLowerCase(),
      queueRun
    });
    const mvpDecision = await this.persistMvpDecision({
      workspaceId,
      projectId
    });
    const pilotWorkbench = await this.persistPilotWorkbench({
      workspaceId,
      projectId
    });
    const latestProject = await this.getProjectSummary({
      workspaceId,
      projectId
    });

    return {
      project: latestProject.project,
      mvpBlueprint,
      mvpDecision,
      pilotWorkbench
    };
  }

  async refreshMvpDecision({ workspaceId, projectId, runId = "" }) {
    const mvpDecision = await this.persistMvpDecision({
      workspaceId,
      projectId,
      runId
    });
    const pilotWorkbench = await this.persistPilotWorkbench({
      workspaceId,
      projectId,
      runId
    });
    const latestProject = await this.getProjectSummary({
      workspaceId,
      projectId
    });

    return {
      project: latestProject.project,
      mvpDecision,
      pilotWorkbench
    };
  }

  async refreshPilotWorkbench({ workspaceId, projectId, runId = "" }) {
    const pilotWorkbench = await this.persistPilotWorkbench({
      workspaceId,
      projectId,
      runId
    });
    const latestProject = await this.getProjectSummary({
      workspaceId,
      projectId
    });

    return {
      project: latestProject.project,
      pilotWorkbench
    };
  }

  async listRunQueue({ workspaceId = "", statuses = [] } = {}) {
    const snapshot = await this.store.snapshot();
    const normalizedStatuses = statuses.map((status) => String(status || "").trim().toLowerCase()).filter(Boolean);
    const jobs = Object.values(snapshot.runQueueJobs || {})
      .filter((job) => !workspaceId || job.workspaceId === workspaceId)
      .filter((job) => !normalizedStatuses.length || normalizedStatuses.includes(job.status))
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .map((job) => summarizeRunQueueJob(job, snapshot.runs[job.runId]));

    return {
      workerMode: this.runMode,
      storeBackend: this.store.kind,
      jobs
    };
  }

  async getOperationalHealth() {
    const timestamp = new Date().toISOString();
    const checks = [];
    let storeStatus = "ok";
    let artifactStatus = "ok";

    try {
      await this.store.snapshot();
    } catch (error) {
      storeStatus = "error";
      checks.push({
        component: "store",
        severity: "critical",
        message: `Store backend error: ${error.message}`
      });
    }

    try {
      await this.artifactStore.initialize();
    } catch (error) {
      artifactStatus = "error";
      checks.push({
        component: "artifact_store",
        severity: "critical",
        message: `Artifact store error: ${error.message}`
      });
    }

    const status = checks.some((check) => check.severity === "critical") ? "degraded" : "ok";

    return {
      status,
      timestamp,
      runMode: this.runMode,
      components: {
        store: {
          status: storeStatus,
          backend: this.store.kind
        },
        artifactStore: {
          status: artifactStatus,
          backend: this.artifactStore.kind
        },
        billing: {
          status: "ok",
          webhookMode: this.billingWebhookMode
        },
        requestPolicy: {
          status: this.requestRateLimitEnabled ? "ok" : "warning",
          rateLimitEnabled: this.requestRateLimitEnabled,
          maxRequests: this.requestRateLimitMaxRequests,
          windowSeconds: Math.ceil(this.requestRateLimitWindowMs / 1000)
        }
      },
      checks
    };
  }

  async getGaReadiness() {
    const health = await this.getOperationalHealth();
    const checks = [];

    checks.push({
      id: "store_backend",
      severity: this.store.kind === "json" ? "critical" : "pass",
      message: this.store.kind === "json"
        ? "GA richiede un backend persistente robusto: usare sqlite o postgres_http, non json."
        : `Store backend ${this.store.kind} idoneo per il gate GA.`
    });
    checks.push({
      id: "api_key_hardening",
      severity: this.apiKey === "dev-twintest-key" ? "critical" : "pass",
      message: this.apiKey === "dev-twintest-key"
        ? "La API key di piattaforma e ancora quella di sviluppo."
        : "API key di piattaforma non di default."
    });
    checks.push({
      id: "billing_webhook_secret",
      severity: this.billingWebhookSecret === "dev-billing-webhook-secret" ? "critical" : "pass",
      message: this.billingWebhookSecret === "dev-billing-webhook-secret"
        ? "Webhook billing secret ancora di default."
        : "Webhook billing secret non di default."
    });
    checks.push({
      id: "billing_webhook_mode",
      severity: this.billingWebhookMode === "shared_secret" ? "warning" : "pass",
      message: this.billingWebhookMode === "shared_secret"
        ? "Modalita shared_secret compatibile ma meno robusta della firma HMAC."
        : `Modalita webhook ${this.billingWebhookMode} compatibile con hardening GA.`
    });
    checks.push({
      id: "request_rate_limit",
      severity: this.requestRateLimitEnabled ? "pass" : "critical",
      message: this.requestRateLimitEnabled
        ? "Rate limit attivo."
        : "Rate limit disattivato."
    });
    checks.push({
      id: "auth_lockout",
      severity: this.authLockoutThreshold > 0 ? "pass" : "critical",
      message: this.authLockoutThreshold > 0
        ? "Lockout login attivo."
        : "Lockout login non configurato."
    });
    checks.push({
      id: "run_mode",
      severity: this.runMode === "external" ? "pass" : "warning",
      message: this.runMode === "external"
        ? "Run mode esterno attivo."
        : "Run mode embedded valido per dev, ma external e raccomandato per GA."
    });
    checks.push({
      id: "artifact_backend",
      severity: this.artifactStore.kind === "local_filesystem" ? "warning" : "pass",
      message: this.artifactStore.kind === "local_filesystem"
        ? "Artifact backend locale attivo: valutare object storage per resilienza produzione."
        : `Artifact backend ${this.artifactStore.kind} adatto al rollout commerciale.`
    });
    checks.push({
      id: "operational_health",
      severity: health.status === "ok" ? "pass" : "critical",
      message: health.status === "ok"
        ? "Health check operativo ok."
        : "Health check operativo degradato."
    });

    const criticalCount = checks.filter((check) => check.severity === "critical").length;
    const warningCount = checks.filter((check) => check.severity === "warning").length;
    const stage = criticalCount > 0
      ? "commercial_alpha"
      : warningCount > 0
        ? "ga_candidate_with_warnings"
        : "commercial_ga_ready";

    return {
      stage,
      canDeclareGa: stage === "commercial_ga_ready",
      criticalCount,
      warningCount,
      checks,
      health
    };
  }

  scheduleRunProcessing() {
    if (this.runMode !== "embedded" || this.embeddedRunPump) {
      return;
    }

    this.embeddedRunPump = setTimeout(async () => {
      this.embeddedRunPump = null;

      try {
        const result = await this.processQueuedRunsOnce({
          workerId: `${this.workerId}_embedded`,
          limit: 4
        });

        if (result.remainingCount > 0) {
          this.scheduleRunProcessing();
        }
      } catch {
        this.scheduleRunProcessing();
      }
    }, this.runDelayMs);
  }

  async processQueuedRunsOnce({ workerId = this.workerId, limit = 1, workspaceId = "" } = {}) {
    const claimedJobs = await this.claimQueuedRunJobs({
      workerId,
      limit,
      workspaceId
    });
    const processedJobs = [];

    for (const job of claimedJobs) {
      const result = await this.processRunJob({
        jobId: job.id,
        runId: job.runId,
        workerId
      });
      processedJobs.push(result);
    }

    const snapshot = await this.store.snapshot();
    const remainingCount = Object.values(snapshot.runQueueJobs || {})
      .filter((job) => (!workspaceId || job.workspaceId === workspaceId) && job.status === "queued")
      .length;

    return {
      workerId,
      claimedCount: claimedJobs.length,
      processedCount: processedJobs.length,
      remainingCount,
      jobs: processedJobs
    };
  }

  async claimQueuedRunJobs({ workerId = this.workerId, limit = 1, workspaceId = "" } = {}) {
    const now = Date.now();

    return this.store.transact((state) => {
      const claimableJobs = Object.values(state.runQueueJobs || {})
        .filter((job) => job.status === "queued")
        .filter((job) => !workspaceId || job.workspaceId === workspaceId)
        .filter((job) => new Date(job.availableAt).getTime() <= now)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
        .slice(0, limit);

      for (const job of claimableJobs) {
        job.status = "leased";
        job.claimedAt = new Date().toISOString();
        job.claimedBy = workerId;
        job.attemptCount += 1;
        job.updatedAt = new Date().toISOString();
      }

      return claimableJobs.map((job) => summarizeRunQueueJob(job));
    });
  }

  async processRunJob({ jobId, runId, workerId = this.workerId }) {
    const result = await this.processRun(runId);

    await this.store.transact((state) => {
      const job = state.runQueueJobs[jobId];

      if (!job) {
        return;
      }

      job.status = result.status === "completed"
        ? "completed"
        : result.status === "skipped"
          ? "queued"
          : "failed";
      job.completedAt = new Date().toISOString();
      job.updatedAt = new Date().toISOString();
      job.claimedBy = workerId;
      job.error = result.errorMessage ? { message: result.errorMessage } : null;
      if (result.status === "skipped") {
        job.completedAt = null;
        job.claimedAt = null;
        job.claimedBy = null;
        job.availableAt = new Date(Date.now() + this.runDelayMs).toISOString();
      }
    });

    const snapshot = await this.store.snapshot();
    return summarizeRunQueueJob(snapshot.runQueueJobs[jobId], snapshot.runs[runId]);
  }

  async processRun(runId) {
    let runtimeContext;

    await this.store.transact((state) => {
      const run = state.runs[runId];

      if (!run || !["queued", "running"].includes(run.status)) {
        return;
      }

      run.status = "running";
      run.startedAt = new Date().toISOString();
      run.error = null;

      runtimeContext = {
        project: structuredClone(state.projects[run.projectId]),
        compilation: structuredClone(state.compilations[run.compilationId]),
        run: structuredClone(run)
      };
    });

    if (!runtimeContext) {
      return {
        runId,
        status: "skipped"
      };
    }

    try {
      const { report, scenarioResults, telemetryEvents } = await executeValidationRun({
        ...runtimeContext,
        workspaceRoot: this.workspaceRoot
      });
      const reportArtifact = await this.artifactStore.writeArtifact({
        workspaceId: runtimeContext.run.workspaceId,
        projectId: runtimeContext.project.id,
        runId,
        reportId: report.id,
        name: `${runId}-report.json`,
        mediaType: "application/json",
        kind: "run_report",
        content: JSON.stringify(report, null, 2),
        metadata: {
          validationOutcome: report.summary.validationOutcome,
          dominantDomainId: report.summary.dominantDomainId
        },
        createdBy: "runtime_report_export"
      });
      report.exportArtifactId = reportArtifact.id;

      await this.store.transact((state) => {
        const run = state.runs[runId];
        const project = state.projects[runtimeContext.project.id];

        if (!run) {
          return;
        }

        run.status = "completed";
        run.completedAt = new Date().toISOString();
        run.scenarioResults = scenarioResults;
        run.artifactIds = Array.isArray(run.artifactIds) ? run.artifactIds : [];
        run.artifactIds.push(reportArtifact.id);
        run.reportId = report.id;
        run.outcome = report.summary.validationOutcome;
        run.error = null;

        state.artifacts[reportArtifact.id] = reportArtifact;
        state.reports[report.id] = report;

        if (project) {
          project.artifactIds = Array.isArray(project.artifactIds) ? project.artifactIds : [];
          project.artifactIds.push(reportArtifact.id);
        }

        for (const event of telemetryEvents) {
          state.telemetry[event.id] = event;
        }
      });

      return {
        runId,
        status: "completed",
        reportId: report.id
      };
    } catch (error) {
      await this.store.transact((state) => {
        const run = state.runs[runId];

        if (!run) {
          return;
        }

        const failureTelemetry = createTelemetry({
          runId,
          sequence: Object.values(state.telemetry).filter((event) => event.runId === runId).length + 1,
          type: "run.failed",
          level: "error",
          message: `Validation run ${runId} failed.`,
          data: {
            error: error.message
          }
        });

        run.status = "failed";
        run.completedAt = new Date().toISOString();
        run.outcome = "failed";
        run.error = {
          message: error.message
        };
        state.telemetry[failureTelemetry.id] = failureTelemetry;
      });

      return {
        runId,
        status: "failed",
        errorMessage: error.message
      };
    }
  }
}

export function createPlatform({
  dataFilePath,
  databaseFilePath,
  storeBackend,
  postgresBaseUrl,
  postgresApiKey,
  postgresSchema,
  postgresTable,
  postgresFetch,
  apiKey,
  offerProfile,
  runDelayMs,
  runMode,
  workspaceRoot,
  artifactRoot,
  artifactStoreBackend,
  artifactBucket,
  artifactPublicBaseUrl,
  artifactRemoteBaseUrl,
  artifactRemoteApiKey,
  artifactFetch,
  billingWebhookSecret,
  billingWebhookMode,
  billingWebhookToleranceSeconds,
  billingProvider,
  billingApiBaseUrl,
  billingApiKey,
  billingCallbackBaseUrl,
  billingFetch,
  requestRateLimitEnabled,
  requestRateLimitMaxRequests,
  requestRateLimitWindowSeconds,
  authLockoutThreshold,
  authLockoutWindowSeconds,
  authLockoutDurationSeconds,
  aiApiKey,
  aiModel,
  aiProvider,
  aiBaseUrl,
  aiFetch
} = {}) {
  const defaultDataPath = fileURLToPath(new URL("../../data/twintest-store.json", import.meta.url));

  return new TwinTestPlatform({
    store: createStore({
      backend: storeBackend,
      dataFilePath: dataFilePath || defaultDataPath,
      databaseFilePath,
      postgresBaseUrl,
      postgresApiKey,
      postgresSchema,
      postgresTable,
      postgresFetch,
      workspaceRoot
    }),
    apiKey,
    offerProfile,
    runDelayMs,
    runMode,
    workspaceRoot,
    artifactStore: createArtifactStore({
      backend: artifactStoreBackend,
      rootDir: path.resolve(artifactRoot || path.join(workspaceRoot || process.cwd(), "data", "artifacts")),
      bucket: artifactBucket,
      publicBaseUrl: artifactPublicBaseUrl,
      remoteBaseUrl: artifactRemoteBaseUrl,
      apiKey: artifactRemoteApiKey,
      fetchImpl: artifactFetch
    }),
    billingWebhookSecret,
    billingWebhookMode,
    billingWebhookToleranceMs: normalizePositiveInteger(
      Number(billingWebhookToleranceSeconds) * 1000,
      300_000
    ),
    requestRateLimitEnabled,
    requestRateLimitMaxRequests,
    requestRateLimitWindowMs: normalizePositiveInteger(
      Number(requestRateLimitWindowSeconds) * 1000,
      60_000
    ),
    authLockoutThreshold,
    authLockoutWindowMs: normalizePositiveInteger(
      Number(authLockoutWindowSeconds) * 1000,
      600_000
    ),
    authLockoutDurationMs: normalizePositiveInteger(
      Number(authLockoutDurationSeconds) * 1000,
      900_000
    ),
    billingGateway: createBillingGateway({
      defaultProvider: billingProvider,
      apiBaseUrl: billingApiBaseUrl,
      apiKey: billingApiKey,
      callbackBaseUrl: billingCallbackBaseUrl,
      fetchImpl: billingFetch
    }),
    aiOrchestrator: createAiSolverOrchestrator({
      provider: aiProvider,
      apiKey: aiApiKey,
      model: aiModel,
      baseUrl: aiBaseUrl,
      fetchImpl: aiFetch
    })
  });
}

function getProject(state, projectId, workspaceId) {
  const project = state.projects[projectId];

  if (!project || project.workspaceId !== workspaceId) {
    throw new HttpError(404, "Project not found.");
  }

  return project;
}

function getWorkspace(state, workspaceId) {
  const workspace = state.workspaces[workspaceId];

  if (!workspace) {
    throw new HttpError(404, "Workspace not found.");
  }

  return workspace;
}

function getRun(state, runId, workspaceId) {
  const run = state.runs[runId];

  if (!run || run.workspaceId !== workspaceId) {
    throw new HttpError(404, "Run not found.");
  }

  return run;
}

function getArtifact(state, artifactId, workspaceId) {
  const artifact = state.artifacts?.[artifactId];

  if (!artifact || artifact.workspaceId !== workspaceId) {
    throw new HttpError(404, "Artifact not found.");
  }

  return artifact;
}

function normalizeHeader(value) {
  return Array.isArray(value) ? value[0] : value;
}

function extractBearerToken(authorizationHeader) {
  const normalized = normalizeHeader(authorizationHeader);

  if (!normalized?.startsWith("Bearer ")) {
    return "";
  }

  return normalized.slice("Bearer ".length).trim();
}

function ensureDevelopmentWorkspace(state, workspaceId, planId = "dev") {
  if (state.workspaces[workspaceId]) {
    ensureUsageMeter(state, workspaceId);
    return state.workspaces[workspaceId];
  }

  const workspace = createWorkspaceRecord({
    workspaceId,
    name: workspaceId,
    planId,
    createdBy: "platform_admin"
  });

  state.workspaces[workspace.id] = workspace;
  ensureUsageMeter(state, workspace.id);
  return workspace;
}

function summarizeProject(project) {
  return {
    id: project.id,
    name: project.name,
    workspaceId: project.workspaceId,
    status: project.status,
    latestCompilationId: project.latestCompilationId,
    latestMvpBlueprintId: project.latestMvpBlueprintId || null,
    latestMvpDecisionId: project.latestMvpDecisionId || null,
    latestPilotWorkbenchId: project.latestPilotWorkbenchId || null,
    artifactCount: Array.isArray(project.artifactIds) ? project.artifactIds.length : 0
  };
}

function summarizeGraph(graph) {
  return {
    graphId: graph.id,
    dominantDomainId: graph.dominantDomainId,
    domains: graph.domainIds,
    counts: {
      components: graph.components.length,
      agentInstances: graph.agentInstances.length,
      scenarios: graph.scenarios.length,
      kpis: graph.kpis.length,
      gates: graph.gates.length
    },
    readiness: summarizeReadiness(graph)
  };
}

function summarizeRun(run) {
  return {
    id: run.id,
    projectId: run.projectId,
    compilationId: run.compilationId,
    status: run.status,
    label: run.label,
    createdAt: run.createdAt,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    outcome: run.outcome,
    error: run.error || null,
    queueJobId: run.queueJobId || null,
    artifactIds: run.artifactIds || []
  };
}

function summarizeArtifact(artifact) {
  return {
    id: artifact.id,
    workspaceId: artifact.workspaceId,
    projectId: artifact.projectId || null,
    runId: artifact.runId || null,
    reportId: artifact.reportId || null,
    name: artifact.name,
    mediaType: artifact.mediaType,
    kind: artifact.kind,
    metadata: artifact.metadata || {},
    createdAt: artifact.createdAt,
    createdBy: artifact.createdBy,
    byteLength: artifact.byteLength,
    sha256: artifact.sha256,
    storageBackend: artifact.storageBackend,
    storagePath: artifact.storagePath,
    bucket: artifact.bucket || null,
    objectKey: artifact.objectKey || null,
    objectUrl: artifact.objectUrl || null,
    contentHref: `/artifacts/${artifact.id}/content`
  };
}

function createRunQueueJob({ workspaceId, runId, availableAt }) {
  return {
    id: createId("run_job"),
    workspaceId,
    runId,
    status: "queued",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    availableAt,
    claimedAt: null,
    claimedBy: null,
    completedAt: null,
    attemptCount: 0,
    error: null
  };
}

function summarizeRunQueueJob(job, run = null) {
  return {
    id: job.id,
    workspaceId: job.workspaceId,
    runId: job.runId,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    availableAt: job.availableAt,
    claimedAt: job.claimedAt,
    claimedBy: job.claimedBy,
    completedAt: job.completedAt,
    attemptCount: job.attemptCount,
    error: job.error || null,
    runStatus: run?.status || null
  };
}

function normalizeRunMode(runMode) {
  const normalized = String(runMode || "embedded").trim().toLowerCase();
  return ["embedded", "external"].includes(normalized) ? normalized : "embedded";
}

function normalizeOfferProfile(offerProfile) {
  const normalized = String(offerProfile || "full").trim().toLowerCase();
  return ["full", "freemium", "paid"].includes(normalized) ? normalized : "full";
}

function normalizeBillingWebhookMode(mode) {
  const normalized = String(mode || "auto").trim().toLowerCase();
  return ["auto", "shared_secret", "hmac_sha256"].includes(normalized) ? normalized : "auto";
}

function normalizePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBillingSignatureHeader(signatureHeader, timestampHeader) {
  const parts = String(signatureHeader || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const parsed = {};

  for (const part of parts) {
    const [rawKey, rawValue] = part.split("=", 2);

    if (!rawKey || !rawValue) {
      continue;
    }

    parsed[rawKey.trim()] = rawValue.trim();
  }

  const timestamp = Number.parseInt(parsed.t || String(timestampHeader || "").trim(), 10);

  return {
    timestamp: Number.isFinite(timestamp) && timestamp > 0 ? timestamp : 0,
    signature: String(parsed.v1 || "").trim().toLowerCase()
  };
}

function safeEqualHex(leftHex, rightHex) {
  const leftBuffer = Buffer.from(String(leftHex || ""), "hex");
  const rightBuffer = Buffer.from(String(rightHex || ""), "hex");

  if (!leftBuffer.length || leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function buildArtifactBuffer({ textContent = "", contentBase64 = "", encoding = "utf8" }) {
  if (String(contentBase64 || "").length) {
    return Buffer.from(contentBase64, "base64");
  }

  return Buffer.from(String(textContent || ""), encoding);
}

function inferMediaTypeFromFormat(format) {
  switch (String(format || "").trim().toLowerCase()) {
    case "markdown":
    case "md":
      return "text/markdown";
    case "json":
      return "application/json";
    case "csv":
      return "text/csv";
    case "tsv":
      return "text/tab-separated-values";
    case "xml":
      return "application/xml";
    case "html":
    case "htm":
      return "text/html";
    case "yaml":
    case "yml":
      return "application/yaml";
    case "pdf":
      return "application/pdf";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case "odt":
      return "application/vnd.oasis.opendocument.text";
    case "ods":
      return "application/vnd.oasis.opendocument.spreadsheet";
    case "odp":
      return "application/vnd.oasis.opendocument.presentation";
    case "doc":
      return "application/msword";
    case "xls":
      return "application/vnd.ms-excel";
    case "ppt":
      return "application/vnd.ms-powerpoint";
    case "text":
    case "txt":
    default:
      return "text/plain";
  }
}

function inferMediaTypeFromName(name) {
  const extension = path.extname(String(name || "").trim()).toLowerCase();

  switch (extension) {
    case ".md":
      return "text/markdown";
    case ".json":
      return "application/json";
    case ".csv":
      return "text/csv";
    case ".tsv":
      return "text/tab-separated-values";
    case ".xml":
      return "application/xml";
    case ".html":
    case ".htm":
      return "text/html";
    case ".yaml":
    case ".yml":
      return "application/yaml";
    case ".txt":
      return "text/plain";
    case ".pdf":
      return "application/pdf";
    case ".doc":
      return "application/msword";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".xls":
      return "application/vnd.ms-excel";
    case ".xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case ".ppt":
      return "application/vnd.ms-powerpoint";
    case ".pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case ".odt":
      return "application/vnd.oasis.opendocument.text";
    case ".ods":
      return "application/vnd.oasis.opendocument.spreadsheet";
    case ".odp":
      return "application/vnd.oasis.opendocument.presentation";
    default:
      return "application/octet-stream";
  }
}

function summarizeReadiness(graph) {
  return {
    totalSolverBindings: graph.solverBindings.length,
    boundSolverBindings: graph.solverBindings.filter((binding) => binding.status === "bound").length,
    unboundSolverBindings: graph.solverBindings.filter((binding) => binding.status !== "bound").length,
    unresolvedParameters: graph.parameters.filter((parameter) => parameter.source === "unresolved").length
  };
}

function createTelemetry({ runId, sequence, type, level, message, data }) {
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

TwinTestPlatform.prototype.persistMvpBlueprint = async function persistMvpBlueprint({
  workspaceId,
  projectId,
  ideaInput,
  autobindMode,
  queueRun
}) {
  const snapshot = await this.store.snapshot();
  const project = getProject(snapshot, projectId, workspaceId);

  if (!project.latestCompilationId) {
    throw new HttpError(409, "Compile the project before generating an MVP blueprint.");
  }

  const compilation = snapshot.compilations[project.latestCompilationId];
  const blueprint = createMvpBlueprint({
    workspaceId,
    project,
    graph: compilation.graph,
    readiness: summarizeReadiness(compilation.graph),
    ideaInput,
    autobindMode,
    queueRun
  });

  await this.store.transact((state) => {
    const liveProject = getProject(state, projectId, workspaceId);
    state.mvpBlueprints[blueprint.id] = blueprint;
    liveProject.mvpBlueprintIds = Array.isArray(liveProject.mvpBlueprintIds) ? liveProject.mvpBlueprintIds : [];
    liveProject.mvpBlueprintIds.push(blueprint.id);
    liveProject.latestMvpBlueprintId = blueprint.id;
    liveProject.updatedAt = new Date().toISOString();
  });

  return blueprint;
};

TwinTestPlatform.prototype.persistMvpDecision = async function persistMvpDecision({
  workspaceId,
  projectId,
  runId = ""
}) {
  const snapshot = await this.store.snapshot();
  const project = getProject(snapshot, projectId, workspaceId);

  if (!project.latestCompilationId) {
    throw new HttpError(409, "Compile the project before generating an MVP decision.");
  }

  if (!project.latestMvpBlueprintId || !snapshot.mvpBlueprints[project.latestMvpBlueprintId]) {
    throw new HttpError(409, "Generate an MVP blueprint before creating an MVP decision.");
  }

  const compilation = snapshot.compilations[project.latestCompilationId];
  const blueprint = snapshot.mvpBlueprints[project.latestMvpBlueprintId];
  const currentRun = resolveCurrentRun(snapshot, project, workspaceId, runId);
  const { evidenceRun, evidenceReport } = resolveEvidenceRun(snapshot, project, workspaceId, runId);
  const decision = createMvpDecision({
    workspaceId,
    project,
    graph: compilation.graph,
    blueprint,
    currentRun,
    evidenceRun,
    evidenceReport
  });

  await this.store.transact((state) => {
    const liveProject = getProject(state, projectId, workspaceId);
    state.mvpDecisions[decision.id] = decision;
    liveProject.mvpDecisionIds = Array.isArray(liveProject.mvpDecisionIds) ? liveProject.mvpDecisionIds : [];
    liveProject.mvpDecisionIds.push(decision.id);
    liveProject.latestMvpDecisionId = decision.id;
    liveProject.updatedAt = new Date().toISOString();
  });

  return decision;
};

TwinTestPlatform.prototype.persistPilotWorkbench = async function persistPilotWorkbench({
  workspaceId,
  projectId,
  runId = ""
}) {
  const snapshot = await this.store.snapshot();
  const project = getProject(snapshot, projectId, workspaceId);

  if (!project.latestCompilationId) {
    throw new HttpError(409, "Compile the project before generating a pilot workbench.");
  }

  if (!project.latestMvpBlueprintId || !snapshot.mvpBlueprints[project.latestMvpBlueprintId]) {
    throw new HttpError(409, "Generate an MVP blueprint before creating a pilot workbench.");
  }

  if (!project.latestMvpDecisionId || !snapshot.mvpDecisions[project.latestMvpDecisionId]) {
    throw new HttpError(409, "Generate an MVP decision before creating a pilot workbench.");
  }

  const compilation = snapshot.compilations[project.latestCompilationId];
  const blueprint = snapshot.mvpBlueprints[project.latestMvpBlueprintId];
  const decision = snapshot.mvpDecisions[project.latestMvpDecisionId];
  const currentRun = resolveCurrentRun(snapshot, project, workspaceId, runId);
  const { evidenceReport } = resolveEvidenceRun(snapshot, project, workspaceId, runId);
  const workbench = createPilotWorkbench({
    workspaceId,
    project,
    graph: compilation.graph,
    blueprint,
    decision,
    currentRun,
    evidenceReport
  });

  await this.store.transact((state) => {
    const liveProject = getProject(state, projectId, workspaceId);
    state.pilotWorkbenches[workbench.id] = workbench;
    liveProject.pilotWorkbenchIds = Array.isArray(liveProject.pilotWorkbenchIds) ? liveProject.pilotWorkbenchIds : [];
    liveProject.pilotWorkbenchIds.push(workbench.id);
    liveProject.latestPilotWorkbenchId = workbench.id;
    liveProject.updatedAt = new Date().toISOString();
  });

  return workbench;
};

function normalizeConstraints(candidate, fallback) {
  const fromCandidate = Array.isArray(candidate)
    ? candidate.map((item) => String(item || "").trim()).filter(Boolean)
    : typeof candidate === "string" && candidate.trim()
      ? candidate.split(/\r?\n|[,;]+/).map((item) => item.trim()).filter(Boolean)
      : [];

  if (fromCandidate.length) {
    return [...new Set(fromCandidate)];
  }

  return Array.isArray(fallback) ? [...new Set(fallback.filter(Boolean))] : [];
}

function findUserByEmail(state, email) {
  const normalizedEmail = normalizeEmail(email);

  return Object.values(state.users || {}).find((user) => user.email === normalizedEmail) || null;
}

function findWorkspaceMembership(state, workspaceId, userId) {
  return Object.values(state.workspaceMemberships || {}).find((membership) =>
    membership.workspaceId === workspaceId && membership.userId === userId
  ) || null;
}

function resolveCurrentRun(snapshot, project, workspaceId, runId) {
  if (runId) {
    return getRun(snapshot, runId, workspaceId);
  }

  for (const candidateId of [...(project.runIds || [])].reverse()) {
    const candidate = snapshot.runs[candidateId];

    if (candidate && candidate.workspaceId === workspaceId) {
      return candidate;
    }
  }

  return null;
}

function resolveEvidenceRun(snapshot, project, workspaceId, runId) {
  if (runId) {
    const explicitRun = getRun(snapshot, runId, workspaceId);
    return {
      evidenceRun: explicitRun.reportId ? explicitRun : null,
      evidenceReport: explicitRun.reportId ? snapshot.reports[explicitRun.reportId] || null : null
    };
  }

  for (const candidateId of [...(project.runIds || [])].reverse()) {
    const candidate = snapshot.runs[candidateId];

    if (!candidate || candidate.workspaceId !== workspaceId || !candidate.reportId) {
      continue;
    }

    return {
      evidenceRun: candidate,
      evidenceReport: snapshot.reports[candidate.reportId] || null
    };
  }

  return {
    evidenceRun: null,
    evidenceReport: null
  };
}
