"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createHandler, POLICY } = require("../api/google-bridge.js");

const TRACE = "11111111-1111-4111-8111-111111111111";
const LIVE_ENV = { MCF_GOOGLE_BRIDGE_PANEL_ENABLED: "true" };
const DISABLED_ENV = {};
const PROJECT = {
  projectId: "mcf-potiguar-gemini-261109",
  displayName: "MCF Potiguar Gemini",
  state: "ACTIVE",
};
const STATUS = {
  service: "mcf-google-bridge",
  version: "0.1.0",
  oauthConnected: true,
  adcConfigured: true,
  refresh_token: "DO_NOT_LEAK",
};
function request(view = "summary", changes = {}) {
  return {
    method: "GET",
    url: "/api/google-bridge?view=" + view,
    socket: { remoteAddress: "127.0.0.1", localAddress: "127.0.0.1" },
    headers: { host: "127.0.0.1:3190" },
    ...changes,
  };
}
function response() {
  return {
    code: null,
    body: null,
    headers: {},
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  };
}
function fixture({ env = LIVE_ENV, fetchImpl, getToken = async () => "TEST_BEARER_VALUE",
  getAudit = async () => { throw new Error("NO_LOCAL_LOG"); } } = {}) {
  const calls = [];
  const transport = fetchImpl || (async (url, init) => {
    assert.equal(url, "http://127.0.0.1:8755/v1/execute");
    assert.equal(init.method, "POST");
    assert.equal(init.redirect, "error");
    const payload = JSON.parse(init.body);
    assert.deepEqual(payload.args, {});
    assert.ok(["google.status", "google.cloud.projects"].includes(payload.operation));
    calls.push({ operation: payload.operation, headers: init.headers });
    return new Response(JSON.stringify({
      operation: payload.operation,
      trace_id: TRACE,
      result: payload.operation === "google.status" ? STATUS : {
        projects: [{ ...PROJECT, secretField: "DO_NOT_LEAK" }],
      },
    }), { status: 200 });
  });
  const handler = createHandler({ env, transport, getToken, getAudit, clock: () => "2026-11-20T14:00:00.000Z" });
  return { handler, calls };
}

test("disabled by default, even on public host; no Google requests", async () => {
  const { handler, calls } = fixture({ env: DISABLED_ENV });
  const res = response();
  await handler(request(), res);
  assert.equal(res.code, 200);
  assert.equal(res.body.mode, "unavailable");
  assert.equal(res.body.status, undefined);
  assert.equal(res.headers["cache-control"], "no-store, private");
  assert.equal(calls.length, 0);
  const blocked = response();
  await handler(request("projects"), blocked);
  assert.equal(blocked.code, 403);
  assert.equal(calls.length, 0);
});

test("rejects remote sockets, untrusted hosts, Render and Vercel", async () => {
  const cases = [
    { req: request("summary", { socket: { localAddress: "127.0.0.1", remoteAddress: "10.1.2.3" } }) },
    { req: request("summary", { headers: { host: "example.com" } }) },
    { req: request("summary"), env: { ...LIVE_ENV, RENDER: "true" } },
    { req: request("summary"), env: { ...LIVE_ENV, VERCEL: "1" } },
  ];
  for (const entry of cases) {
    const { handler, calls } = fixture({ env: entry.env || LIVE_ENV });
    const res = response();
    await handler(entry.req, res);
    assert.equal(res.body.mode, "unavailable");
    assert.equal(calls.length, 0);
  }
});

test("only GET and exact known views", async () => {
  const { handler, calls } = fixture();
  const res = response();
  await handler(request("summary", { method: "POST" }), res);
  assert.equal(res.code, 405);
  assert.equal(res.headers.allow, "GET");
  const unknown = response();
  await handler(request("generate"), unknown);
  assert.equal(unknown.code, 400);
  assert.equal(calls.length, 0);
});

test("status returns whitelisted fields but never token or secret data", async () => {
  const { handler, calls } = fixture();
  const res = response();
  await handler(request("summary"), res);
  assert.equal(res.code, 200);
  assert.equal(res.body.mode, "connected");
  assert.equal(res.body.status.oauthConnected, true);
  assert.equal(res.body.status.adcConfigured, true);
  assert.equal(res.body.status.traceId, TRACE);
  assert.equal(res.body.status.refresh_token, undefined);
  assert.ok(!JSON.stringify(res.body).includes("DO_NOT_LEAK"));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].headers.authorization, "Bearer TEST_BEARER_VALUE");
  assert.ok(!JSON.stringify(res.body).includes("TEST_BEARER_VALUE"));
});

test("project list comes from Bridge, sanitized to projectId, displayName, state", async () => {
  const { handler } = fixture();
  const res = response();
  await handler(request("projects"), res);
  assert.equal(res.code, 200);
  assert.deepEqual(res.body.projects, [PROJECT]);
  assert.equal(res.body.traceId, TRACE);
  assert.ok(!JSON.stringify(res.body).includes("DO_NOT_LEAK"));
});

test("permissions allow only safe read operations and disclose no credential", async () => {
  const { handler, calls } = fixture({ env: DISABLED_ENV });
  const res = response();
  await handler(request("permissions"), res);
  assert.equal(res.code, 200);
  assert.equal(res.body.policy.skillId, "MCF-GOOGLE-CLOUD-READ");
  assert.deepEqual(POLICY.operations.map(x => x.bridge), ["google.status", "google.cloud.projects"]);
  assert.equal(res.body.localMode, false);
  assert.equal(calls.length, 0);
});

test("read-only tests produce two real requests and bounded panel audit", async () => {
  const { handler, calls } = fixture();
  const testRes = response();
  await handler(request("tests"), testRes);
  assert.equal(testRes.code, 200);
  assert.deepEqual(testRes.body.tests.map(t => t.outcome), ["PASS", "PASS"]);
  assert.deepEqual(calls.map(c => c.operation), ["google.status", "google.cloud.projects"]);
  const auditRes = response();
  await handler(request("audit"), auditRes);
  assert.equal(auditRes.code, 200);
  assert.equal(auditRes.body.persistent, false);
  assert.equal(auditRes.body.scope, "LOCAL_PANEL_REQUESTS_ONLY");
  assert.equal(auditRes.body.events.length, 2);
  assert.equal(auditRes.body.events[0].traceId, TRACE);
  assert.ok(!JSON.stringify(auditRes.body).includes("TEST_BEARER_VALUE"));
});

test("error bodies and oversized payloads cannot disclose data", async () => {
  const { handler } = fixture({
    fetchImpl: async () => new Response("DO_NOT_LEAK", { status: 401 }),
  });
  const authRes = response();
  await handler(request(), authRes);
  assert.equal(authRes.code, 503);
  assert.deepEqual(authRes.body, { ok: false, error: "LOCAL_BRIDGE_AUTH_FAILED" });
  const { handler: huge } = fixture({
    fetchImpl: async () => new Response("X".repeat(65537), { status: 200 }),
  });
  const res = response();
  await huge(request(), res);
  assert.equal(res.code, 502);
  assert.equal(res.body.error, "BRIDGE_RESPONSE_TOO_LARGE");
});

test("unexpected operation and malformed project schemas fail closed", async () => {
  for (const payload of [
    { operation: "google.gmail.search", result: { projects: [] } },
    { operation: "google.cloud.projects", result: { projects: [{ ...PROJECT, projectId: "../../secret" }] } },
    { operation: "google.cloud.projects", result: { projects: "not-an-array" } },
  ]) {
    const { handler } = fixture({
      fetchImpl: async () => new Response(JSON.stringify({ trace_id: TRACE, ...payload }), { status: 200 }),
    });
    const res = response();
    await handler(request("projects"), res);
    assert.equal(res.code, 502);
    assert.equal(res.body.error, "INVALID_BRIDGE_RESPONSE");
  }
});

test("local missing credentials fail closed before any transport", async () => {
  let called = false;
  const { handler } = fixture({
    getToken: async () => { throw new Error("SECRET_WITH_CREDENTIALS"); },
    fetchImpl: async () => { called = true; throw new Error("unexpected transport"); },
  });
  const res = response();
  await handler(request(), res);
  assert.equal(res.code, 502);
  assert.equal(called, false);
  assert.ok(!JSON.stringify(res.body).includes("SECRET_WITH_CREDENTIALS"));
});

test("audit displays sanitized persisted Bridge events when local file is available", async () => {
  const events = [{ at: "2026-11-20T12:00:00.000Z", operation: "google.status", outcome: "SUCCEEDED", traceId: TRACE }];
  const { handler } = fixture({ getAudit: async () => events });
  const res = response();
  await handler(request("audit"), res);
  assert.equal(res.code, 200);
  assert.equal(res.body.persistent, true);
  assert.equal(res.body.scope, "BRIDGE_LOCAL_AUDIT");
  assert.deepEqual(res.body.events, events);
});

test("accepts real GCP projects without displayName without inventing a name", async () => {
  const { handler } = fixture({
    fetchImpl: async () => new Response(JSON.stringify({
      trace_id: TRACE,
      operation: "google.cloud.projects",
      result: { projects: [{ projectId: "legacy-mcf-project", state: "ACTIVE" }] },
    }), { status: 200 }),
  });
  const res = response();
  await handler(request("projects"), res);
  assert.equal(res.code, 200);
  assert.equal(res.body.projects.length, 1);
  assert.deepEqual(res.body.projects[0], { projectId: "legacy-mcf-project", displayName: null, state: "ACTIVE" });
});
