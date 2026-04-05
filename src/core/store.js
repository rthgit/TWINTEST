import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export function createEmptyState() {
  return {
    projects: {},
    documents: {},
    compilations: {},
    runs: {},
    reports: {},
    reviews: {},
    telemetry: {},
    artifacts: {},
    workspaces: {},
    apiClients: {},
    users: {},
    workspaceMemberships: {},
    sessions: {},
    usageMeters: {},
    billingCustomers: {},
    billingCheckoutSessions: {},
    billingInvoices: {},
    billingEvents: {},
    mvpBlueprints: {},
    mvpDecisions: {},
    pilotWorkbenches: {},
    runQueueJobs: {}
  };
}

export class JsonFileStore {
  constructor(filePath) {
    this.kind = "json";
    this.filePath = filePath;
    this.state = null;
    this.ready = null;
    this.queue = Promise.resolve();
  }

  async initialize() {
    if (this.ready) {
      return this.ready;
    }

    this.ready = (async () => {
      await mkdir(path.dirname(this.filePath), { recursive: true });

      try {
        const raw = await readFile(this.filePath, "utf8");
        this.state = upgradeState(JSON.parse(raw));
      } catch (error) {
        if (error.code !== "ENOENT") {
          throw error;
        }

        this.state = createEmptyState();
        await writeFile(this.filePath, JSON.stringify(this.state, null, 2));
      }

      return this.state;
    })();

    return this.ready;
  }

  async snapshot() {
    await this.initialize();
    return structuredClone(this.state);
  }

  async transact(mutator) {
    await this.initialize();

    const next = this.queue.then(async () => {
      const result = await mutator(this.state);
      await writeFile(this.filePath, JSON.stringify(this.state, null, 2));
      return result;
    });

    this.queue = next.catch(() => undefined);
    return structuredClone(await next);
  }

  async close() {}

  describe() {
    return {
      backend: this.kind,
      availableBackends: ["json", "sqlite", "postgres_http"],
      filePath: this.filePath
    };
  }
}

export class SqliteFileStore {
  constructor(filePath) {
    this.kind = "sqlite";
    this.filePath = filePath;
    this.state = null;
    this.database = null;
    this.ready = null;
    this.queue = Promise.resolve();
  }

  async initialize() {
    if (this.ready) {
      return this.ready;
    }

    this.ready = (async () => {
      await mkdir(path.dirname(this.filePath), { recursive: true });
      this.database = new DatabaseSync(this.filePath);
      this.database.exec(`
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        CREATE TABLE IF NOT EXISTS twintest_state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          payload TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      const row = this.database.prepare("SELECT payload FROM twintest_state WHERE id = 1").get();

      if (row?.payload) {
        this.state = upgradeState(JSON.parse(row.payload));
        this.persistState();
      } else {
        this.state = createEmptyState();
        this.persistState();
      }

      return this.state;
    })();

    return this.ready;
  }

  async snapshot() {
    await this.initialize();
    return structuredClone(this.state);
  }

  async transact(mutator) {
    await this.initialize();

    const next = this.queue.then(async () => {
      const result = await mutator(this.state);
      this.persistState();
      return result;
    });

    this.queue = next.catch(() => undefined);
    return structuredClone(await next);
  }

  async close() {
    if (this.database) {
      this.database.close();
      this.database = null;
    }
  }

  persistState() {
    const payload = JSON.stringify(this.state);
    const updatedAt = new Date().toISOString();
    this.database.prepare(`
      INSERT INTO twintest_state (id, payload, updated_at)
      VALUES (1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        payload = excluded.payload,
        updated_at = excluded.updated_at
    `).run(payload, updatedAt);
  }

  describe() {
    return {
      backend: this.kind,
      availableBackends: ["json", "sqlite", "postgres_http"],
      databaseFilePath: this.filePath
    };
  }
}

export class PostgresHttpStore {
  constructor({
    baseUrl,
    apiKey = "",
    schema = "public",
    table = "twintest_state",
    fetchImpl = globalThis.fetch
  }) {
    this.kind = "postgres_http";
    this.baseUrl = String(baseUrl || "").trim().replace(/\/+$/, "");
    this.apiKey = String(apiKey || "").trim();
    this.schema = String(schema || "public").trim() || "public";
    this.table = String(table || "twintest_state").trim() || "twintest_state";
    this.fetchImpl = fetchImpl;
    this.state = null;
    this.ready = null;
    this.queue = Promise.resolve();
  }

  async initialize() {
    if (this.ready) {
      return this.ready;
    }

    this.ready = (async () => {
      await this.bootstrap();
      const rows = await this.query(
        `SELECT payload FROM ${quoteIdentifier(this.schema)}.${quoteIdentifier(this.table)} WHERE id = $1`,
        [1]
      );

      if (rows[0]?.payload) {
        const payload = typeof rows[0].payload === "string"
          ? JSON.parse(rows[0].payload)
          : rows[0].payload;
        this.state = upgradeState(payload);
        await this.persistState();
      } else {
        this.state = createEmptyState();
        await this.persistState();
      }

      return this.state;
    })();

    return this.ready;
  }

  async snapshot() {
    await this.initialize();
    return structuredClone(this.state);
  }

  async transact(mutator) {
    await this.initialize();

    const next = this.queue.then(async () => {
      const result = await mutator(this.state);
      await this.persistState();
      return result;
    });

    this.queue = next.catch(() => undefined);
    return structuredClone(await next);
  }

  async close() {}

  describe() {
    return {
      backend: this.kind,
      availableBackends: ["json", "sqlite", "postgres_http"],
      baseUrlConfigured: Boolean(this.baseUrl),
      apiKeyConfigured: Boolean(this.apiKey),
      schema: this.schema,
      table: this.table
    };
  }

  async bootstrap() {
    if (!this.baseUrl) {
      throw new Error("postgres_http store backend requires TWINTEST_POSTGRES_BASE_URL.");
    }

    if (typeof this.fetchImpl !== "function") {
      throw new Error("postgres_http store backend requires a fetch implementation.");
    }

    if (this.schema !== "public") {
      await this.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdentifier(this.schema)}`);
    }

    await this.query(`
      CREATE TABLE IF NOT EXISTS ${quoteIdentifier(this.schema)}.${quoteIdentifier(this.table)} (
        id INTEGER PRIMARY KEY,
        payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);
  }

  async persistState() {
    const payload = JSON.stringify(this.state);
    const updatedAt = new Date().toISOString();

    await this.query(`
      INSERT INTO ${quoteIdentifier(this.schema)}.${quoteIdentifier(this.table)} (id, payload, updated_at)
      VALUES ($1, CAST($2 AS JSONB), $3)
      ON CONFLICT (id) DO UPDATE SET
        payload = EXCLUDED.payload,
        updated_at = EXCLUDED.updated_at
    `, [1, payload, updatedAt]);
  }

  async query(sql, params = []) {
    let response;

    try {
      response = await this.fetchImpl(`${this.baseUrl}/query`, {
        method: "POST",
        headers: compactHeaders({
          "content-type": "application/json",
          authorization: this.apiKey ? `Bearer ${this.apiKey}` : ""
        }),
        body: JSON.stringify({
          sql: String(sql || "").trim(),
          params
        })
      });
    } catch (error) {
      const connectionCode = error?.cause?.code || error?.code || "unknown";
      throw new Error(
        `postgres_http could not reach ${this.baseUrl}/query (${connectionCode}). ` +
          `Start node src/postgres-gateway.js or align TWINTEST_POSTGRES_BASE_URL with the active gateway port.`
      );
    }

    if (!response?.ok) {
      const errorDetails = await readErrorPayload(response);
      const suffix = errorDetails ? `: ${errorDetails}` : ".";
      throw new Error(`postgres_http query failed with status ${response?.status || "unknown"}${suffix}`);
    }

    const payload = await response.json();
    return Array.isArray(payload?.rows) ? payload.rows : [];
  }
}

async function readErrorPayload(response) {
  if (!response || typeof response.text !== "function") {
    return "";
  }

  try {
    const raw = (await response.text()).trim();

    if (!raw) {
      return "";
    }

    try {
      const parsed = JSON.parse(raw);
      return String(parsed?.error || parsed?.message || raw).trim();
    } catch {
      return raw;
    }
  } catch {
    return "";
  }
}

export function createStore({
  backend = "json",
  dataFilePath,
  databaseFilePath,
  postgresBaseUrl,
  postgresApiKey,
  postgresSchema,
  postgresTable,
  postgresFetch,
  workspaceRoot = process.cwd()
} = {}) {
  const normalizedBackend = String(backend || "json").trim().toLowerCase();

  if (normalizedBackend === "postgres_http") {
    return new PostgresHttpStore({
      baseUrl: postgresBaseUrl,
      apiKey: postgresApiKey,
      schema: postgresSchema,
      table: postgresTable,
      fetchImpl: postgresFetch
    });
  }

  if (normalizedBackend === "sqlite") {
    const resolvedDatabasePath = path.resolve(
      databaseFilePath || path.join(workspaceRoot, "data", "twintest-store.sqlite")
    );
    return new SqliteFileStore(resolvedDatabasePath);
  }

  const resolvedDataPath = path.resolve(
    dataFilePath || path.join(workspaceRoot, "data", "twintest-store.json")
  );
  return new JsonFileStore(resolvedDataPath);
}

export function upgradeState(state) {
  return {
    ...createEmptyState(),
    ...(state || {}),
    projects: {
      ...(state?.projects || {})
    },
    documents: {
      ...(state?.documents || {})
    },
    compilations: {
      ...(state?.compilations || {})
    },
    runs: {
      ...(state?.runs || {})
    },
    reports: {
      ...(state?.reports || {})
    },
    reviews: {
      ...(state?.reviews || {})
    },
    telemetry: {
      ...(state?.telemetry || {})
    },
    artifacts: {
      ...(state?.artifacts || {})
    },
    workspaces: {
      ...(state?.workspaces || {})
    },
    apiClients: {
      ...(state?.apiClients || {})
    },
    users: {
      ...(state?.users || {})
    },
    workspaceMemberships: {
      ...(state?.workspaceMemberships || {})
    },
    sessions: {
      ...(state?.sessions || {})
    },
    usageMeters: {
      ...(state?.usageMeters || {})
    },
    billingCustomers: {
      ...(state?.billingCustomers || {})
    },
    billingCheckoutSessions: {
      ...(state?.billingCheckoutSessions || {})
    },
    billingInvoices: {
      ...(state?.billingInvoices || {})
    },
    billingEvents: {
      ...(state?.billingEvents || {})
    },
    mvpBlueprints: {
      ...(state?.mvpBlueprints || {})
    },
    mvpDecisions: {
      ...(state?.mvpDecisions || {})
    },
    pilotWorkbenches: {
      ...(state?.pilotWorkbenches || {})
    },
    runQueueJobs: {
      ...(state?.runQueueJobs || {})
    }
  };
}

function compactHeaders(headers) {
  return Object.fromEntries(Object.entries(headers).filter(([, value]) => String(value || "").length > 0));
}

function quoteIdentifier(value) {
  return `"${String(value || "").replaceAll("\"", "\"\"")}"`;
}
