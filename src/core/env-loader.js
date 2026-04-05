import { readFile } from "node:fs/promises";
import path from "node:path";
import { resolveAiModel, resolveAiProvider } from "./ai-solver-orchestrator.js";

const SHORT_KEY_ALIASES = Object.freeze({
  PROVIDER: "TWINTEST_AI_PROVIDER",
  API_KEY: "TWINTEST_AI_API_KEY",
  AI_API_KEY: "TWINTEST_AI_API_KEY",
  AI_MODEL: "TWINTEST_AI_MODEL",
  MODEL: "TWINTEST_AI_MODEL",
  AI_BASE_URL: "TWINTEST_AI_BASE_URL",
  BASE_URL: "TWINTEST_AI_BASE_URL",
  BILLING_WEBHOOK_SECRET: "TWINTEST_BILLING_WEBHOOK_SECRET"
});

const ASSIGNMENT_PATTERNS = [
  /^\$env:([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/i,
  /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/
];

export async function loadEnvironmentFile({
  filePath = path.resolve(process.cwd(), ".env"),
  env = process.env,
  override = false
} = {}) {
  let source;

  try {
    source = await readFile(filePath, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return {
        loaded: false,
        filePath,
        values: {},
        appliedKeys: [],
        skippedKeys: []
      };
    }

    throw error;
  }

  const values = parseEnvironmentText(source);
  const appliedKeys = [];
  const skippedKeys = [];

  for (const [key, value] of Object.entries(values)) {
    if (!override && hasEnvironmentValue(env[key])) {
      skippedKeys.push(key);
      continue;
    }

    env[key] = value;
    appliedKeys.push(key);
  }

  return {
    loaded: true,
    filePath,
    values,
    appliedKeys,
    skippedKeys
  };
}

export function parseEnvironmentText(source) {
  const values = {};

  for (const rawLine of String(source).replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#") || line.startsWith("//")) {
      continue;
    }

    const assignment = parseAssignedLine(line);
    if (!assignment) {
      continue;
    }

    values[normalizeEnvironmentKey(assignment.key)] = parseEnvironmentValue(assignment.value);
  }

  return values;
}

export function getServerEnvironment(env = process.env) {
  const aiProvider = resolveAiProvider(readEnvironmentValue(env, ["TWINTEST_AI_PROVIDER", "PROVIDER"], "openai"));
  const aiApiKey = readEnvironmentValue(
    env,
    ["TWINTEST_AI_API_KEY", "TWINTEST_OPENAI_API_KEY", "AI_API_KEY", "API_KEY"],
    ""
  );
  const aiModel = resolveAiModel(
    aiProvider,
    readEnvironmentValue(env, ["TWINTEST_AI_MODEL", "TWINTEST_OPENAI_MODEL", "AI_MODEL", "MODEL"], "")
  );
  const aiBaseUrl = readEnvironmentValue(
    env,
    ["TWINTEST_AI_BASE_URL", "AI_BASE_URL", "BASE_URL"],
    ""
  );
  const parsedPort = Number(readEnvironmentValue(env, ["TWINTEST_PORT", "PORT"], 3000));
  const requestRateLimitEnabled = parseBooleanValue(
    readEnvironmentValue(env, ["TWINTEST_RATE_LIMIT_ENABLED"], "true"),
    true
  );
  const requestRateLimitMaxRequests = parsePositiveInteger(
    readEnvironmentValue(env, ["TWINTEST_RATE_LIMIT_MAX_REQUESTS"], 600),
    600
  );
  const requestRateLimitWindowSeconds = parsePositiveInteger(
    readEnvironmentValue(env, ["TWINTEST_RATE_LIMIT_WINDOW_SECONDS"], 60),
    60
  );
  const authLockoutThreshold = parsePositiveInteger(
    readEnvironmentValue(env, ["TWINTEST_AUTH_LOCKOUT_THRESHOLD"], 5),
    5
  );
  const authLockoutWindowSeconds = parsePositiveInteger(
    readEnvironmentValue(env, ["TWINTEST_AUTH_LOCKOUT_WINDOW_SECONDS"], 600),
    600
  );
  const authLockoutDurationSeconds = parsePositiveInteger(
    readEnvironmentValue(env, ["TWINTEST_AUTH_LOCKOUT_DURATION_SECONDS"], 900),
    900
  );
  const billingWebhookMode = normalizeBillingWebhookMode(
    readEnvironmentValue(env, ["TWINTEST_BILLING_WEBHOOK_MODE"], "auto")
  );
  const billingWebhookToleranceSeconds = parsePositiveInteger(
    readEnvironmentValue(env, ["TWINTEST_BILLING_WEBHOOK_TOLERANCE_SECONDS"], 300),
    300
  );

  return {
    port: Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3000,
    apiKey: readEnvironmentValue(env, ["TWINTEST_API_KEY"], "dev-twintest-key"),
    offerProfile: readEnvironmentValue(env, ["TWINTEST_OFFER_PROFILE"], "full"),
    dataFilePath: readEnvironmentValue(env, ["TWINTEST_DATA_FILE"], undefined),
    databaseFilePath: readEnvironmentValue(env, ["TWINTEST_DATABASE_FILE"], undefined),
    postgresBaseUrl: readEnvironmentValue(env, ["TWINTEST_POSTGRES_BASE_URL"], undefined),
    postgresApiKey: readEnvironmentValue(env, ["TWINTEST_POSTGRES_API_KEY"], undefined),
    postgresSchema: readEnvironmentValue(env, ["TWINTEST_POSTGRES_SCHEMA"], undefined),
    postgresTable: readEnvironmentValue(env, ["TWINTEST_POSTGRES_TABLE"], undefined),
    artifactRoot: readEnvironmentValue(env, ["TWINTEST_ARTIFACT_ROOT"], undefined),
    artifactStoreBackend: readEnvironmentValue(env, ["TWINTEST_ARTIFACT_STORE_BACKEND"], "local_filesystem"),
    artifactBucket: readEnvironmentValue(env, ["TWINTEST_ARTIFACT_BUCKET"], undefined),
    artifactPublicBaseUrl: readEnvironmentValue(env, ["TWINTEST_ARTIFACT_PUBLIC_BASE_URL"], undefined),
    artifactRemoteBaseUrl: readEnvironmentValue(env, ["TWINTEST_ARTIFACT_REMOTE_BASE_URL"], undefined),
    artifactRemoteApiKey: readEnvironmentValue(env, ["TWINTEST_ARTIFACT_REMOTE_API_KEY"], undefined),
    storeBackend: readEnvironmentValue(env, ["TWINTEST_STORE_BACKEND"], "json"),
    runMode: readEnvironmentValue(env, ["TWINTEST_RUN_MODE"], "embedded"),
    workerPollMs: Number(readEnvironmentValue(env, ["TWINTEST_WORKER_POLL_MS"], 1000)),
    billingWebhookSecret: readEnvironmentValue(env, ["TWINTEST_BILLING_WEBHOOK_SECRET", "BILLING_WEBHOOK_SECRET"], "dev-billing-webhook-secret"),
    billingProvider: readEnvironmentValue(env, ["TWINTEST_BILLING_PROVIDER"], "simulated_stripe"),
    billingApiBaseUrl: readEnvironmentValue(env, ["TWINTEST_BILLING_API_BASE_URL"], undefined),
    billingApiKey: readEnvironmentValue(env, ["TWINTEST_BILLING_API_KEY"], undefined),
    billingCallbackBaseUrl: readEnvironmentValue(env, ["TWINTEST_BILLING_CALLBACK_BASE_URL"], undefined),
    billingWebhookMode,
    billingWebhookToleranceSeconds,
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
  };
}

function parseAssignedLine(line) {
  for (const pattern of ASSIGNMENT_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      return {
        key: match[1],
        value: match[2]
      };
    }
  }

  return null;
}

function normalizeEnvironmentKey(key) {
  const trimmed = key.trim();
  return SHORT_KEY_ALIASES[trimmed.toUpperCase()] || trimmed;
}

function parseEnvironmentValue(rawValue) {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("\"") || trimmed.startsWith("'")) {
    return extractQuotedValue(trimmed);
  }

  return trimmed.replace(/\s+#.*$/, "").trim();
}

function extractQuotedValue(rawValue) {
  const quote = rawValue[0];
  let value = "";
  let escaping = false;

  for (let index = 1; index < rawValue.length; index += 1) {
    const character = rawValue[index];

    if (escaping) {
      value += unescapeCharacter(character, quote);
      escaping = false;
      continue;
    }

    if (character === "\\") {
      escaping = true;
      continue;
    }

    if (character === quote) {
      return value;
    }

    value += character;
  }

  return rawValue.slice(1);
}

function unescapeCharacter(character, quote) {
  switch (character) {
    case "n":
      return "\n";
    case "r":
      return "\r";
    case "t":
      return "\t";
    case "\\":
      return "\\";
    default:
      return character === quote ? quote : `\\${character}`;
  }
}

function readEnvironmentValue(env, keys, fallback) {
  for (const key of keys) {
    if (hasEnvironmentValue(env[key])) {
      return env[key];
    }
  }

  return fallback;
}

function hasEnvironmentValue(value) {
  return value !== undefined && value !== null && String(value).length > 0;
}

function parseBooleanValue(value, fallback) {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeBillingWebhookMode(value) {
  const normalized = String(value || "auto").trim().toLowerCase();
  return ["auto", "shared_secret", "hmac_sha256"].includes(normalized) ? normalized : "auto";
}
