const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{webcrypto,randomBytes,pbkdf2Sync}=require('node:crypto');
(async()=>{
 const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'web/_worker.js'),'utf8');
 const worker=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
 const salt=randomBytes(16),secret=randomBytes(32).toString('base64url'),password='unit-test-private-password';
 const verifier=JSON.stringify({v:1,iterations:100000,salt:salt.toString('base64url'),hash:pbkdf2Sync(password,salt,100000,32,'sha256').toString('base64url')});
 let privateReads=0;
 const env={ROCKISS_PASSWORD_HASH:verifier,ROCKISS_SESSION_KEY:secret,ASSETS:{fetch:async request=>{
  if(new URL(request.url).pathname==='/gate.html')return new Response(fs.readFileSync(path.join(root,'web/gate.html'),'utf8'),{headers:{'Content-Type':'text/html'}});
  privateReads++;return new Response('<html><body class="story">PRIVATE_MEMORY</body></html>',{headers:{'Content-Type':'text/html','Cache-Control':'public,max-age=14400'}});
 }}};
 const origin='https://test.pages.dev';
 const login=(pw,next='/',ip='192.0.2.1',requestOrigin=origin)=>new Request(origin+'/__auth/login',{method:'POST',headers:{Origin:requestOrigin,'Content-Type':'application/x-www-form-urlencoded','CF-Connecting-IP':ip},body:new URLSearchParams({password:pw,next})});
 let response=await worker.fetch(new Request(origin+'/'),env);
 assert.equal(response.status,200);let html=await response.text();assert.match(html,/name="password"/);assert.ok(!html.includes('PRIVATE_MEMORY'));assert.ok(!html.includes('%%NONCE%%'));assert.match(response.headers.get('Content-Security-Policy'),/form-action 'self'/);
 for(const file of ['/assets/photos/gan-nhau.jpg','/assets/audio/i-love-you-baby.m4a','/app.js','/_worker.js','/index.html']){
  response=await worker.fetch(new Request(origin+file),env);
  assert.ok(![...response.headers].some(([k])=>k==='set-cookie'));assert.ok(!(await response.text()).includes('PRIVATE_MEMORY'));
 }
 assert.equal(privateReads,0,'Unauthenticated request reached private assets');
 response=await worker.fetch(login('wrong-password'),env);assert.equal(response.status,401);assert.match(await response.text(),/Hình như chưa đúng/);
 response=await worker.fetch(login(password,'/?x=1#letter'),env);assert.equal(response.status,303);assert.match(response.headers.get('Location'),/unlocked=1#letter$/);
 const setCookie=response.headers.get('Set-Cookie');for(const flag of ['HttpOnly','Secure','SameSite=Lax','Path=/'])assert.ok(setCookie.includes(flag));
 const cookie=setCookie.split(';')[0];
 response=await worker.fetch(new Request(origin+'/',{headers:{Cookie:cookie}}),env);html=await response.text();assert.ok(html.includes('PRIVATE_MEMORY'));assert.ok(html.includes('data-protected="true"'));assert.match(response.headers.get('Cache-Control'),/no-store/);
 response=await worker.fetch(new Request(origin+'/assets/photos/gan-nhau.jpg',{headers:{Cookie:cookie}}),env);assert.equal(response.status,200);
 const signed=async data=>{const encoded=Buffer.from(JSON.stringify(data)).toString('base64url');const k=await webcrypto.subtle.importKey('raw',Buffer.from(secret,'base64url'),{name:'HMAC',hash:'SHA-256'},false,['sign']);const mac=Buffer.from(await webcrypto.subtle.sign('HMAC',k,Buffer.from(encoded))).toString('base64url');return '__Host-rockiss_session='+encoded+'.'+mac;};
 for(const badCookie of [cookie.replace('=', '=tampered'),await signed({host:'test.pages.dev',exp:1}),await signed({host:'other.pages.dev',exp:Math.floor(Date.now()/1000)+1000})]){
  response=await worker.fetch(new Request(origin+'/assets/photos/gan-nhau.jpg',{headers:{Cookie:badCookie}}),env);assert.equal(response.status,401);
 }
 response=await worker.fetch(login(password,'https://evil.example/', '192.0.2.2'),env);assert.equal(new URL(response.headers.get('Location')).origin,origin);
 response=await worker.fetch(login(password,'/','192.0.2.3','https://evil.example'),env);assert.equal(response.status,403);
 for(let i=0;i<5;i++)await worker.fetch(login('wrong','/','192.0.2.5'),env);
 response=await worker.fetch(login(password,'/','192.0.2.5'),env);assert.equal(response.status,429);assert.ok(response.headers.get('Retry-After'));
 response=await worker.fetch(new Request(origin+'/__auth/logout',{method:'POST',headers:{Origin:origin,Cookie:cookie}}),env);assert.equal(response.status,303);assert.match(response.headers.get('Set-Cookie'),/Max-Age=0/);
 response=await worker.fetch(new Request(origin+'/'),{ASSETS:env.ASSETS});assert.equal(response.status,503);
 const routes=JSON.parse(fs.readFileSync(path.join(root,'web/_routes.json'),'utf8'));assert.deepEqual(routes.include,['/*']);assert.deepEqual(routes.exclude,[]);
 console.log('Passed: protected HTML/media, correct/wrong password, signed sessions, expiry, host binding, safe redirect, CSRF, retry limit, logout and missing secrets.');
})().catch(error=>{console.error(error);process.exit(1);});
