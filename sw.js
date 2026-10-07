const CACHE='ten-second-timer-v7';
const ASSETS=['./','./index.html','./style.css?v=7','./app.js?v=7','./manifest.webmanifest','./cycle.wav','./test.wav','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>(key.startsWith('hold-timer-')||key.startsWith('ten-second-timer-'))&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 if(event.request.mode==='navigate'){
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE);
   try{const response=await fetch(event.request,{cache:'no-store'});if(!response.ok)throw Error('Network response failed');await cache.put('./',response.clone());return response;}
   catch{const cached=await cache.match('./');return cached||Response.error();}
  })());return;
 }
 event.respondWith(caches.open(CACHE).then(async cache=>await cache.match(event.request)||fetch(event.request)));
});
