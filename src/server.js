import { createApp } from "./app.js";
import { getServerEnvironment, loadEnvironmentFile } from "./core/env-loader.js";

await loadEnvironmentFile();

const {
  port,
  apiKey,
  offerProfile,
  dataFilePath,
  databaseFilePath,
  postgresBaseUrl,
  postgresApiKey,
  postgresSchema,
  postgresTable,
  artifactRoot,
  artifactStoreBackend,
  artifactBucket,
  artifactPublicBaseUrl,
  artifactRemoteBaseUrl,
  artifactRemoteApiKey,
  storeBackend,
  runMode,
  billingWebhookSecret,
  billingWebhookMode,
  billingWebhookToleranceSeconds,
  billingProvider,
  billingApiBaseUrl,
  billingApiKey,
  billingCallbackBaseUrl,
  requestRateLimitEnabled,
  requestRateLimitMaxRequests,
  requestRateLimitWindowSeconds,
  authLockoutThreshold,
  authLockoutWindowSeconds,
  authLockoutDurationSeconds,
  aiProvider,
  aiApiKey,
  aiModel,
  aiBaseUrl
} = getServerEnvironment();

const { server } = await createApp({
  apiKey,
  offerProfile,
  dataFilePath,
  databaseFilePath,
  postgresBaseUrl,
  postgresApiKey,
  postgresSchema,
  postgresTable,
  artifactRoot,
  artifactStoreBackend,
  artifactBucket,
  artifactPublicBaseUrl,
  artifactRemoteBaseUrl,
  artifactRemoteApiKey,
  storeBackend,
  runMode,
  billingWebhookSecret,
  billingWebhookMode,
  billingWebhookToleranceSeconds,
  billingProvider,
  billingApiBaseUrl,
  billingApiKey,
  billingCallbackBaseUrl,
  requestRateLimitEnabled,
  requestRateLimitMaxRequests,
  requestRateLimitWindowSeconds,
  authLockoutThreshold,
  authLockoutWindowSeconds,
  authLockoutDurationSeconds,
  aiProvider,
  aiApiKey,
  aiModel,
  aiBaseUrl
});

server.once("error", (error) => {
  if (error?.code === "EADDRINUSE") {
    console.error(
      `TwinTest could not bind to port ${port} because another process is already listening there. ` +
        `Set PORT or TWINTEST_PORT to a free port, then open http://localhost:${port}/studio.`
    );
    process.exit(1);
  }

  console.error("TwinTest server failed to start.", error);
  process.exit(1);
});

server.listen(port, () => {
  console.log(`TwinTest kernel listening on http://localhost:${port}`);
  console.log("API key configured via TWINTEST_API_KEY or default dev key.");
  console.log(`Offer profile ${offerProfile}.`);
  console.log(
    `Store backend ${storeBackend} with run mode ${runMode}${
      storeBackend === "postgres_http" && postgresBaseUrl ? ` via ${postgresBaseUrl}` : ""
    }.`
  );
  console.log(`Artifact backend ${artifactStoreBackend} at ${artifactRoot || artifactRemoteBaseUrl || "default root"}${artifactBucket ? ` (bucket ${artifactBucket})` : ""}.`);
  console.log(`Billing webhook secret configured: ${billingWebhookSecret ? "yes" : "no"} (mode ${billingWebhookMode}, tolerance ${billingWebhookToleranceSeconds}s).`);
  console.log(`Billing provider default ${billingProvider}${billingApiBaseUrl ? ` via ${billingApiBaseUrl}` : ""}.${billingApiKey ? " API key configured." : ""}`);
  console.log(
    `Request policy: rate limit ${requestRateLimitEnabled ? "enabled" : "disabled"} ` +
      `(${requestRateLimitMaxRequests}/${requestRateLimitWindowSeconds}s), ` +
      `auth lockout threshold ${authLockoutThreshold} in ${authLockoutWindowSeconds}s ` +
      `(duration ${authLockoutDurationSeconds}s).`
  );
  console.log(
    aiApiKey
      ? `AI autobind enabled with provider ${aiProvider} and model ${aiModel || "provider default"}.`
      : "AI autobind disabled until TWINTEST_AI_API_KEY or TWINTEST_OPENAI_API_KEY is set."
  );
});
