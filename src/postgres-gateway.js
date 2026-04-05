import { spawn } from "node:child_process";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvironmentFile } from "./core/env-loader.js";

export function createGatewayRequestHandler({ configuration, queryExecutor }) {
  return async function handleRequest(request, response) {
    setBaseHeaders(response);

    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }

    if (request.method === "GET" && request.url === "/health") {
      return sendJson(response, 200, {
        status: "ok",
        mode: configuration.mode,
        port: configuration.port
      });
    }

    if (request.method === "POST" && request.url === "/query") {
      try {
        const body = await readJsonBody(request);
        const rows = await queryExecutor({
          sql: body.sql,
          params: body.params || []
        });
        return sendJson(response, 200, { rows });
      } catch (error) {
        return sendJson(response, 500, { error: error.message || "Postgres gateway query failed." });
      }
    }

    response.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "Endpoint not found." }));
  };
}

export function createQueryExecutor(configuration, runCommand = executeProcess) {
  return async ({ sql, params = [] }) => {
    if (!sql?.trim()) {
      throw new Error("SQL is required.");
    }

    const preparedSql = buildGatewaySql(interpolateSql(sql, params));
    const command = buildPsqlCommand(configuration, preparedSql);
    const result = await runCommand(command);

    if (result.code !== 0) {
      throw new Error(result.stderr?.trim() || `psql exited with code ${result.code}.`);
    }

    return parsePsqlJsonRows(result.stdout);
  };
}

export function getGatewayConfiguration(env = process.env) {
  const parsedPort = Number(env.TWINTEST_POSTGRES_GATEWAY_PORT || env.PORT || 3040);

  return {
    port: Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3040,
    mode: String(env.TWINTEST_POSTGRES_GATEWAY_MODE || "docker_exec").trim().toLowerCase(),
    container: String(env.TWINTEST_PG_CONTAINER || "twintest-postgres").trim(),
    user: String(env.TWINTEST_PG_USER || "postgres").trim(),
    database: String(env.TWINTEST_PG_DATABASE || "twintest").trim(),
    password: String(env.TWINTEST_PG_PASSWORD || "").trim(),
    host: String(env.TWINTEST_PG_HOST || "127.0.0.1").trim(),
    hostPort: Number(env.TWINTEST_PG_PORT || 5432)
  };
}

export function interpolateSql(sql, params = []) {
  let result = String(sql || "");

  for (let index = params.length; index >= 1; index -= 1) {
    const placeholder = new RegExp(`\\$${index}(?!\\d)`, "g");
    result = result.replace(placeholder, toSqlLiteral(params[index - 1]));
  }

  return result;
}

export function buildGatewaySql(interpolatedSql) {
  const trimmed = String(interpolatedSql || "").trim().replace(/;+$/, "");

  if (/^select\b/i.test(trimmed)) {
    return `COPY (SELECT COALESCE(json_agg(q), '[]'::json) FROM (${trimmed}) AS q) TO STDOUT`;
  }

  return `${trimmed}; COPY (SELECT '[]'::json) TO STDOUT`;
}

export function parsePsqlJsonRows(stdout) {
  const raw = String(stdout || "").trim();

  if (!raw) {
    return [];
  }

  for (const candidate of extractJsonCandidates(raw)) {
    try {
      const parsed = JSON.parse(candidate);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      continue;
    }
  }

  throw new Error("psql returned invalid JSON.");
}

function buildPsqlCommand(configuration, sql) {
  if (configuration.mode === "host_psql") {
    return {
      command: "psql",
      args: [
        "-X",
        "-q",
        "-h",
        configuration.host,
        "-p",
        String(configuration.hostPort || 5432),
        "-U",
        configuration.user,
        "-d",
        configuration.database,
        "-t",
        "-A",
        "-f",
        "-"
      ],
      stdin: `${sql}\n`,
      env: configuration.password
        ? {
          ...process.env,
          PGPASSWORD: configuration.password
        }
        : process.env
    };
  }

  const args = [
    "exec",
    "-i"
  ];

  if (configuration.password) {
    args.push("-e", `PGPASSWORD=${configuration.password}`);
  }

  args.push(
    configuration.container,
    "psql",
    "-X",
    "-q",
    "-U",
    configuration.user,
    "-d",
    configuration.database,
    "-t",
    "-A",
    "-f",
    "-"
  );

  return {
    command: "docker",
    args,
    stdin: `${sql}\n`,
    env: process.env
  };
}

function executeProcess({ command, args, env, stdin = "" }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env,
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";

    if (stdin) {
      child.stdin.write(stdin);
    }
    child.stdin.end();

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      resolve({
        code,
        stdout,
        stderr
      });
    });
  });
}

function toSqlLiteral(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "NULL";
  }

  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }

  const normalized = typeof value === "object"
    ? JSON.stringify(value)
    : String(value);

  return `'${normalized.replaceAll("'", "''")}'`;
}

function extractJsonCandidates(raw) {
  const candidates = [raw];
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (!candidates.includes(lines[index])) {
      candidates.push(lines[index]);
    }
  }

  return candidates;
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload, null, 2));
}

function setBaseHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

if (isMainModule(import.meta.url, process.argv[1])) {
  await loadEnvironmentFile();
  const configuration = getGatewayConfiguration(process.env);
  const queryExecutor = createQueryExecutor(configuration);
  const server = http.createServer(createGatewayRequestHandler({
    configuration,
    queryExecutor
  }));

  server.once("error", (error) => {
    if (error?.code === "EADDRINUSE") {
      console.error(
        `TwinTest Postgres gateway could not bind to port ${configuration.port} because another process is already listening there. ` +
          `Stop the old gateway or set TWINTEST_POSTGRES_GATEWAY_PORT to a free port and align TWINTEST_POSTGRES_BASE_URL with it.`
      );
      process.exit(1);
    }

    console.error("TwinTest Postgres gateway failed to start.", error);
    process.exit(1);
  });

  server.listen(configuration.port, () => {
    console.log(`TwinTest Postgres gateway listening on http://localhost:${configuration.port}`);
    console.log(`Gateway mode ${configuration.mode} targeting ${configuration.mode === "docker_exec" ? configuration.container : configuration.database}.`);
  });
}

function isMainModule(moduleUrl, candidatePath) {
  if (!candidatePath) {
    return false;
  }

  return fileURLToPath(moduleUrl) === path.resolve(candidatePath);
}
