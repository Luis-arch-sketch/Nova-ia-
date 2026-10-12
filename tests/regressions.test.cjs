'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8'),server=fs.readFileSync('server.js','utf8');
test('scripts HTML continuam válidos',()=>{
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
 assert(scripts.length>0);
 for(const [i,s] of scripts.entries())assert.doesNotThrow(()=>new Function(s[1]),'Script '+i);
});
test('formatador mostra M B T e Qav no valor correto',()=>{
 const suffix=html.match(/U=(\[[^\n]*\]);/);
 const format=html.match(/const fm=value=>\{[\s\S]*?\n\};/);
 assert(suffix&&format);
 const fm=new Function('const U='+suffix[1]+';'+format[0]+';return fm')();
 assert.equal(fm(1000000),'1M');
 assert.equal(fm(1000000000),'1B');
 assert.equal(fm(1000000000000),'1T');
 assert.equal(fm(1e75),'1Qav');
});
test('backup antigo não reativa corrida 10x',()=>{
 assert(html.includes('A.personalFast=false;if(Number(A.moveMult)===10)A.moveMult=1;'));
 assert(html.includes('const runMultiplier=A.moveMult;'));
 assert(!html.includes('ownerVerified&&A.personalFast===true?10'));
});
test('103 animais, auras e som preservados',()=>{
 assert(html.includes('const REMOVED_BIRDS=new Set([0,9])'));
 assert(html.includes('const AUR={3:'));
 assert(html.includes('GUAXINIM • PARTE 4'));
 assert(html.includes('const SNDSRC='));
});
test('admin distingue o dinheiro digitado do acumulado',()=>{
 assert(html.includes("const raw=String(AS[key]??'').trim()"));
 assert(html.includes('id="adCashPreview"'));
 assert(html.includes('Você digitou: $'));
});
test('mensagens de salas antigas são ignoradas',()=>{
 assert(html.includes('ws.onmessage=e=>{if(MP.socket!==ws)return;'));
 assert(server.includes('if(MP.socket===ws)mpSend({type:mode,room,name})'));
 assert(html.includes("msg.type==='limited-sync'"));
});
test('retirar LIMITED inválido sincroniza e limpar apaga os carregados',()=>{
 assert(server.includes("const resync=()=>send(ws,{type:'limited-sync',eggs});"));
 assert(server.includes('for(const player of peers(ws.room))player.heldLimited=null;'));
});
test('salas, guardião, esteira e Admin Abuse preservados',()=>{
 assert(html.includes('adminSpawnLimited'));assert(html.includes('const ABUSE_NAMES='));
 assert(server.includes('installServerBrowser'));assert(!server.includes('TREADMILL_RATE'));
});

test('reset único do dono mantém ADMIN',()=>{
 assert(html.includes('resetOwnerProgressOnce'));
 assert(html.includes('ADMIN_DEVICE_KEY'));
 assert(!html.includes('removeOwnerTreadmill'));
 assert(html.includes('ensureTM(S.pid);regrow(true);'));
 assert(!server.includes('applyOwnerTreadmill'));
});

test('renovação dos ovos: 9 segundos de noite, depois 3 até abrir as áreas',()=>{
 assert(html.includes("const EGG_NIGHT={phase:'day',until:0,last:'',cycles:0,renewed:0}"));
 assert(html.includes("EGG_NIGHT.phase='night';EGG_NIGHT.until=now+9000"));
 assert(html.includes("EGG_NIGHT.phase='unlock';EGG_NIGHT.until+=3000"));
 assert(html.includes("EGG_NIGHT.phase='day';EGG_NIGHT.until=0"));
 assert(html.includes("nextReset=now/1000+CFG.reset"));
 assert(html.includes("if(EGG_NIGHT.phase==='day'&&Date.now()/1e3>=nextReset)startEggNight()"));
 assert(html.includes("case 'eggNightNow':msg=startEggNight()"));
 assert(html.includes("adBtn('eggNightNow','🌙 Iniciar renovação dos ovos'"));
});
test('13 paredes brancas com relógios bloqueiam áreas e coleta noturna',()=>{
 assert(html.includes('color:0xffffff,transparent:true,opacity:.92'));
 assert(html.includes('return{z,bar,timer,l,b,req:b.req}'));
 assert(html.includes("GT.forEach(g=>{g.bar.visible=true;g.timer.visible=true;g.timer.set(text)})"));
 assert(html.includes("GT.forEach(g=>{g.bar.visible=false;g.timer.visible=false})"));
 assert(html.includes("if(Math.abs(player.x)<10&&EGG_NIGHT.phase==='day')return"));
 assert(html.includes("if(EGG_NIGHT.phase!=='day')return null"));
 assert(html.includes("if(EGG_NIGHT.phase!=='day'){toast('🔒 Aguarde renovar os ovos"));
 assert(html.includes('id="eggNightClock"'));
 assert(html.includes("EGG_NIGHT.phase==='night'?30:1"));
});
test('trocar ovos dos ninhos preserva LIMITED e sorte de raros',()=>{
 assert(html.includes("if(!e||e.s===LIMITED_ID)continue"));
 assert(html.includes("if(e.aura){sc.remove(e.aura);e.aura=null;}"));
 assert(html.includes("const ix=eggs.indexOf(e);if(ix>=0)eggs.splice(ix,1)"));
 assert(html.includes("Math.min(1,chances[r]*1.4)"));
 assert(html.includes("EGG_NIGHT.phase==='night'&&Math.random()<.32"));
 assert(html.includes("}finally{for(const r of [7,8,9])CFG.rare[r]=chances[r]}"));
});
