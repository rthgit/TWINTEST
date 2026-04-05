import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { getServerEnvironment, loadEnvironmentFile, parseEnvironmentText } from "../src/core/env-loader.js";

test("TwinTest parses dotenv, PowerShell env syntax and AI aliases from .env text", () => {
  const values = parseEnvironmentText(`
    # TwinTest AI bootstrap
    PROVIDER = "groq"
    API_KEY = "secret-key"
    AI_MODEL = "gpt 120oss"
    export TWINTEST_API_KEY = "workspace-key"
    $env:TWINTEST_AI_BASE_URL = "https://api.groq.com/openai/v1/responses"
    node src/server.js
  `);

  assert.deepEqual(values, {
    TWINTEST_AI_PROVIDER: "groq",
    TWINTEST_AI_API_KEY: "secret-key",
    TWINTEST_AI_MODEL: "gpt 120oss",
    TWINTEST_API_KEY: "workspace-key",
    TWINTEST_AI_BASE_URL: "https://api.groq.com/openai/v1/responses"
  });
});

test("TwinTest loads .env values without overriding explicit runtime environment by default", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `env-${Date.now()}`);
  const envFilePath = path.join(tempDir, ".env");
  await mkdir(tempDir, { recursive: true });

  try {
    await writeFile(
      envFilePath,
      [
        '$env:TWINTEST_AI_PROVIDER = "groq"',
        'API_KEY = "file-key"',
        'AI_MODEL = "gpt 120oss"',
        'TWINTEST_API_KEY = "file-workspace-key"'
      ].join("\n")
    );

    const env = {
      TWINTEST_AI_API_KEY: "runtime-key"
    };

    const result = await loadEnvironmentFile({
      filePath: envFilePath,
      env
    });

    assert.equal(result.loaded, true);
    assert.ok(result.appliedKeys.includes("TWINTEST_AI_PROVIDER"));
    assert.ok(result.skippedKeys.includes("TWINTEST_AI_API_KEY"));
    assert.equal(env.TWINTEST_AI_PROVIDER, "groq");
    assert.equal(env.TWINTEST_AI_API_KEY, "runtime-key");
    assert.equal(env.TWINTEST_API_KEY, "file-workspace-key");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest derives normalized server configuration from loaded .env aliases", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `env-config-${Date.now()}`);
  const envFilePath = path.join(tempDir, ".env");
  await mkdir(tempDir, { recursive: true });

  try {
    await writeFile(
      envFilePath,
      [
        'PORT = "3105"',
        'PROVIDER = "groq"',
        'API_KEY = "groq-secret"',
        'AI_MODEL = "gpt 120oss"',
        'TWINTEST_API_KEY = "workspace-auth-key"',
        'TWINTEST_OFFER_PROFILE = "paid"',
        'TWINTEST_STORE_BACKEND = "postgres_http"',
        'TWINTEST_POSTGRES_BASE_URL = "https://postgres.twintest.test"',
        'TWINTEST_POSTGRES_API_KEY = "pg-key"',
        'TWINTEST_POSTGRES_SCHEMA = "twintest"',
        'TWINTEST_POSTGRES_TABLE = "state_store"',
        'TWINTEST_ARTIFACT_STORE_BACKEND = "s3_layout_filesystem"',
        'TWINTEST_ARTIFACT_BUCKET = "tenant-artifacts"',
        'TWINTEST_ARTIFACT_REMOTE_BASE_URL = "https://objects.twintest.test/api"',
        'TWINTEST_BILLING_PROVIDER = "http_json"',
        'TWINTEST_BILLING_API_BASE_URL = "https://billing.twintest.test/v1"',
        'TWINTEST_BILLING_WEBHOOK_SECRET = "billing-secret"',
        'TWINTEST_BILLING_WEBHOOK_MODE = "hmac_sha256"',
        'TWINTEST_BILLING_WEBHOOK_TOLERANCE_SECONDS = "450"',
        'TWINTEST_RATE_LIMIT_ENABLED = "true"',
        'TWINTEST_RATE_LIMIT_MAX_REQUESTS = "700"',
        'TWINTEST_RATE_LIMIT_WINDOW_SECONDS = "90"',
        'TWINTEST_AUTH_LOCKOUT_THRESHOLD = "6"',
        'TWINTEST_AUTH_LOCKOUT_WINDOW_SECONDS = "420"',
        'TWINTEST_AUTH_LOCKOUT_DURATION_SECONDS = "840"',
        'node src/server.js'
      ].join("\n")
    );

    const env = {};
    await loadEnvironmentFile({
      filePath: envFilePath,
      env
    });

    const configuration = getServerEnvironment(env);
    assert.equal(configuration.port, 3105);
    assert.equal(configuration.apiKey, "workspace-auth-key");
    assert.equal(configuration.offerProfile, "paid");
    assert.equal(configuration.storeBackend, "postgres_http");
    assert.equal(configuration.postgresBaseUrl, "https://postgres.twintest.test");
    assert.equal(configuration.postgresApiKey, "pg-key");
    assert.equal(configuration.postgresSchema, "twintest");
    assert.equal(configuration.postgresTable, "state_store");
    assert.equal(configuration.aiProvider, "groq");
    assert.equal(configuration.aiApiKey, "groq-secret");
    assert.equal(configuration.aiModel, "openai/gpt-oss-120b");
    assert.equal(configuration.artifactStoreBackend, "s3_layout_filesystem");
    assert.equal(configuration.artifactBucket, "tenant-artifacts");
    assert.equal(configuration.artifactRemoteBaseUrl, "https://objects.twintest.test/api");
    assert.equal(configuration.billingProvider, "http_json");
    assert.equal(configuration.billingApiBaseUrl, "https://billing.twintest.test/v1");
    assert.equal(configuration.billingWebhookSecret, "billing-secret");
    assert.equal(configuration.billingWebhookMode, "hmac_sha256");
    assert.equal(configuration.billingWebhookToleranceSeconds, 450);
    assert.equal(configuration.requestRateLimitEnabled, true);
    assert.equal(configuration.requestRateLimitMaxRequests, 700);
    assert.equal(configuration.requestRateLimitWindowSeconds, 90);
    assert.equal(configuration.authLockoutThreshold, 6);
    assert.equal(configuration.authLockoutWindowSeconds, 420);
    assert.equal(configuration.authLockoutDurationSeconds, 840);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("TwinTest prefers TWINTEST_PORT over PORT when both are defined", () => {
  const configuration = getServerEnvironment({
    PORT: "3000",
    TWINTEST_PORT: "3100"
  });

  assert.equal(configuration.port, 3100);
});
