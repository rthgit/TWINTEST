import { createPlatform } from "./core/platform.js";
import { getServerEnvironment, loadEnvironmentFile } from "./core/env-loader.js";

await loadEnvironmentFile();

const {
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
  workerPollMs,
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

const pollMs = Number.isFinite(workerPollMs) && workerPollMs > 0 ? workerPollMs : 1000;

const platform = createPlatform({
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
  runMode: "external",
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

await platform.store.initialize();

let shouldStop = false;

process.on("SIGINT", () => {
  shouldStop = true;
});

process.on("SIGTERM", () => {
  shouldStop = true;
});

console.log(`TwinTest worker started with offer profile ${platform.offerProfile}, store backend ${platform.store.kind}, poll ${pollMs}ms.`);

while (!shouldStop) {
  const result = await platform.processQueuedRunsOnce({
    workerId: `worker_${process.pid}`,
    limit: 8
  });

  if (result.processedCount > 0) {
    console.log(`TwinTest worker processed ${result.processedCount} run job(s), remaining ${result.remainingCount}.`);
  }

  await wait(pollMs);
}

await platform.store.close?.();
console.log("TwinTest worker stopped.");

function wait(durationMs) {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}
