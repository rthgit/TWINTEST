import { createId } from "./id.js";

export class BillingGateway {
  constructor({
    defaultProvider = "simulated_stripe",
    apiBaseUrl = "",
    apiKey = "",
    callbackBaseUrl = "",
    fetchImpl = globalThis.fetch
  } = {}) {
    this.defaultProvider = String(defaultProvider || "simulated_stripe").trim() || "simulated_stripe";
    this.apiBaseUrl = String(apiBaseUrl || "").trim().replace(/\/+$/, "");
    this.apiKey = String(apiKey || "").trim();
    this.callbackBaseUrl = String(callbackBaseUrl || "").trim().replace(/\/+$/, "");
    this.fetchImpl = fetchImpl;
  }

  async createCheckoutSession({
    provider = "",
    workspaceId,
    planId,
    billingEmail = "",
    successUrl = "",
    cancelUrl = "",
    amountUsd = null
  }) {
    const resolvedProvider = String(provider || this.defaultProvider || "simulated_stripe").trim();

    if (resolvedProvider === "http_json") {
      return this.createHttpJsonCheckoutSession({
        workspaceId,
        planId,
        billingEmail,
        successUrl,
        cancelUrl,
        amountUsd
      });
    }

    return createSimulatedCheckoutSession({
      provider: resolvedProvider,
      workspaceId,
      planId,
      billingEmail,
      successUrl,
      cancelUrl,
      amountUsd
    });
  }

  describe() {
    return {
      defaultProvider: this.defaultProvider,
      apiBaseUrlConfigured: Boolean(this.apiBaseUrl),
      apiKeyConfigured: Boolean(this.apiKey),
      callbackBaseUrlConfigured: Boolean(this.callbackBaseUrl)
    };
  }

  async createHttpJsonCheckoutSession({
    workspaceId,
    planId,
    billingEmail,
    successUrl,
    cancelUrl,
    amountUsd
  }) {
    if (!this.apiBaseUrl) {
      throw new Error("http_json billing provider requires TWINTEST_BILLING_API_BASE_URL.");
    }

    if (typeof this.fetchImpl !== "function") {
      throw new Error("http_json billing provider requires a fetch implementation.");
    }

    const response = await this.fetchImpl(`${this.apiBaseUrl}/checkout-sessions`, {
      method: "POST",
      headers: compactHeaders({
        "content-type": "application/json",
        authorization: this.apiKey ? `Bearer ${this.apiKey}` : "",
        "x-twintest-provider": "http_json"
      }),
      body: JSON.stringify({
        workspaceId,
        planId,
        billingEmail: billingEmail || null,
        successUrl: successUrl || buildCallbackUrl(this.callbackBaseUrl, "/billing/success"),
        cancelUrl: cancelUrl || buildCallbackUrl(this.callbackBaseUrl, "/billing/cancel"),
        amountUsd,
        referenceId: createId("billing_ref")
      })
    });

    if (!response?.ok) {
      throw new Error(`External billing provider checkout failed with status ${response?.status || "unknown"}.`);
    }

    const payload = await response.json();

    if (!payload?.providerSessionId?.trim() || !payload?.checkoutUrl?.trim()) {
      throw new Error("External billing provider response is missing providerSessionId or checkoutUrl.");
    }

    return {
      provider: "http_json",
      providerSessionId: payload.providerSessionId.trim(),
      checkoutUrl: payload.checkoutUrl.trim(),
      status: payload.status || "open",
      customer: {
        providerCustomerId: payload.providerCustomerId || "",
        email: payload.billingEmail || billingEmail || null
      },
      providerPayload: {
        providerReferenceId: payload.providerReferenceId || null,
        rawStatus: payload.status || "open"
      }
    };
  }
}

export function createBillingGateway(options = {}) {
  return new BillingGateway(options);
}

function createSimulatedCheckoutSession({
  provider,
  workspaceId,
  planId,
  billingEmail,
  successUrl,
  cancelUrl,
  amountUsd
}) {
  const providerSessionId = `${provider}_cs_${createId("pcs").slice(-10)}`;
  const query = new URLSearchParams();

  if (successUrl) {
    query.set("success_url", successUrl);
  }

  if (cancelUrl) {
    query.set("cancel_url", cancelUrl);
  }

  return {
    provider,
    providerSessionId,
    checkoutUrl: `https://billing.twintest.local/${provider}/checkout/${providerSessionId}${query.toString() ? `?${query}` : ""}`,
    status: "open",
    customer: {
      providerCustomerId: `${provider}_cus_${createId("pc").slice(-10)}`,
      email: billingEmail || null
    },
    providerPayload: {
      workspaceId,
      planId,
      amountUsd
    }
  };
}

function compactHeaders(headers) {
  return Object.fromEntries(Object.entries(headers).filter(([, value]) => String(value || "").length > 0));
}

function buildCallbackUrl(baseUrl, routePath) {
  if (!baseUrl) {
    return "";
  }

  return `${baseUrl}${routePath}`;
}
