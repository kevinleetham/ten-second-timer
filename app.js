'use strict';
const $=id=>document.getElementById(id);
let running=false,starting=false,phase='hold',raf=0,audio=null,wake=null,generation=0;
const cycleAudio=new Audio('./cycle.wav'),testAudio=new Audio('./test.wav');
cycleAudio.loop=true;cycleAudio.preload='auto';testAudio.preload='auto';
async function unlock(kind='cycle'){
 audio=kind==='cycle'?cycleAudio:testAudio;
 cycleAudio.pause();testAudio.pause();audio.currentTime=0;
 try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch{}
 await audio.play();
}
function render(seconds,fraction){$('count').textContent=seconds;$('progress').style.strokeDashoffset=873.363*(1-fraction);$('phase').textContent=running?(phase==='hold'?'Hold':'Rest'):'Ready';document.body.classList.toggle('rest',running&&phase==='rest');$('toggle').textContent=running?'Stop':'Start';$('test').disabled=running||starting;$('hint').textContent=running?(phase==='hold'?'Hold until the next sound.':'Release. The next hold starts soon.'):'Start when you’re ready.';}
async function keepAwake(){if(!('wakeLock'in navigator)){if(running)$('notice').textContent='Keep your screen awake using your phone’s Auto-Lock setting.';return;}try{const lock=await navigator.wakeLock.request('screen');if(!running){await lock.release();return;}wake=lock;lock.addEventListener('release',()=>{if(wake===lock)wake=null;if(running&&document.visibilityState==='visible')$('notice').textContent='Screen may dim. Check your Auto-Lock setting.';});}catch{if(running)$('notice').textContent='Screen may dim. Check your Auto-Lock setting.';}}
function stop(message=''){generation++;running=false;starting=false;cancelAnimationFrame(raf);cycleAudio.pause();testAudio.pause();cycleAudio.currentTime=0;testAudio.currentTime=0;if(wake){const old=wake;wake=null;old.release().catch(()=>{});}render(10,1);$('toggle').disabled=false;$('notice').textContent=message;}
function tick(now){
 if(!running)return;
 if(cycleAudio.paused||cycleAudio.ended){stop('Audio interrupted. Tap Start to begin again.');return;}
 const position=cycleAudio.currentTime%12;
 phase=position<10?'hold':'rest';
 const left=phase==='hold'?10-position:12-position;
 render(Math.ceil(left),left/(phase==='hold'?10:2));
 raf=requestAnimationFrame(tick);
}
$('toggle').addEventListener('click',async()=>{if(running){stop();return;}if(starting)return;starting=true;const current=++generation;$('toggle').disabled=true;$('test').disabled=true;try{await unlock();if(current!==generation||document.visibilityState!=='visible'){cycleAudio.pause();return;}running=true;starting=false;phase='hold';$('notice').textContent='';render(10,1);$('toggle').disabled=false;keepAwake();raf=requestAnimationFrame(tick);}catch{stop('Sound could not start. Tap Start to try again.');}});
$('test').addEventListener('click',async()=>{if(running||starting)return;const current=++generation;$('test').disabled=true;try{await unlock('test');if(current!==generation){testAudio.pause();return;}$('notice').textContent='High tone: hold. Two low tones: rest.';}catch{$('notice').textContent='Sound could not play. Check your volume and try again.';}finally{if(!running&&!starting)$('test').disabled=false;}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(running||starting))stop('Timer stopped while away. Tap Start to begin again.');});
window.addEventListener('pagehide',()=>stop());
cycleAudio.addEventListener('error',()=>{if(running||starting)stop('Sound could not load. Connect to the internet and reopen the timer.');});
render(10,1);
if('serviceWorker'in navigator){let refreshing=false;const hadController=!!navigator.serviceWorker.controller;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!hadController||refreshing)return;if(running||starting){$('offline').textContent='An update is ready. Close and reopen after stopping.';return;}refreshing=true;location.reload();});navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(async registration=>{registration.update().catch(()=>{});await navigator.serviceWorker.ready;$('offline').textContent='Ready for offline use on this device.';registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller&&!running)$('offline').textContent='An update is ready. Close and reopen the app to use it.';});});}).catch(()=>{$('offline').textContent='Offline access is unavailable. Open this app with an internet connection.';});}else $('offline').textContent='Open this app with an internet connection.';
