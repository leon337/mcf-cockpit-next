"use strict";
const crypto = require("node:crypto");

const SOURCE_ID = "mcf-gpu-x99";
const MAX_AGE_MS = 15 * 60_000;
const SESSION_MS = 12 * 60 * 60_000;
const CLOCK_SKEW_MS = 120_000;
const LOGIN_LIMIT = 7;
const COOKIE_NAME = "mcf_bridge_session";

function isObject(x) { return x !== null && typeof x === "object" && !Array.isArray(x); }
function b64(x) { return Buffer.from(x).toString("base64url"); }
function hash(x) { return crypto.createHash("sha256").update(x).digest("hex"); }
function mac(secret, data) { return crypto.createHmac("sha256", secret).update(data).digest("hex"); }
function sameHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !/^[a-f0-9]{64}$/i.test(a) || !/^[a-f0-9]{64}$/i.test(b)) return false;
  return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}
function policyHeaders(res) {
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Frame-Options", "DENY");
}
function reply(res, code, body) { policyHeaders(res); return res.status(code).json(body); }
function enabled(env) {
  return env.VERCEL && env.MCF_BRIDGE_REMOTE_ENABLED === "true" &&
    typeof env.MCF_BRIDGE_DATABASE_URL === "string" && env.MCF_BRIDGE_DATABASE_URL.startsWith("postgresql://") &&
    /^[a-f0-9]{64}$/i.test(env.MCF_BRIDGE_REMOTE_PASSCODE_SHA256 || "") &&
    typeof env.MCF_BRIDGE_SESSION_SECRET === "string" && env.MCF_BRIDGE_SESSION_SECRET.length >= 43;
}
function validHostname(host) {
  return /^mcf-cockpit-next(?:-[a-z0-9-]{1,70})?\.vercel\.app$/i.test(host || "");
}
function trustedOrigin(req) {
  const origin = req.headers?.origin;
  const host = String(req.headers?.host || "").toLowerCase();
  try {
    const parsed = new URL(origin);
    return parsed.protocol === "https:" && parsed.host === host && validHostname(host);
  } catch { return false; }
}
function sessionCookie(token, maxAge) {
  return COOKIE_NAME + "=" + token + "; Path=/api/google-bridge; HttpOnly; Secure; SameSite=Strict; Max-Age=" + maxAge;
}
function createSession(secret, now = Date.now()) {
  const data = b64(JSON.stringify({ sub: "LEANDRO", issued: now, exp: now + SESSION_MS, v: 1 }));
  return data + "." + mac(secret, data);
}
function isSessionValid(req, secret, now = Date.now()) {
  const cookies = String(req.headers?.cookie || "").slice(0, 8192).split(";").map(x => x.trim());
  const item = cookies.find(x => x.startsWith(COOKIE_NAME + "="));
  if (!item) return false;
  const token = item.slice(COOKIE_NAME.length + 1);
  const match = /^([A-Za-z0-9_-]{20,350})\.([a-f0-9]{64})$/i.exec(token);
  if (!match || !sameHex(match[2], mac(secret, match[1]))) return false;
  try {
    const data = JSON.parse(Buffer.from(match[1], "base64url").toString("utf8"));
    return data.v === 1 && data.sub === "LEANDRO" &&
      Number.isSafeInteger(data.issued) && Number.isSafeInteger(data.exp) &&
      data.issued <= now && data.exp > now && data.exp - data.issued === SESSION_MS;
  } catch { return false; }
}
function isUuid(x) { return typeof x === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(x); }
function safeTrace(x) { return isUuid(x) ? x : null; }
function safeSnapshot(data) {
  if (!isObject(data) || data.sourceId !== SOURCE_ID ||
      !isUuid(data.receiptId) ||
      typeof data.publishedAt !== "string" ||
      Number.isNaN(Date.parse(data.publishedAt)) ||
      !isObject(data.status) || data.status.service !== "mcf-google-bridge" ||
      typeof data.status.version !== "string" || data.status.version.length > 30 ||
      typeof data.status.oauthConnected !== "boolean" || typeof data.status.adcConfigured !== "boolean" ||
      !Array.isArray(data.projects) || data.projects.length > 20 ||
      !Array.isArray(data.checks) || data.checks.length !== 2 ||
      !Array.isArray(data.audit) || data.audit.length > 30) return null;
  const projects = [];
  const seen = new Set();
  for (const p of data.projects) {
    if (!isObject(p) || typeof p.projectId !== "string" ||
      !/^[a-z][a-z0-9-]{4,62}$/.test(p.projectId) || seen.has(p.projectId) ||
      !(p.displayName === null || typeof p.displayName === "string" && p.displayName.length <= 150) ||
      typeof p.state !== "string" || p.state.length > 40) return null;
    seen.add(p.projectId);
    projects.push({ projectId: p.projectId, displayName: p.displayName, state: p.state });
  }
  const operations = ["google.status", "google.cloud.projects"];
  const checks = [];
  for (const c of data.checks) {
    if (!isObject(c) || !operations.includes(c.operation) ||
      checks.some(x => x.operation === c.operation) ||
      c.outcome !== "PASS" || !safeTrace(c.traceId)) return null;
    checks.push({ operation: c.operation, outcome: "PASS", traceId: c.traceId });
  }
  if (checks.length !== 2) return null;
  const audit = [];
  for (const e of data.audit) {
    if (!isObject(e) || typeof e.at !== "string" || Number.isNaN(Date.parse(e.at)) ||
      !["google.status", "google.cloud.projects"].includes(e.operation) ||
      !["SUCCEEDED","FAILED"].includes(e.outcome) ||
      !(e.traceId === null || isUuid(e.traceId))) return null;
    audit.push({at: e.at, operation:e.operation, outcome:e.outcome, traceId:e.traceId});
  }
  return { sourceId: SOURCE_ID, receiptId: data.receiptId,
    publishedAt: data.publishedAt,
    status: {service:"mcf-google-bridge", version:data.status.version,
      oauthConnected:data.status.oauthConnected, adcConfigured:data.status.adcConfigured,
      traceId: safeTrace(data.status.traceId) },
    projects, checks, audit};
}
function makeStore(env = process.env) {
  const { neon } = require("@neondatabase/serverless");
  const sql = neon(env.MCF_BRIDGE_DATABASE_URL);
  return {
    async get() {
      const rows = await sql`SELECT snapshot, published_at, received_at FROM mcf_bridge.snapshots WHERE source_id = ${SOURCE_ID} LIMIT 1`;
      return rows[0] || null;
    },
    async save(snapshot, nonce, digest) {
      // One SQL statement makes replay registration and snapshot publication atomic.
      // If publication fails, the nonce is not consumed without its snapshot.
      const rows = await sql`
        WITH accepted_receipt AS (
          INSERT INTO mcf_bridge.ingest_receipts
            (nonce, source_id, published_at, project_count, content_hash)
          VALUES (
            ${nonce}::uuid, ${SOURCE_ID}, ${snapshot.publishedAt}::timestamptz,
            ${snapshot.projects.length}, ${digest}
          )
          ON CONFLICT (nonce) DO NOTHING RETURNING nonce
        ), updated_snapshot AS (
          INSERT INTO mcf_bridge.snapshots
            (source_id, snapshot, published_at, receipt_id)
          SELECT
            ${SOURCE_ID}, ${JSON.stringify(snapshot)}::jsonb,
            ${snapshot.publishedAt}::timestamptz, nonce
          FROM accepted_receipt
          ON CONFLICT (source_id) DO UPDATE
            SET snapshot=EXCLUDED.snapshot,
                published_at=EXCLUDED.published_at,
                receipt_id=EXCLUDED.receipt_id, received_at=now()
          WHERE mcf_bridge.snapshots.published_at < EXCLUDED.published_at
          RETURNING source_id
        )
        SELECT
          EXISTS(SELECT 1 FROM accepted_receipt) AS accepted,
          EXISTS(SELECT 1 FROM updated_snapshot) AS updated
      `;
      return { accepted: rows[0]?.accepted === true, updated: rows[0]?.updated === true };
    },
    async authAttempt(key) {
      const rows = await sql`INSERT INTO mcf_bridge.auth_limits(key_hash,attempts,expires_at)
        VALUES(${key},1,now() + interval '20 minutes')
        ON CONFLICT (key_hash) DO UPDATE
        SET attempts=CASE WHEN mcf_bridge.auth_limits.expires_at<now() THEN 1 ELSE mcf_bridge.auth_limits.attempts + 1 END,
            expires_at=CASE WHEN mcf_bridge.auth_limits.expires_at<now() THEN now() + interval '20 minutes' ELSE mcf_bridge.auth_limits.expires_at END
        RETURNING attempts`;
      return Number(rows[0]?.attempts || LOGIN_LIMIT + 1);
    },
  };
}
function remoteSummary(snapshot, now = Date.now()) {
  if (!snapshot) return null;
  const data = safeSnapshot(snapshot);
  if (!data) return null;
  const ageMs = now - Date.parse(data.publishedAt);
  return { ...data, stale: !Number.isFinite(ageMs) || ageMs < -CLOCK_SKEW_MS || ageMs > MAX_AGE_MS };
}
module.exports = { SOURCE_ID, MAX_AGE_MS, LOGIN_LIMIT, COOKIE_NAME, reply,
 enabled, trustedOrigin, createSession, isSessionValid, sessionCookie, safeSnapshot,
 sameHex, mac, hash, isUuid, makeStore, remoteSummary };
