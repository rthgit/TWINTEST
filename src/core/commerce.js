import { randomBytes } from "node:crypto";
import { createId, hashString, slugify } from "./id.js";

const commercePlanCatalog = {
  dev: {
    id: "dev",
    label: "Development",
    status: "internal",
    monthlyPriceUsd: 0,
    limits: {
      maxProjects: 1000,
      maxRuns: 10000,
      maxApiClients: 25,
      aiAutobind: true
    }
  },
  freemium: {
    id: "freemium",
    label: "Freemium",
    status: "public_free",
    monthlyPriceUsd: 0,
    limits: {
      maxProjects: 1,
      maxRuns: 25,
      maxApiClients: 1,
      aiAutobind: false
    }
  },
  starter: {
    id: "starter",
    label: "Starter",
    status: "sellable",
    monthlyPriceUsd: 199,
    limits: {
      maxProjects: 3,
      maxRuns: 100,
      maxApiClients: 3,
      aiAutobind: true
    }
  },
  growth: {
    id: "growth",
    label: "Growth",
    status: "sellable",
    monthlyPriceUsd: 1290,
    limits: {
      maxProjects: 25,
      maxRuns: 1500,
      maxApiClients: 10,
      aiAutobind: true
    }
  },
  enterprise: {
    id: "enterprise",
    label: "Enterprise",
    status: "contract",
    monthlyPriceUsd: null,
    limits: {
      maxProjects: 100000,
      maxRuns: 1000000,
      maxApiClients: 1000,
      aiAutobind: true
    }
  }
};

const offerProfilePolicy = Object.freeze({
  full: {
    defaultPlanId: "starter",
    visiblePlanIds: ["freemium", "starter", "growth", "enterprise", "dev"]
  },
  freemium: {
    defaultPlanId: "freemium",
    visiblePlanIds: ["freemium"]
  },
  paid: {
    defaultPlanId: "starter",
    visiblePlanIds: ["starter", "growth", "enterprise"]
  }
});

const billingProviderCatalog = {
  manual: {
    id: "manual",
    label: "Manual Backoffice",
    status: "internal",
    webhookMode: "manual_review"
  },
  simulated_stripe: {
    id: "simulated_stripe",
    label: "Simulated Stripe",
    status: "runtime_ready",
    webhookMode: "signed_webhook"
  },
  http_json: {
    id: "http_json",
    label: "External HTTP JSON",
    status: "adapter_ready",
    webhookMode: "provider_defined"
  }
};

export function listCommercePlans({ offerProfile = "full" } = {}) {
  const policy = resolveOfferProfilePolicy(offerProfile);
  return policy.visiblePlanIds
    .map((planId) => commercePlanCatalog[planId])
    .filter(Boolean);
}

export function getCommercePlanCatalog({ offerProfile = "full" } = {}) {
  return Object.fromEntries(
    listCommercePlans({ offerProfile }).map((plan) => [plan.id, structuredClone(plan)])
  );
}

export function listBillingProviders() {
  return Object.values(billingProviderCatalog);
}

export function getBillingProviderCatalog() {
  return structuredClone(billingProviderCatalog);
}

export function getCommercePlan(planId = "starter") {
  return commercePlanCatalog[planId] || commercePlanCatalog.starter;
}

export function isPlanAllowedForOfferProfile(planId = "", offerProfile = "full") {
  const policy = resolveOfferProfilePolicy(offerProfile);
  return policy.visiblePlanIds.includes(planId);
}

export function resolveDefaultPlanForOfferProfile(offerProfile = "full") {
  const policy = resolveOfferProfilePolicy(offerProfile);
  return policy.defaultPlanId;
}

export function createWorkspaceId(name, preferredId = "") {
  const normalizedPreferred = slugify(preferredId);

  if (normalizedPreferred) {
    return normalizedPreferred;
  }

  const normalizedName = slugify(name);
  return normalizedName || `workspace-${createId("ws").slice(-8)}`;
}

export function issueApiClientSecret() {
  return `ttsk_${randomBytes(24).toString("hex")}`;
}

export function hashApiClientSecret(secret) {
  return `twk_${hashString(secret).toString(16)}`;
}

export function createApiClientRecord({
  workspaceId,
  name,
  role = "owner",
  secret,
  createdBy = "system"
}) {
  const normalizedSecret = secret || issueApiClientSecret();

  return {
    client: {
      id: createId("api_client"),
      workspaceId,
      name: String(name || "Workspace API Client").trim(),
      role,
      status: "active",
      secretHash: hashApiClientSecret(normalizedSecret),
      keyPreview: buildApiKeyPreview(normalizedSecret),
      createdAt: new Date().toISOString(),
      createdBy,
      lastUsedAt: null
    },
    apiKey: normalizedSecret
  };
}

export function sanitizeApiClient(client) {
  return {
    id: client.id,
    workspaceId: client.workspaceId,
    name: client.name,
    role: client.role,
    status: client.status,
    keyPreview: client.keyPreview,
    createdAt: client.createdAt,
    createdBy: client.createdBy,
    lastUsedAt: client.lastUsedAt
  };
}

export function createWorkspaceRecord({
  workspaceId,
  name,
  planId = "starter",
  createdBy = "platform_admin"
}) {
  const plan = getCommercePlan(planId);

  return {
    id: workspaceId,
    name: String(name || workspaceId).trim(),
    planId: plan.id,
    status: "active",
    createdAt: new Date().toISOString(),
    createdBy,
    apiClientIds: [],
    settings: {},
    billingEmail: null,
    subscription: createWorkspaceSubscription(plan.id)
  };
}

export function sanitizeWorkspace(workspace, usage = null) {
  const subscription = normalizeWorkspaceSubscription(workspace);

  return {
    id: workspace.id,
    name: workspace.name,
    planId: workspace.planId,
    status: workspace.status,
    createdAt: workspace.createdAt,
    apiClientCount: workspace.apiClientIds?.length || 0,
    billingEmail: workspace.billingEmail || null,
    subscription: sanitizeWorkspaceSubscription(subscription),
    usage: usage || null
  };
}

export function ensureUsageMeter(state, workspaceId) {
  if (!state.usageMeters[workspaceId]) {
    state.usageMeters[workspaceId] = {
      workspaceId,
      apiCalls: 0,
      projectsCreated: 0,
      runsCreated: 0,
      compilationsCreated: 0,
      aiAutobinds: 0,
      reportsRead: 0,
      lastActivityAt: null,
      endpointCounters: {}
    };
  }

  return state.usageMeters[workspaceId];
}

export function summarizeWorkspaceUsage({ state, workspaceId }) {
  const workspace = state.workspaces[workspaceId];
  const usageMeter = ensureUsageMeter(state, workspaceId);
  const plan = getCommercePlan(workspace?.planId || "dev");
  const projectCount = Object.values(state.projects).filter((project) => project.workspaceId === workspaceId).length;
  const runCount = Object.values(state.runs).filter((run) => run.workspaceId === workspaceId).length;
  const apiClientCount = Object.values(state.apiClients).filter((client) => client.workspaceId === workspaceId).length;

  return {
    workspaceId,
    planId: plan.id,
    status: workspace?.status || "active",
    counts: {
      apiCalls: usageMeter.apiCalls,
      projectsCreated: usageMeter.projectsCreated,
      runsCreated: usageMeter.runsCreated,
      compilationsCreated: usageMeter.compilationsCreated,
      aiAutobinds: usageMeter.aiAutobinds,
      reportsRead: usageMeter.reportsRead,
      liveProjects: projectCount,
      liveRuns: runCount,
      apiClients: apiClientCount
    },
    lastActivityAt: usageMeter.lastActivityAt,
    endpointCounters: usageMeter.endpointCounters,
    limits: plan.limits
  };
}

export function normalizeWorkspaceSubscription(workspace) {
  const plan = getCommercePlan(workspace?.planId || "dev");
  const current = workspace?.subscription || {};

  return {
    planId: plan.id,
    status: current.status || (plan.id === "dev" ? "active" : "trialing"),
    billingCycle: current.billingCycle || "monthly",
    startedAt: current.startedAt || new Date().toISOString(),
    trialEndsAt: current.trialEndsAt || (plan.id === "dev" ? null : addDays(new Date(), 14)),
    renewsAt: current.renewsAt || addDays(new Date(), 30),
    canceledAt: current.canceledAt || null,
    notes: current.notes || ""
  };
}

export function sanitizeWorkspaceSubscription(subscription) {
  return {
    planId: subscription.planId,
    status: subscription.status,
    billingCycle: subscription.billingCycle,
    startedAt: subscription.startedAt,
    trialEndsAt: subscription.trialEndsAt,
    renewsAt: subscription.renewsAt,
    canceledAt: subscription.canceledAt,
    notes: subscription.notes
  };
}

export function updateWorkspaceSubscription(workspace, { planId = "", status = "", billingEmail = "", renewsAt = "", notes = "" }) {
  const nextPlan = getCommercePlan(planId || workspace.planId || "starter");
  const current = normalizeWorkspaceSubscription(workspace);
  const nextStatus = status || current.status;

  workspace.planId = nextPlan.id;
  workspace.billingEmail = billingEmail || workspace.billingEmail || null;
  workspace.subscription = {
    ...current,
    planId: nextPlan.id,
    status: nextStatus,
    renewsAt: renewsAt || current.renewsAt || addDays(new Date(), 30),
    notes: notes || current.notes || "",
    trialEndsAt: nextStatus === "trialing"
      ? current.trialEndsAt || addDays(new Date(), 14)
      : null,
    canceledAt: nextStatus === "canceled" ? new Date().toISOString() : null
  };

  return workspace.subscription;
}

export function ensureBillingCustomerRecord({
  state,
  workspaceId,
  provider = "simulated_stripe",
  providerCustomerId = "",
  billingEmail = "",
  createdBy = "system"
}) {
  const existing = Object.values(state.billingCustomers || {}).find((customer) =>
    customer.workspaceId === workspaceId
      && customer.provider === provider
      && customer.status !== "archived"
  );

  if (existing) {
    if (billingEmail) {
      existing.email = billingEmail;
    }

    if (providerCustomerId) {
      existing.providerCustomerId = providerCustomerId;
    }

    existing.updatedAt = new Date().toISOString();
    return existing;
  }

  const customer = {
    id: createId("billing_customer"),
    workspaceId,
    provider,
    providerCustomerId: providerCustomerId || `${provider}_cus_${createId("pc").slice(-10)}`,
    email: billingEmail || state.workspaces[workspaceId]?.billingEmail || null,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy
  };

  state.billingCustomers[customer.id] = customer;
  return customer;
}

export function createBillingCheckoutSessionRecord({
  state,
  workspaceId,
  planId,
  provider = "simulated_stripe",
  providerSessionId = "",
  providerCustomerId = "",
  successUrl = "",
  cancelUrl = "",
  checkoutUrl = "",
  status = "open",
  customerId = "",
  providerPayload = {},
  billingEmail = "",
  createdBy = "workspace_owner"
}) {
  const resolvedProviderSessionId = providerSessionId || `${provider}_cs_${createId("pcs").slice(-10)}`;
  const customer = ensureBillingCustomerRecord({
    state,
    workspaceId,
    provider,
    providerCustomerId,
    billingEmail,
    createdBy
  });
  const resolvedPlan = getCommercePlan(planId || state.workspaces[workspaceId]?.planId || "starter");
  const checkoutSession = {
    id: createId("billing_checkout"),
    workspaceId,
    provider,
    planId: resolvedPlan.id,
    customerId: customerId || customer.id,
    providerSessionId: resolvedProviderSessionId,
    status,
    checkoutUrl: checkoutUrl || buildCheckoutUrl({
      provider,
      providerSessionId: resolvedProviderSessionId,
      successUrl,
      cancelUrl
    }),
    successUrl: successUrl || null,
    cancelUrl: cancelUrl || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    canceledAt: null,
    providerPayload: structuredClone(providerPayload || {}),
    createdBy
  };

  state.billingCheckoutSessions[checkoutSession.id] = checkoutSession;
  return checkoutSession;
}

export function sanitizeBillingCustomer(customer) {
  return customer
    ? {
      id: customer.id,
      workspaceId: customer.workspaceId,
      provider: customer.provider,
      providerCustomerId: customer.providerCustomerId,
      email: customer.email,
      status: customer.status,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    }
    : null;
}

export function sanitizeBillingCheckoutSession(session) {
  return session
    ? {
      id: session.id,
      workspaceId: session.workspaceId,
      provider: session.provider,
      planId: session.planId,
      customerId: session.customerId,
      providerSessionId: session.providerSessionId,
      status: session.status,
      checkoutUrl: session.checkoutUrl,
      successUrl: session.successUrl,
      cancelUrl: session.cancelUrl,
      providerPayload: session.providerPayload || {},
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      completedAt: session.completedAt,
      canceledAt: session.canceledAt
    }
    : null;
}

export function sanitizeBillingInvoice(invoice) {
  return invoice
    ? {
      id: invoice.id,
      workspaceId: invoice.workspaceId,
      provider: invoice.provider,
      customerId: invoice.customerId,
      checkoutSessionId: invoice.checkoutSessionId,
      providerInvoiceId: invoice.providerInvoiceId,
      planId: invoice.planId,
      amountUsd: invoice.amountUsd,
      currency: invoice.currency,
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      dueAt: invoice.dueAt,
      paidAt: invoice.paidAt,
      updatedAt: invoice.updatedAt
    }
    : null;
}

export function sanitizeBillingEvent(event) {
  return event
    ? {
      id: event.id,
      workspaceId: event.workspaceId,
      provider: event.provider,
      eventType: event.eventType,
      status: event.status,
      checkoutSessionId: event.checkoutSessionId,
      invoiceId: event.invoiceId,
      customerId: event.customerId,
      createdAt: event.createdAt,
      processedAt: event.processedAt,
      payloadSummary: event.payloadSummary
    }
    : null;
}

export function applyBillingWebhookEvent({
  state,
  provider = "simulated_stripe",
  eventType,
  payload = {},
  createdBy = "billing_webhook"
}) {
  if (!eventType?.trim()) {
    throw new Error("Billing webhook event type is required.");
  }

  const checkoutSession = resolveCheckoutSession(state, payload.sessionId || payload.checkoutSessionId || payload.providerSessionId || "");
  let workspaceId = payload.workspaceId || checkoutSession?.workspaceId || "";

  if (!workspaceId) {
    throw new Error("Billing webhook payload must resolve a workspace.");
  }

  const workspace = state.workspaces[workspaceId];

  if (!workspace) {
    throw new Error("Workspace not found for billing webhook.");
  }

  const billingEmail = payload.billingEmail || workspace.billingEmail || "";
  const targetPlan = getCommercePlan(payload.planId || checkoutSession?.planId || workspace.planId || "starter");
  const customer = ensureBillingCustomerRecord({
    state,
    workspaceId,
    provider,
    billingEmail,
    createdBy
  });
  let invoice = resolveBillingInvoice(state, payload.invoiceId || payload.providerInvoiceId || "");

  if (billingEmail) {
    workspace.billingEmail = billingEmail;
  }

  switch (eventType) {
    case "checkout.session.completed":
      if (checkoutSession) {
        checkoutSession.status = "completed";
        checkoutSession.completedAt = new Date().toISOString();
        checkoutSession.updatedAt = checkoutSession.completedAt;
      }

      updateWorkspaceSubscription(workspace, {
        planId: targetPlan.id,
        status: payload.subscriptionStatus || "active",
        billingEmail,
        notes: payload.notes || `Activated via ${provider} checkout completion.`
      });
      invoice = upsertBillingInvoice({
        state,
        workspaceId,
        provider,
        customerId: customer.id,
        checkoutSessionId: checkoutSession?.id || null,
        providerInvoiceId: payload.providerInvoiceId || "",
        planId: targetPlan.id,
        amountUsd: payload.amountUsd,
        status: payload.invoiceStatus || "paid"
      });
      break;
    case "invoice.paid":
      invoice = upsertBillingInvoice({
        state,
        workspaceId,
        provider,
        customerId: customer.id,
        checkoutSessionId: checkoutSession?.id || null,
        providerInvoiceId: payload.providerInvoiceId || payload.invoiceId || "",
        planId: targetPlan.id,
        amountUsd: payload.amountUsd,
        status: "paid"
      });
      updateWorkspaceSubscription(workspace, {
        planId: targetPlan.id,
        status: "active",
        billingEmail,
        notes: payload.notes || `Latest invoice paid via ${provider}.`
      });
      break;
    case "invoice.payment_failed":
      invoice = upsertBillingInvoice({
        state,
        workspaceId,
        provider,
        customerId: customer.id,
        checkoutSessionId: checkoutSession?.id || null,
        providerInvoiceId: payload.providerInvoiceId || payload.invoiceId || "",
        planId: targetPlan.id,
        amountUsd: payload.amountUsd,
        status: "past_due"
      });
      updateWorkspaceSubscription(workspace, {
        planId: targetPlan.id,
        status: "past_due",
        billingEmail,
        notes: payload.notes || `Latest invoice payment failed via ${provider}.`
      });
      break;
    case "customer.subscription.updated":
      updateWorkspaceSubscription(workspace, {
        planId: targetPlan.id,
        status: payload.subscriptionStatus || workspace.subscription?.status || "active",
        billingEmail,
        notes: payload.notes || `Subscription updated via ${provider}.`
      });
      break;
    case "customer.subscription.deleted":
      updateWorkspaceSubscription(workspace, {
        planId: workspace.planId,
        status: "canceled",
        billingEmail,
        notes: payload.notes || `Subscription canceled via ${provider}.`
      });
      break;
    case "checkout.session.expired":
    case "checkout.session.canceled":
      if (checkoutSession) {
        checkoutSession.status = eventType === "checkout.session.expired" ? "expired" : "canceled";
        checkoutSession.canceledAt = new Date().toISOString();
        checkoutSession.updatedAt = checkoutSession.canceledAt;
      }
      break;
    default:
      break;
  }

  const billingEvent = {
    id: createId("billing_event"),
    workspaceId,
    provider,
    eventType,
    status: "processed",
    checkoutSessionId: checkoutSession?.id || null,
    invoiceId: invoice?.id || null,
    customerId: customer.id,
    createdAt: new Date().toISOString(),
    processedAt: new Date().toISOString(),
    payloadSummary: {
      planId: targetPlan.id,
      amountUsd: payload.amountUsd ?? null,
      billingEmail: billingEmail || null,
      providerInvoiceId: payload.providerInvoiceId || null
    },
    createdBy
  };

  state.billingEvents[billingEvent.id] = billingEvent;
  return {
    workspace,
    customer,
    checkoutSession,
    invoice,
    billingEvent
  };
}

export function buildWorkspaceBillingSummary({ state, workspaceId }) {
  const workspace = state.workspaces[workspaceId];
  const usage = summarizeWorkspaceUsage({ state, workspaceId });
  const subscription = normalizeWorkspaceSubscription(workspace);
  const plan = getCommercePlan(subscription.planId);
  const recurringChargeUsd = plan.monthlyPriceUsd;
  const utilization = buildUtilization(usage);
  const customers = Object.values(state.billingCustomers || {}).filter((customer) => customer.workspaceId === workspaceId);
  const checkoutSessions = Object.values(state.billingCheckoutSessions || {})
    .filter((session) => session.workspaceId === workspaceId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const invoices = Object.values(state.billingInvoices || {})
    .filter((invoice) => invoice.workspaceId === workspaceId)
    .sort((left, right) => right.issuedAt.localeCompare(left.issuedAt));
  const events = Object.values(state.billingEvents || {})
    .filter((event) => event.workspaceId === workspaceId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  return {
    workspaceId,
    plan: {
      id: plan.id,
      label: plan.label,
      status: plan.status,
      monthlyPriceUsd: plan.monthlyPriceUsd
    },
    subscription: sanitizeWorkspaceSubscription(subscription),
    billingEmail: workspace?.billingEmail || null,
    recurringChargeUsd,
    estimatedNextInvoiceUsd: recurringChargeUsd,
    upgradeRecommendation: recommendUpgrade({ plan, utilization }),
    providerCoverage: [...new Set(customers.map((customer) => customer.provider).concat(checkoutSessions.map((session) => session.provider)))],
    customerCount: customers.length,
    openCheckoutSessions: checkoutSessions.filter((session) => session.status === "open").length,
    latestCheckoutSession: sanitizeBillingCheckoutSession(checkoutSessions[0] || null),
    latestInvoice: sanitizeBillingInvoice(invoices[0] || null),
    invoiceStatusCounts: summarizeInvoiceStatuses(invoices),
    eventCount: events.length,
    utilization,
    usage
  };
}

export function assertPlanLimit({ state, workspaceId, resource, currentCount }) {
  const workspace = state.workspaces[workspaceId];
  const plan = getCommercePlan(workspace?.planId || "dev");
  const limitMap = {
    projects: "maxProjects",
    runs: "maxRuns",
    apiClients: "maxApiClients"
  };
  const limitKey = limitMap[resource];

  if (!limitKey) {
    return;
  }

  const limit = plan.limits[limitKey];

  if (Number.isFinite(limit) && currentCount >= limit) {
    throw new Error(`Plan limit reached for ${resource}. Upgrade from ${plan.id} to continue.`);
  }
}

export function isAiAutobindAllowed(workspace) {
  return getCommercePlan(workspace?.planId || "dev").limits.aiAutobind;
}

function buildApiKeyPreview(secret) {
  return `${secret.slice(0, 7)}...${secret.slice(-4)}`;
}

function resolveCheckoutSession(state, candidateId) {
  if (!candidateId) {
    return null;
  }

  return Object.values(state.billingCheckoutSessions || {}).find((session) =>
    session.id === candidateId || session.providerSessionId === candidateId
  ) || null;
}

function resolveBillingInvoice(state, candidateId) {
  if (!candidateId) {
    return null;
  }

  return Object.values(state.billingInvoices || {}).find((invoice) =>
    invoice.id === candidateId || invoice.providerInvoiceId === candidateId
  ) || null;
}

function upsertBillingInvoice({
  state,
  workspaceId,
  provider,
  customerId,
  checkoutSessionId = null,
  providerInvoiceId = "",
  planId,
  amountUsd,
  status
}) {
  const existing = providerInvoiceId ? resolveBillingInvoice(state, providerInvoiceId) : null;
  const hasExplicitAmount = amountUsd !== undefined && amountUsd !== null && String(amountUsd).length > 0;
  const nextAmount = hasExplicitAmount && Number.isFinite(Number(amountUsd))
    ? Number(amountUsd)
    : getCommercePlan(planId || state.workspaces[workspaceId]?.planId || "starter").monthlyPriceUsd;
  const now = new Date().toISOString();

  if (existing) {
    existing.status = status;
    existing.amountUsd = nextAmount;
    existing.planId = planId || existing.planId;
    existing.updatedAt = now;
    existing.checkoutSessionId = checkoutSessionId || existing.checkoutSessionId;
    existing.paidAt = status === "paid" ? now : existing.paidAt;
    return existing;
  }

  const invoice = {
    id: createId("invoice"),
    workspaceId,
    provider,
    customerId,
    checkoutSessionId,
    providerInvoiceId: providerInvoiceId || `${provider}_inv_${createId("pinv").slice(-10)}`,
    planId,
    amountUsd: nextAmount,
    currency: "usd",
    status,
    issuedAt: now,
    dueAt: now,
    paidAt: status === "paid" ? now : null,
    updatedAt: now
  };

  state.billingInvoices[invoice.id] = invoice;
  return invoice;
}

function summarizeInvoiceStatuses(invoices) {
  return invoices.reduce((summary, invoice) => {
    summary[invoice.status] = (summary[invoice.status] || 0) + 1;
    return summary;
  }, {});
}

function buildCheckoutUrl({ provider, providerSessionId, successUrl, cancelUrl }) {
  const query = new URLSearchParams();

  if (successUrl) {
    query.set("success_url", successUrl);
  }

  if (cancelUrl) {
    query.set("cancel_url", cancelUrl);
  }

  const suffix = query.toString() ? `?${query}` : "";
  return `https://billing.twintest.local/${provider}/checkout/${providerSessionId}${suffix}`;
}

function createWorkspaceSubscription(planId) {
  const plan = getCommercePlan(planId);
  const now = new Date();

  return {
    planId: plan.id,
    status: plan.id === "dev" ? "active" : "trialing",
    billingCycle: "monthly",
    startedAt: now.toISOString(),
    trialEndsAt: plan.id === "dev" ? null : addDays(now, 14),
    renewsAt: addDays(now, 30),
    canceledAt: null,
    notes: ""
  };
}

function buildUtilization(usage) {
  return {
    projects: ratio(usage.counts.liveProjects, usage.limits.maxProjects),
    runs: ratio(usage.counts.liveRuns, usage.limits.maxRuns),
    apiClients: ratio(usage.counts.apiClients, usage.limits.maxApiClients)
  };
}

function recommendUpgrade({ plan, utilization }) {
  if (plan.id === "enterprise") {
    return null;
  }

  const highestUtilization = Math.max(utilization.projects, utilization.runs, utilization.apiClients);

  if (highestUtilization >= 1) {
    return "upgrade_now";
  }

  if (highestUtilization >= 0.8) {
    return "upgrade_soon";
  }

  return "current_plan_ok";
}

function ratio(current, limit) {
  return Number.isFinite(limit) && limit > 0 ? Number((current / limit).toFixed(6)) : 0;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

function resolveOfferProfilePolicy(offerProfile) {
  const normalizedProfile = String(offerProfile || "full").trim().toLowerCase();
  return offerProfilePolicy[normalizedProfile] || offerProfilePolicy.full;
}
