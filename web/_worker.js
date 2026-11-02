// Server-only Pages gate. Password verifier and session key are Cloudflare Secrets.
const COOKIE='__Host-rockiss_session',TTL=604800,encoder=new TextEncoder(),attempts=new Map();
const headers=()=>({'Cache-Control':'private, no-store, max-age=0','Cloudflare-CDN-Cache-Control':'no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Robots-Tag':'noindex, nofollow'});
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const decode=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=secret=>crypto.subtle.importKey('raw',decode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
const cookie=request=>(request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
async function validSession(request,secret){try{const token=cookie(request);if(!token||token.length>1024)return false;const [data,signature,extra]=token.split('.');if(extra||!await crypto.subtle.verify('HMAC',await key(secret),decode(signature),encoder.encode(data)))return false;const body=JSON.parse(new TextDecoder().decode(decode(data))),now=Date.now()/1000;return body.host===new URL(request.url).host&&Number.isSafeInteger(body.exp)&&body.exp>now&&body.exp<=now+TTL+60;}catch{return false;}}
async function session(host,secret){const data=b64(encoder.encode(JSON.stringify({host,exp:Math.floor(Date.now()/1000)+TTL,nonce:b64(crypto.getRandomValues(new Uint8Array(16)))})));const signature=b64(await crypto.subtle.sign('HMAC',await key(secret),encoder.encode(data)));return `${COOKIE}=${data}.${signature}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${TTL}`;}
async function passwordValid(password,stored){try{if(typeof password!=='string'||password.length>128||!password)return false;const v=JSON.parse(stored),salt=decode(v.salt),expected=decode(v.hash);if(v.v!==1||v.iterations!==100000||salt.length!==16||expected.length!==32)return false;const material=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);const actual=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:v.iterations},material,256));let difference=0;for(let i=0;i<32;i++)difference|=actual[i]^expected[i];return difference===0;}catch{return false;}}
function safeNext(value,origin){try{const next=new URL(value||'/',origin);return next.origin===origin&&!next.pathname.startsWith('/__auth/')?next:new URL('/',origin);}catch{return new URL('/',origin);}}
async function readForm(request){if(!request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded'))return null;const reader=request.body?.getReader();if(!reader)return null;const chunks=[];let total=0;while(true){const {value,done}=await reader.read();if(done)break;total+=value.byteLength;if(total>2048){await reader.cancel();return null;}chunks.push(value);}const bytes=new Uint8Array(total);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}return new URLSearchParams(new TextDecoder().decode(bytes));}
async function gate(env,origin,error='',next='/',status=200){const nonce=b64(crypto.getRandomValues(new Uint8Array(18)));const template=await env.ASSETS.fetch(new Request(origin+'/gate.html'));if(!template.ok)return new Response('Trang đang được chuẩn bị.',{status:503,headers:headers()});const html=(await template.text()).replaceAll('%%NONCE%%',nonce).replace('%%ERROR%%',escape(error)).replace('%%NEXT%%',escape(next));return new Response(html,{status,headers:{...headers(),'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':`default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`}});}
export default {async fetch(request,env){
 const url=new URL(request.url),method=request.method;
 if(!env.ROCKISS_PASSWORD_HASH||!env.ROCKISS_SESSION_KEY)return new Response('Trang đang được chuẩn bị. Em quay lại sau một chút nhé.',{status:503,headers:headers()});
 if(url.pathname==='/__auth/login'){
  if(method!=='POST')return new Response('Method not allowed',{status:405,headers:{...headers(),Allow:'POST'}});
  if(request.headers.get('Origin')!==url.origin)return new Response('Forbidden',{status:403,headers:headers()});
  const form=await readForm(request);if(!form)return new Response('Yêu cầu không hợp lệ.',{status:400,headers:headers()});
  const next=safeNext(form.get('next'),url.origin),ip=request.headers.get('CF-Connecting-IP')||'unknown',now=Date.now();
  if(attempts.size>512)attempts.delete(attempts.keys().next().value);let recent=attempts.get(ip);if(!recent||recent.until<=now)recent={count:0,until:now+900000};
  if(recent.count>=5){const response=await gate(env,url.origin,'Em thử lại sau vài phút nhé.',next.pathname+next.search+next.hash,429);response.headers.set('Retry-After',String(Math.ceil((recent.until-now)/1000)));return response;}
  if(!await passwordValid(form.get('password'),env.ROCKISS_PASSWORD_HASH)){recent.count++;attempts.set(ip,recent);return gate(env,url.origin,'Hình như chưa đúng rồi. Em thử lại nhé.',next.pathname+next.search+next.hash,401);}
  attempts.delete(ip);next.searchParams.set('unlocked','1');return new Response(null,{status:303,headers:{...headers(),Location:next.href,'Set-Cookie':await session(url.host,env.ROCKISS_SESSION_KEY)}});
 }
 if(url.pathname==='/__auth/logout'){
  if(method!=='POST')return new Response('Method not allowed',{status:405,headers:{...headers(),Allow:'POST'}});
  if(request.headers.get('Origin')!==url.origin)return new Response('Forbidden',{status:403,headers:headers()});
  return new Response(null,{status:303,headers:{...headers(),Location:url.origin+'/','Set-Cookie':`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`}});
 }
 if(!['GET','HEAD'].includes(method))return new Response('Method not allowed',{status:405,headers:{...headers(),Allow:'GET, HEAD'}});
 if(!await validSession(request,env.ROCKISS_SESSION_KEY)){
  const documentRequest=!url.pathname.startsWith('/assets/')&&(url.pathname==='/'||url.pathname==='/index.html'||request.headers.get('Accept')?.includes('text/html'));
  if(documentRequest&&method==='GET')return gate(env,url.origin,'',url.pathname+url.search);
  return new Response(method==='HEAD'?null:'Vui lòng mở website và nhập mật khẩu trước.',{status:401,headers:{...headers(),'Content-Type':'text/plain; charset=utf-8'}});
 }
 if(url.pathname.startsWith('/__auth/')||['/_worker.js','/_routes.json','/gate.html'].includes(url.pathname))return new Response('Not found',{status:404,headers:headers()});
 const response=await env.ASSETS.fetch(request),protectedHeaders=new Headers(response.headers);for(const [name,value] of Object.entries(headers()))protectedHeaders.set(name,value);
 // Pages' asset binding may return the complete audio even for a Range request.
 // Keep Safari/phone seeking working without exposing any unauthenticated bytes.
 const range=request.headers.get('Range');
 if(method==='GET'&&range&&response.status===200&&protectedHeaders.get('Content-Type')?.startsWith('audio/')){
  const match=/^bytes=([0-9]*)-([0-9]*)$/.exec(range);
  if(match&&(match[1]||match[2])){
   const bytes=await response.arrayBuffer(),total=bytes.byteLength;
   const start=match[1]?Number(match[1]):Math.max(0,total-Number(match[2]));
   const end=match[1]?(match[2]?Math.min(Number(match[2]),total-1):total-1):total-1;
   protectedHeaders.set('Accept-Ranges','bytes');protectedHeaders.delete('Content-Encoding');
   if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start> end||start>=total){protectedHeaders.set('Content-Range','bytes */'+total);protectedHeaders.delete('Content-Length');return new Response(null,{status:416,headers:protectedHeaders});}
   protectedHeaders.set('Content-Range',`bytes ${start}-${end}/${total}`);protectedHeaders.set('Content-Length',String(end-start+1));
   return new Response(bytes.slice(start,end+1),{status:206,headers:protectedHeaders});
  }
 }

 if(method==='GET'&&protectedHeaders.get('Content-Type')?.includes('text/html')){const html=(await response.text()).replace('<body ','<body data-protected="true" ');protectedHeaders.delete('Content-Length');protectedHeaders.delete('Content-Encoding');protectedHeaders.delete('ETag');return new Response(html,{status:response.status,headers:protectedHeaders});}
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers:protectedHeaders});
}};
