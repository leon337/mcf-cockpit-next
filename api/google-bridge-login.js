"use strict";

const {
  reply, enabled, trustedOrigin, createSession, sessionCookie,
  isSessionValid, hash, sameHex, makeStore, LOGIN_LIMIT,
} = require("./lib/google-bridge-remote.js");

function createHandler({ env=process.env, storeFactory=makeStore, clock=()=>Date.now() } = {}) {
  return async function handler(req, res) {
    if (req.method !== "POST") {
      res.setHeader("Allow","POST");
      return reply(res,405,{ok:false,error:"METHOD_NOT_ALLOWED"});
    }
    if (!enabled(env)) return reply(res,503,{ok:false,error:"REMOTE_CHANNEL_UNCONFIGURED"});
    if (!trustedOrigin(req)) return reply(res,403,{ok:false,error:"ORIGIN_DENIED"});
    const logout = new URL(req.url || "/", "https://localhost").searchParams.get("action") === "logout";
    if (logout) {
      res.setHeader("Set-Cookie", sessionCookie("",0));
      return reply(res,200,{ok:true,authenticated:false});
    }
    const contentType = String(req.headers["content-type"] || "");
    if (!contentType.startsWith("application/json")) return reply(res,415,{ok:false,error:"INVALID_CONTENT_TYPE"});
    const data = typeof req.body === "string" ? (() => {try{return JSON.parse(req.body)}catch{return null}})() : req.body;
    if (!data || typeof data !== "object" || Array.isArray(data) ||
        typeof data.code !== "string" || !/^[A-Za-z0-9_-]{40,130}$/.test(data.code)) {
      return reply(res,400,{ok:false,error:"INVALID_PAIR_CODE"});
    }
    try {
      const peer = String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown").slice(0,256).split(",")[0].trim();
      const attempts = await storeFactory(env).authAttempt(hash("bridge-login:" + peer));
      if (attempts > LOGIN_LIMIT) return reply(res,429,{ok:false,error:"TOO_MANY_ATTEMPTS"});
    } catch { return reply(res,503,{ok:false,error:"LOGIN_STORE_UNAVAILABLE"}); }
    if (!sameHex(hash(data.code),env.MCF_BRIDGE_REMOTE_PASSCODE_SHA256)) {
      return reply(res,401,{ok:false,error:"INVALID_PAIR_CODE"});
    }
    res.setHeader("Set-Cookie",sessionCookie(createSession(env.MCF_BRIDGE_SESSION_SECRET, clock()),43200));
    return reply(res,200,{ok:true,authenticated:true,expiresInSeconds:43200});
  };
}
module.exports=createHandler();
module.exports.createHandler=createHandler;
