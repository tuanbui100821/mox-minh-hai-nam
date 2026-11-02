const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
assert.ok(!html.includes('{{'),'Unresolved template field');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size,'Duplicate HTML IDs');
const checkAsset=url=>{
 if(!url||/^(https?:|data:|#)/.test(url))return;
 const file=path.resolve(dist,decodeURIComponent(url.split(/[?#]/)[0]));
 assert.ok(file.startsWith(dist+path.sep),'Asset outside website');
 assert.ok(fs.statSync(file).isFile(),'Missing asset: '+url);
};
for(const match of html.matchAll(/<(img|script|source|link|a)\b[^>]*>/g)){
 const a=attrs(match[0]);
 if(a.src)checkAsset(a.src);
 if(a['data-photo'])checkAsset(a['data-photo']);
 if(a.rel==='stylesheet')checkAsset(a.href);
 if(a.href?.startsWith('#'))assert.ok(ids.includes(a.href.slice(1)),'Broken anchor: '+a.href);
 if(a.srcset)for(const candidate of a.srcset.split(','))checkAsset(candidate.trim().split(/\s+/)[0]);
 if(match[1]==='img'&&a.id!=='lightbox-image')assert.ok(a.width&&a.height,'Image has no layout dimensions');
}
const photoCount=fs.readFileSync(path.join(root,'config/photos.tsv'),'utf8').split(/\r?\n/).filter(line=>line.trim()&&!line.startsWith('#')).length;
assert.equal([...html.matchAll(/class="photo-card /g)].length,photoCount,'Photo missing from album');
for(const size of ['small','large'])assert.equal(fs.readdirSync(path.join(dist,'assets/photos/previews',size)).length,photoCount,'Missing previews');
for(const expected of ['open-quietly','days','lightbox','retry-photo','close-letter-top'])assert.ok(ids.includes(expected),'Missing control '+expected);
console.log('Passed: generated HTML, anchors, image variants, layout dimensions, controls and '+photoCount+' photos.');
