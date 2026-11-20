"use strict";

const fs = require("node:fs/promises");
const { homedir } = require("node:os");
const path = require("node:path");

const BRIDGE_ENDPOINT = "http://127.0.0.1:8755/v1/execute";
const TOKEN_PATH = path.join(homedir(), ".config", "mcf-google-bridge", "http-token");
const AUDIT_PATH = path.join(homedir(), ".config", "mcf-google-bridge", "audit.jsonl");
const MAX_RESPONSE_BYTES = 64 * 1024;
const TIMEOUT_MS = 40000;
const AUDIT_LIMIT = 30;

const POLICY = Object.freeze({
  skillId: "MCF-GOOGLE-CLOUD-READ",
  provider: "mcf-google-bridge",
  resource: "google-cloud",
  permissionProfile: "READ_ONLY",
  operations: [
    { id: "status", bridge: "google.status", scope: "read-only" },
    { id: "list-projects", bridge: "google.cloud.projects", scope: "read-only" },
  ],
  blocked: ["generate", "write", "delete", "iam", "billing", "gmail", "drive"],
  provenance:
    "https://github.com/leon337/multiagent-collaboration-framework/blob/main/docs/operations/MCF-GOOGLE-BRIDGE-RUNTIME-READONLY.md",
});

function isLoopback(value) {
  return value === "127.0.0.1" || value === "::1" || value === "::ffff:127.0.0.1";
}

function allowLocalConnection(request, env) {
  if (env.MCF_GOOGLE_BRIDGE_PANEL_ENABLED !== "true" || env.RENDER || env.VERCEL) return false;
  const socket = request.socket || {};
  const host = String(request.headers?.host || "").toLowerCase();
  return isLoopback(socket.remoteAddress) &&
    isLoopback(socket.localAddress) &&
    /^(localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/u.test(host);
}

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

class BridgeFailure extends Error {
  constructor(code, http = 502) {
    super(code);
    this.code = code;
    this.http = http;
  }
}

async function readLocalToken() {
  try {
    const meta = await fs.lstat(TOKEN_PATH);
    if (!meta.isFile() || (meta.mode & 0o077) !== 0 ||
        (typeof process.getuid === "function" && meta.uid !== process.getuid())) {
      throw new Error("invalid file permissions");
    }
    const token = (await fs.readFile(TOKEN_PATH, "utf8")).trim();
    if (!/^[A-Za-z0-9._~-]{24,256}$/u.test(token)) throw new Error("invalid credential");
    return token;
  } catch {
    throw new BridgeFailure("LOCAL_CREDENTIALS_UNAVAILABLE", 503);
  }
}

async function readLocalAudit() {
  const meta = await fs.lstat(AUDIT_PATH);
  if (!meta.isFile() || (meta.mode & 0o077) !== 0 ||
      (typeof process.getuid === "function" && meta.uid !== process.getuid())) {
    throw new BridgeFailure("LOCAL_AUDIT_UNAVAILABLE", 503);
  }
  const file = await fs.open(AUDIT_PATH, "r");
  try {
    const size = Math.min(meta.size, 128 * 1024);
    const buffer = Buffer.alloc(size);
    await file.read(buffer, 0, size, meta.size - size);
    let text = buffer.toString("utf8");
    if (meta.size > size) text = text.slice(text.indexOf("\n") + 1);
    return text.split("\n").filter(Boolean).slice(-AUDIT_LIMIT).reverse().flatMap((line) => {
      try {
        const entry = JSON.parse(line);
        if (!record(entry) ||
            typeof entry.time !== "string" || Number.isNaN(Date.parse(entry.time)) ||
            typeof entry.operation !== "string" || !/^google\.[a-z0-9._-]{1,80}$/u.test(entry.operation) ||
            typeof entry.outcome !== "string" || !/^[a-zA-Z0-9_-]{1,70}$/u.test(entry.outcome)) return [];
        return [{
          at: entry.time,
          operation: entry.operation,
          outcome: entry.outcome === "ok" ? "SUCCEEDED" : "FAILED",
          traceId: safeTrace(entry.trace_id),
        }];
      } catch { return []; }
    });
  } finally {
    await file.close();
  }
}

async function boundedJson(response) {
  const stream = response.body;
  if (!stream) throw new BridgeFailure("INVALID_BRIDGE_RESPONSE");
  const reader = stream.getReader();
  let length = 0;
  const chunks = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_RESPONSE_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new BridgeFailure("BRIDGE_RESPONSE_TOO_LARGE");
      }
      chunks.push(Buffer.from(value));
    }
    const data = JSON.parse(Buffer.concat(chunks, length).toString("utf8"));
    if (!record(data)) throw new Error("invalid response");
    return data;
  } catch (error) {
    if (error instanceof BridgeFailure) throw error;
    throw new BridgeFailure("INVALID_BRIDGE_RESPONSE");
  } finally {
    reader.releaseLock();
  }
}

function safeTrace(value) {
  return typeof value === "string" && /^[a-f0-9-]{36}$/iu.test(value) ? value : null;
}

function sanitizedResult(operation, payload) {
  if (!record(payload) || payload.operation !== operation ||
      !safeTrace(payload.trace_id) || !record(payload.result)) {
    throw new BridgeFailure("INVALID_BRIDGE_RESPONSE");
  }
  const result = payload.result;
  if (operation === "google.status") {
    if (result.service !== "mcf-google-bridge" ||
        typeof result.oauthConnected !== "boolean" ||
        typeof result.adcConfigured !== "boolean" ||
        typeof result.version !== "string" || result.version.length > 32) {
      throw new BridgeFailure("INVALID_BRIDGE_RESPONSE");
    }
    return {
      traceId: payload.trace_id,
      service: result.service,
      version: result.version,
      oauthConnected: result.oauthConnected,
      adcConfigured: result.adcConfigured,
      readOnly: true,
    };
  }
  if (operation === "google.cloud.projects") {
    if (!Array.isArray(result.projects) || result.projects.length > 20) {
      throw new BridgeFailure("INVALID_BRIDGE_RESPONSE");
    }
    const projects = result.projects.map((project) => {
      if (!record(project) || typeof project.projectId !== "string" ||
          !/^[a-z][a-z0-9-]{4,62}$/u.test(project.projectId) ||
          !(project.displayName === undefined || project.displayName === null ||
            (typeof project.displayName === "string" && project.displayName.length <= 150)) ||
          typeof project.state !== "string" || project.state.length > 40) {
        throw new BridgeFailure("INVALID_BRIDGE_RESPONSE");
      }
      return {
        projectId: project.projectId,
        displayName: typeof project.displayName === "string" ? project.displayName : null,
        state: project.state,
      };
    });
    return { traceId: payload.trace_id, projects };
  }
  throw new BridgeFailure("UNSUPPORTED_OPERATION", 403);
}

function json(res, status, payload) {
  return res.status(status).json(payload);
}

function createHandler({ env = process.env, transport = fetch, getToken = readLocalToken,
  clock = () => new Date().toISOString(), getAudit = readLocalAudit } = {}) {
  const audit = [];

  function log(operation, outcome, traceId = null) {
    audit.unshift({ at: clock(), operation, outcome, traceId });
    if (audit.length > AUDIT_LIMIT) audit.length = AUDIT_LIMIT;
  }

  async function queryBridge(operation) {
    const token = await getToken();
    let response;
    try {
      response = await transport(BRIDGE_ENDPOINT, {
        method: "POST",
        headers: { authorization: "Bearer " + token, "content-type": "application/json" },
        body: JSON.stringify({ operation, args: {} }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: "error",
      });
    } catch {
      throw new BridgeFailure("LOCAL_BRIDGE_UNREACHABLE", 503);
    }
    if (!response.ok) {
      throw new BridgeFailure(
        response.status === 401 ? "LOCAL_BRIDGE_AUTH_FAILED" : "LOCAL_BRIDGE_REQUEST_FAILED",
        response.status === 401 ? 503 : 502,
      );
    }
    return sanitizedResult(operation, await boundedJson(response));
  }

  async function tracked(operation) {
    try {
      const result = await queryBridge(operation);
      log(operation, "SUCCEEDED", result.traceId);
      return result;
    } catch (error) {
      log(operation, "FAILED");
      throw error;
    }
  }

  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store, private");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return json(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
    }

    const view = String(new URL(req.url || "/", "http://localhost").searchParams.get("view") || "summary");
    if (!["summary", "projects", "permissions", "tests", "audit"].includes(view)) {
      return json(res, 400, { ok: false, error: "INVALID_VIEW" });
    }
    if (view === "permissions") {
      return json(res, 200, { ok: true, policy: POLICY, localMode: allowLocalConnection(req, env) });
    }
    if (!allowLocalConnection(req, env)) {
      if (view === "summary") {
        return json(res, 200, {
          ok: true,
          mode: "unavailable",
          reason: "LOCAL_RUNTIME_NOT_CONNECTED",
          checkedAt: clock(),
          policy: POLICY,
        });
      }
      return json(res, 403, { ok: false, error: "LOCAL_RUNTIME_NOT_CONNECTED" });
    }

    try {
      if (view === "audit") {
        try {
          const events = await getAudit();
          return json(res, 200, {
            ok: true, scope: "BRIDGE_LOCAL_AUDIT", persistent: true,
            events, checkedAt: clock(),
          });
        } catch {
          return json(res, 200, {
            ok: true, scope: "LOCAL_PANEL_REQUESTS_ONLY", persistent: false,
            events: [...audit], checkedAt: clock(),
          });
        }
      }
      if (view === "summary") {
        const result = await tracked("google.status");
        return json(res, 200, {
          ok: true, mode: "connected", checkedAt: clock(), status: result, policy: POLICY,
        });
      }
      if (view === "projects") {
        const result = await tracked("google.cloud.projects");
        return json(res, 200, { ok: true, checkedAt: clock(), ...result });
      }

      const tests = [];
      for (const operation of ["google.status", "google.cloud.projects"]) {
        try {
          const result = await tracked(operation);
          tests.push({ operation, outcome: "PASS", traceId: result.traceId });
        } catch (error) {
          tests.push({ operation, outcome: "FAIL", code: error.code || "BRIDGE_ERROR" });
        }
      }
      const passed = tests.every((test) => test.outcome === "PASS");
      return json(res, passed ? 200 : 503, { ok: passed, checkedAt: clock(), tests, readOnly: true });
    } catch (error) {
      return json(res, error.http || 502, { ok: false, error: error.code || "BRIDGE_ERROR" });
    }
  };
}

module.exports = createHandler();
module.exports.createHandler = createHandler;
module.exports.POLICY = POLICY;
module.exports.allowLocalConnection = allowLocalConnection;
