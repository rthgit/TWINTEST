import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGatewaySql,
  createGatewayRequestHandler,
  createQueryExecutor,
  getGatewayConfiguration,
  interpolateSql,
  parsePsqlJsonRows
} from "../src/postgres-gateway.js";

test("TwinTest Postgres gateway interpolates SQL parameters safely", () => {
  const sql = interpolateSql(
    "INSERT INTO demo (id, payload, enabled, note) VALUES ($1, CAST($2 AS JSONB), $3, $4)",
    [1, { ok: true }, false, "O'Hara"]
  );

  assert.equal(
    sql,
    "INSERT INTO demo (id, payload, enabled, note) VALUES (1, CAST('{\"ok\":true}' AS JSONB), FALSE, 'O''Hara')"
  );
});

test("TwinTest Postgres gateway builds copy wrappers for select and mutation SQL", () => {
  assert.equal(
    buildGatewaySql("SELECT payload FROM demo"),
    "COPY (SELECT COALESCE(json_agg(q), '[]'::json) FROM (SELECT payload FROM demo) AS q) TO STDOUT"
  );
  assert.equal(
    buildGatewaySql("INSERT INTO demo (id) VALUES (1)"),
    "INSERT INTO demo (id) VALUES (1); COPY (SELECT '[]'::json) TO STDOUT"
  );
});

test("TwinTest Postgres gateway executor uses docker exec mode by default", async () => {
  const commands = [];
  const executor = createQueryExecutor(
    getGatewayConfiguration({
      TWINTEST_POSTGRES_GATEWAY_MODE: "docker_exec",
      TWINTEST_PG_CONTAINER: "twintest-postgres",
      TWINTEST_PG_USER: "postgres",
      TWINTEST_PG_DATABASE: "twintest",
      TWINTEST_PG_PASSWORD: "postgres"
    }),
    async (command) => {
      commands.push(command);
      return {
        code: 0,
        stdout: "[{\"payload\":{\"ok\":true}}]\n",
        stderr: ""
      };
    }
  );

  const rows = await executor({
    sql: "SELECT payload FROM demo WHERE id = $1",
    params: [1]
  });

  assert.equal(rows[0].payload.ok, true);
  assert.equal(commands[0].command, "docker");
  assert.ok(commands[0].args.includes("exec"));
  assert.ok(commands[0].args.includes("-i"));
  assert.ok(commands[0].args.includes("twintest-postgres"));
  assert.ok(commands[0].args.includes("-q"));
  assert.ok(commands[0].args.includes("-X"));
  assert.ok(commands[0].args.includes("-f"));
  assert.ok(commands[0].args.includes("-"));
  assert.match(commands[0].stdin, /COPY/);
});

test("TwinTest Postgres gateway parses JSON stdout rows", () => {
  assert.deepEqual(parsePsqlJsonRows("[{\"id\":1}]"), [{ id: 1 }]);
  assert.deepEqual(parsePsqlJsonRows("[]"), []);
  assert.deepEqual(parsePsqlJsonRows("CREATE TABLE\n[]"), []);
});

test("TwinTest Postgres gateway request handler serves health and query responses", async () => {
  const handler = createGatewayRequestHandler({
    configuration: {
      mode: "docker_exec",
      port: 3040
    },
    queryExecutor: async () => [{ id: 1 }]
  });

  const healthResponse = createMockResponse();
  await handler({
    method: "GET",
    url: "/health"
  }, healthResponse.response);
  assert.equal(healthResponse.statusCode, 200);
  assert.match(healthResponse.body, /"status": "ok"/);

  const queryResponse = createMockResponse();
  await handler(createMockJsonRequest({
    method: "POST",
    url: "/query",
    body: {
      sql: "SELECT 1",
      params: []
    }
  }), queryResponse.response);
  assert.equal(queryResponse.statusCode, 200);
  assert.match(queryResponse.body, /"id": 1/);
});

function createMockResponse() {
  const headers = {};
  const state = {
    statusCode: null,
    body: ""
  };

  return {
    get statusCode() {
      return state.statusCode;
    },
    get body() {
      return state.body;
    },
    response: {
      setHeader(name, value) {
        headers[name] = value;
      },
      writeHead(statusCode, nextHeaders = {}) {
        state.statusCode = statusCode;
        Object.assign(headers, nextHeaders);
      },
      end(body = "") {
        state.body += body;
      }
    }
  };
}

function createMockJsonRequest({ method, url, body }) {
  const buffer = Buffer.from(JSON.stringify(body), "utf8");

  return {
    method,
    url,
    async *[Symbol.asyncIterator]() {
      yield buffer;
    }
  };
}
