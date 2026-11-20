"use strict";

const {
 reply, enabled, sameHex, mac, hash, isUuid, safeSnapshot, makeStore,
} = require("./lib/google-bridge-remote.js");

const SIZE_LIMIT = 24 * 1024;
const SKEW_MS = 120_000;

function createHandler({env=process.env, storeFactory=makeStore, clock=()=>Date.now()}={}) {
  return async function handler(req,res) {
    if (req.method !== "POST") {
      res.setHeader("Allow","POST");
      return reply(res,405,{ok:false,error:"METHOD_NOT_ALLOWED"});
    }
    if (!enabled(env) || !/^[a-f0-9]{64}$/i.test(env.MCF_BRIDGE_INGEST_SECRET||"")) {
      return reply(res,503,{ok:false,error:"REMOTE_CHANNEL_UNCONFIGURED"});
    }
    if (!String(req.headers?.["content-type"]||"").startsWith("application/json")) {
      return reply(res,415,{ok:false,error:"INVALID_CONTENT_TYPE"});
    }
    const body=typeof req.body==="string" ? (()=>{try{return JSON.parse(req.body)}catch{return null}})() : req.body;
    if (!body || typeof body!=="object" || Array.isArray(body)) return reply(res,400,{ok:false,error:"INVALID_PAYLOAD"});
    const canonical=JSON.stringify(body);
    if (Buffer.byteLength(canonical)>SIZE_LIMIT) return reply(res,413,{ok:false,error:"PAYLOAD_TOO_LARGE"});
    const timestamp=String(req.headers?.["x-mcf-timestamp"]||"");
    const nonce=String(req.headers?.["x-mcf-nonce"]||"");
    const signature=String(req.headers?.["x-mcf-signature"]||"");
    const time=Number(timestamp);
    if (!/^\d{13}$/.test(timestamp) || !Number.isSafeInteger(time) ||
        Math.abs(clock()-time)>SKEW_MS || !isUuid(nonce)) {
      return reply(res,401,{ok:false,error:"UNAUTHORIZED"});
    }
    const expected=mac(env.MCF_BRIDGE_INGEST_SECRET,timestamp+"\n"+nonce+"\n"+canonical);
    if (!sameHex(expected,signature)) return reply(res,401,{ok:false,error:"UNAUTHORIZED"});
    const clean=safeSnapshot(body);
    if (!clean || clean.receiptId!==nonce ||
        Math.abs(time-Date.parse(clean.publishedAt))>SKEW_MS) {
      return reply(res,400,{ok:false,error:"INVALID_SNAPSHOT"});
    }
    try {
      const result=await storeFactory(env).save(clean,nonce,hash(canonical));
      if(!result.accepted) return reply(res,409,{ok:false,error:"REPLAY_DETECTED"});
      return reply(res,200,{ok:true,updated:result.updated,source:clean.sourceId,receiptId:nonce});
    } catch { return reply(res,503,{ok:false,error:"REMOTE_STORE_UNAVAILABLE"}); }
  };
}
module.exports=createHandler();
module.exports.createHandler=createHandler;
