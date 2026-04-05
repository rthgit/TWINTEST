import assert from "node:assert/strict";
import test from "node:test";
import { PostgresHttpStore } from "../src/core/store.js";

test("TwinTest postgres_http store reports a clear gateway connectivity error", async () => {
  const store = new PostgresHttpStore({
    baseUrl: "http://127.0.0.1:3041",
    schema: "twintest",
    table: "state_store",
    fetchImpl: async () => {
      const error = new TypeError("fetch failed");
      error.cause = {
        code: "ECONNREFUSED"
      };
      throw error;
    }
  });

  await assert.rejects(
    () => store.query("SELECT 1"),
    /postgres_http could not reach http:\/\/127\.0\.0\.1:3041\/query \(ECONNREFUSED\)\. Start node src\/postgres-gateway\.js or align TWINTEST_POSTGRES_BASE_URL with the active gateway port\./
  );
});

test("TwinTest postgres_http store surfaces gateway error details on non-ok responses", async () => {
  const store = new PostgresHttpStore({
    baseUrl: "http://127.0.0.1:3041",
    schema: "twintest",
    table: "state_store",
    fetchImpl: async () => ({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({
        error: "spawn EPERM"
      })
    })
  });

  await assert.rejects(
    () => store.query("SELECT 1"),
    /postgres_http query failed with status 500: spawn EPERM/
  );
});
