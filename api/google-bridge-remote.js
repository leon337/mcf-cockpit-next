"use strict";

const {
  reply, enabled, isSessionValid, makeStore, remoteSummary,
} = require("./lib/google-bridge-remote.js");

function createHandler({ env = process.env, storeFactory = makeStore, clock = () => Date.now() } = {}) {
  return async function handler(req, res, view, policy) {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return reply(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
    }
    if (!enabled(env)) return reply(res, 503, {ok:false,error:"REMOTE_CHANNEL_UNCONFIGURED"});
    if (view === "permissions") {
      return reply(res, 200, {ok:true,policy,remoteMode:true,localMode:false});
    }
    if (!isSessionValid(req, env.MCF_BRIDGE_SESSION_SECRET, clock())) {
      if (view === "summary") return reply(res, 200, {
        ok: true, mode: "authentication_required", checkedAt: new Date(clock()).toISOString(), policy,
      });
      return reply(res, 401, {ok:false,error:"AUTHENTICATION_REQUIRED"});
    }
    let snapshot;
    try { snapshot = remoteSummary((await storeFactory(env).get())?.snapshot, clock()); }
    catch { return reply(res, 503, {ok:false,error:"REMOTE_STORE_UNAVAILABLE"}); }
    if (!snapshot) {
      if (view === "summary") return reply(res, 200, {
        ok: true, mode: "pending", checkedAt: new Date(clock()).toISOString(), policy,
      });
      return reply(res, 503, {ok:false,error:"NO_VERIFIED_SNAPSHOT"});
    }
    if (view === "summary") return reply(res, 200, {
      ok: true, mode: "remote", checkedAt: new Date(clock()).toISOString(),
      publishedAt: snapshot.publishedAt, stale: snapshot.stale,
      status: {...snapshot.status, readOnly:true}, policy,
    });
    if (view === "projects") return reply(res, 200, {
      ok: true, checkedAt: snapshot.publishedAt, publishedAt:snapshot.publishedAt, stale:snapshot.stale,
      traceId:snapshot.receiptId, projects:snapshot.projects, source:"REMOTE_SIGNED_SNAPSHOT",
    });
    if (view === "tests") return reply(res, 200, {
      ok: !snapshot.stale, checkedAt: snapshot.publishedAt, stale: snapshot.stale,
      source:"REMOTE_AGENT_LAST_CHECK", readOnly:true,
      tests: snapshot.checks.map(x => ({...x, outcome: snapshot.stale ? "STALE" : x.outcome})),
    });
    if (view === "audit") return reply(res, 200, {
      ok:true, checkedAt: snapshot.publishedAt, stale:snapshot.stale,
      scope:"BRIDGE_LOCAL_AUDIT_SYNCED", persistent:true, events:snapshot.audit,
    });
    return reply(res, 400, {ok:false,error:"INVALID_VIEW"});
  };
}

module.exports = createHandler();
module.exports.createHandler = createHandler;
