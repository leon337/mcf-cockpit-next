const { test } = require('node:test');
const assert = require('node:assert/strict');
const c = require('../api/lib/google-bridge-remote.js');
const read = require('../api/google-bridge-remote.js').createHandler;
const login = require('../api/google-bridge-login.js').createHandler;
const ingest = require('../api/google-bridge-ingest.js').createHandler;
const now=1795188600000, id='11111111-1111-4111-8111-111111111111', pass='P'.repeat(44);
const env={VERCEL:'1',MCF_BRIDGE_REMOTE_ENABLED:'true',MCF_BRIDGE_DATABASE_URL:'postgresql://fake/db',
MCF_BRIDGE_REMOTE_PASSCODE_SHA256:c.hash(pass),MCF_BRIDGE_SESSION_SECRET:'9'.repeat(64),MCF_BRIDGE_INGEST_SECRET:'a'.repeat(64)};
const snap=()=>({sourceId:'mcf-gpu-x99',receiptId:id,publishedAt:new Date(now).toISOString(),
status:{service:'mcf-google-bridge',version:'0.1.0',oauthConnected:true,adcConfigured:true,traceId:id},
projects:[{projectId:'mcf-potiguar-gemini-261109',displayName:null,state:'ACTIVE'}],
checks:[{operation:'google.status',outcome:'PASS',traceId:id},{operation:'google.cloud.projects',outcome:'PASS',traceId:id}],audit:[]});
const req=(method='GET',body,headers={})=>({method,body,url:'/api/google-bridge',headers:{
host:'mcf-cockpit-next.vercel.app',origin:'https://mcf-cockpit-next.vercel.app','content-type':'application/json',...headers}});
const res=()=>({code:0,body:null,headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v},
status(v){this.code=v;return this},json(v){this.body=v;return this}});
function store(){return {saved:null,async get(){return this.saved?{snapshot:this.saved}:null},
async save(x){this.saved=x;return{accepted:true,updated:true}},async authAttempt(){return 1}}}
test('strict snapshot validation',()=>{
 assert.ok(c.safeSnapshot(snap()));assert.equal(c.safeSnapshot({...snap(),sourceId:'external'}),null);
});
test('unauthenticated projects denied',async()=>{
 const s=store(),h=read({env,storeFactory:()=>s,clock:()=>now}),out=res();
 await h(req(),out,'summary',{});assert.equal(out.body.mode,'authentication_required');
 const denied=res();await h(req(),denied,'projects',{});assert.equal(denied.code,401);
});
test('outbound HMAC accepted',async()=>{
 const s=store(),h=ingest({env,storeFactory:()=>s,clock:()=>now}),out=res(),body=snap(),time=String(now);
 const sig=c.mac(env.MCF_BRIDGE_INGEST_SECRET,[time,id,JSON.stringify(body)].join('\n'));
 await h(req('POST',body,{'x-mcf-timestamp':time,'x-mcf-nonce':id,'x-mcf-signature':sig}),out);
 assert.equal(out.code,200);assert.equal(s.saved.projects.length,1);
});
test('private pairing session',async()=>{
 const s=store(),h=login({env,storeFactory:()=>s,clock:()=>now}),out=res();
 await h(req('POST',{code:pass}),out);
 assert.equal(out.code,200);assert.match(out.headers['set-cookie'],/HttpOnly; Secure; SameSite=Strict/);
 s.saved=snap();
 const cookie=out.headers['set-cookie'].split(';')[0],reader=read({env,storeFactory:()=>s,clock:()=>now}),pr=res();
 await reader(req('GET',null,{cookie}),pr,'projects',{});
 assert.equal(pr.code,200);assert.equal(pr.body.projects[0].displayName,null);
});
test('stale result cannot be labeled live PASS',async()=>{
 const s=store(),x=snap();x.publishedAt=new Date(now-3600000).toISOString();s.saved=x;
 const cookie=c.COOKIE_NAME+'='+c.createSession(env.MCF_BRIDGE_SESSION_SECRET,now),out=res();
 await read({env,storeFactory:()=>s,clock:()=>now})(req('GET',null,{cookie}),out,'tests',{});
 assert.equal(out.body.ok,false);assert.equal(out.body.tests[0].outcome,'STALE');
});

test('ingest rejects altered signatures and outdated timestamps',async()=>{
 const state=store();const handler=ingest({env,storeFactory:()=>state,clock:()=>now}),body=snap();
 const altered=res();await handler(req('POST',body,{'x-mcf-timestamp':String(now),
   'x-mcf-nonce':id,'x-mcf-signature':'f'.repeat(64)}),altered);
 assert.equal(altered.code,401);assert.equal(state.saved,null);
 const old=res();await handler(req('POST',body,{'x-mcf-timestamp':String(now-999999),
   'x-mcf-nonce':id,'x-mcf-signature':'f'.repeat(64)}),old);
 assert.equal(old.code,401);
});
test('wrong pair code and origin cannot create a session',async()=>{
 const state=store(),handler=login({env,storeFactory:()=>state,clock:()=>now});
 const wrong=res();await handler(req('POST',{code:'X'.repeat(44)}),wrong);
 assert.equal(wrong.code,401);assert.equal(wrong.headers['set-cookie'],undefined);
 const origin=res();await handler(req('POST',{code:pass},{origin:'https://another.example'}),origin);
 assert.equal(origin.code,403);
});
test('missing secrets always disables remote access',()=>{
 for(const change of [
   {MCF_BRIDGE_REMOTE_ENABLED:'false'},
   {MCF_BRIDGE_DATABASE_URL:''},
   {MCF_BRIDGE_SESSION_SECRET:'weak'},
   {MCF_BRIDGE_REMOTE_PASSCODE_SHA256:''},
 ]) assert.equal(Boolean(c.enabled({...env,...change})),false);
});
test('expired sessions are rejected',()=>{
 const token=c.COOKIE_NAME+'='+c.createSession(env.MCF_BRIDGE_SESSION_SECRET,now);
 assert.equal(c.isSessionValid(req('GET',null,{cookie:token}),
   env.MCF_BRIDGE_SESSION_SECRET,now+12*60*60*1000),false);
});
test('outbound publisher emits a validated read-only snapshot',async()=>{
 const w=await import('../tools/google-bridge-outbound-agent.mjs');
 const body=await w.buildSnapshot({
   token:'local',now:()=>new Date(now),loadAudit:async()=>'',invoke:async operation=>({
     operation,trace_id:id,result:operation==='google.status'
       ? {service:'mcf-google-bridge',version:'0.1.0',oauthConnected:true,adcConfigured:true}
       : {projects:[]},
   }),
 });
 assert.equal(body.projects.length,0);
 const options=w.signedRequest(body,env.MCF_BRIDGE_INGEST_SECRET,now);
 const saved=store(),handler=ingest({env,storeFactory:()=>saved,clock:()=>now}),out=res();
 await handler(req('POST',body,options.headers),out);
 assert.equal(out.code,200);
});
