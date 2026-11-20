import { createRequire } from 'node:module';
import { randomUUID, createHmac } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { safeSnapshot } = require('../api/lib/google-bridge-remote.js');

const BRIDGE_URL = 'http://127.0.0.1:8755/v1/execute';
const TOKEN_PATH = join(homedir(), '.config/mcf-google-bridge/http-token');
const AUDIT_PATH = join(homedir(), '.config/mcf-google-bridge/audit.jsonl');
const FETCH_TIMEOUT_MS = 55_000;

export async function privateFile(file, required = true) {
  try {
    const meta = await lstat(file);
    if (!meta.isFile() || (meta.mode & 0o077) !== 0 ||
        (typeof process.getuid === 'function' && meta.uid !== process.getuid())) {
      throw new Error('insecure local file');
    }
    return await readFile(file,'utf8');
  } catch (error) {
    if (!required && error?.code === 'ENOENT') return '';
    throw new Error('LOCAL_PRIVATE_FILE_UNAVAILABLE');
  }
}

export async function invokeBridge(operation, token, transport=fetch) {
  const response=await transport(BRIDGE_URL,{
    method:'POST',
    headers:{ authorization:'Bearer '+token, 'content-type':'application/json' },
    body:JSON.stringify({ operation, args:{} }),
    redirect:'error',
    signal:AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if(!response.ok) throw new Error('LOCAL_BRIDGE_QUERY_FAILED');
  const payload=await response.json();
  if(!payload || payload.operation!==operation ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(payload.trace_id) ||
      !payload.result || typeof payload.result!=='object') throw new Error('INVALID_LOCAL_BRIDGE_RESPONSE');
  return payload;
}

export function auditEvents(text) {
  let value=text;
  if(value.length>131072) value=value.slice(-131072);
  if(value && !value.startsWith('{')) value=value.slice(value.indexOf('\n')+1);
  return value.split('\n').filter(Boolean).slice(-30).reverse().flatMap(line=>{
    try{
      const entry=JSON.parse(line);
      if(!entry || typeof entry.time!=='string' || Number.isNaN(Date.parse(entry.time)) ||
         !['google.status','google.cloud.projects'].includes(entry.operation)) return [];
      return [{
        at:entry.time, operation:entry.operation,
        outcome:entry.outcome==='ok'?'SUCCEEDED':'FAILED',
        traceId:typeof entry.trace_id==='string' &&
          /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(entry.trace_id)
          ?entry.trace_id:null,
      }];
    }catch {return [];}
  });
}

export async function buildSnapshot({token, invoke=invokeBridge, loadAudit=()=>privateFile(AUDIT_PATH,false),
                                    now=()=>new Date()}={}) {
  const status=await invoke('google.status',token);
  const cloud=await invoke('google.cloud.projects',token);
  if(status.result.service!=='mcf-google-bridge' || typeof status.result.version!=='string' ||
     typeof status.result.oauthConnected!=='boolean' ||
     typeof status.result.adcConfigured!=='boolean' ||
     !Array.isArray(cloud.result.projects)) throw new Error('INVALID_LOCAL_BRIDGE_DATA');
  const snapshot = {
    sourceId:'mcf-gpu-x99', receiptId:randomUUID(), publishedAt:now().toISOString(),
    status: { service:'mcf-google-bridge', version:status.result.version,
      oauthConnected:status.result.oauthConnected,
      adcConfigured:status.result.adcConfigured, traceId:status.trace_id },
    projects:cloud.result.projects.map(p=>({
      projectId:p.projectId, displayName:typeof p.displayName==='string'?p.displayName:null, state:p.state,
    })),
    checks:[
      {operation:'google.status',outcome:'PASS',traceId:status.trace_id},
      {operation:'google.cloud.projects',outcome:'PASS',traceId:cloud.trace_id},
    ],
    audit:auditEvents(await loadAudit()),
  };
  const safe=safeSnapshot(snapshot);
  if(!safe) throw new Error('INVALID_LOCAL_SNAPSHOT');
  return safe;
}

export function signedRequest(snapshot, key, now=Date.now()) {
  const body=JSON.stringify(snapshot);
  const timestamp=String(now);
  const signature=createHmac('sha256',key)
    .update(timestamp+'\n'+snapshot.receiptId+'\n'+body)
    .digest('hex');
  return {
    method:'POST', redirect:'error', signal:AbortSignal.timeout(25_000),
    headers:{'content-type':'application/json','x-mcf-timestamp':timestamp,
      'x-mcf-nonce':snapshot.receiptId, 'x-mcf-signature':signature},
    body,
  };
}

export async function publish({env=process.env, tokenFile=()=>privateFile(TOKEN_PATH),
                              transport=fetch, now=Date.now}={}) {
  const endpoint=env.MCF_BRIDGE_INGEST_URL;
  if(typeof endpoint!=='string' ||
     !/^https:\/\/mcf-cockpit-next(?:-[a-z0-9-]{1,70})?\.vercel\.app\/api\/google-bridge-ingest$/i.test(endpoint)) {
    throw new Error('REMOTE_INGEST_URL_NOT_ALLOWLISTED');
  }
  if(!/^[a-f0-9]{64}$/i.test(env.MCF_BRIDGE_INGEST_SECRET||'')) throw new Error('REMOTE_INGEST_NOT_CONFIGURED');
  const token=(await tokenFile()).trim();
  if(!/^[A-Za-z0-9._~-]{24,256}$/.test(token)) throw new Error('LOCAL_BRIDGE_TOKEN_INVALID');
  const snapshot=await buildSnapshot({token});
  const response=await transport(endpoint,
    signedRequest(snapshot,env.MCF_BRIDGE_INGEST_SECRET,now()));
  if(!response.ok) throw new Error('REMOTE_INGEST_HTTP_'+response.status);
  const reply=await response.json();
  if(reply?.ok!==true || reply.receiptId!==snapshot.receiptId) throw new Error('REMOTE_INGEST_INVALID_ACK');
  return {published:true, projectCount:snapshot.projects.length,
    receiptId:snapshot.receiptId, updated:reply.updated===true};
}

if(process.argv[1] && import.meta.url.endsWith('/'+process.argv[1].split('/').pop())) {
  publish().then(out=>{
    console.log(JSON.stringify({result:'PUBLISHED',projectCount:out.projectCount,updated:out.updated}));
  }).catch(error=>{
    console.error(JSON.stringify({result:'FAILED',code:String(error?.message||'UNKNOWN').slice(0,85)}));
    process.exitCode=1;
  });
}
